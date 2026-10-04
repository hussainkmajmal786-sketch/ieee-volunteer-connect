// Profiles & portfolios, the public volunteer directory, the leaderboard, and
// the participant list shown on event pages.
import { DocError, getDocRow, writeDoc, applyUpdate } from './docstore.js';
import { avatarProblem, isAdmin, SOCIAL_KEYS } from './rules.js';
import { safeFieldKey } from './functions.js';
import { putFile } from './files.js';

const ADMIN_ROLES = ['ADMIN', 'SUPER_ADMIN'];
const PUBLIC_CACHE = { 'Cache-Control': 'public, max-age=15' };
const safeHttp = (v) => (typeof v === 'string' && /^https?:\/\//i.test(v) ? v : '');

/** Is this person part of the team (shown in the directory, can open portfolios)? */
export const isTeamMember = (d) => !!d && (d.role === 'VOLUNTEER' || ADMIN_ROLES.includes(d.role) || !!d.ambassadorType);

/** Verified = an active volunteer/ambassador, or an admin. */
export const isVerified = (d) => !!d && (ADMIN_ROLES.includes(d.role)
    || ((d.role === 'VOLUNTEER' || !!d.ambassadorType) && d.approvalStatus !== 'PENDING'));

/** The fields anyone may see on a portfolio. Email only when the person opted in. */
export function publicProfile(id, d) {
    const socials = {};
    for (const k of SOCIAL_KEYS) {
        const v = safeHttp(d.socials?.[k]) || safeHttp(d[k]);   // legacy top-level links
        if (v) socials[k] = v;
    }
    const skills = Array.isArray(d.skills) ? d.skills : Array.isArray(d.interests) ? d.interests : [];
    return {
        id,
        name: d.name || 'IEEE Member',
        photoURL: typeof d.photoURL === 'string' ? d.photoURL : null,
        headline: d.headline || '',
        bio: d.bio || '',
        department: d.department || '',
        year: d.year || '',
        college: d.college || d.branch || '',
        skills: skills.filter(s => typeof s === 'string').slice(0, 25),
        socials,
        email: d.showEmail ? (d.contactEmail || d.email || null) : null,
        points: d.points || 0,
        tasksCompleted: d.tasksCompleted || 0,
        referrals: d.referrals || 0,
        shares: d.shares || 0,
        role: d.role || 'STUDENT',
        ambassadorType: d.ambassadorType || null,
        campusAmbassadorName: d.campusAmbassadorName || null,
    };
}

async function allUsers(db) {
    const { results } = await db.prepare("SELECT id, data FROM docs WHERE parent = 'users'").all();
    return results.map(r => ({ id: r.id, data: JSON.parse(r.data) }));
}

export async function listPeople(env) {
    const people = (await allUsers(env.DB))
        .filter(u => isTeamMember(u.data))
        .map(u => publicProfile(u.id, u.data))
        .sort((a, b) => b.points - a.points || a.name.localeCompare(b.name));
    return new Response(JSON.stringify({ people }), { headers: { 'Content-Type': 'application/json', ...PUBLIC_CACHE } });
}

export async function getPerson(env, id) {
    const row = await getDocRow(env.DB, `users/${safeFieldKey(id)}`);
    if (!row || !isTeamMember(row.data)) throw new DocError('not-found', 'Profile not found');
    return new Response(JSON.stringify({ person: publicProfile(safeFieldKey(id), row.data) }), { headers: { 'Content-Type': 'application/json', ...PUBLIC_CACHE } });
}

/** Volunteers, ambassadors and anyone who has earned points — admins excluded. */
export async function leaderboard(env) {
    const leaders = (await allUsers(env.DB))
        .filter(u => !ADMIN_ROLES.includes(u.data.role) && (isTeamMember(u.data) || (u.data.points || 0) > 0))
        .map(u => {
            const p = publicProfile(u.id, u.data);
            return {
                id: p.id, name: p.name, photoURL: p.photoURL, college: p.college, department: p.department,
                points: p.points, tasksCompleted: p.tasksCompleted, referrals: p.referrals, shares: p.shares,
                ambassadorType: p.ambassadorType, role: p.role,
            };
        })
        .sort((a, b) => b.points - a.points || b.referrals - a.referrals || a.name.localeCompare(b.name))
        .slice(0, 200);
    return new Response(JSON.stringify({ leaders }), { headers: { 'Content-Type': 'application/json', ...PUBLIC_CACHE } });
}

/**
 * Who registered for an event. Everyone gets the count and up to 10 photos;
 * verified volunteers and admins also get names and colleges for everyone.
 */
export async function eventParticipants(env, ctx, eventId) {
    const id = safeFieldKey(eventId);
    const db = env.DB;
    const { results } = await db.prepare(`
        SELECT r.data AS reg, u.id AS uid, u.data AS profile
        FROM docs r LEFT JOIN docs u ON u.parent = 'users' AND u.id = json_extract(r.data, '$.userId')
        WHERE r.parent = ?
        ORDER BY json_extract(r.data, '$.registeredAt.__ts') ASC`).bind(`events/${id}/registrations`).all();

    const rows = results.map(r => {
        const reg = JSON.parse(r.reg);
        const profile = r.profile ? JSON.parse(r.profile) : {};
        const name = profile.name || reg.name || '?';
        return {
            initial: name.trim().charAt(0).toUpperCase() || '?',
            photoURL: typeof profile.photoURL === 'string' ? profile.photoURL : null,
            detail: {
                userId: r.uid || null,
                name,
                college: reg.college || profile.college || '',
                year: reg.year || profile.year || '',
                department: profile.department || '',
                hasPortfolio: isTeamMember(profile),
            },
        };
    });

    const viewer = ctx.auth ? await ctx.profile() : null;
    const verified = (await isAdmin(ctx)) || isVerified(viewer);
    return {
        count: rows.length,
        avatars: rows.slice(0, 10).map(({ initial, photoURL }) => ({ initial, photoURL })),
        canSeeDetails: verified,
        participants: verified ? rows.map(r => ({ ...r.detail, photoURL: r.photoURL, initial: r.initial })) : null,
    };
}

/** The signed-in user replaces their own profile photo. */
export async function uploadAvatar(env, ctx, form) {
    if (!ctx.auth) throw new DocError('unauthenticated', 'Sign in to change your photo');
    const file = form.get('file');
    if (!(file instanceof File)) throw new DocError('invalid-argument', 'No photo provided');
    const problem = avatarProblem({ type: file.type, size: file.size });
    if (problem) throw new DocError('invalid-argument', problem);
    const ext = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' }[file.type];
    const key = `avatars/${ctx.auth.uid}/${Date.now()}.${ext}`;
    await putFile(env, key, await file.arrayBuffer(), file.type);
    const photoURL = `/files/${key}`;
    await writeDoc(env.DB, `users/${ctx.auth.uid}`, (before) => (before ? applyUpdate(before, { photoURL }) : null));
    return { photoURL };
}
