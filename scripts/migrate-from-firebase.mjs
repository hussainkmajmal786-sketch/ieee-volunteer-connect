#!/usr/bin/env node
/**
 * One-time migration: Firebase (Firestore + Auth + Storage) → Cloudflare (D1 + KV).
 *
 *   npm run migrate:firebase -- --key service-account.json
 *
 * Options:
 *   --key <file>      Firebase service-account JSON (default: service-account.json)
 *   --local           Load into the local dev database instead of Cloudflare
 *   --export-only     Only write migration/ files, don't touch Cloudflare
 *   --skip-files      Don't copy Storage files
 *   --files-only      Only copy Storage files to Cloudflare (data already imported)
 *
 * What happens to accounts:
 *   - Email/password users keep their password: it's checked once against
 *     Firebase on their first sign-in (needs the FIREBASE_API_KEY secret),
 *     then stored on Cloudflare.
 *   - Google users just sign in with Google again (needs GOOGLE_CLIENT_ID/SECRET).
 *   - User IDs are unchanged, so points, referrals and registrations still match.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';

const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const opt = (name, fallback) => {
    const i = args.indexOf(`--${name}`);
    return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};

const OUT = 'migration';
const KEY_FILE = opt('key', 'service-account.json');
const TARGET = flag('local') ? '--local' : '--remote';
const SKIP_COLLECTIONS = new Set(['rateLimits']);   // old Cloud Functions internals
const MAX_STATEMENT_BYTES = 95_000;                  // D1 limit is 100 KB per statement
const KV_CHUNK_BYTES = 40 * 1024 * 1024;

function log(msg) { console.log(msg); }
function die(msg) { console.error(`\n✖ ${msg}`); process.exit(1); }

// ─── Firebase setup ─────────────────────────────────────────

let projectId = process.env.GCLOUD_PROJECT;
if (process.env.FIRESTORE_EMULATOR_HOST) {
    initializeApp({ projectId });
} else {
    if (!existsSync(KEY_FILE)) {
        die(`Service-account key not found: ${KEY_FILE}
  Firebase console → Project settings → Service accounts → "Generate new private key",
  save it in this folder as service-account.json, then re-run.`);
    }
    const key = JSON.parse(readFileSync(KEY_FILE, 'utf8'));
    projectId = key.project_id;
    initializeApp({ credential: cert(key), projectId });
}
const firestore = getFirestore();
const auth = getAuth();

// ─── Value conversion ───────────────────────────────────────

const referencedFiles = new Map();   // key (object path) → bucket name

function storageRefFromUrl(url) {
    let m = url.match(/^https?:\/\/[^/]+\/v0\/b\/([^/]+)\/o\/([^?#]+)/);
    if (m) return { bucket: m[1], path: decodeURIComponent(m[2]) };
    m = url.match(/^https:\/\/storage\.googleapis\.com\/([^/]+)\/([^?#]+)/);
    return m ? { bucket: m[1], path: decodeURIComponent(m[2]) } : null;
}

function convert(value) {
    if (value === null || value === undefined) return value ?? null;
    if (typeof value === 'string') {
        const ref = storageRefFromUrl(value);
        if (ref) { referencedFiles.set(ref.path, ref.bucket); return `/files/${ref.path}`; }
        return value;
    }
    if (typeof value !== 'object') return Number.isNaN(value) ? null : value;
    if (Array.isArray(value)) return value.map(convert);
    const kind = value.constructor?.name;
    if (typeof value.toMillis === 'function' && 'seconds' in value) return { __ts: value.toMillis() };   // Timestamp
    if (value instanceof Date) return { __ts: value.getTime() };
    if (kind === 'GeoPoint') return { latitude: value.latitude, longitude: value.longitude };
    if (kind === 'DocumentReference') return value.path;
    if (value instanceof Uint8Array || Buffer.isBuffer(value)) return Buffer.from(value).toString('base64');
    if (kind === 'Bytes' && typeof value.toBase64 === 'function') return value.toBase64();
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = convert(v);
    return out;
}

// ─── Export ─────────────────────────────────────────────────

const docs = [];   // { path, parent, id, data }

async function exportCollection(ref) {
    const refs = await ref.listDocuments();
    for (let i = 0; i < refs.length; i += 300) {
        const snaps = await firestore.getAll(...refs.slice(i, i + 300));
        for (const snap of snaps) {
            if (snap.exists) {
                docs.push({ path: snap.ref.path, parent: ref.path, id: snap.id, data: convert(snap.data()) });
            }
            for (const sub of await snap.ref.listCollections()) await exportCollection(sub);
        }
    }
}

async function exportFirestore() {
    for (const col of await firestore.listCollections()) {
        if (SKIP_COLLECTIONS.has(col.id)) { log(`  – skipping ${col.id}`); continue; }
        const before = docs.length;
        await exportCollection(col);
        log(`  ✓ ${col.id}: ${docs.length - before} documents (incl. sub-collections)`);
    }
}

async function exportUsers() {
    const users = [];
    let pageToken;
    do {
        const page = await auth.listUsers(1000, pageToken);
        users.push(...page.users);
        pageToken = page.pageToken;
    } while (pageToken);
    return users;
}

/** Download every Storage object the data links to (each file on its own, so one failure doesn't stop the rest). */
async function exportFiles() {
    const out = [];
    const failed = [];
    for (const [key, bucket] of referencedFiles) {
        const file = getStorage().bucket(bucket).file(key);
        let lastErr;
        for (let attempt = 0; attempt < 3; attempt++) {
            try {
                const [[buf], [meta]] = await Promise.all([file.download(), file.getMetadata()]);
                out.push({ key, contentType: meta?.contentType || 'application/octet-stream', buf });
                lastErr = null;
                break;
            } catch (err) {
                lastErr = err;
            }
        }
        if (lastErr) failed.push({ key, bucket, message: String(lastErr.message || lastErr).split('\n')[0] });
    }
    if (failed.length) {
        log(`  ! ${failed.length} file(s) could not be downloaded:`);
        for (const f of failed.slice(0, 10)) log(`      ${f.bucket}/${f.key} — ${f.message}`);
    }
    return out;
}

