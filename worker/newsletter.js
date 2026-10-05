// Newsletter: public sign-up with double opt-in, one-click-style unsubscribe,
// and the subscriber list the super admin emails from the Communication Center.
//
// Subscribers live in the private `newsletter` collection (doc id = hash of
// the lower-cased email). Confirm / unsubscribe links carry an HMAC of the id,
// so no token has to be stored.
import { DocError, getDocRow, writeDoc } from './docstore.js';
import { sha256Hex, rateLimit, optionalString, validateEmail } from './functions.js';
import { sendEmail } from './auth.js';
import { senderPool } from './senders.js';

export const COLLECTION = 'newsletter';
const HOUR = 60 * 60 * 1000;

export const subscriberId = async (email) => sha256Hex(`newsletter|${String(email).toLowerCase().trim()}`);

async function hmac(env, message) {
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(env.BETTER_AUTH_SECRET || 'dev-secret'), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
    return [...new Uint8Array(sig)].map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 40);
}

export const makeToken = (env, purpose, id) => hmac(env, `${purpose}:${id}`);

async function verifyToken(env, purpose, id, token) {
    const expected = await makeToken(env, purpose, id);
    if (typeof token !== 'string' || token.length !== expected.length) return false;
    let diff = 0;
    for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ token.charCodeAt(i);
    return diff === 0;
}

export const confirmUrl = async (env, origin, id) => `${origin}/api/newsletter/confirm?id=${id}&t=${await makeToken(env, 'confirm', id)}`;
export const unsubscribeUrl = async (env, origin, id) => `${origin}/newsletter?action=unsubscribe&id=${id}&t=${await makeToken(env, 'unsubscribe', id)}`;

const emailReady = (env) => !!((env.BREVO_API_KEY && senderPool(env).length) || env.RESEND_API_KEY);

const confirmHtml = (name, url) => `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#1f2937">
<p>Hi ${name ? String(name).replace(/[<>&"]/g, '') : 'there'},</p>
<p>Please confirm your subscription to the <b>IEEE SB CEK newsletter</b> — event announcements, deadlines and updates.</p>
<p><a href="${url}" style="display:inline-block;background:#00629b;color:#fff;text-decoration:none;padding:12px 22px;border-radius:10px;font-weight:bold">Yes, subscribe me</a></p>
<p style="font-size:12px;color:#6b7280">If you didn't ask for this, just ignore this email — you won't be subscribed.</p></div>`;

/** Public: POST /api/newsletter/subscribe { email, name?, website? (honeypot) } */
export async function subscribe(env, body, ip, origin) {
    // Bots fill the hidden field; pretend it worked.
    if (body?.website) return { status: 'pending' };
    const email = validateEmail(body?.email);
    const name = optionalString(body?.name, 100) || '';
    await rateLimit(env.DB, `newsletter-ip:${await sha256Hex(ip || 'unknown')}`, 6, HOUR);

    const id = await subscriberId(email);
    const before = (await getDocRow(env.DB, `${COLLECTION}/${id}`))?.data;
    if (before?.status === 'active') return { status: 'already' };

    const needsConfirm = emailReady(env);
    if (needsConfirm) await rateLimit(env.DB, `newsletter-email:${id}`, 3, HOUR);
    const now = Date.now();
    await writeDoc(env.DB, `${COLLECTION}/${id}`, (b) => ({
        ...(b || {}),
        email, name: name || b?.name || '',
        status: needsConfirm ? 'pending' : 'active',
        createdAt: b?.createdAt ?? { __ts: now },
        ...(needsConfirm ? { requestedAt: { __ts: now } } : { confirmedAt: { __ts: now } }),
    }));
    if (!needsConfirm) return { status: 'subscribed' };

    try {
        await sendEmail(env, email, 'Confirm your subscription — IEEE SB CEK', confirmHtml(name, await confirmUrl(env, origin, id)));
    } catch (err) {
        console.error('newsletter confirmation failed', err);
        throw new DocError('unavailable', 'Could not send the confirmation email right now. Please try again later.');
    }
    return { status: 'pending' };
}

/** GET /api/newsletter/confirm?id&t → activates, returns where to send the browser. */
export async function confirm(env, id, token) {
    if (!/^[a-f0-9]{48}$/.test(id || '') || !(await verifyToken(env, 'confirm', id, token))) return 'invalid';
    let found = false;
    await writeDoc(env.DB, `${COLLECTION}/${id}`, (b) => {
        if (!b) return null;
        found = true;
        return b.status === 'active' ? b : { ...b, status: 'active', confirmedAt: { __ts: Date.now() } };
    });
    return found ? 'confirmed' : 'invalid';
}

/** POST /api/newsletter/unsubscribe { id, t } */
export async function unsubscribe(env, body) {
    const id = body?.id;
    if (!/^[a-f0-9]{48}$/.test(id || '') || !(await verifyToken(env, 'unsubscribe', id, body?.t))) {
        throw new DocError('permission-denied', 'This unsubscribe link is not valid.');
    }
    await writeDoc(env.DB, `${COLLECTION}/${id}`, (b) => (b ? { ...b, status: 'unsubscribed', unsubscribedAt: { __ts: Date.now() } } : null));
    return { ok: true };
}

/** Active subscribers as roster entries for the Communication Center. */
export async function listSubscribers(env) {
    const { results } = await env.DB.prepare(
        `SELECT data FROM docs WHERE parent = ? AND json_extract(data, '$.status') = 'active'`).bind(COLLECTION).all();
    const counts = await env.DB.prepare(
        `SELECT json_extract(data, '$.status') AS status, COUNT(*) AS n FROM docs WHERE parent = ? GROUP BY 1`).bind(COLLECTION).all();
    return {
        people: results.map(r => JSON.parse(r.data)).map(s => ({ name: s.name || '', email: s.email, phone: null, college: '', events: ['Newsletter'] }))
            .sort((a, b) => a.email.localeCompare(b.email)),
        counts: Object.fromEntries(counts.results.map(c => [c.status, c.n])),
    };
}

/** Keep only recipients who are active subscribers; each gets their own unsubscribe link. */
export async function subscribersOnly(env, recipients, origin) {
    const withId = await Promise.all(recipients.map(async r => ({ ...r, id: await subscriberId(r.email) })));
    if (!withId.length) return [];
    const { results } = await env.DB.prepare(
        `SELECT id FROM docs WHERE parent = ? AND id IN (${withId.map(() => '?').join(',')}) AND json_extract(data, '$.status') = 'active'`)
        .bind(COLLECTION, ...withId.map(r => r.id)).all();
    const active = new Set(results.map(r => r.id));
    return Promise.all(withId.filter(r => active.has(r.id)).map(async r => ({ ...r, unsub: await unsubscribeUrl(env, origin, r.id) })));
}
