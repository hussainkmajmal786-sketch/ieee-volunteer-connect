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

/** Plain-language reason + fix for a Brevo error (shown to the super admin). */
export function explainBrevoError(message, sender = '') {
    const m = String(message || '');
    if (/not configured/i.test(m)) return 'Email isn\'t set up: BREVO_API_KEY or BREVO_SENDER_EMAIL is missing on the site.';
    if (/unrecognised ip|unrecognized ip|ip address|authorised ip|authorized ip/i.test(m)) {
        return 'Brevo is blocking the site\'s server by IP address. In Brevo go to your name (top right) → Security → Authorised IPs and deactivate the IP blocking (Cloudflare\'s IP addresses change, so they can\'t be listed).';
    }
    if (/sender|from address|not valid|not verified|invalid.*email/i.test(m) && /\b(400|403)\b/.test(m)) {
        return `Brevo doesn't accept ${sender || 'the sender address'} as a sender yet. In Brevo go to Senders, Domains & Dedicated IPs → Senders → add it and click the verification link Brevo emails to that address.`;
    }
    if (/key not found|invalid api key|api-key/i.test(m) || /\b401\b/.test(m)) {
        return 'Brevo rejected the API key. Create a new API key in Brevo (SMTP & API → API Keys, the "API" tab, starting with xkeysib-) and set it again as the BREVO_API_KEY secret.';
    }
    if (/not.*(activated|enabled)|permission|contact.*support|account/i.test(m) || /\b403\b/.test(m)) {
        return 'Brevo hasn\'t activated email sending for this account yet. New Brevo accounts must be validated first — check Brevo\'s notice at the top of the dashboard or contact Brevo support.';
    }
    if (/\b(429|quota|limit)\b/i.test(m)) return 'Brevo\'s daily sending limit was reached (free plan: 300 emails a day). Try again tomorrow.';
    return 'Brevo returned an error — see the details above.';
}