// ─── SQL generation ─────────────────────────────────────────

const q = (v) => (v === null || v === undefined ? 'NULL' : `'${String(v).replace(/'/g, "''")}'`);

function buildSql(users) {
    const lines = ['-- Generated by scripts/migrate-from-firebase.mjs'];
    const now = Date.now();
    const nowIso = new Date(now).toISOString();
    const docPaths = new Set(docs.map(d => d.path));
    let skippedLarge = 0;

    for (const d of docs) {
        const stmt = `INSERT OR REPLACE INTO docs (path, parent, id, data, rev, updated_at) VALUES (${q(d.path)}, ${q(d.parent)}, ${q(d.id)}, ${q(JSON.stringify(d.data))}, 1, ${now});`;
        if (Buffer.byteLength(stmt) > MAX_STATEMENT_BYTES) { skippedLarge++; log(`  ! ${d.path} is too large for D1 (>95 KB), skipped`); continue; }
        lines.push(stmt);
    }

    let imported = 0, skippedNoEmail = 0, skippedDisabled = 0;
    for (const u of users) {
        if (!u.email) { skippedNoEmail++; continue; }
        if (u.disabled) { skippedDisabled++; continue; }
        const email = u.email.toLowerCase();
        const name = u.displayName || email.split('@')[0];
        const created = new Date(u.metadata.creationTime || now).toISOString();
        lines.push(`INSERT OR IGNORE INTO "user" (id, name, email, emailVerified, image, createdAt, updatedAt) VALUES (${q(u.uid)}, ${q(name)}, ${q(email)}, ${u.emailVerified ? 1 : 0}, ${q(convert(u.photoURL || null))}, ${q(created)}, ${q(nowIso)});`);
        for (const p of u.providerData) {
            if (p.providerId === 'password') {
                lines.push(`INSERT OR IGNORE INTO account (id, accountId, providerId, userId, password, createdAt, updatedAt) VALUES (${q(randomUUID())}, ${q(u.uid)}, 'credential', ${q(u.uid)}, ${q(`firebase:${email}`)}, ${q(created)}, ${q(nowIso)});`);
            } else if (p.providerId === 'google.com') {
                lines.push(`INSERT OR IGNORE INTO account (id, accountId, providerId, userId, createdAt, updatedAt) VALUES (${q(randomUUID())}, ${q(p.uid)}, 'google', ${q(u.uid)}, ${q(created)}, ${q(nowIso)});`);
            }
        }
        // Accounts without an app profile get the default one.
        if (!docPaths.has(`users/${u.uid}`)) {
            const profile = { name, email, role: 'STUDENT', approvalStatus: 'PENDING', branch: 'IEEE Branch', college: '', points: 0, badges: [], createdAt: { __ts: now } };
            lines.push(`INSERT OR IGNORE INTO docs (path, parent, id, data, rev, updated_at) VALUES (${q(`users/${u.uid}`)}, 'users', ${q(u.uid)}, ${q(JSON.stringify(profile))}, 1, ${now});`);
        }
        imported++;
    }

    // Bump every collection version so open pages refetch.
    lines.push(`INSERT INTO coll_versions (parent, version) SELECT parent, 1 FROM docs WHERE 1 GROUP BY parent ON CONFLICT(parent) DO UPDATE SET version = version + 1;`);
    return { sql: lines.join('\n') + '\n', imported, skippedNoEmail, skippedDisabled, skippedLarge };
}

