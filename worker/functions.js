// Server-side operations that used to be Firebase Cloud Functions.
import { writeDoc, getDocRow, runQuery, autoId, applyUpdate, DocError } from './docstore.js';

const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const LINK_CLICK_LIMIT_PER_WINDOW = 10;
const LINK_CLICK_LIMIT_PER_IP = 120;
export const REFERRAL_POINTS = 10;

export function requireString(value, field, maxLength) {
    if (typeof value !== 'string' || value.trim().length === 0 || value.length > maxLength) {
        throw new DocError('invalid-argument', `${field} is required`);
    }
    return value.trim();
}

export function optionalString(value, maxLength) {
    if (value == null || value === '') return null;
    if (typeof value !== 'string' || value.length > maxLength) {
        throw new DocError('invalid-argument', 'Invalid string field');
    }
    return value.trim();
}

export function validateEmail(value) {
    const email = requireString(value, 'email', 200).toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new DocError('invalid-argument', 'Invalid email');
    return email;
}

export function safeFieldKey(value) {
    if (!value) return null;
    return String(value).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 64);
}

export async function sha256Hex(value) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(String(value)));
    return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 48);
}

/** Fixed-window limiter; throws resource-exhausted when over the limit. */
async function rateLimit(db, subject, limit, windowMs) {
    const now = Date.now();
    const row = await db.prepare(`
        INSERT INTO rate_limits (subject, window_start, count) VALUES (?1, ?2, 1)
        ON CONFLICT(subject) DO UPDATE SET
            count = CASE WHEN ?2 - window_start >= ?3 THEN 1 ELSE count + 1 END,
            window_start = CASE WHEN ?2 - window_start >= ?3 THEN ?2 ELSE window_start END
        RETURNING count`).bind(subject, now, windowMs).first();
    // Occasionally drop expired windows so the table stays small.
    if (Math.random() < 0.01) await db.prepare('DELETE FROM rate_limits WHERE window_start < ?').bind(now - 60 * 60 * 1000).run();
    if (row.count > limit) throw new DocError('resource-exhausted', 'Too many tracking events. Try again later.');
}

export async function registerForEvent(env, auth, data) {
    if (!auth) throw new DocError('unauthenticated', 'Sign in before registering for events');
    const db = env.DB;

    const eventId = safeFieldKey(requireString(data?.eventId, 'eventId', 128));
    const form = data?.form || {};
    const registration = {
        userId: auth.uid,
        name: requireString(form.name, 'name', 100),
        email: validateEmail(form.email),
        phone: requireString(form.phone, 'phone', 40),
        college: requireString(form.college, 'college', 160),
        year: requireString(form.year, 'year', 40),
        eventId,
        registeredAt: { __ts: Date.now() },
    };

    if (!(await getDocRow(db, `events/${eventId}`))) throw new DocError('not-found', 'Event not found');

    const regsPath = `events/${eventId}/registrations`;
    const dupe = await runQuery(db, regsPath, { filters: [{ field: 'email', op: '==', value: registration.email }], limit: 1 });
    if (dupe.length > 0 && dupe[0].id !== auth.uid) {
        throw new DocError('already-exists', 'This email is already registered for this event');
    }

    // Self-referrals and refs that are not real accounts are never credited.
    const requestedRef = safeFieldKey(data?.referredBy);
    if (requestedRef && requestedRef !== auth.uid) {
        const referrer = await getDocRow(db, `users/${requestedRef}`);
        if (referrer) {
            registration.referredBy = requestedRef;
            registration.referrerName = optionalString(referrer.data.name, 100);
        }
    }

    // The registration doc is keyed by uid, so "create only if absent" is the
    // duplicate guard; the counters are only bumped when it was created.
    await writeDoc(db, `${regsPath}/${auth.uid}`, (before) => {
        if (before) throw new DocError('already-exists', 'You are already registered for this event');
        return registration;
    });

    const counters = { participants: { __op: 'increment', n: 1 } };
    if (registration.referredBy) counters[`refCounts.${registration.referredBy}`] = { __op: 'increment', n: 1 };
    await updateFields(db, `events/${eventId}`, counters);

    // The ambassador earns points for every registration through their link.
    if (registration.referredBy) {
        await updateFields(db, `users/${registration.referredBy}`, {
            points: { __op: 'increment', n: REFERRAL_POINTS },
            referrals: { __op: 'increment', n: 1 },
        });
    }

    return { ok: true };
}

