// Short ambassador links: /s/<code> stands for /r/<event>/<ambassador>.
// Each ambassador gets one stable code per event (created on first request).
import { DocError, getDocRow, writeDoc } from './docstore.js';
import { safeFieldKey } from './functions.js';

const ALPHABET = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/l/I
const CODE_LENGTH = 6;
export const CODE_RE = /^[A-Za-z0-9]{4,16}$/;

function randomCode() {
    const bytes = crypto.getRandomValues(new Uint8Array(CODE_LENGTH));
    return [...bytes].map(b => ALPHABET[b % ALPHABET.length]).join('');
}

/** The caller's short link for an event (same code every time). */
export async function getShortLink(env, ctx, eventId, origin) {
    if (!ctx.auth) throw new DocError('unauthenticated', 'Sign in to get your link');
    const eventKey = safeFieldKey(eventId);
    if (!eventKey || !(await getDocRow(env.DB, `events/${eventKey}`))) throw new DocError('not-found', 'Event not found');
    const uid = ctx.auth.uid;
    const indexPath = `shortLinkIndex/${eventKey}__${uid}`;

    let code = (await getDocRow(env.DB, indexPath))?.data?.code;
    if (!code) {
        for (let attempt = 0; attempt < 5 && !code; attempt++) {
            const candidate = randomCode();
            let taken = false;
            await writeDoc(env.DB, `shortLinks/${candidate}`, (before) => {
                taken = !!before;
                return before || { eventId: eventKey, refId: uid, createdAt: { __ts: Date.now() } };
            });
            if (!taken) code = candidate;
        }
        if (!code) throw new DocError('aborted', 'Could not create a short link, try again');
        // Two tabs racing: keep whichever code was indexed first.
        await writeDoc(env.DB, indexPath, (before) => {
            if (before) code = before.code;
            return before || { code };
        });
    }
    return { code, url: `${origin}/s/${code}` };
}

/** Resolve a short code to { eventId, refId }, or null. */
export async function resolveShortLink(db, code) {
    if (!CODE_RE.test(code || '')) return null;
    return (await getDocRow(db, `shortLinks/${code}`))?.data ?? null;
}
