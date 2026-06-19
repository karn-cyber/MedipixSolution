# Medipix — Invoice & Team Visibility (PWA)

An installable mobile-first **Progressive Web App** for Medipix field staff to upload
invoices/bills and give managers and admins visibility, with a clear audit trail.

Built with **Next.js 16 (App Router)** · **Clerk** (auth) · **MongoDB + Mongoose** ·
**Tailwind CSS 4** · service-worker PWA.

## Features
- 📲 **Installable** on Android (Chrome/Edge) and iPhone (Safari → Add to Home Screen).
- 🔐 **Clerk authentication** with a first-login onboarding step (name + role).
- 🧾 **Invoice upload** from the phone camera, with individual & total counts and comments.
- 👀 **Role-based visibility**: an invoice is seen by its uploader, the uploader's direct
  manager, and admins.
- 👥 **Team management**: ABMs manage TMs, ZBMs manage ABMs; members are notified when added/removed.
- 🛡️ **Admin** view across all invoices and users.
- 🔔 In-app **notifications**.

## Roles & hierarchy
`TM → ABM → ZBM`, plus `ADMIN`.
- **TM** (Territory Manager): uploads invoices. Reports to an ABM.
- **ABM** (Area Business Manager): manages a team of TMs. Reports to a ZBM.
- **ZBM** (Zonal Business Manager): manages a team of ABMs.
- **ADMIN**: full visibility. Provisioned via `ADMIN_EMAILS` (see below).

## Setup
1. Install deps: `npm install`
2. Copy `.env.example` → `.env` and fill in:
   - `MONGODB_URI` — your MongoDB Atlas connection string.
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` — from
     [dashboard.clerk.com](https://dashboard.clerk.com) → API Keys.
   - `ADMIN_EMAILS` — comma-separated emails to auto-provision as ADMIN on first login.
3. Regenerate icons if you change the logo: `node scripts/gen-icons.mjs`
4. Run: `npm run dev` → open http://localhost:3000

> Until Clerk keys are present, the app runs in **setup mode** (landing page only) instead
> of crashing.

## Installing on a phone
Serve over **HTTPS** (PWA installs require it — `localhost` is exempt for testing). Deploy to
Vercel or run behind an HTTPS tunnel, open the URL on the phone, and tap **Download Medipix**
(Android) or **Share → Add to Home Screen** (iPhone).

> Note: invoice images are stored on the server's local disk (`/data/uploads`). For a
> serverless deploy (e.g. Vercel) switch `src/lib/storage.ts` to object storage (S3/GCS/Blob).

## Project layout
```
src/
  app/
    (app)/            authenticated shell + pages (dashboard, invoices, team, admin, notifications)
    api/              health + access-controlled invoice image route
    actions.ts        server actions (onboarding, upload, comments, team, notifications)
    onboarding/       first-login name + role
    sign-in, sign-up  Clerk pages
    page.tsx          public landing / install screen
  components/         InstallButton, UploadForm, CommentForm, TeamManager, BottomNav
  lib/                db, models, auth, roles, visibility, storage
public/               manifest.json, sw.js, icons/
```

See [DESIGN.md](DESIGN.md) for the full architecture and data-model write-up.
