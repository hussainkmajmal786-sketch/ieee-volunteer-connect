// A small Firestore-style document store on top of Cloudflare D1.
// Documents live in the `docs` table as JSON; see migrations/0001_init.sql.

const FIELD_RE = /^[A-Za-z0-9_]+(\.[A-Za-z0-9_-]+)*$/;
const SEGMENT_RE = /^[A-Za-z0-9_-]{1,128}$/;
const ID_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const MAX_RETRIES = 5;

export class DocError extends Error {
    constructor(code, message) {
        super(message);
        this.code = code;
    }
}

export function autoId() {
    const bytes = crypto.getRandomValues(new Uint8Array(20));
    return [...bytes].map(b => ID_CHARS[b % ID_CHARS.length]).join('');
}

/** Validate a document or collection path and split it into segments. */
export function parsePath(path, kind) {
    if (typeof path !== 'string') throw new DocError('invalid-argument', 'Invalid path');
    const segments = path.split('/');
    if (!segments.every(s => SEGMENT_RE.test(s))) throw new DocError('invalid-argument', 'Invalid path');
    const isDoc = segments.length % 2 === 0;
    if ((kind === 'doc') !== isDoc) throw new DocError('invalid-argument', `Expected a ${kind} path`);
    return segments;
}

export function splitDocPath(path) {
    const segments = parsePath(path, 'doc');
    return { parent: segments.slice(0, -1).join('/'), id: segments[segments.length - 1] };
}

function jsonPath(field) {
    if (!FIELD_RE.test(field)) throw new DocError('invalid-argument', `Invalid field: ${field}`);
    return `$.${field}`;
}

// Comparable value for a field: timestamps ({__ts}) and ISO date strings
// compare as epoch ms, everything else compares as itself. The JSON path is
// validated by jsonPath(), so interpolation here is safe.
function sortExpr(field) {
    const p = jsonPath(field);
    return `(CASE json_type(data, '${p}')
        WHEN 'object' THEN json_extract(data, '${p}.__ts')
        WHEN 'text' THEN COALESCE((julianday(json_extract(data, '${p}')) - 2440587.5) * 86400000, json_extract(data, '${p}'))
        ELSE json_extract(data, '${p}') END)`;
}

function bindValue(v) {
    if (v && typeof v === 'object' && '__ts' in v) return v.__ts;
    if (typeof v === 'boolean') return v ? 1 : 0;
    if (v !== null && typeof v === 'object') throw new DocError('invalid-argument', 'Unsupported filter value');
    return v;
}

const OPS = { '==': '=', '!=': '!=', '<': '<', '<=': '<=', '>': '>', '>=': '>=' };

/**
 * Build the SQL for a collection query.
 * spec = { filters: [{field, op, value}], orderBy: [{field, dir}], limit, count }
 */
export function buildQuery(parent, spec = {}) {
    const where = ['parent = ?'];
    const params = [parent];

    for (const f of spec.filters || []) {
        const p = jsonPath(f.field);
        if (f.op === 'in') {
            if (!Array.isArray(f.value) || f.value.length === 0 || f.value.length > 30) {
                throw new DocError('invalid-argument', "'in' needs 1-30 values");
            }
            where.push(`json_extract(data, '${p}') IN (${f.value.map(() => '?').join(', ')})`);
            params.push(...f.value.map(bindValue));
        } else if (f.op === 'array-contains') {
            where.push(`EXISTS (SELECT 1 FROM json_each(data, '${p}') WHERE value = ?)`);
            params.push(bindValue(f.value));
        } else if (OPS[f.op]) {
            if (f.value === null && (f.op === '==' || f.op === '!=')) {
                where.push(`json_type(data, '${p}') ${f.op === '==' ? '=' : '!='} 'null'`);
            } else {
                where.push(`${sortExpr(f.field)} ${OPS[f.op]} ?`);
                params.push(bindValue(f.value));
            }
        } else {
            throw new DocError('invalid-argument', `Unsupported operator: ${f.op}`);
        }
    }

    // Firestore excludes documents that lack an orderBy field.
    const order = [];
    for (const o of spec.orderBy || []) {
        where.push(`json_type(data, '${jsonPath(o.field)}') IS NOT NULL`);
        order.push(`${sortExpr(o.field)} ${o.dir === 'desc' ? 'DESC' : 'ASC'}`);
    }
    order.push('id ASC');

    if (spec.count) {
        return { sql: `SELECT COUNT(*) AS n FROM docs WHERE ${where.join(' AND ')}`, params };
    }

    let sql = `SELECT id, data FROM docs WHERE ${where.join(' AND ')} ORDER BY ${order.join(', ')}`;
    if (spec.limit != null) {
        const n = Number(spec.limit);
        if (!Number.isInteger(n) || n < 1 || n > 10000) throw new DocError('invalid-argument', 'Invalid limit');
        sql += ` LIMIT ${n}`;
    }
    return { sql, params };
}

// ─── Field transforms ─────────────────────────────────────────

function isSentinel(v) {
    return v && typeof v === 'object' && !Array.isArray(v) && typeof v.__op === 'string';
}

