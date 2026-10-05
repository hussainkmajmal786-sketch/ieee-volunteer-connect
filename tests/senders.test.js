import { describe, it, expect, vi, afterEach } from 'vitest';
import { senderPool, replyToAddress, sendViaBrevo, ORG_EMAIL } from '../worker/senders.js';

const counterDb = () => { let n = 0; return { prepare: () => ({ first: async () => ({ count: ++n }) }) }; };

describe('sender pool', () => {
    it('uses the rotation list when set (de-duplicated, validated), else the single sender', () => {
        expect(senderPool({ BREVO_SENDER_EMAIL: 'A@x.com', BREVO_SENDER_EMAILS: ' b@x.com, c@x.com, not-an-email ,B@x.com' })).toEqual(['b@x.com', 'c@x.com']);
        expect(senderPool({ BREVO_SENDER_EMAIL: 'A@x.com' })).toEqual(['a@x.com']);
        expect(senderPool({ BREVO_SENDER_EMAIL: 'A@x.com', BREVO_SENDER_EMAILS: ' , nope' })).toEqual(['a@x.com']);
        expect(senderPool({})).toEqual([]);
    });
    it('replies go to the organisation mailbox unless overridden', () => {
        expect(replyToAddress({})).toBe(ORG_EMAIL);
        expect(replyToAddress({ BREVO_REPLY_TO: 'club@x.com' })).toBe('club@x.com');
    });
});

describe('sendViaBrevo', () => {
    afterEach(() => vi.unstubAllGlobals());

    it('alternates senders between sends and always sets the reply-to', async () => {
        const bodies = [];
        vi.stubGlobal('fetch', vi.fn(async (_u, o) => { bodies.push(JSON.parse(o.body)); return new Response('{}', { status: 201 }); }));
        const env = { BREVO_API_KEY: 'k', BREVO_SENDER_EMAILS: 'one@x.com,two@x.com', DB: counterDb() };
        const used = [];
        for (let i = 0; i < 4; i++) used.push((await sendViaBrevo(env, { subject: 's', htmlContent: 'h', to: [{ email: 'r@x.com' }] })).sender);
        expect(used).toEqual(['one@x.com', 'two@x.com', 'one@x.com', 'two@x.com']);
        expect(bodies.every(b => b.replyTo.email === ORG_EMAIL && b.subject === 's')).toBe(true);
    });

    it('falls back to the next sender when Brevo rejects one', async () => {
        const tried = [];
        vi.stubGlobal('fetch', vi.fn(async (_u, o) => {
            const email = JSON.parse(o.body).sender.email; tried.push(email);
            return email === 'new@x.com' ? new Response('{"message":"Sender is not valid"}', { status: 400 }) : new Response('{}', { status: 201 });
        }));
        const env = { BREVO_API_KEY: 'k', BREVO_SENDER_EMAILS: 'new@x.com,ok@x.com', DB: counterDb() };
        expect((await sendViaBrevo(env, { subject: 's' })).sender).toBe('ok@x.com');
        expect(tried).toEqual(['new@x.com', 'ok@x.com']);
    });

    it('does not retry unrelated failures, and needs a configured sender', async () => {
        const f = vi.fn(async () => new Response('{"message":"Key not found"}', { status: 401 }));
        vi.stubGlobal('fetch', f);
        await expect(sendViaBrevo({ BREVO_API_KEY: 'k', BREVO_SENDER_EMAILS: 'a@x.com,b@x.com', DB: counterDb() }, {})).rejects.toThrow(/401/);
        expect(f).toHaveBeenCalledTimes(1);
        await expect(sendViaBrevo({ BREVO_API_KEY: 'k' }, {})).rejects.toThrow(/not configured/);
    });
});
