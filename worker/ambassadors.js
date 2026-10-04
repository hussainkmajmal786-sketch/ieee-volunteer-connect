// Ambassador program: Campus/Class ambassadors, the Class Ambassador
// application form, admin notifications, and tracked short links (/r/...).
import { DocError, getDocRow, writeDoc, autoId, applyUpdate } from './docstore.js';
import { isSuperAdmin, isValidExternalUrl } from './rules.js';
import {
    requireString, optionalString, validateEmail, safeFieldKey,
    limitClicks, creditReferralVisit,
} from './functions.js';

export const FORM_SETTINGS_PATH = 'settings/classAmbassadorForm';
const AUDIENCES = { campus: ['campus'], class: ['class'], both: ['campus', 'class'] };
const MAX_SELECTED = 90;   // D1 allows 100 bound parameters per statement

async function requireSuperAdmin(ctx) {
    if (!(await isSuperAdmin(ctx))) throw new DocError('permission-denied', 'Only the super admin can do this');
}

/** Insert one inbox message per recipient in a single statement. */
async function sendInbox(db, userIds, { title, message, from, kind = 'message', link = null }) {
    const ids = [...new Set(userIds)].filter(Boolean);
    if (ids.length === 0) return 0;
    const now = Date.now();
    const stmts = [];
    for (let i = 0; i < ids.length; i += MAX_SELECTED) {
        const chunk = ids.slice(i, i + MAX_SELECTED);
        stmts.push(db.prepare(`
            INSERT INTO docs (path, parent, id, data, rev, updated_at)
            SELECT 'inbox/' || nid, 'inbox', nid,
                   json_object('userId', uid, 'title', ?1, 'message', ?2, 'from', ?3, 'kind', ?4, 'link', ?5,
                               'createdAt', json_object('__ts', ?6)),
                   1, ?6
            FROM (SELECT lower(hex(randomblob(10))) AS nid, value AS uid FROM json_each(?7))`)
            .bind(title, message, from, kind, link, now, JSON.stringify(chunk)));
    }
    stmts.push(db.prepare("INSERT INTO coll_versions (parent, version) VALUES ('inbox', 1) ON CONFLICT(parent) DO UPDATE SET version = version + 1"));
    await db.batch(stmts);
    return ids.length;
}

/** Ids of users whose ambassadorType is one of `types`. */
async function ambassadorIds(db, types) {
    const { results } = await db.prepare(
        `SELECT id FROM docs WHERE parent = 'users' AND json_extract(data, '$.ambassadorType') IN (${types.map(() => '?').join(',')})`
    ).bind(...types).all();
    return results.map(r => r.id);
}

// ─── Notifications ───────────────────────────────────────────

export async function notifyAmbassadors(env, ctx, body) {
    await requireSuperAdmin(ctx);
    const title = requireString(body?.title, 'title', 120);
    const message = requireString(body?.message, 'message', 2000);
    let recipients;
    if (body?.audience === 'selected') {
        const ids = Array.isArray(body.userIds) ? body.userIds.map(safeFieldKey).filter(Boolean) : [];
        if (ids.length === 0 || ids.length > MAX_SELECTED) throw new DocError('invalid-argument', `Choose 1-${MAX_SELECTED} people`);
        recipients = ids;
    } else if (AUDIENCES[body?.audience]) {
        recipients = await ambassadorIds(env.DB, AUDIENCES[body.audience]);
    } else {
        throw new DocError('invalid-argument', 'Unknown audience');
    }
    const sent = await sendInbox(env.DB, recipients, { title, message, from: 'Super Admin', kind: body.audience });
    return { sent };
}

// ─── Class Ambassador applications ──────────────────────────

export async function applyClassAmbassador(env, auth, data) {
    if (!auth) throw new DocError('unauthenticated', 'Sign in to apply');
    const db = env.DB;
    const settings = (await getDocRow(db, FORM_SETTINGS_PATH))?.data;
    if (!settings?.published) throw new DocError('failed-precondition', 'Applications are not open right now');

    const caId = safeFieldKey(requireString(data?.campusAmbassadorId, 'campusAmbassadorId', 128));
    const ca = (await getDocRow(db, `users/${caId}`))?.data;
    if (ca?.ambassadorType !== 'campus') throw new DocError('invalid-argument', 'This application link is no longer valid');
    if (caId === auth.uid) throw new DocError('invalid-argument', "You can't apply through your own link");

    const me = (await getDocRow(db, `users/${auth.uid}`))?.data;
    if (me?.ambassadorType) throw new DocError('already-exists', `You are already a ${me.ambassadorType} ambassador`);

    const form = data?.form || {};
    const application = {
        userId: auth.uid,
        campusAmbassadorId: caId,
        campusAmbassadorName: optionalString(ca.name, 100),
        name: requireString(form.name, 'name', 100),
        email: validateEmail(form.email),
        phone: requireString(form.phone, 'phone', 40),
        college: requireString(form.college, 'college', 160),
        department: requireString(form.department, 'department', 120),
        year: requireString(form.year, 'year', 40),
        className: requireString(form.className, 'class', 60),
        about: optionalString(form.about, 1000),
        status: 'PENDING',
        createdAt: { __ts: Date.now() },
    };

    await writeDoc(db, `ambassadorApplications/${auth.uid}`, (before) => {
        if (before && before.status !== 'REJECTED') throw new DocError('already-exists', 'You have already applied');
        return application;
    });
    await sendInbox(db, [caId], {
        title: 'New Class Ambassador application',
        message: `${application.name} (${application.department}, ${application.className}) applied through your link.`,
        from: 'System', kind: 'application', link: '/volunteer',
    });
    return { ok: true };
}

