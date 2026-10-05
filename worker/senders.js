// Outgoing email through Brevo, alternating between several sender addresses.
//
//   BREVO_SENDER_EMAIL    the sender when no rotation list is set
//   BREVO_SENDER_EMAILS   optional comma-separated senders to alternate between
//                         (used instead of BREVO_SENDER_EMAIL) — every address
//                         must be verified in Brevo
//   BREVO_REPLY_TO        where replies go (default: the organisation mailbox),
//                         so answers always reach the organisation whichever
//                         sender address was used
//
// Each send alternates to the next sender. If Brevo refuses a sender (for
// example one that isn't verified yet) the next one is tried, so mail never
// stops because of a single address.
export const ORG_EMAIL = 'ajmal_b25219ec_a@ce-kgr.org';
const EMAIL_RE = /^[^\s@,]+@[^\s@,]+\.[^\s@,]+$/;

export function senderPool(env) {
    // When a rotation list is set it is exactly the senders used; otherwise the single main sender.
    const clean = (list) => [...new Set(list.map(e => String(e || '').trim().toLowerCase()).filter(e => EMAIL_RE.test(e)))];
    const rotation = clean(String(env.BREVO_SENDER_EMAILS || '').split(','));
    return rotation.length ? rotation : clean([env.BREVO_SENDER_EMAIL]);
}

export const replyToAddress = (env) => String(env.BREVO_REPLY_TO || ORG_EMAIL).trim();

/** Next position in the rotation (shared across requests through the database). */
async function nextIndex(env, size) {
    if (size < 2 || !env.DB) return 0;
    const row = await env.DB.prepare(
        // window_start is far in the future so the rate-limit cleanup never deletes this counter.
        `INSERT INTO rate_limits (subject, window_start, count) VALUES ('email-sender-rotation', 9007199254740000, 1)
         ON CONFLICT(subject) DO UPDATE SET count = count + 1 RETURNING count`).first();
    return (row.count - 1) % size;
}

/**
 * POST to Brevo's transactional email API with the next sender in the pool.
 * `payload` is everything except sender/replyTo. Returns { sender }.
 */
export async function sendViaBrevo(env, payload) {
    const pool = senderPool(env);
    if (!env.BREVO_API_KEY || pool.length === 0) throw new Error('Email is not configured (BREVO_API_KEY / BREVO_SENDER_EMAIL)');
    const start = await nextIndex(env, pool.length);
    const name = env.BREVO_SENDER_NAME || 'IEEE SB CEK';
    let lastError;
    for (let i = 0; i < pool.length; i++) {
        const email = pool[(start + i) % pool.length];
        const res = await fetch(env.BREVO_API_URL || 'https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: { 'api-key': env.BREVO_API_KEY, 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify({ ...payload, sender: { email, name }, replyTo: { email: replyToAddress(env), name } }),
        });
        if (res.ok) return { sender: email };
        const text = (await res.text()).slice(0, 200);
        lastError = new Error(`Brevo ${res.status}: ${text}`);
        // A sender Brevo doesn't accept → try the next one; anything else (bad key, bad content) won't be fixed by another sender.
        if (!([400, 401, 403].includes(res.status) && /sender|from|valid/i.test(text)) || pool.length === 1) throw lastError;
    }
    throw lastError;
}
