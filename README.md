# Devi Youth — Sree Bala Ganesh

Phase 1 (App Foundation + Public UI) of the four-phase build. React + Vite,
mobile-first, bilingual (English / Telugu), running entirely on sample data
so every page already looks and feels real.

## What's in Phase 1

- Vite + React + React Router app shell, mobile-first (max-width 520px, works down to 360px)
- Festive design system (`src/styles/tokens.css`, `src/styles/app.css`) — kumkum/marigold palette, Baloo 2 + Poppins + Noto Sans Telugu type, a toranam-garland divider as the signature motif
- Splash screen → bottom-nav app shell
- Pages: Home, Announcements, Events, Laddu Velam, Lottery, Committee, Gallery (year filter + lightbox), History (timeline), Contacts, and a "More" menu for the pages that don't fit the 5-tab bottom nav
- EN | తెలుగు language toggle (`src/i18n`), persisted to localStorage
- WhatsApp share button that opens a pre-formatted message
- Sample data (`src/data/sampleData.js`) shaped exactly like the Phase 2 Supabase tables (announcements, events, committee_members, laddu_auctions, lottery, lottery_prizes, lottery_winners, photo_albums, photos, contacts) — swapping it for live Supabase queries later is a drop-in
- `src/lib/supabaseClient.js` wired up and ready (reads `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`), inert until Phase 2
- Lottery and Laddu Velam pages are read-only by design — no bidding, no ticket purchase, no payment. They just display details entered manually by the committee after the offline event, per the project rules.
- No placeholder buttons that look functional but do nothing — anything not yet wired (photo upload, admin login, etc.) simply isn't shown yet.

## Run it

```bash
npm install
npm run dev
```

Open the printed local URL and resize your browser to a phone width (or open dev tools device mode) — this is a mobile-first layout.

## Project structure

```
src/
  components/   Header, BottomNav, Toranam, Splash, WhatsAppShare, PhotoTile
  data/         sampleData.js — stand-in for Supabase until Phase 2
  i18n/         LanguageContext + en.js / te.js dictionaries
  lib/          supabaseClient.js
  pages/        Home, Announcements, Events, Laddu, Lottery, Committee,
                Gallery, History, Contacts, More
  styles/       tokens.css (design tokens), app.css (components/layout)
```

## Next phases (not built yet, by design)

- **Phase 2 — done.** See "Phase 2: connect Supabase" below.
- **Phase 3** — Supabase Auth, admin + committee roles, the protected admin dashboard, donation/expense management with RLS locking villagers out of private financial data.
- **Phase 4** — toast messages, confirmation dialogs, image optimization, full Telugu QA, production deploy to Vercel (+ Render only if a backend service turns out to be genuinely necessary).

## Phase 2: connect Supabase

Phase 1 ran entirely on `src/data/sampleData.js`. Phase 2 adds a real Supabase
project behind it — the app now queries Supabase when it's configured, and
silently falls back to sample data when it isn't, so it's safe to develop
against either.

### 1. Create the project and run the SQL

In the Supabase SQL editor, run the files in `supabase/` **in order**:

1. `01_schema.sql` — every table from section 15 of the brief, plus two
   helper functions (`is_admin()`, `is_committee_or_admin()`) that later
   RLS policies use, and a trigger that auto-creates a `profiles` row
   (default role `villager`) for every new auth user.
2. `02_policies.sql` — Row Level Security. Festival content (announcements,
   events, committee, laddu, lottery, gallery, contacts) is public to
   *read*, but only committee/admin can write and only admin can delete.
   `donations` and `expenses` are locked to committee/admin in **both**
   directions — villagers get no access at all, matching the brief's
   privacy rule.
3. `03_storage.sql` — a single public `gallery` bucket for every image
   (committee photos, gallery photos, lottery prize images, laddu images).
   Public read, committee/admin upload, admin delete.
4. `04_seed.sql` *(optional)* — sample rows mirroring `sampleData.js`, so
   you can see the live-Supabase path working before real committee data
   exists.

### 2. Point the app at it

```bash
cp .env.example .env
# then fill in:
# VITE_SUPABASE_URL=https://xxxx.supabase.co
# VITE_SUPABASE_ANON_KEY=xxxx
```

Restart `npm run dev`. As soon as those two variables are set, every page
switches from sample data to live Supabase queries automatically — no code
change needed. Leave `.env` empty/absent and the app keeps working on
sample data, which is what Phase 1 relied on.

### 3. How the data layer works

`src/services/api.js` is the only place that talks to Supabase. Each
function (`getAnnouncements()`, `getEvents()`, `getLaddu()`, …) returns
data shaped exactly like `sampleData.js` — bilingual fields as
`{ en, te }` — so page components never need to know or care whether
they're looking at a live row or a sample one. If a Supabase query errors
or returns nothing, the function fails soft back to sample data instead of
breaking the page.

