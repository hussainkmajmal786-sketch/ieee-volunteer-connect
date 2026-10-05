// IEEE Volunteer Connect — Cloudflare Worker
// Serves the React build (static assets) plus the /api backend:
//   /api/auth/*   Better Auth (email/password + Google)
//   /api/db/*     Firestore-style document access, guarded by worker/rules.js
//   /api/fn/*     registerForEvent, recordLinkClick (former Cloud Functions)
//   /api/upload   admin image uploads → /files/*
import { Hono } from 'hono';
import { getAuth } from './auth.js';
import { canRead, canWrite, uploadProblem } from './rules.js';
import {
    DocError, autoId, parsePath, splitDocPath, getDocRow, runQuery, getVersions,
    writeDoc, applySet, applyUpdate,
} from './docstore.js';
import { registerForEvent, recordLinkClick } from './functions.js';
import { applyClassAmbassador, reviewApplication, notifyAmbassadors, shortLink } from './ambassadors.js';
import { createShare, listShares, downloadShare, deleteShare } from './sharedFiles.js';
import { listParticipants, sendBatch } from './messaging.js';
import { listPeople, getPerson, leaderboard, eventParticipants, uploadAvatar } from './people.js';
import { putFile, getFile } from './files.js';
import { getShortLink, resolveShortLink } from './shortLinks.js';
import { importEvent } from './eventImport.js';
import { getHook, updateHook, importRegistrations, receiveWebhook } from './externalRegistrations.js';

const STATUS = {
    'invalid-argument': 400, unauthenticated: 401, 'permission-denied': 403, 'not-found': 404,
    'already-exists': 409, aborted: 409, 'resource-exhausted': 429, 'failed-precondition': 412,
};
const MAX_POLL_SUBS = 40;

const app = new Hono();

app.onError((err, c) => {
    if (err instanceof DocError) return c.json({ error: { code: err.code, message: err.message } }, STATUS[err.code] || 400);
    console.error(err);
    return c.json({ error: { code: 'internal', message: 'Internal error' } }, 500);
});

// Request context: who is calling, with their profile loaded lazily once.
app.use('/api/*', async (c, next) => {
    if (c.req.path.startsWith('/api/auth/')) return next();
    const session = await getAuth(c.env).api.getSession({ headers: c.req.raw.headers });
    const auth = session?.user ? { uid: session.user.id, email: session.user.email } : null;
    let profile;
    c.set('ctx', {
        auth,
        profile: () => (profile ??= auth ? getDocRow(c.env.DB, `users/${auth.uid}`).then(r => r?.data ?? null) : Promise.resolve(null)),
    });
    return next();
});

app.on(['GET', 'POST'], '/api/auth/*', (c) => getAuth(c.env).handler(c.req.raw));

// ─── Documents ───────────────────────────────────────────────

const denied = () => new DocError('permission-denied', 'Missing or insufficient permissions.');

async function readDoc(c, path) {
    const { parent, id } = splitDocPath(path);
    const access = await canRead(parent, c.get('ctx'));
    if (!access) throw denied();
    const row = await getDocRow(c.env.DB, path);
    // Scoped collections: only documents that belong to the caller.
    if (Array.isArray(access) && row && !access.some(s => row.data?.[s.field] === s.value)) throw denied();
    return { id, exists: !!row, data: row?.data ?? null };
}

async function readQuery(c, parent, spec) {
    parsePath(parent, 'collection');
    const access = await canRead(parent, c.get('ctx'));
    if (!access) throw denied();
    if (Array.isArray(access)) {
        const scoped = (spec?.filters || []).some(f => f.op === '==' && access.some(s => s.field === f.field && s.value === f.value));
        if (!scoped) throw denied();
    }
    if (spec?.count) return { count: await runQuery(c.env.DB, parent, spec) };
    return { docs: await runQuery(c.env.DB, parent, spec || {}) };
}

app.post('/api/db/get', async (c) => {
    const { path } = await c.req.json();
    return c.json(await readDoc(c, path));
});

app.post('/api/db/query', async (c) => {
    const { parent, spec } = await c.req.json();
    return c.json(await readQuery(c, parent, spec));
});

// One round-trip for every live subscription on the page: returns fresh
// results only for subscriptions whose collection changed since `v`.
app.post('/api/db/poll', async (c) => {
    const { subs = [] } = await c.req.json();
    if (!Array.isArray(subs) || subs.length > MAX_POLL_SUBS) throw new DocError('invalid-argument', 'Too many subscriptions');
    const parentOf = (s) => (s.kind === 'doc' ? splitDocPath(s.path).parent : s.parent);
    const versions = await getVersions(c.env.DB, [...new Set(subs.map(parentOf))]);

    const results = {};
    await Promise.all(subs.map(async (s) => {
        const v = versions[parentOf(s)];
        if (s.v === v) return;
        try {
            results[s.key] = { v, ...(s.kind === 'doc' ? await readDoc(c, s.path) : await readQuery(c, s.parent, s.spec)) };
        } catch (err) {
            results[s.key] = { v, error: { code: err.code || 'internal', message: err.message } };
        }
    }));
    return c.json({ results });
});

