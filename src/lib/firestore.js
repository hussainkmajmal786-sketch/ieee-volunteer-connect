// Firestore-compatible client API backed by the Cloudflare Worker (D1).
// Mirrors the subset of `firebase/firestore` this app uses, so components keep
// the same calls. Live listeners (onSnapshot) are served by one batched poll
// that only refetches collections whose version changed.
import { api } from './api';

export const db = Object.freeze({ type: 'database' });

const POLL_MS = 5000;
const ID_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

// ─── Values ──────────────────────────────────────────────────

export class Timestamp {
    constructor(ms) { this._ms = ms; }
    static now() { return new Timestamp(Date.now()); }
    static fromDate(d) { return new Timestamp(d.getTime()); }
    static fromMillis(ms) { return new Timestamp(ms); }
    toDate() { return new Date(this._ms); }
    toMillis() { return this._ms; }
    get seconds() { return Math.floor(this._ms / 1000); }
    get nanoseconds() { return (this._ms % 1000) * 1e6; }
    toJSON() { return this.toDate().toISOString(); }
}

/** JS → wire: Dates/Timestamps become {__ts}. Sentinels pass through. */
export function encode(value) {
    if (value instanceof Date) return { __ts: value.getTime() };
    if (value instanceof Timestamp) return { __ts: value.toMillis() };
    if (Array.isArray(value)) return value.map(encode);
    if (value && typeof value === 'object') {
        if (typeof value.__op === 'string') {
            return value.values ? { ...value, values: value.values.map(encode) } : value;
        }
        const out = {};
        for (const [k, v] of Object.entries(value)) if (v !== undefined) out[k] = encode(v);
        return out;
    }
    return value;
}

/** Wire → JS: {__ts} becomes a Timestamp. */
export function decode(value) {
    if (Array.isArray(value)) return value.map(decode);
    if (value && typeof value === 'object') {
        if (typeof value.__ts === 'number' && Object.keys(value).length === 1) return new Timestamp(value.__ts);
        const out = {};
        for (const [k, v] of Object.entries(value)) out[k] = decode(v);
        return out;
    }
    return value;
}

export const serverTimestamp = () => ({ __op: 'serverTimestamp' });
export const increment = (n) => ({ __op: 'increment', n });
export const arrayUnion = (...values) => ({ __op: 'arrayUnion', values });
export const arrayRemove = (...values) => ({ __op: 'arrayRemove', values });
export const deleteField = () => ({ __op: 'deleteField' });

// ─── References & queries ────────────────────────────────────

function joinPath(base, segments) {
    const parts = [...(base?.path ? [base.path] : []), ...segments].join('/').split('/').filter(Boolean);
    return parts.join('/');
}

function makeCollection(path) {
    return { type: 'collection', path, id: path.split('/').pop() };
}

function makeDoc(path) {
    const parts = path.split('/');
    return { type: 'document', path, id: parts[parts.length - 1], parent: makeCollection(parts.slice(0, -1).join('/')) };
}

export function collection(base, ...segments) {
    const path = joinPath(base, segments);
    if (path.split('/').length % 2 !== 1) throw new Error(`Invalid collection path: ${path}`);
    return makeCollection(path);
}

export function doc(base, ...segments) {
    if (base?.type === 'collection' && segments.length === 0) {
        const bytes = crypto.getRandomValues(new Uint8Array(20));
        segments = [[...bytes].map(b => ID_CHARS[b % ID_CHARS.length]).join('')];
    }
    const path = joinPath(base, segments);
    if (path.split('/').length % 2 !== 0) throw new Error(`Invalid document path: ${path}`);
    return makeDoc(path);
}

export const where = (field, op, value) => ({ kind: 'where', field, op, value: encode(value) });
export const orderBy = (field, dir = 'asc') => ({ kind: 'orderBy', field, dir });
export const limit = (n) => ({ kind: 'limit', n });

export function query(ref, ...constraints) {
    const base = ref.type === 'query' ? ref : { type: 'query', parent: ref.path, spec: { filters: [], orderBy: [] } };
    const spec = { ...base.spec, filters: [...base.spec.filters], orderBy: [...base.spec.orderBy] };
    for (const c of constraints) {
        if (c.kind === 'where') spec.filters.push({ field: c.field, op: c.op, value: c.value });
        else if (c.kind === 'orderBy') spec.orderBy.push({ field: c.field, dir: c.dir });
        else if (c.kind === 'limit') spec.limit = c.n;
    }
    return { type: 'query', parent: base.parent, spec };
}

const asQuery = (ref) => (ref.type === 'query' ? ref : query(ref));

// ─── Snapshots ───────────────────────────────────────────────

function docSnapshot(path, exists, rawData) {
    const data = exists ? decode(rawData) : undefined;
    return {
        id: path.split('/').pop(),
        ref: makeDoc(path),
        exists: () => exists,
        data: () => data,
        get: (field) => field.split('.').reduce((o, k) => o?.[k], data),
    };
}

function querySnapshot(parent, docs) {
    const snaps = docs.map(d => docSnapshot(`${parent}/${d.id}`, true, d.data));
    return { docs: snaps, size: snaps.length, empty: snaps.length === 0, forEach: (cb) => snaps.forEach(cb) };
}

