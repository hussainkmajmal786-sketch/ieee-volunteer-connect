import { betterAuth } from 'better-auth';
import { createAuthMiddleware } from 'better-auth/api';
import { hashPassword, verifyPbkdf2, verifyWithFirebase, FIREBASE_PREFIX } from './password.js';
import { writeDoc } from './docstore.js';

const authCache = new WeakMap();

/** One Better Auth instance per env (Workers reuse isolates across requests). */
export function getAuth(env) {
    let auth = authCache.get(env);
    if (!auth) {
        auth = createAuth(env);
        authCache.set(env, auth);
    }
    return auth;
}

async function sendEmail(env, to, subject, html) {
    if (env.BREVO_API_KEY && env.BREVO_SENDER_EMAIL) {
        const res = await fetch(env.BREVO_API_URL || 'https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: { 'api-key': env.BREVO_API_KEY, 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify({
                sender: { email: env.BREVO_SENDER_EMAIL, name: env.BREVO_SENDER_NAME || 'IEEE SB CEK' },
                to: [{ email: to }], subject, htmlContent: html,
            }),
        });
        if (!res.ok) throw new Error(`Email send failed: ${res.status}`);
        return;
    }
    if (!env.RESEND_API_KEY) throw new Error('Email is not configured (BREVO_API_KEY)');
    const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: env.EMAIL_FROM || 'IEEE Volunteer Connect <onboarding@resend.dev>', to, subject, html }),
    });
    if (!res.ok) throw new Error(`Email send failed: ${res.status}`);
}

/** The app profile document every account gets on first sign-up. */
export function defaultProfile(user, extra = {}) {
    return {
        name: user.name || 'IEEE Member',
        email: user.email,
        role: 'STUDENT',
        approvalStatus: 'PENDING',
        branch: 'IEEE Branch',
        college: '',
        points: 0,
        badges: [],
        createdAt: { __ts: Date.now() },
        ...extra,
    };
}

export function createAuth(env) {
    const iterations = Number(env.PBKDF2_ITERATIONS) || undefined;
    const socialProviders = env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
        ? { google: { clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET, prompt: 'select_account' } }
        : {};

    return betterAuth({
        database: env.DB,
        secret: env.BETTER_AUTH_SECRET,
        baseURL: env.BETTER_AUTH_URL,
        basePath: '/api/auth',
        trustedOrigins: (env.TRUSTED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean),
        emailAndPassword: {
            enabled: true,
            minPasswordLength: 6,
            password: {
                hash: (password) => hashPassword(password, iterations),
                verify: async ({ hash, password }) => {
                    if (hash.startsWith(FIREBASE_PREFIX)) {
                        return verifyWithFirebase(hash.slice(FIREBASE_PREFIX.length), password, env.FIREBASE_API_KEY, env.FIREBASE_AUTH_EMULATOR_HOST);
                    }
                    return verifyPbkdf2(hash, password);
                },
            },
            sendResetPassword: async ({ user, url }) => {
                await sendEmail(env, user.email, 'Reset your IEEE Volunteer Connect password',
                    `<p>Hi ${user.name || ''},</p><p><a href="${url}">Click here to reset your password</a>. The link expires in 1 hour.</p>`);
            },
        },
        socialProviders,
        account: {
            accountLinking: { enabled: true, trustedProviders: ['google'] },
        },
        session: {
            cookieCache: { enabled: true, maxAge: 5 * 60 },
        },
        databaseHooks: {
            user: {
                create: {
                    // Every new account gets its app profile (role, points…).
                    after: async (user) => {
                        await writeDoc(env.DB, `users/${user.id}`, (before) => before ?? defaultProfile(user));
                    },
                },
            },
        },
        hooks: {
            // After a migrated user signs in with their old Firebase password,
            // replace the "firebase:" marker with a real local hash.
            after: createAuthMiddleware(async (ctx) => {
                if (ctx.path !== '/sign-in/email') return;
                const userId = ctx.context.newSession?.user?.id;
                if (!userId) return;
                const account = await ctx.context.internalAdapter.findAccountByUserId(userId)
                    .then(list => list.find(a => a.providerId === 'credential'));
                if (account?.password?.startsWith(FIREBASE_PREFIX)) {
                    const hash = await ctx.context.password.hash(ctx.body.password);
                    await ctx.context.internalAdapter.updatePassword(userId, hash);
                }
            }),
        },
    });
}
