# IEEE Volunteer Connect

A volunteer management platform for IEEE student branches — events, tasks, points, leaderboards, and admin tooling in one place.

**Live:** [ieee-vc-cek-main.web.app](https://ieee-vc-cek-main.web.app)

---

## Features

- **Events** — Public event listing with categories, search, real-time updates, registration with duplicate detection, countdown timers, and per-event analytics.
- **Volunteer dashboard** — Personal task list, points display, referral link generation with click tracking, auto-completion when referral targets are hit, and badge progression.
- **Admin dashboard** — Full CRUD over events, volunteers, tasks, teams, and rewards. Live analytics, link-tracking panel, image uploads with cropping (Firebase Storage), participant analytics, and registration management.
- **Leaderboard** — Public rankings by points with grade tiers and badge display.
- **Auth** — Email/password, Google OAuth, password reset. Role-based access (`STUDENT` → `VOLUNTEER` → `ADMIN` → `SUPER_ADMIN`).
- **PWA** — Installable, offline page, service worker.
- **Notifications** — Real-time bell with unread state.

---

## Tech stack

| Layer | Tooling |
|---|---|
| Frontend | React 19 · Vite 7 · React Router 7 |
| Styling | Tailwind CSS 3 · custom design system (glassmorphism, IEEE blue) |
| Motion | framer-motion 12 |
| Backend | Firebase Firestore · Firebase Auth |
| File uploads | Firebase Storage |
| Forms / validation | zod |
| Hosting | Firebase Hosting |
| Analytics | Google Analytics 4 |

---

## Getting started

```bash
# 1. Install
npm install

# 2. Configure environment
cp .env.example .env.local
# Fill in your Firebase keys

# 3. Run dev server
npm run dev
```

App runs at `http://localhost:5173`.

---

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | Production build → `build/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | ESLint over the project |
| `npm run test:rules` | Run Firestore rules unit tests (requires Java + Firebase emulator) |

---

## Environment variables

Required in `.env.local`:

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_CLOUDINARY_CLOUD_NAME=
VITE_CLOUDINARY_UPLOAD_PRESET=
```

See `.env.example` for the template.

---

## Project structure

```
src/
├── App.jsx                 # Router + lazy routes
├── main.jsx                # React entrypoint
├── pages/                  # 8 top-level pages
│   ├── LandingPage.jsx     # Hero3D, live events, animated counters
│   ├── AuthPage.jsx        # Login / register / reset
│   ├── EventsPage.jsx
│   ├── EventDetailPage.jsx
│   ├── VolunteerDashboard.jsx
│   ├── AdminDashboard.jsx  # CRUD + analytics
│   ├── LeaderboardPage.jsx
│   └── NotFoundPage.jsx
├── components/             # Shared UI
│   ├── admin/              # Admin widgets + modals
│   └── Hero3D, Navbar, Footer, Toast, ...
├── context/                # AuthContext, ToastContext
├── services/               # eventService, authService, adminService, trackingService
├── hooks/                  # useAuth, useTheme, useToast, useTracking
├── shared/                 # MetaTags, OptimizedImage, Skeleton
├── utils/                  # constants, validation, analytics, firebaseUpload, ...
└── firebase/config.js      # Firebase SDK initialization
```

---

## Security model

Firestore rules (`firestore.rules`) enforce role-based access:

- **Events** — public read · admin write
- **Users** — authenticated read · self-signup constrained to `role: STUDENT`, `points: 0`, `approvalStatus: PENDING` (no privilege escalation) · self-update cannot grant ADMIN/SUPER_ADMIN
- **Tasks / Teams / Rewards / Claims** — admin write · authenticated read
- **linkClicks** — public create (anonymous tracking) · admin read · immutable
- **Default** — deny

Rules are covered by unit tests in `tests/firestore.rules.test.js`.

---

## Deployment

Firebase handles hosting, database (Firestore), auth, and security rules.

```bash
npm run build
firebase deploy --only hosting,firestore
```

GitHub Actions workflow (`.github/workflows/deploy.yml`) auto-deploys to Firebase Hosting on push to `main`.

---

## License

Internal project. All rights reserved.
