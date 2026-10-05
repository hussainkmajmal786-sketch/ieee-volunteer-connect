import { describe, it, expect, vi, afterEach } from 'vitest';
import { parsePage, publicHttpUrl, parseModelJson, buildDraft, importEvent, AI_MODEL } from '../worker/eventImport.js';

const IG_HTML = `<html><head>
<meta property="og:title" content="IEEE SB CEK on Instagram: &quot;Hack the Hills 2.0&quot;" />
<meta property="og:description" content="24hr hackathon 🚀 Register: https://forms.gle/AbC123. Venue: CEK Main Block &amp; Lab 2" />
<meta property="og:image" content="https://scontent.cdninstagram.com/v/poster.jpg?x=1&amp;y=2" />
<meta property="og:video:secure_url" content="https://scontent.cdninstagram.com/v/reel.mp4" />
</head></html>`;

describe('parsePage', () => {
    it('reads Instagram-style preview tags and decodes entities', () => {
        const p = parsePage(IG_HTML, 'https://www.instagram.com/p/xyz/');
        expect(p.title).toBe('IEEE SB CEK on Instagram: "Hack the Hills 2.0"');
        expect(p.text).toContain('CEK Main Block & Lab 2');
        expect(p.image).toBe('https://scontent.cdninstagram.com/v/poster.jpg?x=1&y=2');
        expect(p.video).toBe('https://scontent.cdninstagram.com/v/reel.mp4');
    });

    it('reads schema.org Event data and resolves relative images', () => {
        const html = `<meta name="description" content="d"><meta property="og:image" content="/img/p.png">
<script type="application/ld+json">{"@graph":[{"@type":"WebPage"},{"@type":"Event","name":"RoboWars","startDate":"2026-11-20T10:30:00+05:30","location":{"name":"CEK Auditorium"},"url":"https://ieee.ce-kgr.org/robowars"}]}</script>`;
        const p = parsePage(html, 'https://ieee.ce-kgr.org/events/1');
        expect(p.image).toBe('https://ieee.ce-kgr.org/img/p.png');
        expect(p.event).toMatchObject({ name: 'RoboWars', venue: 'CEK Auditorium', startDate: '2026-11-20T10:30:00+05:30' });
    });
});

describe('publicHttpUrl', () => {
    it('allows public web links only', () => {
        expect(publicHttpUrl('https://www.instagram.com/p/abc/')).toBe('https://www.instagram.com/p/abc/');
        for (const bad of ['http://localhost/x', 'http://127.0.0.1/', 'http://10.0.0.5/', 'http://[::1]/', 'http://intranet/', 'javascript:alert(1)', 'ftp://a.com/x', 'http://x.internal/']) {
            expect(publicHttpUrl(bad)).toBeNull();
        }
    });
});

describe('parseModelJson', () => {
    it('accepts objects, plain JSON and fenced JSON', () => {
        expect(parseModelJson({ response: { name: 'A' } })).toEqual({ name: 'A' });
        expect(parseModelJson({ response: '{"name":"B"}' })).toEqual({ name: 'B' });
        expect(parseModelJson({ response: 'Here you go:\n```json\n{"name":"C"}\n```' })).toEqual({ name: 'C' });
        expect(parseModelJson({ response: 'no json' })).toBeNull();
    });
});

describe('buildDraft', () => {
    it('turns AI output into event form fields with the extras in the description', () => {
        const d = buildDraft({
            ai: { name: 'Hack the Hills 2.0', date: '2026-11-21', time: '9:30', venue: 'CEK', category: 'Hackathon', description: 'A 24 hour hackathon.', fee: '₹200', registerBy: '2026-11-15', contacts: [{ name: 'Anu', phone: '9876543210' }], registrationUrl: 'javascript:x' },
            page: null,
            caption: 'Register: https://forms.gle/AbC123.',
        });
        expect(d).toMatchObject({ name: 'Hack the Hills 2.0', date: '2026-11-21T09:30', venue: 'CEK', category: 'Hackathon', registrationUrl: 'https://forms.gle/AbC123', timeGuessed: false });
        expect(d).toMatchObject({ fee: '200', registrationDeadline: '2026-11-15T23:59', contactName: 'Anu', contactPhone: '9876543210', mode: 'Offline' });
        expect(d.desc).toBe('A 24 hour hackathon.');
    });

    it('keeps detailed fees in the description and reads new fields', () => {
        const d = buildDraft({
            ai: { name: 'X', date: '2026-11-21', endDate: '2026-11-22', fee: '₹100 (IEEE members ₹50)', mode: 'Hybrid', prize: '₹50,000', teamSize: '2-4', category: 'Tech Fest', contacts: [{ name: 'A', phone: '1' }, { name: 'B', phone: '2' }] },
            caption: '',
        });
        expect(d).toMatchObject({ fee: '100', mode: 'Hybrid', prize: '₹50,000', teamSize: '2-4', category: 'Tech Fest', endDate: '2026-11-22T18:00' });
        expect(d.desc).toContain('Fee: ₹100 (IEEE members ₹50)');
        expect(d.desc).toContain('More contacts: B 2');
        expect(buildDraft({ ai: { name: 'Y', fee: 'Free' }, caption: '' }).fee).toBe('0');
    });

    it('falls back to structured page data and rejects bad values', () => {
        const d = buildDraft({
            ai: { date: '21/11/2026', time: '25:00', category: 'Party' },
            page: { title: 'Page', event: { name: 'RoboWars', startDate: '2026-11-20T10:30:00+05:30', venue: 'Auditorium', url: 'https://ieee.ce-kgr.org/robowars' } },
            caption: '',
        });
        expect(d).toMatchObject({ name: 'RoboWars', date: '2026-11-20T10:30', venue: 'Auditorium', category: 'Workshop', registrationUrl: 'https://ieee.ce-kgr.org/robowars' });
    });

    it('marks a missing time', () => {
        expect(buildDraft({ ai: { name: 'X', date: '2026-12-01' }, caption: '' })).toMatchObject({ date: '2026-12-01T09:00', timeGuessed: true });
    });
});