function resolveSentinel(current, v, now) {
    switch (v.__op) {
        case 'serverTimestamp': return { __ts: now };
        case 'increment': {
            if (typeof v.n !== 'number') throw new DocError('invalid-argument', 'Bad increment');
            return (typeof current === 'number' ? current : 0) + v.n;
        }
        case 'arrayUnion': {
            const arr = Array.isArray(current) ? [...current] : [];
            for (const x of v.values || []) {
                if (!arr.some(y => JSON.stringify(y) === JSON.stringify(x))) arr.push(x);
            }
            return arr;
        }
        case 'arrayRemove': {
            const drop = (v.values || []).map(x => JSON.stringify(x));
            return Array.isArray(current) ? current.filter(y => !drop.includes(JSON.stringify(y))) : [];
        }
        case 'deleteField': return undefined;
        default: throw new DocError('invalid-argument', `Unknown transform ${v.__op}`);
    }
}

function resolveDeep(value, current, now) {
    if (isSentinel(value)) return resolveSentinel(current, value, now);
    if (Array.isArray(value)) return value.map(v => resolveDeep(v, undefined, now));
    if (value && typeof value === 'object' && !('__ts' in value)) {
        const out = {};
        for (const [k, v] of Object.entries(value)) {
            const r = resolveDeep(v, current?.[k], now);
            if (r !== undefined) out[k] = r;
        }
        return out;
    }
    return value;
}

/** setDoc semantics: replace (or merge into) the document. */
export function applySet(before, data, { merge = false, now = Date.now() } = {}) {
    if (!merge) return resolveDeep(data, undefined, now);
    const out = structuredClone(before || {});
    for (const [k, v] of Object.entries(data)) {
        const r = resolveDeep(v, out[k], now);
        if (r === undefined) delete out[k]; else out[k] = r;
    }
    return out;
}

/** updateDoc semantics: dotted keys address nested fields. */
export function applyUpdate(before, data, { now = Date.now() } = {}) {
    const out = structuredClone(before || {});
    for (const [key, v] of Object.entries(data)) {
        if (!FIELD_RE.test(key)) throw new DocError('invalid-argument', `Invalid field: ${key}`);
        const parts = key.split('.');
        let node = out;
        for (const part of parts.slice(0, -1)) {
            if (!node[part] || typeof node[part] !== 'object' || Array.isArray(node[part])) node[part] = {};
            node = node[part];
        }
        const last = parts[parts.length - 1];
        const r = resolveDeep(v, node[last], now);
        if (r === undefined) delete node[last]; else node[last] = r;
    }
    return out;
}

// ─── Storage ──────────────────────────────────────────────────

export async function getDocRow(db, path) {
    const row = await db.prepare('SELECT data, rev FROM docs WHERE path = ?').bind(path).first();
    return row ? { data: JSON.parse(row.data), rev: row.rev } : null;
}

export async function runQuery(db, parent, spec) {
    const { sql, params } = buildQuery(parent, spec);
    if (spec?.count) {
        const row = await db.prepare(sql).bind(...params).first();
        return row?.n ?? 0;
    }
    const { results } = await db.prepare(sql).bind(...params).all();
    return results.map(r => ({ id: r.id, data: JSON.parse(r.data) }));
}

export async function getVersions(db, parents) {
    if (parents.length === 0) return {};
    const { results } = await db
        .prepare(`SELECT parent, version FROM coll_versions WHERE parent IN (${parents.map(() => '?').join(',')})`)
        .bind(...parents)
        .all();
    const out = Object.fromEntries(parents.map(p => [p, 0]));
    for (const r of results) out[r.parent] = r.version;
    return out;
}

function bumpStmt(db, parent) {
    return db.prepare('INSERT INTO coll_versions (parent, version) VALUES (?, 1) ON CONFLICT(parent) DO UPDATE SET version = version + 1').bind(parent);
}

/**
 * Atomically transform one document. `mutate(before)` returns
 * { after } (after === null deletes) or throws. `authorize(op, before, after)`
 * is awaited before writing. Retries on concurrent modification.
 */
export async function writeDoc(db, path, mutate, authorize) {
    const { parent, id } = splitDocPath(path);
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        const current = await getDocRow(db, path);
        const before = current?.data ?? null;
        const after = await mutate(before);
        if (before && after === before) return { op: 'none', after };  // mutate chose not to change it
        const op = after === null ? 'delete' : before ? 'update' : 'create';
        if (op === 'delete' && !before) return { op, after: null };
        if (authorize && !(await authorize(op, before, after))) {
            throw new DocError('permission-denied', 'Missing or insufficient permissions.');
        }

        const now = Date.now();
        let stmt;
        if (op === 'create') {
            stmt = db.prepare('INSERT INTO docs (path, parent, id, data, rev, updated_at) VALUES (?, ?, ?, ?, 1, ?) ON CONFLICT(path) DO NOTHING')
                .bind(path, parent, id, JSON.stringify(after), now);
        } else if (op === 'update') {
            stmt = db.prepare('UPDATE docs SET data = ?, rev = rev + 1, updated_at = ? WHERE path = ? AND rev = ?')
                .bind(JSON.stringify(after), now, path, current.rev);
        } else {
            stmt = db.prepare('DELETE FROM docs WHERE path = ? AND rev = ?').bind(path, current.rev);
        }
        const [res] = await db.batch([stmt, bumpStmt(db, parent)]);
        if (res.meta.changes === 1) return { op, after };
        // Someone else wrote first — re-read and try again.
    }
    throw new DocError('aborted', 'Too much contention on this document, try again.');
}