/** Per-visitor limit with a per-IP ceiling (campus Wi-Fi shares one IP). */
export async function limitClicks(db, { uid, ip, visitorId }) {
    const ipKey = `ip_${await sha256Hex(ip || 'unknown')}`;
    const subject = uid ? `uid_${uid}` : visitorId ? `${ipKey}_${await sha256Hex(visitorId)}` : ipKey;
    await rateLimit(db, `linkClicks:${subject}`, LINK_CLICK_LIMIT_PER_WINDOW, RATE_LIMIT_WINDOW_MS);
    if (!uid) await rateLimit(db, `linkClicks:${ipKey}:all`, LINK_CLICK_LIMIT_PER_IP, RATE_LIMIT_WINDOW_MS);
    return subject;
}

/**
 * Count an ambassador-link visit on the event's counters (clicks, and unique
 * visitors the first time this visitor arrives through this ambassador).
 */
export async function creditReferralVisit(db, { eventId, refId, uid, visitorKey }) {
    const refKey = safeFieldKey(refId);
    const eventKey = safeFieldKey(eventId);
    if (!refKey || !eventKey || refKey === uid) return false;
    if (!(await getDocRow(db, `events/${eventKey}`))) return false;

    const visitId = await sha256Hex(`${eventKey}|${refKey}|${visitorKey}`);
    let firstVisit = false;
    await writeDoc(db, `referralVisits/${visitId}`, (before) => {
        if (before) return before;
        firstVisit = true;
        return { eventId: eventKey, refId: refKey, userId: uid, firstSeen: { __ts: Date.now() } };
    });

    const counters = { [`refClicks.${refKey}`]: { __op: 'increment', n: 1 } };
    if (firstVisit) counters[`refVisitors.${refKey}`] = { __op: 'increment', n: 1 };
    await updateFields(db, `events/${eventKey}`, counters);
    return true;
}

export async function recordLinkClick(env, auth, data, ip) {
    const db = env.DB;
    const uid = auth?.uid || null;
    const visitorId = optionalString(data?.visitorId, 128);
    const subject = await limitClicks(db, { uid, ip, visitorId });

    const eventType = requireString(data?.eventType || 'event', 'eventType', 64);
    const payload = {
        eventType,
        source: optionalString(data?.source, 128),
        medium: optionalString(data?.medium, 64),
        campaign: optionalString(data?.campaign, 128),
        page: optionalString(data?.page, 256),
        element: optionalString(data?.element, 128),
        eventId: optionalString(data?.eventId, 128),
        eventName: optionalString(data?.eventName, 200),
        refId: optionalString(data?.refId, 128),
        sessionId: optionalString(data?.sessionId, 128),
        visitorId,
        device: optionalString(data?.device, 40),
        userId: uid,
        timestamp: { __ts: Date.now() },
    };
    await writeDoc(db, `linkClicks/${autoId()}`, () => payload);

    // Ambassador link visits feed per-event counters so ambassadors (who
    // cannot read linkClicks) can see their own funnel on the event document.
    if (eventType === 'referral_visit') {
        const visitorKey = uid ? `uid_${uid}` : visitorId || payload.sessionId || subject;
        await creditReferralVisit(db, { eventId: payload.eventId, refId: payload.refId, uid, visitorKey });
    }
    return { ok: true };
}

// Server-trusted field update (no rules check).
export async function updateFields(db, path, fields) {
    await writeDoc(db, path, (before) => (before ? applyUpdate(before, fields) : null));
}
