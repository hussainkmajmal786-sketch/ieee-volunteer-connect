// Super admin → registered participants: email (Brevo), SMS (Fast2SMS) and
// WhatsApp (Meta Cloud API). The browser sends recipients in small batches so
// each request stays within Workers' per-request subrequest limits.
import { DocError, writeDoc, autoId, applyUpdate } from './docstore.js';
import { isSuperAdmin } from './rules.js';
import { requireString, optionalString, safeFieldKey } from './functions.js';

export const MAX_BATCH = 40;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function channelStatus(env) {
    return {
        email: !!(env.BREVO_API_KEY && env.BREVO_SENDER_EMAIL),
        sms: !!env.FAST2SMS_API_KEY,
        whatsapp: !!(env.WHATSAPP_TOKEN && env.WHATSAPP_PHONE_NUMBER_ID),
        emailLimitPerDay: 300,
    };
}

async function requireSuperAdmin(ctx) {
    if (!(await isSuperAdmin(ctx))) throw new DocError('permission-denied', 'Only the super admin can message participants');
}

/** 10-digit Indian mobile number, or null. */
export function indianMobile(phone) {
    let d = String(phone || '').replace(/\D/g, '');
    if (d.length === 12 && d.startsWith('91')) d = d.slice(2);
    if (d.length === 11 && d.startsWith('0')) d = d.slice(1);
    return /^[6-9]\d{9}$/.test(d) ? d : null;
}

/**
 * Everyone registered for one event (or all events), de-duplicated by email
 * and by phone, with the events each person registered for.
 */
export async function listParticipants(env, ctx, eventId) {
    await requireSuperAdmin(ctx);
    const db = env.DB;
    const event = eventId ? safeFieldKey(eventId) : null;
    const stmt = event
        ? db.prepare("SELECT parent, data FROM docs WHERE parent = ?").bind(`events/${event}/registrations`)
        : db.prepare("SELECT parent, data FROM docs WHERE parent LIKE 'events/%/registrations'");
    const { results } = await stmt.all();

    const names = {};
    const { results: evs } = await db.prepare("SELECT id, json_extract(data, '$.name') AS name FROM docs WHERE parent = 'events'").all();
    for (const e of evs) names[e.id] = e.name;

    const people = new Map();
    for (const row of results) {
        const r = JSON.parse(row.data);
        const evId = row.parent.split('/')[1];
        const email = String(r.email || '').toLowerCase().trim();
        const phone = indianMobile(r.phone);
        const key = email || phone;
        if (!key) continue;
        const p = people.get(key) || { name: r.name || '', email: EMAIL_RE.test(email) ? email : null, phone, college: r.college || '', events: [] };
        if (!p.phone && phone) p.phone = phone;
        if (names[evId] && !p.events.includes(names[evId])) p.events.push(names[evId]);
        people.set(key, p);
    }
    const list = [...people.values()].sort((a, b) => a.name.localeCompare(b.name));
    return {
        participants: list,
        counts: { total: list.length, withEmail: list.filter(p => p.email).length, withPhone: list.filter(p => p.phone).length },
        channels: channelStatus(env),
    };
}

// ─── Providers ───────────────────────────────────────────────

const escapeHtml = (s) => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function emailHtml(message) {
    const body = escapeHtml(message).replace(/\{\{name\}\}/g, '{{params.name}}').replace(/\n/g, '<br>');
    return `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#1f2937">${body}
<hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
<p style="font-size:12px;color:#6b7280">IEEE SB CEK · You are receiving this because you registered for an IEEE event.</p></div>`;
}

async function sendEmails(env, recipients, { subject, message }) {
    const res = await fetch(env.BREVO_API_URL || 'https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: { 'api-key': env.BREVO_API_KEY, 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
            sender: { email: env.BREVO_SENDER_EMAIL, name: env.BREVO_SENDER_NAME || 'IEEE SB CEK' },
            subject,
            htmlContent: emailHtml(message),
            // One version per person so nobody sees anyone else's address.
            messageVersions: recipients.map(r => ({ to: [{ email: r.email, name: r.name || undefined }], params: { name: r.name || 'there' } })),
        }),
    });
    if (!res.ok) throw new Error(`Brevo ${res.status}: ${(await res.text()).slice(0, 200)}`);
    return { sent: recipients.length, failed: 0 };
}

