// Access rules — a direct port of the former firestore.rules.
// Pure functions so they can be unit tested without a database.
//
// ctx = {
//   auth: { uid, email } | null,
//   profile: () => Promise<object|null>   // users/{auth.uid} document data
// }

export const SUPER_ADMIN_EMAIL = 'hussainkmajmal786@gmail.com';

const PUBLIC_CONTENT = ['opportunities', 'projects', 'chapters', 'testimonials', 'sponsors', 'news', 'spotlights'];
const TITLED_CONTENT = ['opportunities', 'projects'];

const isSignedIn = (ctx) => !!ctx.auth;

async function role(ctx) {
    if (!ctx.auth) return null;
    const profile = await ctx.profile();
    return profile?.role ?? null;
}

async function isAdmin(ctx) {
    return ['ADMIN', 'SUPER_ADMIN'].includes(await role(ctx));
}

async function isSuperAdmin(ctx) {
    return isSignedIn(ctx) && ctx.auth.email === SUPER_ADMIN_EMAIL && (await isAdmin(ctx));
}

async function isVolunteer(ctx) {
    return (await role(ctx)) === 'VOLUNTEER';
}

const isOwner = (ctx, uid) => isSignedIn(ctx) && ctx.auth.uid === uid;

export function isValidString(value, maxLen) {
    return typeof value === 'string' && value.length > 0 && value.length <= maxLen;
}

const isInt = (v) => Number.isInteger(v);

/** Top-level keys whose values differ between two documents. */
export function changedKeys(before = {}, after = {}) {
    const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
    return [...keys].filter(k => JSON.stringify(before[k]) !== JSON.stringify(after[k]));
}

function isValidParticipantCounterUpdate(ctx, before, after) {
    if (!isSignedIn(ctx)) return false;
    const keys = changedKeys(before, after);
    if (keys.length !== 1 || keys[0] !== 'participants') return false;
    if (!isInt(before.participants) || !isInt(after.participants)) return false;
    return Math.abs(after.participants - before.participants) === 1;
}

/**
 * Can the caller list/read documents in this collection?
 * None of the original read rules depended on document contents, so this is
 * decided per collection.
 */
export async function canRead(collectionPath, ctx) {
    const s = collectionPath.split('/');
    if (s.length === 1) {
        const [col] = s;
        if (col === 'events' || PUBLIC_CONTENT.includes(col)) return true;
        if (['users', 'tasks', 'teams', 'rewards', 'claims', 'notifications', 'resources', 'applications'].includes(col)) {
            return isSignedIn(ctx);
        }
        if (col === 'linkClicks' || col === 'referralVisits') return isAdmin(ctx);
        return false;
    }
    if (s.length === 3 && s[0] === 'events') {
        if (s[2] === 'registrations') return (await isAdmin(ctx)) || (await isVolunteer(ctx));
        if (s[2] === 'notifications') return isSignedIn(ctx);
    }
    return false;
}

/**
 * Can the caller perform `op` ('create' | 'update' | 'delete') on the
 * document at `path`? `before`/`after` are the document data before and after
 * the write (null when absent).
 */
export async function canWrite(op, path, before, after, ctx) {
    const s = path.split('/');
    if (s.length % 2 !== 0) return false;

    if (s.length === 4 && s[0] === 'events') {
        // Registrations are created only by the registerForEvent endpoint.
        if (s[2] === 'registrations') return op === 'create' ? false : isAdmin(ctx);
        if (s[2] === 'notifications') return isAdmin(ctx);
        return false;
    }
    if (s.length !== 2) return false;

    const [col, id] = s;
    const d = after || {};

    switch (col) {
        case 'events':
            if (op === 'create') return (await isAdmin(ctx)) && isValidString(d.name, 200) && isValidString(d.venue, 200);
            if (op === 'update') return (await isAdmin(ctx)) || isValidParticipantCounterUpdate(ctx, before, after);
            return isAdmin(ctx);

        case 'users':
            if (op === 'create') {
                return (isOwner(ctx, id)
                    && isValidString(d.name, 100)
                    && d.role === 'STUDENT'
                    && d.points === 0
                    && d.approvalStatus === 'PENDING')
                    || isAdmin(ctx);
            }
            if (op === 'update') {
                if (await isAdmin(ctx)) return true;
                if (!isOwner(ctx, id)) return false;
                const roleOk = d.role === before.role || (before.role === 'STUDENT' && d.role === 'VOLUNTEER');
                const statusOk = d.approvalStatus === before.approvalStatus
                    || (before.approvalStatus === 'PENDING' && d.approvalStatus === 'ACTIVE')
                    || (before.approvalStatus === 'APPROVED_PENDING_FORM' && d.approvalStatus === 'ACTIVE');
                return roleOk && statusOk;
            }
            return isSuperAdmin(ctx);

        case 'tasks':
            if (op === 'create') {
                return (await isAdmin(ctx)) && isValidString(d.title, 200)
                    && isInt(d.points) && d.points > 0 && d.points <= 10000;
            }
            if (op === 'update') return (await isAdmin(ctx)) || (await isVolunteer(ctx));
            return isAdmin(ctx);

        case 'teams':
            if (op === 'create') return (await isAdmin(ctx)) && isValidString(d.name, 100);
            return isAdmin(ctx);

        case 'rewards':
            if (op === 'create') return (await isAdmin(ctx)) && isValidString(d.name, 200) && isInt(d.points) && d.points > 0;
            return isAdmin(ctx);

        case 'claims':
        case 'notifications':
            return isAdmin(ctx);

        case 'resources':
            if (op === 'delete') return isSuperAdmin(ctx);
            return isAdmin(ctx);

        case 'applications':
            if (op === 'create') return isSignedIn(ctx) && d.userId === ctx.auth.uid && d.status === 'PENDING';
            if (op === 'update') return isAdmin(ctx);
            return isSuperAdmin(ctx);

        default:
            if (PUBLIC_CONTENT.includes(col)) {
                if (op === 'delete') return isSuperAdmin(ctx);
                if (op === 'create' && TITLED_CONTENT.includes(col)) return (await isAdmin(ctx)) && isValidString(d.title, 200);
                return isAdmin(ctx);
            }
            // linkClicks, referralVisits and anything unknown: server-only.
            return false;
    }
}

// ─── Image uploads (port of the former storage.rules) ─────────

export const UPLOAD_FOLDERS = ['events', 'volunteers', 'rewards', 'teams'];
export const UPLOAD_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const UPLOAD_ROLES = ['admin', 'organizer', 'ADMIN', 'SUPER_ADMIN'];

/** Returns null when allowed, otherwise the reason the upload is refused. */
export function uploadProblem({ role, folder, type, size }) {
    if (!UPLOAD_ROLES.includes(role)) return 'Only admins can upload images';
    if (!UPLOAD_FOLDERS.includes(folder)) return 'Uploads are not allowed in that folder';
    if (!UPLOAD_TYPES.includes(type)) return 'Only JPEG, PNG, WebP or GIF images are allowed';
    if (!(size < MAX_UPLOAD_BYTES)) return 'Images must be smaller than 5MB';
    return null;
}