describe('importEvent', () => {
    afterEach(() => vi.unstubAllGlobals());

    const kv = () => { const m = new Map(); return { m, put: async (k, v, o) => m.set(k, { v, o }) }; };
    const db = { prepare: () => ({ bind: () => ({ first: async () => ({ count: 1 }), run: async () => ({}) }) }) };
    const admin = { auth: { uid: 'a1' }, profile: async () => ({ role: 'ADMIN' }) };
    const form = (fields) => { const f = new FormData(); for (const [k, v] of Object.entries(fields)) f.append(k, v); return f; };

    it('reads a post link: copies the poster and video, asks the AI with the image', async () => {
        const fetchMock = vi.fn(async (url) => {
            if (url.includes('instagram.com/p/')) return new Response(IG_HTML, { headers: { 'content-type': 'text/html' } });
            if (url.includes('poster.jpg')) return new Response(new Uint8Array([1, 2, 3]), { headers: { 'content-type': 'image/jpeg' } });
            if (url.includes('reel.mp4')) return new Response(new Uint8Array([4, 5]), { headers: { 'content-type': 'video/mp4' } });
            return new Response('no', { status: 404 });
        });
        vi.stubGlobal('fetch', fetchMock);
        const run = vi.fn(async () => ({ response: { name: 'Hack the Hills 2.0', date: '2026-11-21', time: '09:00', venue: 'CEK Main Block', category: 'Hackathon', description: 'Build things.' } }));
        const FILES_KV = kv();
        const r = await importEvent({ DB: db, AI: { run }, FILES_KV }, admin, form({ url: 'https://www.instagram.com/p/xyz/' }));

        expect(fetchMock.mock.calls[0][1].headers['User-Agent']).toMatch(/facebookexternalhit/);
        expect(run.mock.calls[0][0]).toBe(AI_MODEL);
        const user = run.mock.calls[0][1].messages[1].content;
        expect(user[0].text).toContain('24hr hackathon');
        expect(user[1].image_url.url).toMatch(/^data:image\/jpeg;base64,AQID$/);
        expect(r.draft).toMatchObject({ name: 'Hack the Hills 2.0', date: '2026-11-21T09:00', registrationUrl: 'https://forms.gle/AbC123', sourceUrl: 'https://www.instagram.com/p/xyz/' });
        expect(r.draft.imageUrl).toMatch(/^\/files\/events\/\d+-poster\.jpg$/);
        expect(r.draft.videoUrl).toMatch(/^\/files\/event-media\/\d+-post-video\.mp4$/);
        expect(FILES_KV.m.size).toBe(2);
        expect(r.aiUsed).toBe(true);
    });

    it('works from an uploaded poster alone and survives an AI failure', async () => {
        const FILES_KV = kv();
        const file = new File([new Uint8Array([9])], 'p.png', { type: 'image/png' });
        const r = await importEvent({ DB: db, AI: { run: async () => { throw new Error('down'); } }, FILES_KV }, admin, form({ file, text: 'Python workshop 2026-12-05 10:00 at Lab 3' }));
        expect(r.draft.imageUrl).toMatch(/\.png$/);
        expect(r.aiUsed).toBe(false);
        expect(r.warnings.join(' ')).toMatch(/unavailable/);
        expect(r.draft.desc).toContain('Python workshop');
    });

    it('rejects non-admins, empty requests, private links and non-image posters', async () => {
        const env = { DB: db, FILES_KV: kv() };
        await expect(importEvent(env, { auth: { uid: 's' }, profile: async () => ({ role: 'STUDENT' }) }, form({ text: 'x' }))).rejects.toMatchObject({ code: 'permission-denied' });
        await expect(importEvent(env, admin, form({}))).rejects.toMatchObject({ code: 'invalid-argument' });
        await expect(importEvent(env, admin, form({ url: 'http://127.0.0.1/admin' }))).rejects.toMatchObject({ code: 'invalid-argument' });
        const svg = new File(['<svg/>'], 'x.svg', { type: 'image/svg+xml' });
        await expect(importEvent(env, admin, form({ file: svg }))).rejects.toMatchObject({ code: 'invalid-argument' });
    });

    it('explains a login-walled post', async () => {
        vi.stubGlobal('fetch', vi.fn(async () => new Response('<html><title>Login • Instagram</title></html>', { headers: { 'content-type': 'text/html' } })));
        const r = await importEvent({ DB: db, FILES_KV: kv() }, admin, form({ url: 'https://www.instagram.com/p/private/' }));
        expect(r.warnings.join(' ')).toMatch(/private or need a login/);
        expect(r.warnings.join(' ')).toMatch(/no AI binding/);
    });
});