Photos are referenced by `storage_path` in the database and resolved to a
public URL via `publicImageUrl()` (`src/services/api.js`), which calls
Supabase Storage's `getPublicUrl`.

Pages fetch through a small `useAsyncData` hook (`src/hooks/useAsyncData.js`)
and show a loading skeleton or an inline error state (`src/components/LoadingStates.jsx`)
around the content — the first piece of Phase 4's polish pulled forward
because it's needed as soon as data can actually fail to load.

### What Phase 2 intentionally leaves out

No auth, no admin screens, no way to *write* data from the app yet — that's
Phase 3. Right now the only way to add or edit rows is directly in the
Supabase table editor or via SQL, which is fine for standing up a first
real festival year before the admin UI exists.

## Phase 3 — Admin + Private Data

Phase 3 adds Supabase Authentication, a protected admin area, and full
CRUD for everything a committee needs to run day-to-day — including the
private donation and expense records that villagers must never see.

### Signing in

There's no public sign-up screen — accounts are created by an existing
admin, straight in Supabase:

1. Supabase dashboard → **Authentication → Users → Add user** (email +
   password). The `handle_new_user` trigger from `01_schema.sql`
   automatically creates a matching `profiles` row with `role = 'villager'`.
2. Promote that user: `Table editor → profiles → role → committee` or
   `admin` (or use the **Settings → Users & Roles** screen once you have
   at least one admin).
3. Open the app → **More → Committee Login** (or `#/admin/login`) and sign
   in with that email/password.

The very first admin has to be promoted by hand in the table editor,
since there's no admin yet to do it from the UI.

### What's in the admin area

- **`src/auth/AuthContext.jsx`** — wraps the Supabase session + the
  matching `profiles` row (which carries `role`) in a `useAuth()` hook.
- **`src/auth/ProtectedRoute.jsx`** — gates a route behind sign-in and,
  optionally, `requireAdmin` for admin-only screens (Committee members,
  Contacts, deleting things, festival-year management, user roles).
- **`src/components/admin/AdminLayout.jsx`** — a second app shell (its own
  header + bottom nav: Dashboard / Content / Money / Gallery / Settings)
  that reuses the same design tokens and `.card`/`.btn` classes as the
  public app, so it doesn't feel like a bolted-on backend panel.
- **`src/services/adminApi.js`** — the write-side data layer. Unlike
  `services/api.js`, it never falls back to sample data: the admin area
  requires a live Supabase connection, and Row Level Security
  (`02_policies.sql`) is the actual enforcement — the client just calls
  Supabase directly and surfaces whatever RLS allows or blocks.
- **`src/hooks/useActiveFestival.js`** — every management screen edits one
  festival year at a time (defaults to whichever is marked active; a
  committee member can switch years from **Settings** to backfill an old
  lottery result, for example).

### Pages

| Route | What it does |
|---|---|
| `/admin` | Dashboard — totals, balance, donor count, upcoming events, quick actions |
| `/admin/content` | Hub linking to every content type below |
| `/admin/content/announcements` | Add/edit/delete, optional photo, important flag |
| `/admin/content/events` | Add/edit/delete, date/time/location |
| `/admin/content/committee` | Admin-only. Members, photos, phone, sort order |
| `/admin/content/laddu` | This year's Laddu Velam (single form; starting/final price, winner) |
| `/admin/content/lottery` | Draw details + prizes + winners (three sub-forms) |
| `/admin/content/contacts` | Admin-only. Village-wide contact list |
| `/admin/content/donations` | **Private.** Add, search by donor, per-donor history across years, delete |
| `/admin/content/expenses` | **Private.** Add by category, running total, delete |
| `/admin/gallery` | Create albums, bulk photo upload, delete photos/albums |
| `/admin/settings` | Festival years (create/activate/delete), Users & Roles (admin-only), log out |

Every list/add/edit screen uses the shared `ConfirmDialog` before deleting
anything, and every save/delete reports through the shared `Toast` helper
(`src/components/admin/Toast.jsx`) — both new, reusable across all of
Phase 4's remaining polish too.

### Privacy, enforced twice

Donations and expenses are hidden from villagers in two independent
places: the public pages/`api.js` never query those tables at all, *and*
`02_policies.sql` denies villagers read access at the database level. A
bug in the UI can't leak them — RLS is the real backstop.

## Phase 4 — Final Polish + Deployment

Phase 4 doesn't add new features — it hardens what Phases 1–3 built and
gets it ready to hand to a real village committee.

### What changed

- **Performance / code-splitting.** The admin area (`src/pages/admin/*`,
  `AdminLayout`) is now loaded with `React.lazy` + `Suspense` instead of
  being bundled with the public app. Villagers browsing Home/Announcements/
  Gallery/etc. — the overwhelming majority of visits — now download a
  smaller main bundle (~278 KB vs. ~339 KB before); the admin code only
  loads the first time someone opens `/admin`.
