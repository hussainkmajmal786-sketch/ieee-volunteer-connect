// Ambassador referral attribution.
// A visitor who opens /event/:id?ref=<ambassadorUid> often has to sign in (or
// create an account) before registering. That round-trip drops the query
// string, so we remember the referrer per event and re-apply it at
// registration time.

const STORAGE_KEY = '_vc_refs';
export const REFERRAL_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const REF_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

export function isValidRefId(ref) {
    return typeof ref === 'string' && REF_PATTERN.test(ref);
}

function readAll(storage) {
    try {
        const parsed = JSON.parse(storage.getItem(STORAGE_KEY) || '{}');
        return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
        return {};
    }
}

function defaultStorage() {
    try { return window.localStorage; } catch { return null; }
}

/**
 * Remember who referred this visitor to `eventId`. First touch wins: a later
 * click on a different ambassador's link does not steal the credit while the
 * original attribution is still fresh.
 */
export function rememberReferral(eventId, refId, { now = Date.now(), storage = defaultStorage() } = {}) {
    if (!storage || !eventId || !isValidRefId(refId)) return;
    try {
        const all = readAll(storage);
        const existing = all[eventId];
        if (existing && now - existing.ts < REFERRAL_TTL_MS) return;
        all[eventId] = { ref: refId, ts: now };
        storage.setItem(STORAGE_KEY, JSON.stringify(all));
    } catch { /* storage unavailable (private mode) — attribution falls back to the URL */ }
}

export function getStoredReferral(eventId, { now = Date.now(), storage = defaultStorage() } = {}) {
    if (!storage || !eventId) return null;
    const entry = readAll(storage)[eventId];
    if (!entry || !isValidRefId(entry.ref) || now - entry.ts >= REFERRAL_TTL_MS) return null;
    return entry.ref;
}

/** The referrer to credit: the stored first touch, else the one in the current URL. */
export function resolveReferral(eventId, urlRef, opts) {
    return getStoredReferral(eventId, opts) || (isValidRefId(urlRef) ? urlRef : null);
}

/**
 * An ambassador's personal link. The server records the click and sends the
 * visitor to this site or the event's main website (chosen per event).
 */
export function buildReferralLink(origin, eventId, refId) {
    return `${origin}/r/${encodeURIComponent(eventId)}/${encodeURIComponent(refId)}`;
}

/**
 * Per-ambassador funnel for one event, from the counters the Cloud Functions
 * maintain on the event document.
 */
export function referralFunnel(event, refId) {
    const clicks = event?.refClicks?.[refId] || 0;
    const visitors = event?.refVisitors?.[refId] || 0;
    const registrations = event?.refCounts?.[refId] || 0;
    const conversion = visitors > 0 ? Math.round((registrations / visitors) * 100) : 0;
    return { clicks, visitors, registrations, conversion };
}

/** Every ambassador who has any activity on `event`, sorted by registrations then visitors. */
export function ambassadorRows(event) {
    const ids = new Set([
        ...Object.keys(event?.refClicks || {}),
        ...Object.keys(event?.refVisitors || {}),
        ...Object.keys(event?.refCounts || {}),
    ]);
    return [...ids]
        .map(refId => ({ refId, ...referralFunnel(event, refId) }))
        .sort((a, b) => b.registrations - a.registrations || b.visitors - a.visitors || b.clicks - a.clicks);
}
