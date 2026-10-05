// Create an event from a social media post or a poster.
//
// The admin pastes a post link (Instagram, Facebook, LinkedIn, X, a website)
// and/or uploads the poster (or a frame from the promo video). We read the
// post's preview tags and any structured event data, copy the poster into our
// own storage (social CDN links expire), and ask Workers AI to pull the event
// details out of the caption + poster. Nothing is published: the admin gets a
// pre-filled event form to review.
import { DocError } from './docstore.js';
import { rateLimit } from './functions.js';
import { isAdmin, isValidExternalUrl, IMAGE_TYPES, MB } from './rules.js';
import { putFile } from './files.js';

export const AI_MODEL = '@cf/meta/llama-4-scout-17b-16e-instruct';
export const CATEGORIES = ['Hackathon', 'Competition', 'Workshop', 'Tech Fest', 'Project Expo', 'Conference', 'Conclave', 'Seminar', 'Networking', 'Bootcamp', 'Meetup', 'Cultural', 'Sports', 'Other'];
export const MODES = ['Offline', 'Online', 'Hybrid'];
const MAX_HTML = 2 * MB;
const MAX_IMAGE = 5 * MB;
const MAX_VIDEO = 25 * MB;
const VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];
// Instagram/Facebook serve preview tags to link-preview crawlers, not to anonymous browsers.
const CRAWLER_UA = 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)';
const REG_LINK_RE = /https?:\/\/(?:forms\.gle|docs\.google\.com\/forms|bit\.ly|tinyurl\.com|linktr\.ee|lu\.ma|unstop\.com|konfhub\.com|devfolio\.co|makemypass\.com|[\w.-]*ieee[\w.-]*)\/[^\s"'<>)]+/gi;

const EVENT_SCHEMA = {
    type: 'object',
    properties: {
        name: { type: 'string', description: 'Event title as written on the poster' },
        date: { type: 'string', description: 'Start date as YYYY-MM-DD, empty if unknown' },
        time: { type: 'string', description: 'Start time as 24-hour HH:MM, empty if unknown' },
        endDate: { type: 'string', description: 'Last day as YYYY-MM-DD for multi-day events, else empty' },
        venue: { type: 'string', description: 'Place, or "Online" for online events' },
        category: { type: 'string', enum: CATEGORIES },
        description: { type: 'string', description: '2-4 sentence description for students, in English' },
        organizer: { type: 'string' },
        registrationUrl: { type: 'string', description: 'Registration link if shown, else empty' },
        mode: { type: 'string', enum: MODES },
        fee: { type: 'string', description: 'Registration fee, e.g. "Free" or "₹100 (IEEE members ₹50)", else empty' },
        prize: { type: 'string', description: 'Prize pool or prizes, else empty' },
        teamSize: { type: 'string', description: 'Team size, e.g. "1-4 members", else empty' },
        eligibility: { type: 'string', description: 'Who can take part, else empty' },
        registerBy: { type: 'string', description: 'Last date to register as YYYY-MM-DD, else empty' },
        contacts: {
            type: 'array',
            items: { type: 'object', properties: { name: { type: 'string' }, phone: { type: 'string' } } },
        },
    },
    required: ['name'],
};

// ─── Reading a post link ─────────────────────────────────────

function decodeEntities(s) {
    return s.replace(/&(#x?[0-9a-f]+|amp|lt|gt|quot|apos|#39);/gi, (m, e) => {
        const named = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", '#39': "'" }[e.toLowerCase()];
        if (named) return named;
        const code = e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
        return Number.isFinite(code) ? String.fromCodePoint(code) : m;
    });
}

/** Preview tags (og:/twitter:/description) and JSON-LD Event data from a page. */
export function parsePage(html, baseUrl) {
    const meta = {};
    for (const tag of html.match(/<meta\b[^>]*>/gi) || []) {
        const key = /(?:property|name)\s*=\s*["']([^"']+)["']/i.exec(tag)?.[1]?.toLowerCase();
        const content = /content\s*=\s*["']([^"']*)["']/i.exec(tag)?.[1];
        if (key && content && !(key in meta)) meta[key] = decodeEntities(content).trim();
    }
    const abs = (u) => {
        try { return u ? new URL(u, baseUrl).toString() : null; } catch { return null; }
    };
    const page = {
        title: meta['og:title'] || meta['twitter:title'] || decodeEntities(/<title[^>]*>([^<]*)<\/title>/i.exec(html)?.[1] || '').trim(),
        text: meta['og:description'] || meta['twitter:description'] || meta.description || '',
        image: abs(meta['og:image:secure_url'] || meta['og:image'] || meta['twitter:image']),
        video: abs(meta['og:video:secure_url'] || meta['og:video:url'] || meta['og:video']),
        event: null,
    };
    for (const m of html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
        try {
            const data = JSON.parse(m[1]);
            const all = [data, ...(Array.isArray(data) ? data : data['@graph'] || [])].flat();
            const ev = all.find(x => x && /Event$/.test(String(x['@type'])));
            if (ev) {
                page.event = {
                    name: ev.name, startDate: ev.startDate, endDate: ev.endDate, description: ev.description,
                    venue: typeof ev.location === 'string' ? ev.location : ev.location?.name,
                    url: ev.url || ev.offers?.url,
                };
                break;
            }
        } catch { /* not JSON */ }
    }
    return page;
}

/** Social/web hosts only: no IP literals or internal names. */
export function publicHttpUrl(raw) {
    if (!isValidExternalUrl(raw)) return null;
    const u = new URL(raw);
    const host = u.hostname.toLowerCase();
    if (!host.includes('.') || host === 'localhost' || host.endsWith('.local') || host.endsWith('.internal')) return null;
    if (/^[\d.]+$/.test(host) || host.startsWith('[')) return null;
    return u.toString();
}

async function readCapped(res, max) {
    const len = Number(res.headers.get('content-length') || 0);
    if (len > max) throw new Error('too large');
    const reader = res.body.getReader();
    const chunks = [];
    let size = 0;
    for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > max) { await reader.cancel(); throw new Error('too large'); }
        chunks.push(value);
    }
    const out = new Uint8Array(size);
    let off = 0;
    for (const c of chunks) { out.set(c, off); off += c.byteLength; }
    return out;
}

