# IEEE Volunteer Connect

A volunteer management platform for IEEE student branches — events, tasks, points, leaderboards, and admin tooling in one place.

**Hosting:** Cloudflare Workers (site + API) · D1 (database) · KV (images)

---

## Features

- **Events** — Public event listing with categories, search, real-time updates, registration with duplicate detection, countdown timers, and per-event analytics.
- **Volunteer dashboard** — Personal task list, points display, personal referral links, "My Referral Performance" (clicks → unique visitors → registrations, and who registered), auto-completion when referral targets are hit, and badge progression.
- **Admin dashboard** — Full CRUD over events, volunteers, tasks, teams, and rewards. Live analytics, link-tracking panel, Ambassador Monitor (per-ambassador funnel with registrant details + CSV), image uploads with cropping, participant analytics, and registration management.
- **Ambassador program** — Campus Ambassadors (set by the super admin) recruit Class Ambassadors through a personal application form; applications reach the campus ambassador and the super admin, who approves them. The super admin can notify campus ambassadors, class ambassadors, both, or chosen people.
- **Tracked short links** — ambassador links (`/r/<event>/<ambassador>`) are counted server-side and lead either to this site's registration or to the event's main-website page (super admin's choice per event).
- **Leaderboard** — Public rankings by points with grade tiers and badge display.
- **Auth** — Email/password, Google sign-in, password reset (Better Auth). Role-based access (`STUDENT` → `VOLUNTEER` → `ADMIN` → `SUPER_ADMIN`).
- **PWA** — Installable, offline page, service worker.
- **Notifications** — Real-time bell with unread state.

---

## Tech stack

| Layer | Tooling |
|---|---|
| Frontend | React 19 · Vite 7 · React Router 7 · Tailwind CSS 3 · framer-motion |
| Backend | Cloudflare Worker (`worker/`) with Hono |
| Database | Cloudflare D1 — a Firestore-style document store (`docs` table) |
| Auth | Better Auth on D1 (email/password + Google) |
| Images | Workers KV (or R2 if you enable it) |
| Live updates | Batched version polling (`src/lib/firestore.js`) |
| Analytics | Google Analytics 4 (optional) |

The frontend keeps Firestore-style calls (`collection`, `doc`, `onSnapshot`, `updateDoc`, …) via `src/lib/firestore.js`, which talks to `/api/db/*`. Every read and write is checked by `worker/rules.js` (a port of the old Firestore rules).

---

## Getting started (local)

```bash
npm install
npm run db:migrate:local      # create the local D1 tables
npm run build                 # the Worker serves ./build
npm run dev:api               # Worker + D1 on http://localhost:8787
npm run dev                   # (optional) Vite with hot reload on :5173, proxies /api
```

Create `.dev.vars` for local secrets:

```
BETTER_AUTH_SECRET=any-long-random-string
BETTER_AUTH_URL=http://localhost:8787
```

Make yourself an admin after signing up: `npm run make-admin -- you@example.com SUPER_ADMIN --local`

---

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` / `npm run dev:api` | Vite dev server / local Worker + D1 |
| `npm run build` | Production build → `build/` |
| `npm run deploy` | Build, apply D1 migrations, deploy the Worker |
| `npm test` | Unit tests (rules, document store, client) |
| `npm run lint` | ESLint |
| `npm run migrate:firebase` | One-time import from the old Firebase project |
| `npm run make-admin -- email [ROLE]` | Set a user's role (default SUPER_ADMIN) |

---

## Deploy to Cloudflare

```bash
npx wrangler login
npx wrangler secret put BETTER_AUTH_SECRET     # any long random string
npm run deploy
```

Optional secrets: `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` (Google sign-in; redirect URI `https://<your-site>/api/auth/callback/google`), `FIREBASE_API_KEY` (lets migrated users sign in with their old password), `RESEND_API_KEY` (password-reset emails). Set `BETTER_AUTH_URL` to your site URL under `vars` in `wrangler.jsonc` once it is known.

GitHub Actions (`.github/workflows/deploy.yml`) lints, tests and builds every PR, and deploys `main` when the `CLOUDFLARE_API_TOKEN` repo secret is set.

## Migrating from Firebase

1. Firebase console → Project settings → Service accounts → **Generate new private key**; save it as `service-account.json` in the project folder (it is git-ignored).
2. `npm run migrate:firebase` — copies Firestore (incl. sub-collections), Auth users and Storage images into D1/KV. Safe to re-run.
3. `npx wrangler secret put FIREBASE_API_KEY` — your old Firebase web API key, so email/password users can sign in with their existing password (it is re-saved on Cloudflare at first sign-in).

User IDs are preserved, so points, referrals and registrations stay linked.

---

## Project structure

```
worker/                 # Cloudflare Worker (API)
├── index.js            # routes: /api/auth, /api/db, /api/fn, /api/upload, /files
├── rules.js            # access rules (port of firestore.rules + storage.rules)
├── docstore.js         # document store on D1
├── auth.js, password.js
├── functions.js        # registerForEvent, recordLinkClick
└── files.js            # KV/R2 image storage
migrations/             # D1 schema
src/
├── lib/                # firestore.js (client), authClient.js, api.js, functions.js
├── pages/, components/, services/, context/, hooks/, utils/
scripts/                # migrate-from-firebase.mjs, make-admin.mjs
tests/                  # vitest suites
```

---

## Security model

`worker/rules.js` enforces role-based access on every request (tested in `tests/worker.rules.test.js`):

- **Events** — public read · admin write · signed-in users may only move `participants` by ±1
- **Registrations** — created only by the server endpoint · readable by admins and volunteers
- **Users** — signed-in read · self-signup only as `STUDENT` with 0 points · no self-promotion to ADMIN/SUPER_ADMIN
- **linkClicks / referralVisits** — server-written · admin read
- **inbox** — each user reads only their own messages · written by the server
- **ambassadorApplications** — campus ambassadors read their own recruits, applicants their own · approvals by the super admin only
- **Event link destination, ambassador roles, form settings** — super admin only
- **Uploads** — admins only, JPEG/PNG/WebP/GIF under 5 MB, fixed folders
- **Default** — deny

---

## License

Internal project. All rights reserved.
