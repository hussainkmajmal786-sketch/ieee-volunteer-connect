// Link previews. Crawlers (WhatsApp, Instagram, Facebook, LinkedIn, X,
// Telegram, Google) read the preview tags in the HTML they are given and do
// not run the site's scripts — so the Worker fills the tags in per page
// before sending index.html:
//   /event/:id     → the event's poster, name, date, venue, fee
//   /volunteers/:id → the person's photo, name and headline
//   main pages     → the site card (public/og-image.png)
import { getDocRow } from './docstore.js';
import { safeFieldKey } from './functions.js';
import { isTeamMember, publicProfile } from './people.js';
import { formatEventDate } from '../src/utils/format.js';
import { feeLabel } from '../src/utils/events.js';

const SITE_NAME = 'IEEE SB CEK';
const DEFAULT_TITLE = 'IEEE Volunteer Connect | CEK';
const DEFAULT_DESC = 'Official platform of the IEEE Student Branch, College of Engineering Kidangoor — discover events, register in one tap, volunteer and earn rewards.';

/** Main pages and their preview text. */
export const PAGES = {
    '/': { title: DEFAULT_TITLE, desc: DEFAULT_DESC },
    '/events': { title: 'Upcoming Events | IEEE SB CEK', desc: 'Hackathons, workshops, tech fests and more by IEEE Student Branch CEK. Browse and register in one tap.' },
    '/projects': { title: 'Projects | IEEE SB CEK', desc: 'What the IEEE Student Branch CEK community has built — projects with photos, demos and documents.' },
    '/leaderboard': { title: 'Leaderboard | IEEE SB CEK', desc: 'Top volunteers and ambassadors of IEEE Student Branch CEK.' },
    '/volunteers': { title: 'Our Volunteers | IEEE SB CEK', desc: 'Meet the volunteers, ambassadors and core team of IEEE Student Branch CEK.' },
    '/opportunities': { title: 'Opportunities | IEEE SB CEK', desc: 'Volunteer roles, internships and opportunities from IEEE Student Branch CEK.' },
    '/chapters': { title: 'Chapters & Societies | IEEE SB CEK', desc: 'IEEE chapters and societies at College of Engineering Kidangoor.' },
    '/resources': { title: 'Resources | IEEE SB CEK', desc: 'Learning resources shared by IEEE Student Branch CEK.' },
    '/contact': { title: 'Contact Us | IEEE SB CEK', desc: 'Get in touch with IEEE Student Branch, College of Engineering Kidangoor.' },
};

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clip = (s, n) => { const t = String(s || '').replace(/\s+/g, ' ').trim(); return t.length > n ? `${t.slice(0, n - 1).trimEnd()}…` : t; };

/** Crawlers need absolute https URLs. */
export function absoluteUrl(origin, path) {
    if (!path) return null;
    try { return new URL(path, origin).toString(); } catch { return null; }
}

/** The preview tags for one page, as an HTML string. */
export function metaBlock({ title, description, image, url, type = 'website', jsonLd = null }) {
    const t = esc(title), d = esc(description), u = esc(url), img = image ? esc(image) : '';
    return [
        `<title>${t}</title>`,
        `<meta name="title" content="${t}" />`,
        `<meta name="description" content="${d}" />`,
        `<link rel="canonical" href="${u}" />`,
        `<meta property="og:site_name" content="${SITE_NAME}" />`,
        `<meta property="og:type" content="${type}" />`,
        `<meta property="og:url" content="${u}" />`,
        `<meta property="og:title" content="${t}" />`,
        `<meta property="og:description" content="${d}" />`,
        img && `<meta property="og:image" content="${img}" />`,
        img && `<meta property="og:image:alt" content="${t}" />`,
        `<meta name="twitter:card" content="${img ? 'summary_large_image' : 'summary'}" />`,
        `<meta name="twitter:title" content="${t}" />`,
        `<meta name="twitter:description" content="${d}" />`,
        img && `<meta name="twitter:image" content="${img}" />`,
        jsonLd && `<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>`,
    ].filter(Boolean).join('\n  ');
}