// ─── One-shot reads ──────────────────────────────────────────

export async function getDoc(ref) {
    const res = await api('/api/db/get', { path: ref.path });
    return docSnapshot(ref.path, res.exists, res.data);
}

export async function getDocs(ref) {
    const q = asQuery(ref);
    const res = await api('/api/db/query', { parent: q.parent, spec: q.spec });
    return querySnapshot(q.parent, res.docs);
}

export async function getCountFromServer(ref) {
    const q = asQuery(ref);
    const res = await api('/api/db/query', { parent: q.parent, spec: { ...q.spec, count: true } });
    return { data: () => ({ count: res.count }) };
}

// ─── Writes ──────────────────────────────────────────────────

async function write(body) {
    const res = await api('/api/db/write', body);
    poller.soon();
    return res;
}

export async function addDoc(collectionRef, data) {
    const res = await write({ op: 'add', path: collectionRef.path, data: encode(data) });
    return makeDoc(res.path);
}

export async function setDoc(ref, data, options = {}) {
    await write({ op: 'set', path: ref.path, data: encode(data), merge: !!options.merge });
}

export async function updateDoc(ref, dataOrField, ...rest) {
    let data = dataOrField;
    if (typeof dataOrField === 'string') {
        data = {};
        const pairs = [dataOrField, ...rest];
        for (let i = 0; i < pairs.length; i += 2) data[pairs[i]] = pairs[i + 1];
    }
    await write({ op: 'update', path: ref.path, data: encode(data) });
}

export async function deleteDoc(ref) {
    await write({ op: 'delete', path: ref.path });
}

// ─── Live listeners ──────────────────────────────────────────

class Poller {
    constructor() {
        this.subs = new Map();   // key → { wire, v, snapshot, listeners:Set }
        this.timer = null;
        this.inFlight = null;
        this.pendingSoon = null;
        if (typeof document !== 'undefined') {
            document.addEventListener('visibilitychange', () => {
                if (document.visibilityState === 'visible') this.soon(0);
            });
        }
    }

    subscribe(wire, listener) {
        const key = JSON.stringify(wire);
        let sub = this.subs.get(key);
        if (!sub) {
            sub = { wire: { key, ...wire }, v: null, snapshot: null, listeners: new Set() };
            this.subs.set(key, sub);
        }
        sub.listeners.add(listener);
        if (sub.snapshot) queueMicrotask(() => listener.next(sub.snapshot));
        this.soon(0);
        this.schedule();
        return () => {
            sub.listeners.delete(listener);
            if (sub.listeners.size === 0) this.subs.delete(key);
        };
    }

    /** Re-deliver every subscription (e.g. after sign-in/out changes access). */
    refreshAll() {
        for (const sub of this.subs.values()) sub.v = null;
        this.soon(0);
    }

    soon(delay = 150) {
        clearTimeout(this.pendingSoon);
        this.pendingSoon = setTimeout(() => this.tick(), delay);
    }

    schedule() {
        if (this.timer) return;
        this.timer = setInterval(() => {
            if (this.subs.size === 0) { clearInterval(this.timer); this.timer = null; return; }
            if (typeof document === 'undefined' || document.visibilityState === 'visible') this.tick();
        }, POLL_MS);
    }

    async tick() {
        if (this.inFlight || this.subs.size === 0) return this.inFlight;
        const subs = [...this.subs.values()];
        this.inFlight = (async () => {
            try {
                for (let i = 0; i < subs.length; i += 40) {
                    const batch = subs.slice(i, i + 40);
                    const { results } = await api('/api/db/poll', { subs: batch.map(s => ({ ...s.wire, v: s.v })) });
                    for (const s of batch) {
                        const r = results[s.wire.key];
                        if (!r) continue;
                        s.v = r.v;
                        if (r.error) {
                            const err = Object.assign(new Error(r.error.message), { code: r.error.code });
                            s.listeners.forEach(l => l.error?.(err));
                            continue;
                        }
                        s.snapshot = s.wire.kind === 'doc'
                            ? docSnapshot(s.wire.path, r.exists, r.data)
                            : querySnapshot(s.wire.parent, r.docs);
                        s.listeners.forEach(l => l.next(s.snapshot));
                    }
                }
            } catch (err) {
                // Network hiccup: the next interval retries.
                if (import.meta.env?.DEV) console.warn('[db] poll failed', err);
            } finally {
                this.inFlight = null;
                // Subscriptions added while this poll was running.
                if ([...this.subs.values()].some(s => s.v === null)) this.soon(0);
            }
        })();
        return this.inFlight;
    }
}

const poller = new Poller();
export const refreshListeners = () => poller.refreshAll();

export function onSnapshot(ref, onNext, onError) {
    const listener = typeof onNext === 'function' ? { next: onNext, error: onError } : onNext;
    const wire = ref.type === 'document'
        ? { kind: 'doc', path: ref.path }
        : { kind: 'query', ...(({ parent, spec }) => ({ parent, spec }))(asQuery(ref)) };
    return poller.subscribe(wire, listener);
}

export const getFirestore = () => db;