- **Image loading.** Every image across the app (public `PhotoTile` and
  every admin thumbnail/preview) uses `loading="lazy" decoding="async"`,
  so off-screen photos in Gallery, Committee, and the admin lists don't
  block the initial page render.
- **404 handling.** A `NotFound` page catches any unmatched public route
  (`<Route path="*">`), and the admin router has its own graceful
  "that admin page doesn't exist" fallback instead of a blank screen.
- **Form validation.** Donation/expense amounts must be a positive number
  (rejected client-side with a toast before the request is even sent, in
  addition to the `min="1"` on the input); a new festival year's start
  date is checked against its end date before saving.
- **Loading / empty / error states** — already present since Phase 2/3
  (`PageSkeleton`, `PageError`, and each list's own "no X yet" empty
  state) — were audited page-by-page and are consistent across every
  admin screen added in Phase 3.
- **Confirmation dialogs & toasts** — already shared components since
  Phase 3 (`ConfirmDialog`, `Toast`) — were checked against every delete
  action (announcements, events, committee, contacts, donations,
  expenses, lottery prizes/winners, gallery albums/photos, festival
  years) to make sure none can fire without a confirm step.
- **Telugu translations** — `src/i18n/en.js` and `src/i18n/te.js` were
  diffed key-by-key; both have exactly the same 42 keys, so nothing on
  the public side silently falls back to English. (The admin area is
  intentionally English-only — it's a backend tool for the committee, not
  villager-facing content, matching the brief's public-page language
  requirement.)
- **Responsive desktop support.** The `.app-shell` stays centered at a
  520px max-width on wider screens rather than stretching full-bleed, so
  the app still reads as a phone-shaped app if a committee member opens
  it on a laptop.

### Security checklist (verify before go-live)

Run through this once against your real Supabase project, not just the
seed data:

1. **RLS is actually enabled.** In the Supabase dashboard →
   Authentication → Policies, confirm every table listed in
   `02_policies.sql` shows RLS **on**. `alter table ... enable row level
   security` only takes effect once, at the time you ran the script — if
   a table was recreated afterward, re-run that section.
2. **Villager can't read donations/expenses.** Sign in as a plain
   `villager`-role account (or use an incognito window with no session)
   and try `supabase.from('donations').select('*')` in the browser
   console — it must return an empty array or a permissions error, never
   rows.
3. **Only admins can promote roles.** As a `committee` account, confirm
   `/admin/settings` doesn't show the Users & Roles section, and that a
   direct `profiles` update to change someone's role is rejected by RLS
   (`profiles: admin manages all` policy).
4. **Storage bucket policy matches intent.** `gallery` is public-read by
   design (festival photos are meant to be seen by everyone) but
   committee/admin-only to upload and admin-only to delete — try
   uploading as a signed-out session and confirm it's rejected.
5. **`.env` is never committed.** Confirmed via `.gitignore` (`*.local`
   and the standard Vite ignores) — double check `.env` itself isn't
   already tracked if this repo existed before the ignore rule was added.

### Navigation checklist

- Every admin sub-page (`ManageAnnouncements`, `ManageEvents`, …) uses
  `showBack` on its header and returns to the Content hub, not the
  Dashboard, matching how the person got there.
- Deep-linking straight to `/#/admin/content/donations` while signed out
  redirects to `/#/admin/login` and returns to the donations page after a
  successful sign-in (`ProtectedRoute` passes `location.state.from`).
- The public bottom nav and the admin bottom nav never appear at the same
  time — `Root` in `App.jsx` switches the whole shell based on whether
  the path starts with `/admin`, so there's no risk of overlapping nav
  bars during a route transition.

### Production build

```bash
npm install
npm run build      # outputs to dist/
npm run preview    # sanity-check the production build locally
```

`npm run build` must complete with no errors before deploying — this is
checked after every phase, and Phase 4 keeps it clean (`✓ built in ~1.2s`
as of this phase, ~278 KB main bundle + on-demand admin chunks, all
gzipped under 100 KB).

### Deploying to Vercel

1. Push this repo to GitHub.
2. In Vercel: **New Project → Import** the repo. Framework preset
   "Vite" is auto-detected; build command `npm run build`, output
   directory `dist` (Vercel fills these in automatically).
3. Add the two environment variables from `.env.example` under
   **Settings → Environment Variables**:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy. No `vercel.json` or rewrite rules are needed — the app uses
   `HashRouter` (URLs like `/#/gallery`), so every route resolves to the
   same static `index.html` without server-side routing configuration.

### Supabase production setup

1. Create a fresh Supabase project for production (don't reuse a dev/test
   project that has throwaway data).