function writeKvChunks(files) {
    const chunks = [];
    let current = [], size = 0;
    for (const f of files) {
        const entry = { key: f.key, value: f.buf.toString('base64'), base64: true, metadata: { contentType: f.contentType } };
        const bytes = entry.value.length;
        if (size + bytes > KV_CHUNK_BYTES && current.length) { chunks.push(current); current = []; size = 0; }
        current.push(entry); size += bytes;
    }
    if (current.length) chunks.push(current);
    return chunks.map((chunk, i) => {
        const file = join(OUT, `kv-files-${i + 1}.json`);
        writeFileSync(file, JSON.stringify(chunk));
        return file;
    });
}

// On Windows npx is a .cmd, so it must run through the shell; quote each
// argument ourselves (paths can contain spaces, e.g. C:\Users\First Last).
function runWrangler(args) {
    if (process.platform !== 'win32') return spawnSync('npx', ['wrangler', ...args], { stdio: 'inherit' });
    const quoted = args.map(a => (/[\s"&|<>^]/.test(a) ? `"${a.replace(/"/g, '""')}"` : a)).join(' ');
    return spawnSync(`npx wrangler ${quoted}`, { stdio: 'inherit', shell: true });
}

function wrangler(...cmd) {
    log(`  $ wrangler ${cmd.join(' ')}`);
    const res = runWrangler(cmd);
    if (res.status !== 0) die(`wrangler ${cmd[0]} ${cmd[1]} failed — fix the error above and re-run (the import is safe to repeat).`);
}

// ─── Main ───────────────────────────────────────────────────

log(`\nMigrating Firebase project "${projectId}" → Cloudflare (${TARGET.slice(2)})\n`);
mkdirSync(join(OUT, 'files'), { recursive: true });

log('1/4 Firestore');
await exportFirestore();

log('2/4 Storage files');
const files = flag('skip-files') ? [] : await exportFiles();
for (const f of files) {
    const p = join(OUT, 'files', f.key);
    mkdirSync(dirname(p), { recursive: true });
    writeFileSync(p, f.buf);
}
log(`  ✓ ${files.length} of ${referencedFiles.size} linked files downloaded`);
const kvFiles = writeKvChunks(files);

if (flag('files-only')) {
    if (flag('export-only')) process.exit(0);
    log('3/3 Uploading files to Cloudflare');
    for (const f of kvFiles) wrangler('kv', 'bulk', 'put', f, '--binding=FILES_KV', TARGET);
    log(`\n✔ Done. ${files.length} files uploaded.`);
    process.exit(0);
}

log('3/4 Auth users');
const users = await exportUsers();
const { sql, imported, skippedNoEmail, skippedDisabled, skippedLarge } = buildSql(users);
writeFileSync(join(OUT, 'data.sql'), sql);
log(`  ✓ ${imported} accounts (${skippedNoEmail} without email and ${skippedDisabled} disabled were skipped)`);
log(`  ✓ wrote ${OUT}/data.sql (${docs.length} documents${skippedLarge ? `, ${skippedLarge} too large` : ''}) and ${kvFiles.length} file bundle(s)`);

if (flag('export-only')) {
    log('\nExport only — nothing was sent to Cloudflare.');
    process.exit(0);
}

log('4/4 Loading into Cloudflare');
wrangler('d1', 'migrations', 'apply', 'DB', TARGET);
wrangler('d1', 'execute', 'DB', TARGET, '--yes', `--file=${join(OUT, 'data.sql')}`);
for (const f of kvFiles) wrangler('kv', 'bulk', 'put', f, '--binding=FILES_KV', TARGET);

log(`\n✔ Done. ${docs.length} documents, ${imported} accounts and ${files.length} files migrated.`);
log('  Delete the migration/ folder and service-account.json when you have checked the site.');