app.post('/api/db/write', async (c) => {
    const { op, path, data = {}, merge = false } = await c.req.json();
    const ctx = c.get('ctx');
    const authorize = (kind, before, after) => canWrite(kind, docPath, before, after, ctx);

    let docPath = path;
    if (op === 'add') {
        parsePath(path, 'collection');
        docPath = `${path}/${autoId()}`;
    } else {
        parsePath(path, 'doc');
    }

    if (op === 'delete') {
        await writeDoc(c.env.DB, docPath, () => null, authorize);
    } else if (op === 'update') {
        await writeDoc(c.env.DB, docPath, (before) => {
            if (!before) throw new DocError('not-found', `No document to update: ${docPath}`);
            return applyUpdate(before, data);
        }, authorize);
    } else if (op === 'set' || op === 'add') {
        await writeDoc(c.env.DB, docPath, (before) => applySet(before, data, { merge }), authorize);
    } else {
        throw new DocError('invalid-argument', 'Unknown write op');
    }
    return c.json({ path: docPath, id: docPath.split('/').pop() });
});

// ─── Former Cloud Functions ──────────────────────────────────

app.post('/api/fn/:name', async (c) => {
    const { data } = await c.req.json();
    const { auth } = c.get('ctx');
    switch (c.req.param('name')) {
        case 'registerForEvent': return c.json({ data: await registerForEvent(c.env, auth, data) });
        case 'recordLinkClick': return c.json({ data: await recordLinkClick(c.env, auth, data, c.req.header('CF-Connecting-IP')) });
        case 'applyClassAmbassador': return c.json({ data: await applyClassAmbassador(c.env, auth, data) });
        default: throw new DocError('not-found', 'Unknown function');
    }
});

// ─── Admin ───────────────────────────────────────────────────

async function requireAdmin(c) {
    const ctx = c.get('ctx');
    const role = ctx.auth ? (await ctx.profile())?.role : null;
    if (!['ADMIN', 'SUPER_ADMIN'].includes(role)) throw new DocError('permission-denied', 'Admins only');
    return ctx;
}

// Create a volunteer account without touching the admin's own session.
app.post('/api/admin/users', async (c) => {
    await requireAdmin(c);
    const { name, email, password, branch, college } = await c.req.json();
    const res = await getAuth(c.env).api.signUpEmail({ body: { name, email, password } }).catch((err) => {
        throw new DocError(err?.status === 'UNPROCESSABLE_ENTITY' ? 'already-exists' : 'invalid-argument', err?.message || 'Could not create user');
    });
    const uid = res.user.id;
    await writeDoc(c.env.DB, `users/${uid}`, () => ({
        uid, name, email, role: 'VOLUNTEER', approvalStatus: 'ACTIVE', branch,
        college: college || branch, points: 0, tasksCompleted: 0, shares: 0, badges: [],
        createdAt: { __ts: Date.now() },
    }));
    return c.json({ uid });
});

// Super admin: message campus / class / both / selected ambassadors.
app.post('/api/admin/notify', async (c) => c.json(await notifyAmbassadors(c.env, c.get('ctx'), await c.req.json())));

// Super admin: approve or reject a Class Ambassador application.
app.post('/api/admin/ambassador-applications/:id', async (c) => {
    const { status } = await c.req.json();
    return c.json(await reviewApplication(c.env, c.get('ctx'), c.req.param('id'), status));
});

// ─── People: portfolios, leaderboard, participants ───────────

app.get('/api/public/people', (c) => listPeople(c.env));
app.get('/api/public/people/:id', (c) => getPerson(c.env, c.req.param('id')));
app.get('/api/public/leaderboard', (c) => leaderboard(c.env));
app.get('/api/events/:id/participants', async (c) => c.json(await eventParticipants(c.env, c.get('ctx'), c.req.param('id'))));
app.post('/api/me/avatar', async (c) => c.json(await uploadAvatar(c.env, c.get('ctx'), await c.req.formData())));

// ─── Shared files (super admin → ambassadors / volunteers) ────