async function sendSms(env, recipients, { message }) {
    const res = await fetch(env.FAST2SMS_API_URL || 'https://www.fast2sms.com/dev/bulkV2', {
        method: 'POST',
        headers: { authorization: env.FAST2SMS_API_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({
            route: 'q',   // Quick SMS: no DLT template needed
            message: message.replace(/\{\{name\}\}/g, '').replace(/\s+/g, ' ').trim(),
            language: 'english',
            flash: 0,
            numbers: recipients.map(r => r.phone).join(','),
        }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json.return === false) throw new Error(`Fast2SMS: ${json.message || res.status}`);
    return { sent: recipients.length, failed: 0 };
}

async function sendWhatsApp(env, recipients, { message }) {
    const url = `${env.WHATSAPP_API_URL || 'https://graph.facebook.com/v21.0'}/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
    // Template parameters can't contain new lines or long runs of spaces.
    const text = message.replace(/\{\{name\}\}/g, '').replace(/\s+/g, ' ').trim().slice(0, 1000);
    let sent = 0;
    const errors = [];
    await Promise.all(recipients.map(async (r) => {
        const res = await fetch(url, {
            method: 'POST',
            headers: { Authorization: `Bearer ${env.WHATSAPP_TOKEN}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messaging_product: 'whatsapp',
                to: `91${r.phone}`,
                type: 'template',
                template: {
                    name: env.WHATSAPP_TEMPLATE || 'ieee_update',
                    language: { code: env.WHATSAPP_TEMPLATE_LANG || 'en' },
                    components: [{ type: 'body', parameters: [{ type: 'text', text: r.name || 'there' }, { type: 'text', text }] }],
                },
            }),
        }).catch(err => ({ ok: false, text: async () => err.message }));
        if (res.ok) sent++;
        else errors.push((await res.text()).slice(0, 160));
    }));
    return { sent, failed: recipients.length - sent, error: errors[0] };
}

// ─── Sending ─────────────────────────────────────────────────

/**
 * Send one batch. The first batch creates a broadcasts/{id} log entry; later
 * batches pass its id so the totals add up.
 */
export async function sendBatch(env, ctx, body) {
    await requireSuperAdmin(ctx);
    const channel = body?.channel;
    const status = channelStatus(env);
    if (!['email', 'sms', 'whatsapp'].includes(channel)) throw new DocError('invalid-argument', 'Unknown channel');
    if (!status[channel]) throw new DocError('failed-precondition', `${channel} is not set up yet`);

    const message = requireString(body?.message, 'message', channel === 'email' ? 10000 : 1000);
    const subject = channel === 'email' ? requireString(body?.subject, 'subject', 200) : null;
    const raw = Array.isArray(body?.recipients) ? body.recipients : [];
    if (raw.length === 0 || raw.length > MAX_BATCH) throw new DocError('invalid-argument', `Send 1-${MAX_BATCH} recipients per batch`);

    const recipients = raw.map(r => ({
        name: optionalString(String(r?.name || ''), 100) || '',
        email: EMAIL_RE.test(String(r?.email || '')) ? String(r.email).toLowerCase() : null,
        phone: indianMobile(r?.phone),
    })).filter(r => (channel === 'email' ? r.email : r.phone));
    const skipped = raw.length - recipients.length;

    let result = { sent: 0, failed: 0 };
    if (recipients.length) {
        try {
            result = channel === 'email' ? await sendEmails(env, recipients, { subject, message })
                : channel === 'sms' ? await sendSms(env, recipients, { message })
                    : await sendWhatsApp(env, recipients, { message });
        } catch (err) {
            result = { sent: 0, failed: recipients.length, error: err.message };
        }
    }

    const logId = safeFieldKey(body?.logId) || autoId();
    await writeDoc(env.DB, `broadcasts/${logId}`, (before) => before
        ? applyUpdate(before, { sent: { __op: 'increment', n: result.sent }, failed: { __op: 'increment', n: result.failed }, skipped: { __op: 'increment', n: skipped } })
        : {
            channel, subject, message: message.slice(0, 2000), eventId: optionalString(body?.eventId, 128),
            eventName: optionalString(body?.eventName, 200), total: Number(body?.total) || raw.length,
            sent: result.sent, failed: result.failed, skipped, sentBy: ctx.auth.uid, createdAt: { __ts: Date.now() },
        });
    return { logId, ...result, skipped };
}
