// Password hashing for Workers: PBKDF2-SHA256 via WebCrypto (native, so it
// fits the Workers CPU budget, unlike a pure-JS scrypt).
// Format: pbkdf2$<iterations>$<salt b64>$<hash b64>

const DEFAULT_ITERATIONS = 100_000;
const enc = new TextEncoder();

const b64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
const unb64 = (s) => Uint8Array.from(atob(s), c => c.charCodeAt(0));

async function derive(password, salt, iterations) {
    const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
    return crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, key, 256);
}

function timingSafeEqual(a, b) {
    if (a.length !== b.length) return false;
    let diff = 0;
    for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
    return diff === 0;
}

export async function hashPassword(password, iterations = DEFAULT_ITERATIONS) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const hash = await derive(password, salt, iterations);
    return `pbkdf2$${iterations}$${b64(salt)}$${b64(hash)}`;
}

export async function verifyPbkdf2(stored, password) {
    const [scheme, iter, salt, hash] = stored.split('$');
    if (scheme !== 'pbkdf2' || !iter || !salt || !hash) return false;
    const actual = new Uint8Array(await derive(password, unb64(salt), Number(iter)));
    return timingSafeEqual(actual, unb64(hash));
}

// Accounts imported from Firebase carry "firebase:<email>" instead of a hash
// until the user's first successful sign-in.
export const FIREBASE_PREFIX = 'firebase:';

/** Check a password against the legacy Firebase Auth project (REST API). */
export async function verifyWithFirebase(email, password, apiKey, emulatorHost) {
    if (!apiKey) return false;
    // emulatorHost is only set in local tests (FIREBASE_AUTH_EMULATOR_HOST).
    const origin = emulatorHost ? `http://${emulatorHost}/identitytoolkit.googleapis.com` : 'https://identitytoolkit.googleapis.com';
    const res = await fetch(`${origin}/v1/accounts:signInWithPassword?key=${encodeURIComponent(apiKey)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, returnSecureToken: false }),
    });
    return res.ok;
}
