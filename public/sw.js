/**
 * IEEE Volunteer Connect — Service Worker
 * -------------------------------------------------
 * Strategy:
 *  - Precache the app shell and offline fallback
 *  - `network-first` for navigation requests (HTML) so new deploys are picked up
 *    quickly, with a graceful offline fallback when the network fails
 *  - `stale-while-revalidate` for static build assets (hashed, safe to cache)
 *  - Bypass cache entirely for Firebase / Google APIs (never cache auth/firestore)
 */
const VERSION = 'ieee-vc-v1';
const STATIC_CACHE = `${VERSION}-static`;
const RUNTIME_CACHE = `${VERSION}-runtime`;

const APP_SHELL = [
    '/',
    '/index.html',
    '/offline.html',
    '/manifest.json',
    '/favicon.svg',
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(STATIC_CACHE).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(
                keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))
            )
        ).then(() => self.clients.claim())
    );
});

function isFirebaseOrAuthRequest(url) {
    return /(firestore|firebaseio|googleapis|identitytoolkit|securetoken|firebase|gstatic)/i.test(url.host);
}

self.addEventListener('fetch', (event) => {
    const req = event.request;
    if (req.method !== 'GET') return;

    const url = new URL(req.url);
    // Never cache Firebase/Google auth traffic — must be fresh + online
    if (isFirebaseOrAuthRequest(url)) return;

    // Navigation requests — network-first with offline fallback
    if (req.mode === 'navigate') {
        event.respondWith(
            fetch(req)
                .then((res) => {
                    const copy = res.clone();
                    caches.open(RUNTIME_CACHE).then((c) => c.put(req, copy));
                    return res;
                })
                .catch(() => caches.match(req).then((r) => r || caches.match('/offline.html')))
        );
        return;
    }

    // Static assets — stale-while-revalidate
    if (/\.(?:js|css|woff2?|png|jpg|jpeg|svg|webp|gif|ico)$/.test(url.pathname)) {
        event.respondWith(
            caches.match(req).then((cached) => {
                const fetched = fetch(req).then((res) => {
                    const copy = res.clone();
                    caches.open(RUNTIME_CACHE).then((c) => c.put(req, copy));
                    return res;
                }).catch(() => cached);
                return cached || fetched;
            })
        );
    }
});

// Allow the page to prompt an immediate update.
self.addEventListener('message', (event) => {
    if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
