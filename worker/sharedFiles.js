// Super admin → people file/link sharing. Files live in KV/R2 under
// shared/<id>/..., metadata in the `sharedFiles` collection; downloads go
// through the Worker so only the chosen audience can open them.
import { DocError, getDocRow, writeDoc, autoId, runQuery } from './docstore.js';
import { isSuperAdmin, isAdmin, isValidExternalUrl } from './rules.js';
import { optionalString, requireString, safeFieldKey } from './functions.js';
import { putFile, getFileObject, deleteFile } from './files.js';
import { sendInbox, audienceUserIds } from './ambassadors.js';

export const SHARE_AUDIENCES = ['campus', 'class', 'ambassadors', 'volunteers', 'everyone', 'selected'];
export const MAX_SHARE_BYTES = 25 * 1024 * 1024;   // Workers KV value limit
const MAX_SELECTED = 90;

// Types a browser could execute as a page are always downloaded, never shown.
const RENDER_INLINE = /^(image\/(png|jpeg|gif|webp|avif)|application\/pdf|video\/(mp4|webm)|audio\/(mpeg|ogg|wav)|text\/plain)$/;

/** Does `profile` (users/{uid} data) belong to `file`'s audience? */
export function inAudience(file, uid, profile) {
    if (!profile) return false;
    const amb = profile.ambassadorType;
    switch (file.audience) {
        case 'campus': return amb === 'campus';
        case 'class': return amb === 'class';
        case 'ambassadors': return amb === 'campus' || amb === 'class';
        case 'volunteers': return profile.role === 'VOLUNTEER' || !!amb;
        case 'everyone': return true;
        case 'selected': return Array.isArray(file.userIds) && file.userIds.includes(uid);
        default: return false;
    }
}

async function canOpen(ctx, file) {
    if (!ctx.auth) return false;
    if (await isAdmin(ctx)) return true;
    return inAudience(file, ctx.auth.uid, await ctx.profile());
}

export async function createShare(env, ctx, form) {
    if (!(await isSuperAdmin(ctx))) throw new DocError('permission-denied', 'Only the super admin can share files');
    const title = requireString(String(form.get('title') || ''), 'title', 150);
    const description = optionalString(String(form.get('description') || ''), 2000);
    const audience = String(form.get('audience') || '');
    if (!SHARE_AUDIENCES.includes(audience)) throw new DocError('invalid-argument', 'Choose who to share with');

    let userIds = [];
    if (audience === 'selected') {
        userIds = JSON.parse(String(form.get('userIds') || '[]')).map(safeFieldKey).filter(Boolean);
        if (userIds.length === 0 || userIds.length > MAX_SELECTED) throw new DocError('invalid-argument', `Choose 1-${MAX_SELECTED} people`);
    }

    const id = autoId();
    const file = form.get('file');
    const link = String(form.get('url') || '').trim();
    const meta = {
        title, description, audience, userIds,
        uploadedBy: ctx.auth.uid,
        createdAt: { __ts: Date.now() },
    };
    if (file instanceof File && file.size > 0) {
        if (file.size > MAX_SHARE_BYTES) throw new DocError('invalid-argument', 'Files must be 25MB or smaller');
        const name = (file.name || 'file').replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120);
        meta.key = `shared/${id}/${name}`;
        meta.fileName = name;
        meta.size = file.size;
        meta.contentType = file.type || 'application/octet-stream';
        await putFile(env, meta.key, await file.arrayBuffer(), meta.contentType);
    } else if (link) {
        if (!isValidExternalUrl(link)) throw new DocError('invalid-argument', 'Enter a valid link (https://…)');
        meta.url = link;
    } else {
        throw new DocError('invalid-argument', 'Attach a file or add a link');
    }
    await writeDoc(env.DB, `sharedFiles/${id}`, () => meta);

    const recipients = audience === 'selected' ? userIds : await audienceUserIds(env.DB, audience);
    await sendInbox(env.DB, recipients.filter(u => u !== ctx.auth.uid), {
        title: `New file shared: ${title}`,
        message: description || (meta.fileName ? `${meta.fileName} is ready to download.` : 'Open the link from your dashboard.'),
        from: 'Super Admin', kind: 'file', link: '/volunteer',
    });
    return { id, recipients: recipients.length };
}

/** Items the caller may open, newest first (admins see everything). */
export async function listShares(env, ctx) {
    if (!ctx.auth) throw new DocError('unauthenticated', 'Sign in to see shared files');
    const all = await runQuery(env.DB, 'sharedFiles', { orderBy: [{ field: 'createdAt', dir: 'desc' }], limit: 500 });
    const admin = await isAdmin(ctx);
    const profile = await ctx.profile();
    return all
        .filter(f => admin || inAudience(f.data, ctx.auth.uid, profile))
        .map(({ id, data }) => ({
            id, title: data.title, description: data.description, audience: data.audience,
            fileName: data.fileName || null, size: data.size || null, contentType: data.contentType || null,
            url: data.url || null, createdAt: data.createdAt,
            ...(admin ? { userIds: data.userIds } : {}),
        }));
}

export async function downloadShare(env, ctx, id, { inline = false } = {}) {
    const row = await getDocRow(env.DB, `sharedFiles/${safeFieldKey(id)}`);
    if (!row || !row.data.key) throw new DocError('not-found', 'File not found');
    if (!(await canOpen(ctx, row.data))) throw new DocError('permission-denied', 'This file was not shared with you');
    const obj = await getFileObject(env, row.data.key);
    if (!obj) throw new DocError('not-found', 'File not found');
    const type = row.data.contentType || 'application/octet-stream';
    const showInline = inline && RENDER_INLINE.test(type);
    return new Response(obj.body, {
        headers: {
            'Content-Type': showInline ? type : 'application/octet-stream',
            'Content-Disposition': `${showInline ? 'inline' : 'attachment'}; filename="${row.data.fileName}"`,
            'Cache-Control': 'private, no-store',
            'X-Content-Type-Options': 'nosniff',
        },
    });
}

export async function deleteShare(env, ctx, id) {
    if (!(await isSuperAdmin(ctx))) throw new DocError('permission-denied', 'Only the super admin can delete shared files');
    const path = `sharedFiles/${safeFieldKey(id)}`;
    const row = await getDocRow(env.DB, path);
    if (!row) return { ok: true };
    if (row.data.key) await deleteFile(env, row.data.key);
    await writeDoc(env.DB, path, () => null);
    return { ok: true };
}
