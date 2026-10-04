import { api } from '../lib/api';

// One request per event per page load; the code never changes for an ambassador.
const cache = new Map();

/** The signed-in user's short referral link for an event (e.g. https://…/s/Ab3xK9). */
export function getShortLink(eventId) {
    if (!cache.has(eventId)) {
        cache.set(eventId, api('/api/short-links', { eventId }).then(r => r.url).catch((err) => {
            cache.delete(eventId);
            throw err;
        }));
    }
    return cache.get(eventId);
}

/** Copy text, falling back to a hidden textarea where the clipboard API is blocked. */
export async function copyText(text) {
    try {
        await navigator.clipboard.writeText(text);
    } catch {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
    }
}