app.post('/api/shared-files', async (c) => c.json(await createShare(c.env, c.get('ctx'), await c.req.formData())));
app.get('/api/shared-files', async (c) => c.json({ files: await listShares(c.env, c.get('ctx')) }));
app.get('/api/shared-files/:id/download', (c) => downloadShare(c.env, c.get('ctx'), c.req.param('id'), { inline: c.req.query('view') === '1' }));
app.delete('/api/shared-files/:id', async (c) => c.json(await deleteShare(c.env, c.get('ctx'), c.req.param('id'))));

// ─── Messages to registered participants (super admin) ────────

app.get('/api/admin/participants', async (c) => c.json(await listParticipants(c.env, c.get('ctx'), c.req.query('eventId') || null)));
app.post('/api/admin/broadcast', async (c) => c.json(await sendBatch(c.env, c.get('ctx'), await c.req.json())));

// ─── Registrations on the main website ───────────────────────

const originOf = (c) => new URL(c.req.url).origin;
app.get('/api/admin/events/:id/hook', async (c) => c.json(await getHook(c.env, c.get('ctx'), c.req.param('id'), originOf(c))));
app.post('/api/admin/events/:id/hook', async (c) => c.json(await updateHook(c.env, c.get('ctx'), c.req.param('id'), await c.req.json(), originOf(c))));
app.post('/api/admin/events/:id/import', async (c) => c.json(await importRegistrations(c.env, c.get('ctx'), c.req.param('id'), await c.req.json())));

// Called by the main website (Google Forms Apps Script, or its own server)
// for each submitted registration form. Authenticated by the per-event key.
const HOOK_CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Webhook-Key',
};
app.options('/api/hooks/registrations/:eventId', () => new Response(null, { status: 204, headers: HOOK_CORS }));
app.post('/api/hooks/registrations/:eventId', async (c) => {
    for (const [k, v] of Object.entries(HOOK_CORS)) c.header(k, v);
    const body = await c.req.json().catch(() => { throw new DocError('invalid-argument', 'Body must be JSON'); });
    const key = c.req.header('X-Webhook-Key') || c.req.query('key') || '';
    return c.json(await receiveWebhook(c.env, c.req.param('eventId'), key, body));
});

// Admin: read an event from a social media post / poster (returns a draft, saves nothing).
app.post('/api/admin/event-import', async (c) => c.json(await importEvent(c.env, c.get('ctx'), await c.req.formData())));

app.post('/api/upload', async (c) => {
    const ctx = c.get('ctx');
    const form = await c.req.formData();
    const file = form.get('file');
    const folder = String(form.get('folder') || '');
    if (!(file instanceof File)) throw new DocError('invalid-argument', 'No file provided');
    const role = ctx.auth ? (await ctx.profile())?.role : null;
    const problem = uploadProblem({ role, folder, type: file.type, size: file.size });
    if (problem) throw new DocError(ctx.auth ? 'permission-denied' : 'unauthenticated', problem);
    const key = `${folder}/${Date.now()}-${(file.name || 'image').replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    await putFile(c.env, key, await file.arrayBuffer(), file.type);
    return c.json({ url: `/files/${key}` });
});

app.get('/files/*', async (c) => {
    const key = decodeURIComponent(c.req.path.slice('/files/'.length));
    // Shared files are private: they're only served through the checked download route.
    if (key.startsWith('shared/')) return c.notFound();
    const res = await getFile(c.env, key, c.req.header('Range'));
    return res || c.notFound();
});

// Ambassador short links: tracked, then sent to this site or the main website.
app.get('/r/:eventId/:refId', async (c) => {
    const session = await getAuth(c.env).api.getSession({ headers: c.req.raw.headers }).catch(() => null);
    const auth = session?.user ? { uid: session.user.id } : null;
    return shortLink(c.env, c.req.raw, c.req.param('eventId'), c.req.param('refId'), auth);
});

// Short form of the same link: /s/<code>.
app.post('/api/short-links', async (c) => {
    const { eventId } = await c.req.json();
    return c.json(await getShortLink(c.env, c.get('ctx'), eventId, new URL(c.req.url).origin));
});
app.get('/s/:code', async (c) => {
    const link = await resolveShortLink(c.env.DB, c.req.param('code'));
    if (!link) return c.redirect('/events', 302);
    const session = await getAuth(c.env).api.getSession({ headers: c.req.raw.headers }).catch(() => null);
    const auth = session?.user ? { uid: session.user.id } : null;
    return shortLink(c.env, c.req.raw, link.eventId, link.refId, auth);
});

app.all('/api/*', (c) => c.json({ error: { code: 'not-found', message: 'Not found' } }, 404));

// Everything else is the single-page app.
app.all('*', (c) => c.env.ASSETS.fetch(c.req.raw));

export default app;