2. Run, in order, in the SQL editor: `supabase/01_schema.sql` →
   `02_policies.sql` → `03_storage.sql`. Skip `04_seed.sql` in production
   — it's sample data for local development only.
3. Create your first festival year for real, either via SQL or once
   you're signed in as an admin, via **Settings → New Festival Year** →
   **Make Active**.
4. Create the first admin account: Authentication → Users → Add user,
   then in the table editor set that user's `profiles.role` to `admin`.
   Every admin/committee account after that can be promoted from
   **Settings → Users & Roles** instead of the table editor.
5. Copy the project's URL and anon key (Project Settings → API) into
   Vercel's environment variables (see above) and redeploy.

### README / setup instructions

This file *is* the setup instructions — Phase 1 through Phase 4 sections
above cover, in order: running locally on sample data, connecting a real
Supabase project, using the admin area, and deploying to production. No
separate setup doc was created, per the brief's instruction not to
over-engineer the project.

## Phase 4 addendum — installability

Added after the initial Phase 4 pass: a `manifest.webmanifest` plus
generated `icon-180.png` / `icon-192.png` / `icon-512.png` (derived from
`favicon.svg`), linked from `index.html`. This is what lets a villager
tap "Add to Home Screen" in their mobile browser and get a real app
icon and splash instead of a browser tab — closing out the "App icon"
requirement from the brief's UI section. No other behavior changes.

## Laptop / desktop view

The app is mobile-first, but from 900px viewport width up it reflows
into a real laptop layout — no separate desktop build, same code:

- The bottom tab bar becomes a sticky left sidebar.
- The single mobile column widens into a proper content area
  (max 1180px, centered) with a soft background behind the card so a
  laptop window doesn't look like a phone floating on blank white.
- Committee, prize, and gallery grids pick up extra columns
  automatically as the window gets wider.
- This applies to both the public site and the admin area — same
  `.app-shell` / `.bottom-nav` markup drives both.

Resize the browser window (or open dev tools' responsive mode) past
900px to see it switch — nothing to configure.

## Notes on the offline rules

Per the brief, the Lottery and Laddu Velam are conducted entirely offline —
this app never builds ticket purchase, bidding, or payment flows for them.
Donation and expense data is private by design and lives behind Supabase
RLS (Phase 3), with only an admin-approved total (e.g. "Total Festival
Donations: ₹8,50,000") ever shown to villagers, as reflected on the Home
page.

## Phase 5 — Bilingual content (EN ↔ TE)

Two separate layers of localization, both already wired in:

**Static UI text** (nav labels, buttons, empty states, etc.) uses the
existing `src/i18n/` system — `en.js` / `te.js` dictionaries plus
`LanguageContext`, which persists the chosen language to `localStorage`
(`gc_lang`) and applies it app-wide via `useLanguage()`.

**Admin-entered content** (festival name/village, announcements, events,
committee positions, contacts, laddu/lottery details, gallery album
names) now uses a single-input workflow instead of separate
English/Telugu fields:

- `src/lib/language.js` — `detectLanguage(text)` detects Telugu vs.
  English by Unicode script, instantly, with no API call.
- `src/components/admin/BilingualField.jsx` — a drop-in single `<input>`
  that detects the script as the admin types and stores it in the
  correct `{field}_en` / `{field}_te` / `{field}_source_lang` columns,
  leaving the other language blank.
- `src/services/translate.js` — `translateText()` calls MyMemory's free
  translation API (no key required) with an 8s timeout, in-flight
  request de-duplication, and a shared cache table
  (`translation_cache`, see `supabase/06_i18n.sql`) so the same sentence
  is never translated twice.
- `src/services/localize.js` — `resolveBilingual()` fills in whichever
  side is blank (cached translation → live translation → original text
  as a last-resort fallback; it never returns blank/undefined). This is
  wired into `src/services/api.js` for every public-facing read.

`supabase/06_i18n.sql` is additive only — it doesn't touch or drop any
existing column, so already-populated bilingual rows keep working
exactly as before; only new/edited content goes through the
detect-and-translate path. Run it after `05_gallery_update.sql`.

**Applied so far:** Settings (festival name/village), Announcements,
Events, Committee, Contacts, Gallery albums, Laddu Velam, Lottery
(draw location + prize names). Donations/Expenses were left as-is —
they're private admin-only financial records, not public bilingual
content.

**Extending the pattern to a new field:** add a nullable
`{field}_source_lang` column (see `06_i18n.sql` for the pattern), swap
the admin form's two `Field`/`Input` pairs for one
`<BilingualField label="..." baseName="..." form={form} setForm={setForm} />`,
and wrap the read in `src/services/api.js` with
`await bilingual(row.x_en, row.x_te, row.x_source_lang)`.

