// Outgoing email through Brevo from the one configured sender (BREVO_SENDER_EMAIL).
const EMAIL_RE = /^[^\s@,]+@[^\s@,]+\.[^\s@,]+$/;

export function senderPool(env) {
    const e = String(env.BREVO_SENDER_EMAIL || '').trim().toLowerCase();
    return EMAIL_RE.test(e) ? [e] : [];
}

/** POST to Brevo's transactional email API. `payload` is everything except the sender. Returns { sender }. */
export async function sendViaBrevo(env, payload) {
    const [email] = senderPool(env);
    if (!env.BREVO_API_KEY || !email) throw new Error('Email is not configured (BREVO_API_KEY / BREVO_SENDER_EMAIL)');
    const res = await fetch(env.BREVO_API_URL || 'https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: { 'api-key': env.BREVO_API_KEY, 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ ...payload, sender: { email, name: env.BREVO_SENDER_NAME || 'IEEE SB CEK' } }),
    });
    if (!res.ok) throw new Error(`Brevo ${res.status}: ${(await res.text()).slice(0, 200)}`);
    return { sender: email };
}
