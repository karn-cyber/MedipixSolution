# Medipix Invoice Platform — Feature & Architecture Design

A web-based, **mobile-first PWA** for internal employee expense/invoice management and team
visibility at Medipix. It streamlines invoice visibility for managers and provides a clear
audit trail.

---

## 1. User Roles and Permissions

The role doubles as the employee's position in the field hierarchy.

| Role | Position | Can upload | Sees invoices of | Manages team | Admin tools |
|------|----------|:---------:|------------------|:------------:|:-----------:|
| **TM** | Territory Manager | ✅ | self | — | — |
| **ABM** | Area Business Manager | ✅ | self + their TMs | ✅ (adds/removes TMs) | — |
| **ZBM** | Zonal Business Manager | ✅ | self + their ABMs | ✅ (adds/removes ABMs) | — |
| **ADMIN** | Administrator | ✅ | **everyone** | — (or all, via admin view) | ✅ |

**Hierarchy:** `TM → ABM → ZBM`. Each user has at most one direct manager (`managerId`).

**Visibility rule (single source of truth):** an invoice is visible to
1. its **uploader**,
2. the uploader's **direct manager**, and
3. any **admin**.

This is enforced in three places that must stay in sync: list queries
(`lib/visibility.ts`), the comment action, and the image-serving route.

---

## 2. User Onboarding Flow

1. **Authenticate** via Clerk (sign-up or sign-in). Clerk owns credentials/sessions.
2. On first return to the app, a **User** record is created in MongoDB, keyed by Clerk's
   `clerkId`. Emails in `ADMIN_EMAILS` are provisioned as `ADMIN` and skip step 3.
3. **Role assignment** (`/onboarding`): the user supplies their **name** and selects a
   **role** (TM / ABM / ZBM). `onboarded` is set to `true`.
4. Redirect to the **dashboard**. Until onboarded, the authenticated shell always redirects
   back to onboarding.
5. **Joining a team:** when a manager adds someone by email, that person's `managerId` (and
   role, aligned to the team) is set and they receive a **notification**.

---

## 3. Core Feature Modules

### 3.1 Authentication Module
- **Clerk** for direct login (hosted sign-in/sign-up components at `/sign-in`, `/sign-up`).
- A Next.js **proxy/middleware** (`src/proxy.ts`) protects every route except the public
  landing, auth, and health routes. It **gracefully no-ops** when Clerk isn't configured so
  the app shows a setup screen instead of crashing.
- `getCurrentUser()` maps the Clerk session to the Mongo `User`, creating it on first sight.

### 3.2 Invoice Management Module
- **Upload** (`/invoices/new`): camera capture (`<input capture>`), client-side image
  **compression** (canvas downscale to ~1600px JPEG) to keep mobile uploads light, plus
  fields for **title**, **individual count**, **total count**, and an optional **comment
  added before upload**.
- **Storage:** the image is written to access-controlled server storage
  (`/data/uploads`, swappable for S3/GCS/Blob); the invoice document keeps the path + mime.
- **View** (`/invoices`, `/invoices/[id]`): list filtered by the visibility rule; detail
  shows the full image, both counts, uploader, timestamp, and the comment thread.
- **Comments:** added before upload (carried into the first comment) and afterwards on the
  detail page; commenting notifies the uploader.
- **Image route** (`/api/invoices/[id]/image`): re-checks visibility on every request and
  streams the bytes with `Cache-Control: private` — images are never publicly addressable.

### 3.3 Team Management Module
- **Hierarchy-aware recruiting:** a ZBM can add ABMs; an ABM can add TMs (`recruitableRole`).
- **Add member** by email (must have signed in once); sets `managerId` + role, notifies them.
- **Remove member** clears `managerId` and notifies them.
- Managers see only their **direct reports** at `/team`.

### 3.4 Reporting / Visibility Module
- **Manager view:** dashboard + invoice list aggregate self + direct reports, with summed
  **individual** and **total** counts and team size.
- **Admin view** (`/admin`): platform-wide invoice/user counts, per-role breakdown, latest
  invoices, and a user directory.

### 3.5 PWA Module
- `manifest.json` (standalone display, icons, shortcuts), a **service worker** (network-first
  navigation, cache-first assets, offline fallback), iOS/Android install affordances, and an
  **Install** button driven by `beforeinstallprompt` with an iOS "Add to Home Screen" hint.

---

## 4. Data Model

```
User            { _id, clerkId⊥, email, name, role(TM|ABM|ZBM|ADMIN),
                  onboarded, managerId → User, timestamps }
Invoice         { _id, uploaderId → User, uploaderName, imagePath, imageMime,
                  title, individualCount, totalCount, comments[], timestamps }
Comment (embedded in Invoice)
                { _id, authorId → User, authorName, body, createdAt }
Notification    { _id, userId → User, message, link, read, createdAt }
```

**Relationships**
- `User.managerId` is a self-referential one-to-many (a manager has many reports).
- `Invoice.uploaderId` → `User` (one user, many invoices).
- `Comment` is **embedded** in `Invoice` (always read/written with its invoice; no
  standalone queries needed) — denormalized `authorName`/`uploaderName` keep list rendering
  cheap.
- `Notification` is a separate collection, indexed by `(userId, read)` for fast unread badges.

**Data integrity**
- Counts are non-negative integers (`min: 0`), defaulted to 1.
- Visibility is computed from the hierarchy, never stored per-invoice, so it can't drift.
- Adding a member aligns their role to the team they join, keeping the hierarchy consistent.

---

## 5. Key User Journeys

**A. Employee uploads an invoice**
Sign in → (first time) set name + role → Upload → snap photo → enter counts + optional
comment → submit → image stored, invoice created, **manager notified** → redirected to the
invoice detail.

**B. Manager manages a team & reviews invoices**
Sign in → Team → add a member by email (they're notified and now report to the manager) →
Dashboard/Invoices now include that member's submissions with rolled-up counts → open an
invoice → add a comment (uploader notified).

**C. Admin oversight**
Sign in as an admin (provisioned via `ADMIN_EMAILS`) → Admin → see platform-wide counts,
per-role breakdown, every invoice, and the full user directory.

---

## 6. Tech Stack & Rationale
- **Next.js 16 App Router** — server components + server actions keep auth and DB logic on
  the server; one codebase for UI + API.
- **Clerk** — required; offloads credential/session security.
- **MongoDB + Mongoose** — flexible document model fits embedded comments and evolving fields.
- **Tailwind CSS 4** — fast mobile-first styling.
- **Service worker + manifest** — installable, offline-aware PWA without an app store.