async function fetchPage(url) {
    const res = await fetch(url, { headers: { 'User-Agent': CRAWLER_UA, Accept: 'text/html,*/*' }, redirect: 'follow', signal: AbortSignal.timeout(10000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return parsePage(new TextDecoder().decode(await readCapped(res, MAX_HTML)), res.url || url);
}

async function fetchMedia(url, types, max) {
    const safe = publicHttpUrl(url);
    if (!safe) return null;
    const res = await fetch(safe, { headers: { 'User-Agent': CRAWLER_UA }, signal: AbortSignal.timeout(20000) });
    const type = (res.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
    if (!res.ok || !types.includes(type)) return null;
    return { bytes: await readCapped(res, max), type };
}

// ─── AI extraction ───────────────────────────────────────────

function toBase64(bytes) {
    let bin = '';
    for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    return btoa(bin);
}

/** Model output (object or JSON text, maybe fenced) → object, or null. */
export function parseModelJson(out) {
    const r = out?.response ?? out;
    if (r && typeof r === 'object') return r;
    if (typeof r !== 'string') return null;
    const start = r.indexOf('{');
    const end = r.lastIndexOf('}');
    if (start < 0 || end <= start) return null;
    try { return JSON.parse(r.slice(start, end + 1)); } catch { return null; }
}

async function askAi(env, { text, image, today }) {
    const content = [{
        type: 'text',
        text: `Today is ${today}. Extract the event from this ${image ? 'poster and ' : ''}social media post.\n`
            + 'Use a date in the future when the year is not written. Leave a field empty if it is not shown — never guess.\n\n'
            + `Post text:\n${text || '(none)'}`,
    }];
    if (image) content.push({ type: 'image_url', image_url: { url: `data:${image.type};base64,${toBase64(image.bytes)}` } });
    const out = await env.AI.run(AI_MODEL, {
        messages: [
            { role: 'system', content: 'You read event posters and posts for an IEEE student branch website and return the event details as JSON.' },
            { role: 'user', content },
        ],
        response_format: { type: 'json_schema', json_schema: EVENT_SCHEMA },
        max_tokens: 1024,
        temperature: 0.1,
    });
    return parseModelJson(out);
}

// ─── Cleaning the result into event form fields ──────────────

const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const isoDate = (v) => (/^\d{4}-\d{2}-\d{2}$/.test(str(v, 10)) && !Number.isNaN(Date.parse(v)) ? v : '');
const hhmm = (v) => {
    const m = /^(\d{1,2}):(\d{2})/.exec(str(v, 8));
    return m && +m[1] < 24 && +m[2] < 60 ? `${m[1].padStart(2, '0')}:${m[2]}` : '';
};

/** Merge AI output, structured page data and caption links into event form fields. */
export function buildDraft({ ai, page, caption }) {
    const a = ai || {};
    const ld = page?.event || {};
    const ldStart = typeof ld.startDate === 'string' ? ld.startDate : '';
    const date = isoDate(a.date) || isoDate(ldStart.slice(0, 10));
    const time = hhmm(a.time) || hhmm(ldStart.slice(11, 16));
    const links = [...new Set((caption || '').match(REG_LINK_RE) || [])].map(u => u.replace(/[.,;!]+$/, ''));
    const registrationUrl = [a.registrationUrl, ld.url, ...links].map(u => str(u, 2000)).find(u => publicHttpUrl(u)) || '';

    const end = isoDate(a.endDate) || isoDate(String(ld.endDate || '').slice(0, 10));
    const regBy = isoDate(a.registerBy);
    const contacts = (Array.isArray(a.contacts) ? a.contacts : [])
        .map(c => ({ name: str(c?.name, 60), phone: str(c?.phone, 30) }))
        .filter(c => c.name || c.phone).slice(0, 4);
    // "₹100 (IEEE members ₹50)": the first amount is the fee; the full text stays in the description.
    const feeText = str(a.fee, 120);
    const feeNum = /free/i.test(feeText) ? 0 : Number((/(\d[\d,]*)/.exec(feeText)?.[1] || '').replace(/,/g, ''));
    const extras = [];
    if (feeText && !/^\s*(free|₹?\s*\d[\d,]*)\s*$/i.test(feeText)) extras.push(`Fee: ${feeText}`);
    if (contacts.length > 1) extras.push(`More contacts: ${contacts.slice(1).map(c => [c.name, c.phone].filter(Boolean).join(' ')).join(', ')}`);

    const description = str(a.description, 1500) || str(ld.description, 1500) || str(caption, 1500);
    return {
        name: str(a.name, 200) || str(ld.name, 200) || str(page?.title, 200),
        date: date ? `${date}T${time || '09:00'}` : '',
        endDate: end && end !== date ? `${end}T18:00` : '',
        registrationDeadline: regBy ? `${regBy}T23:59` : '',
        venue: str(a.venue, 200) || str(ld.venue, 200),
        mode: MODES.includes(a.mode) ? a.mode : 'Offline',
        category: CATEGORIES.includes(a.category) ? a.category : 'Workshop',
        desc: [description, extras.join('\n')].filter(Boolean).join('\n\n').slice(0, 3000),
        fee: feeText ? (Number.isFinite(feeNum) ? String(feeNum) : '') : '',
        prize: str(a.prize, 160),
        teamSize: str(a.teamSize, 60),
        eligibility: str(a.eligibility, 160),
        organizer: str(a.organizer, 160),
        contactName: contacts[0]?.name || '',
        contactPhone: contacts[0]?.phone || '',
        registrationUrl,
        timeGuessed: !!date && !time,
    };
}

// ─── Endpoint ────────────────────────────────────────────────

async function storeMedia(env, folder, media, name) {
    const ext = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif', 'video/mp4': 'mp4', 'video/webm': 'webm', 'video/quicktime': 'mov' }[media.type] || 'bin';
    const key = `${folder}/${Date.now()}-${name}.${ext}`;
    await putFile(env, key, media.bytes, media.type);
    return `/files/${key}`;
}

/**
 * form: url? (post link), text? (caption), file? (poster image, or a frame of the video),
 * videoUrl? (/files/… video already uploaded by the admin).
 */
export async function importEvent(env, ctx, form) {
    if (!(await isAdmin(ctx))) throw new DocError('permission-denied', 'Admins only');
    await rateLimit(env.DB, `event-import:${ctx.auth.uid}`, 30, 60 * 60 * 1000);

    const rawUrl = String(form.get('url') || '').trim();
    const sourceUrl = rawUrl ? publicHttpUrl(rawUrl) : null;
    if (rawUrl && !sourceUrl) throw new DocError('invalid-argument', 'Paste a public http(s) link to the post');
    let caption = String(form.get('text') || '').slice(0, 5000);
    const file = form.get('file');
    let videoUrl = String(form.get('videoUrl') || '');
    if (videoUrl && !/^\/files\/event-media\/[\w./-]+$/.test(videoUrl)) videoUrl = '';
    if (!sourceUrl && !caption.trim() && !(file instanceof File)) {
        throw new DocError('invalid-argument', 'Add a post link, a poster/video or the post text');
    }

    const warnings = [];
    let page = null;
    if (sourceUrl) {
        try {
            page = await fetchPage(sourceUrl);
            caption = [page.title, page.text, caption].filter(Boolean).join('\n\n');
            if (!page.text && !page.image) warnings.push('The post did not share its caption or image (it may be private or need a login). Upload the poster or paste the caption.');
        } catch {
            warnings.push('Could not open that link. Upload the poster or paste the caption instead.');
        }
    }

    // Poster: the uploaded file wins over the post's preview image.
    let image = null;
    if (file instanceof File) {
        if (!IMAGE_TYPES.includes(file.type)) throw new DocError('invalid-argument', 'Upload a JPEG, PNG, WebP or GIF poster (videos are uploaded separately)');
        if (file.size > MAX_IMAGE) throw new DocError('invalid-argument', 'Posters must be smaller than 5MB');
        image = { bytes: new Uint8Array(await file.arrayBuffer()), type: file.type };
    } else if (page?.image) {
        image = await fetchMedia(page.image, IMAGE_TYPES, MAX_IMAGE).catch(() => null);
        if (!image) warnings.push('Could not download the post image — upload the poster yourself.');
    }
    if (!videoUrl && page?.video) {
        const video = await fetchMedia(page.video, VIDEO_TYPES, MAX_VIDEO).catch(() => null);
        if (video) videoUrl = await storeMedia(env, 'event-media', video, 'post-video');
    }
    // A frame grabbed from a promo video doubles as the cover image.
    const imageUrl = image ? await storeMedia(env, 'events', image, 'poster') : '';

    let ai = null;
    if (!env.AI) {
        warnings.push('AI reading is not set up (no AI binding), so only the post text was used.');
    } else {
        try {
            ai = await askAi(env, { text: caption, image, today: new Date().toISOString().slice(0, 10) });
            if (!ai) warnings.push('The AI could not read the details — please fill them in.');
        } catch (err) {
            console.error('event import AI failed', err);
            warnings.push('The AI reader is unavailable right now — the form has whatever the post text gave.');
        }
    }

    const draft = buildDraft({ ai, page, caption });
    if (draft.timeGuessed) warnings.push('No start time found — set to 9:00 AM, please check.');
    if (!draft.date) warnings.push('No date found — please add it.');
    return {
        draft: { ...draft, imageUrl, videoUrl, sourceUrl: sourceUrl || '' },
        caption: caption.slice(0, 5000),
        warnings,
        aiUsed: !!ai,
    };
}
