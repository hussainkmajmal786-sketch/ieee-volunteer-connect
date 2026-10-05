import { describe, it, expect } from 'vitest';
import { injectMeta, metaBlock, eventMeta, personMeta, pageMeta, absoluteUrl } from '../worker/preview.js';

const HTML = `<!doctype html><html><head><meta charset="UTF-8" />
<title>Old</title>
<meta name="title" content="Old" />
<meta name="description" content="old desc" />
<meta property="og:title" content="Old" />
<meta property="og:image" content="/favicon.svg" />
<meta property="twitter:card" content="x" />
<meta name="viewport" content="width=device-width" />
</head><body></body></html>`;

describe('injectMeta', () => {
    it('replaces the generic tags and keeps the rest', () => {
        const out = injectMeta(HTML, { title: 'Hack "Night" <b>', description: 'a & b', image: 'https://x.org/p.png', url: 'https://x.org/event/1' });
        expect(out.match(/<title>/g)).toHaveLength(1);
        expect(out).toContain('<title>Hack &quot;Night&quot; &lt;b&gt;</title>');
        expect(out).toContain('property="og:image" content="https://x.org/p.png"');
        expect(out).toContain('name="twitter:card" content="summary_large_image"');
        expect(out).not.toContain('Old');
        expect(out).not.toContain('favicon.svg');
        expect(out).toContain('name="viewport"'); // unrelated tags survive
        expect(out).toContain('<meta charset="UTF-8" />');
    });
    it('uses a small card when there is no image', () => {
        expect(metaBlock({ title: 't', description: 'd', url: 'https://x.org/' })).toContain('content="summary"');
    });
});

describe('eventMeta', () => {
    const ev = { name: 'Hack Night', date: '2027-01-20T09:00', venue: 'CEK', mode: 'Hybrid', fee: 150, prize: '₹50,000', desc: 'Build   things\nall night.', imageUrl: '/files/events/1-poster.png', organizer: 'IEEE' };
    it('builds the title, a facts line and an absolute poster URL', () => {
        const m = eventMeta(ev, 'https://site.dev', 'abc');
        expect(m.title).toBe('Hack Night | IEEE SB CEK');
        expect(m.description).toBe('📅 Wed, 20 Jan 2027 · 9:00 AM  📍 CEK · Hybrid  🎟 ₹150  🏆 ₹50,000 — Build things all night.');
        expect(m.image).toBe('https://site.dev/files/events/1-poster.png');
        expect(m.url).toBe('https://site.dev/event/abc');
        expect(m.jsonLd).toMatchObject({ '@type': 'Event', name: 'Hack Night', startDate: '2027-01-20T09:00:00+05:30', offers: { price: 150, priceCurrency: 'INR' } });
    });
    it('falls back to the site card and handles sparse events', () => {
        const m = eventMeta({ name: 'X' }, 'https://site.dev', 'a');
        expect(m.image).toBe('https://site.dev/og-image.png');
        expect(m.description).toContain('Free');
        expect(JSON.stringify(m.jsonLd)).not.toContain('startDate');
    });
    it('keeps JSON-LD from closing the script tag', () => {
        const out = injectMeta(HTML, eventMeta({ name: '</script><script>alert(1)</script>', date: '2027-01-01' }, 'https://s.dev', 'a'));
        expect(out.match(/<\/script>/g)).toHaveLength(1);
    });
});

describe('people and pages', () => {
    it('person card', () => {
        const m = personMeta({ id: 'u1', name: 'Anu', role: 'VOLUNTEER', ambassadorType: 'campus', headline: 'ECE · S5', bio: '', photoURL: '/files/avatars/u1/a.png' }, 'https://s.dev');
        expect(m).toMatchObject({ title: 'Anu — Campus Ambassador | IEEE SB CEK', description: 'ECE · S5', image: 'https://s.dev/files/avatars/u1/a.png', url: 'https://s.dev/volunteers/u1', type: 'profile' });
    });
    it('main pages use the site card; unknown pages have none', () => {
        expect(pageMeta('/events', 'https://s.dev')).toMatchObject({ title: 'Upcoming Events | IEEE SB CEK', image: 'https://s.dev/og-image.png', url: 'https://s.dev/events' });
        expect(pageMeta('/', 'https://s.dev').url).toBe('https://s.dev/');
        expect(pageMeta('/admin', 'https://s.dev')).toBeNull();
        expect(absoluteUrl('https://s.dev', null)).toBeNull();
    });
});
