// Registrations that happen on the event's main website (linkMode "external").
//
// The short link /r/:event/:ref adds the ambassador's code to the main
// website URL (?ref=…, plus a custom field such as a Google Form "entry.123"
// pre-fill). The main website then reports each submitted form here, either
// live through the per-event webhook (e.g. a Google Forms Apps Script) or as a
// CSV the super admin imports. Rows land in events/{id}/registrations next to
// on-site registrations, so counts, the ambassador funnel, exports and
// participant messaging all work the same.
import { DocError, getDocRow, runQuery, writeDoc } from './docstore.js';
import { REFERRAL_POINTS, safeFieldKey, sha256Hex, updateFields, rateLimit } from './functions.js';
import { isSuperAdmin } from './rules.js';

export const HOOKS_COLLECTION = 'eventHooks'; // private: no client read/write rule
export const MAX_ROWS = 50;
const MAX_ANSWERS = 80;
const REF_PARAM_RE = /^[A-Za-z0-9_.-]{1,64}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Which form question holds which core field (matched on the question title).
const FIELD_PATTERNS = {
    email: /e-?mail/i,
    phone: /phone|mobile|whats\s?app|contact\s*(no|num)/i,
    college: /college|institut|university|school/i,
    department: /department|branch|stream|discipline/i,
    year: /\byear\b|semester|\bsem\b|batch/i,
    ref: /^ref$|referr|referral|ambassador|promo/i,
    name: /name/i,
};
const NOT_PERSON_NAME = /college|institut|school|university|event|team|father|mother|parent|guardian|ambassador|refer|department|branch/i;
const META_KEYS = new Set(['answers', 'rows', 'submittedAt', 'timestamp', 'ref', 'source']);

function text(v, max = 2000) {
    if (v === null || v === undefined) return '';
    if (Array.isArray(v)) v = v.flat().join(', ');
    else if (typeof v === 'object') v = JSON.stringify(v);
    return String(v).trim().slice(0, max);
}

/** Pick name/email/phone/college/year/ref out of free-form form answers. */
export function mapAnswers(raw) {
    const answers = {};
    for (const [k, v] of Object.entries(raw || {})) {
        const key = text(k, 200);
        if (!key || META_KEYS.has(key) || Object.keys(answers).length >= MAX_ANSWERS) continue;
        const value = text(v);
        if (value) answers[key] = value;
    }
    const core = {};
    for (const [field, re] of Object.entries(FIELD_PATTERNS)) {
        const key = Object.keys(answers).find(k => re.test(k) && (field !== 'name' || !NOT_PERSON_NAME.test(k))
            && (field !== 'year' || !/name/i.test(k)));
        if (key) core[field] = answers[key];
    }
    if (core.email) core.email = core.email.toLowerCase();
    if (core.email && !EMAIL_RE.test(core.email)) delete core.email;
    return { answers, core };
}

/** One submitted form, in any of the accepted shapes, as { answers, ref, submittedAt }. */
export function normalizeRow(row) {
    if (!row || typeof row !== 'object' || Array.isArray(row)) return null;
    const source = row.answers && typeof row.answers === 'object' ? row.answers : row;
    const { answers, core } = mapAnswers(source);
    if (!core.email && typeof row.email === 'string' && EMAIL_RE.test(row.email.trim())) core.email = row.email.trim().toLowerCase();
    const ref = text(row.ref, 200) || core.ref || '';
    const t = row.submittedAt ?? row.timestamp;
    const ms = typeof t === 'number' ? t : Date.parse(t);
    const submittedAt = Number.isFinite(ms) && ms > 0 && ms < Date.now() + 86400000 ? ms : Date.now();
    return { answers, core, ref, submittedAt };
}

/** The ambassador a ref code points at: their id, account email, or exact unique name. */
async function findReferrer(db, ref) {
    if (!ref) return null;
    const id = safeFieldKey(ref);
    if (id) {
        const row = await getDocRow(db, `users/${id}`);
        if (row) return { id, ...row.data };
    }
    const field = EMAIL_RE.test(ref) ? '$.email' : '$.name';
    const { results } = await db.prepare(
        `SELECT id, data FROM docs WHERE parent = 'users' AND lower(trim(json_extract(data, '${field}'))) = ? LIMIT 2`,
    ).bind(ref.toLowerCase().trim()).all();
    return results.length === 1 ? { id: results[0].id, ...JSON.parse(results[0].data) } : null;
}

async function existingRegistration(db, regsPath, core) {
    for (const field of ['email', 'phone']) {
        if (!core[field]) continue;
        const hit = await runQuery(db, regsPath, { filters: [{ field, op: '==', value: core[field] }], limit: 1 });
        if (hit.length) return hit[0].id;
    }
    return null;
}

