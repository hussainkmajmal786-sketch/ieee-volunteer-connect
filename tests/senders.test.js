import { describe, it, expect, vi, afterEach } from 'vitest';
import { senderPool, sendViaBrevo, explainBrevoError } from '../worker/senders.js';

describe('explainBrevoError', () => {
    it('explains the common Brevo failures in plain words', () => {
        expect(explainBrevoError('Brevo 401: {"message":"We have detected you are using an unrecognised IP address 1.2.3.4"}')).toMatch(/Authorised IPs/);
        expect(explainBrevoError('Brevo 400: {"message":"Sender is not valid"}', 'me@x.com')).toMatch(/me@x\.com.*Senders/);
        expect(explainBrevoError('Brevo 401: {"message":"Key not found"}')).toMatch(/API key/);
        expect(explainBrevoError('Brevo 403: {"message":"Your account is not yet activated"}')).toMatch(/activated/);
        expect(explainBrevoError('Email is not configured (BREVO_API_KEY / BREVO_SENDER_EMAIL)')).toMatch(/isn't set up/);
        expect(explainBrevoError('Brevo 429: quota')).toMatch(/daily sending limit/);
    });
});

describe('sendViaBrevo', () => {
    afterEach(() => vi.unstubAllGlobals());
    it('uses the single configured sender and reports Brevo errors', async () => {
        const f = vi.fn(async (_u, o) => (JSON.parse(o.body).sender.email === 'me@x.com' ? new Response('{"message":"Sender is not valid"}', { status: 400 }) : new Response('{}', { status: 201 })));
        vi.stubGlobal('fetch', f);
        expect(senderPool({ BREVO_SENDER_EMAIL: 'Me@X.com' })).toEqual(['me@x.com']);
        await expect(sendViaBrevo({ BREVO_API_KEY: 'k', BREVO_SENDER_EMAIL: 'me@x.com' }, {})).rejects.toThrow(/400.*Sender is not valid/);
        await expect(sendViaBrevo({ BREVO_API_KEY: 'k' }, {})).rejects.toThrow(/not configured/);
        expect((await sendViaBrevo({ BREVO_API_KEY: 'k', BREVO_SENDER_EMAIL: 'ok@x.com' }, {})).sender).toBe('ok@x.com');
    });
});