/** index.html with its generic title / description / og / twitter tags replaced. */
export function injectMeta(html, meta) {
    const stripped = html
        .replace(/<title>[\s\S]*?<\/title>\s*/i, '')
        .replace(/<meta\s+(?:name|property)="(?:title|description|og:[^"]*|twitter:[^"]*)"[^>]*>\s*/gi, '')
        .replace(/<link\s+rel="canonical"[^>]*>\s*/gi, '');
    return stripped.replace('</head>', `  ${metaBlock(meta)}\n</head>`);
}

// ─── Per-page data ───────────────────────────────────────────

export function eventMeta(event, origin, id) {
    const when = formatEventDate(event.date);
    const mode = event.mode && event.mode !== 'Offline' ? ` · ${event.mode}` : '';
    const facts = [when && `📅 ${when}`, event.venue && `📍 ${event.venue}${mode}`, `🎟 ${feeLabel(event.fee)}`, event.prize && `🏆 ${event.prize}`].filter(Boolean).join('  ');
    const body = clip(event.desc, 200);
    const url = `${origin}/event/${id}`;
    const image = absoluteUrl(origin, event.imageUrl) || `${origin}/og-image.png`;
    const start = (typeof event.date === 'string' && /^\d{4}-\d{2}-\d{2}/.test(event.date)) ? `${event.date.slice(0, 16)}${event.date.length > 10 ? ':00+05:30' : ''}` : undefined;
    return {
        title: `${clip(event.name, 90)} | ${SITE_NAME}`,
        description: [facts, body].filter(Boolean).join(' — '),
        image, url, type: 'article',
        jsonLd: {
            '@context': 'https://schema.org', '@type': 'Event', name: event.name, description: body || undefined,
            startDate: start, image: [image], url,
            eventAttendanceMode: event.mode === 'Online' ? 'https://schema.org/OnlineEventAttendanceMode' : 'https://schema.org/OfflineEventAttendanceMode',
            location: event.venue ? { '@type': 'Place', name: event.venue } : undefined,
            organizer: { '@type': 'Organization', name: event.organizer || 'IEEE Student Branch CEK' },
            offers: { '@type': 'Offer', price: Number(event.fee) || 0, priceCurrency: 'INR', url },
        },
    };
}

export function personMeta(person, origin) {
    const role = person.ambassadorType === 'campus' ? 'Campus Ambassador' : person.ambassadorType === 'class' ? 'Class Ambassador' : ['ADMIN', 'SUPER_ADMIN'].includes(person.role) ? 'Core Team' : 'Volunteer';
    return {
        title: `${person.name} — ${role} | ${SITE_NAME}`,
        description: clip(person.headline || person.bio || `${person.name} is a ${role} at IEEE Student Branch CEK.`, 200),
        image: absoluteUrl(origin, person.photoURL) || `${origin}/og-image.png`,
        url: `${origin}/volunteers/${person.id}`, type: 'profile',
    };
}

export function pageMeta(path, origin) {
    const p = PAGES[path];
    if (!p) return null;
    return { title: p.title, description: p.desc, image: `${origin}/og-image.png`, url: `${origin}${path === '/' ? '/' : path}` };
}

// ─── Responses ───────────────────────────────────────────────

async function baseHtml(env, origin) {
    const res = await env.ASSETS.fetch(new Request(`${origin}/index.html`));
    return { html: await res.text(), headers: new Headers(res.headers) };
}

function htmlResponse(html, headers, status = 200) {
    headers.set('Content-Type', 'text/html; charset=utf-8');
    headers.delete('Content-Length');
    headers.set('Cache-Control', 'public, max-age=0, must-revalidate');
    return new Response(html, { status, headers });
}

/** The preview-filled app page, or null when `meta` is null. */
export async function previewResponse(env, origin, meta, status = 200) {
    if (!meta) return null;
    const { html, headers } = await baseHtml(env, origin);
    return htmlResponse(injectMeta(html, meta), headers, status);
}

export async function eventPreview(env, origin, rawId) {
    const id = safeFieldKey(rawId);
    const row = id ? await getDocRow(env.DB, `events/${id}`) : null;
    if (!row) return null;
    return previewResponse(env, origin, eventMeta(row.data, origin, id));
}

export async function personPreview(env, origin, rawId) {
    const id = safeFieldKey(rawId);
    const row = id ? await getDocRow(env.DB, `users/${id}`) : null;
    if (!row || !isTeamMember(row.data)) return null;
    return previewResponse(env, origin, personMeta(publicProfile(id, row.data), origin));
}