/** Store one main-website registration; returns 'created' | 'updated' | 'skipped'. */
export async function ingestRow(db, eventId, raw, source) {
    const row = normalizeRow(raw);
    if (!row || (!row.core.email && !row.core.phone && !row.core.name)) return 'skipped';
    const { answers, core } = row;
    const regsPath = `events/${eventId}/registrations`;

    let referrer = await findReferrer(db, row.ref);
    if (referrer && core.email && String(referrer.email || '').toLowerCase() === core.email) referrer = null;

    const id = (await existingRegistration(db, regsPath, core))
        || `ext_${(await sha256Hex(core.email || core.phone || JSON.stringify(answers))).slice(0, 32)}`;

    let outcome, credited;
    await writeDoc(db, `${regsPath}/${id}`, (before) => {
        credited = false;
        const now = { __ts: Date.now() };
        if (!before) {
            outcome = 'created';
            credited = !!referrer;
            return {
                name: core.name || '', email: core.email || '', phone: core.phone || '',
                college: core.college || '', department: core.department || '', year: core.year || '', eventId,
                source, answers, registeredAt: { __ts: row.submittedAt }, receivedAt: now,
                ...(referrer ? { referredBy: referrer.id, referrerName: text(referrer.name, 100) || null } : {}),
            };
        }
        outcome = 'updated';
        const next = { ...before, answers: { ...(before.answers || {}), ...answers }, updatedAt: now };
        for (const f of ['name', 'email', 'phone', 'college', 'department', 'year']) if (!next[f] && core[f]) next[f] = core[f];
        if (!before.referredBy && referrer && referrer.id !== before.userId) {
            next.referredBy = referrer.id;
            next.referrerName = text(referrer.name, 100) || null;
            credited = true;
        }
        if (JSON.stringify(next.answers) === JSON.stringify(before.answers || {}) && !credited) {
            outcome = 'skipped';
            return before;
        }
        return next;
    });

    const counters = {};
    if (outcome === 'created') counters.participants = { __op: 'increment', n: 1 };
    if (credited) counters[`refCounts.${referrer.id}`] = { __op: 'increment', n: 1 };
    if (Object.keys(counters).length) await updateFields(db, `events/${eventId}`, counters);
    if (credited) {
        await updateFields(db, `users/${referrer.id}`, {
            points: { __op: 'increment', n: REFERRAL_POINTS },
            referrals: { __op: 'increment', n: 1 },
        });
    }
    return outcome;
}

async function ingestRows(db, eventId, rows, source) {
    if (!Array.isArray(rows) || rows.length === 0) throw new DocError('invalid-argument', 'No registrations in the request');
    if (rows.length > MAX_ROWS) throw new DocError('invalid-argument', `Send at most ${MAX_ROWS} registrations per request`);
    const result = { created: 0, updated: 0, skipped: 0 };
    for (const r of rows) result[await ingestRow(db, eventId, r, source)]++;
    return result;
}

async function requireEvent(db, eventId) {
    const key = safeFieldKey(eventId);
    if (!key || !(await getDocRow(db, `events/${key}`))) throw new DocError('not-found', 'Event not found');
    return key;
}

function newSecret() {
    const bytes = crypto.getRandomValues(new Uint8Array(24));
    return [...bytes].map(b => b.toString(16).padStart(2, '0')).join('');
}

function sameSecret(a, b) {
    if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
    let diff = 0;
    for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
    return diff === 0;
}

/** The main website's referral field for this event (null when not set up). */
export async function hookConfig(db, eventId) {
    return (await getDocRow(db, `${HOOKS_COLLECTION}/${eventId}`))?.data ?? null;
}

// ─── Super admin ─────────────────────────────────────────────

async function requireSuperAdmin(ctx) {
    if (!(await isSuperAdmin(ctx))) throw new DocError('permission-denied', 'Super admin only');
}

/** Webhook settings for an event; the secret is created on first view. */
export async function getHook(env, ctx, eventId, origin) {
    await requireSuperAdmin(ctx);
    const key = await requireEvent(env.DB, eventId);
    let config;
    await writeDoc(env.DB, `${HOOKS_COLLECTION}/${key}`, (before) => {
        config = before || { secret: newSecret(), refParam: '', received: 0, createdAt: { __ts: Date.now() } };
        return config;
    });
    return {
        url: `${origin}/api/hooks/registrations/${encodeURIComponent(key)}`,
        secret: config.secret,
        refParam: config.refParam || '',
        received: config.received || 0,
        lastReceivedAt: config.lastReceivedAt?.__ts || null,
    };
}

export async function updateHook(env, ctx, eventId, body, origin) {
    await requireSuperAdmin(ctx);
    const key = await requireEvent(env.DB, eventId);
    const refParam = typeof body?.refParam === 'string' ? body.refParam.trim() : undefined;
    if (refParam && !REF_PARAM_RE.test(refParam)) throw new DocError('invalid-argument', 'The referral field may only use letters, numbers, dots, dashes and underscores (e.g. entry.123456789)');
    await writeDoc(env.DB, `${HOOKS_COLLECTION}/${key}`, (before) => ({
        received: 0,
        createdAt: { __ts: Date.now() },
        ...before,
        secret: body?.rotate || !before?.secret ? newSecret() : before.secret,
        ...(refParam !== undefined ? { refParam } : {}),
    }));
    return getHook(env, ctx, key, origin);
}

/** Import rows from a CSV the super admin exported from the main website. */
export async function importRegistrations(env, ctx, eventId, body) {
    await requireSuperAdmin(ctx);
    const key = await requireEvent(env.DB, eventId);
    return ingestRows(env.DB, key, body?.rows, 'import');
}

// ─── Public webhook (called by the main website) ─────────────

export async function receiveWebhook(env, eventId, secret, body) {
    const key = safeFieldKey(eventId);
    const config = key ? await hookConfig(env.DB, key) : null;
    if (!config || !sameSecret(secret, config.secret)) throw new DocError('permission-denied', 'Invalid webhook key');
    await requireEvent(env.DB, key);
    await rateLimit(env.DB, `hook:${key}`, 600, 60 * 1000);
    const rows = Array.isArray(body?.rows) ? body.rows : [body];
    const result = await ingestRows(env.DB, key, rows, 'main_website');
    await updateFields(env.DB, `${HOOKS_COLLECTION}/${key}`, {
        received: { __op: 'increment', n: result.created },
        lastReceivedAt: { __ts: Date.now() },
    });
    return { ok: true, ...result };
}