export async function reviewApplication(env, ctx, applicationId, status) {
    await requireSuperAdmin(ctx);
    if (!['APPROVED', 'REJECTED'].includes(status)) throw new DocError('invalid-argument', 'Invalid status');
    const db = env.DB;
    const id = safeFieldKey(applicationId);

    let app;
    await writeDoc(db, `ambassadorApplications/${id}`, (before) => {
        if (!before) throw new DocError('not-found', 'Application not found');
        app = { ...before, status, reviewedAt: { __ts: Date.now() } };
        return app;
    });

    if (status === 'APPROVED') {
        await writeDoc(db, `users/${app.userId}`, (before) => before && applyUpdate(before, {
            ambassadorType: 'class',
            campusAmbassadorId: app.campusAmbassadorId,
            campusAmbassadorName: app.campusAmbassadorName,
            role: ['ADMIN', 'SUPER_ADMIN'].includes(before.role) ? before.role : 'VOLUNTEER',
            approvalStatus: 'ACTIVE',
            college: before.college || app.college,
        }));
    }
    const approved = status === 'APPROVED';
    await sendInbox(db, [app.userId], {
        title: approved ? 'You are now a Class Ambassador! 🎉' : 'Class Ambassador application update',
        message: approved
            ? 'Your application was approved. Open your dashboard to get your referral links.'
            : 'Thank you for applying. Your application was not approved this time.',
        from: 'Super Admin', kind: 'application', link: '/volunteer',
    });
    await sendInbox(db, [app.campusAmbassadorId], {
        title: `Application ${approved ? 'approved' : 'rejected'}`,
        message: `${app.name}'s Class Ambassador application was ${approved ? 'approved' : 'rejected'}.`,
        from: 'Super Admin', kind: 'application', link: '/volunteer',
    });
    return { ok: true };
}

// ─── Tracked short links: /r/:eventId/:refId ────────────────

const BOT_UA = /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|telegram|discord|skype|embedly|linkedin/i;

function readCookie(header, name) {
    const m = (header || '').match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
    return m ? decodeURIComponent(m[1]) : null;
}

function withTracking(url, eventId) {
    const u = new URL(url);
    if (!u.searchParams.has('utm_source')) u.searchParams.set('utm_source', 'ieee-volunteer-connect');
    if (!u.searchParams.has('utm_medium')) u.searchParams.set('utm_medium', 'ambassador');
    if (!u.searchParams.has('utm_campaign')) u.searchParams.set('utm_campaign', eventId);
    return u.toString();
}

/**
 * Where an ambassador's link goes is chosen per event by the super admin:
 * this site (register here, fully tracked) or the event's main website
 * (click tracked here, then redirected).
 */
export async function shortLink(env, request, eventId, refId, auth) {
    const db = env.DB;
    const origin = new URL(request.url).origin;
    const eventKey = safeFieldKey(eventId);
    const refKey = safeFieldKey(refId);
    const event = eventKey ? (await getDocRow(db, `events/${eventKey}`))?.data : null;
    if (!event) return Response.redirect(`${origin}/events`, 302);

    const external = event.linkMode === 'external' && isValidExternalUrl(event.externalUrl);
    if (!external) {
        // The event page records the visit (and keeps the ref through sign-in).
        return Response.redirect(`${origin}/event/${eventKey}?ref=${encodeURIComponent(refKey)}`, 302);
    }

    const headers = new Headers({ Location: withTracking(event.externalUrl, eventKey), 'Cache-Control': 'no-store' });
    const ua = request.headers.get('User-Agent') || '';
    if (!BOT_UA.test(ua)) {
        let visitorId = readCookie(request.headers.get('Cookie'), '_vc_vid');
        if (!visitorId) {
            visitorId = autoId();
            headers.append('Set-Cookie', `_vc_vid=${visitorId}; Path=/; Max-Age=31536000; SameSite=Lax; Secure; HttpOnly`);
        }
        const uid = auth?.uid || null;
        try {
            await limitClicks(db, { uid, ip: request.headers.get('CF-Connecting-IP'), visitorId });
            await writeDoc(db, `linkClicks/${autoId()}`, () => ({
                eventType: 'referral_visit', source: 'ambassador_link', medium: 'redirect', page: '/r',
                element: 'external_redirect', eventId: eventKey, eventName: event.name || null, refId: refKey,
                visitorId, device: /Mobi|Android/i.test(ua) ? 'mobile' : 'desktop', userId: uid,
                timestamp: { __ts: Date.now() },
            }));
            await creditReferralVisit(db, { eventId: eventKey, refId: refKey, uid, visitorKey: uid ? `uid_${uid}` : visitorId });
        } catch (err) {
            // Never block the visitor because tracking failed or was rate-limited.
            if (!(err instanceof DocError)) console.error('short link tracking failed', err);
        }
    }
    return new Response(null, { status: 302, headers });
}
