# Devi Youth — UI v2, Stage 1

Drop-in files. Nothing in your existing folder is modified — copy these
over the matching paths when you're ready.

## Files in this stage

| Copy this | To this path |
|---|---|
| `src/main.jsx` | `project/src/main.jsx` *(replaces — wires both stylesheets in, no manual edit needed)* |
| `src/App.jsx` | `project/src/App.jsx` *(replaces — wires the `/rsvp` and `/admin/content/rsvps` routes in, no manual edit needed)* |
| `src/styles/upgrade.css` | `project/src/styles/upgrade.css` *(new)* |
| `src/components/Header.jsx` | `project/src/components/Header.jsx` *(replaces)* |
| `src/components/BottomNav.jsx` | `project/src/components/BottomNav.jsx` *(replaces)* |
| `src/components/Splash.jsx` | `project/src/components/Splash.jsx` *(replaces)* |
| `src/components/SearchSheet.jsx` | `project/src/components/SearchSheet.jsx` *(new)* |
| `src/components/NotificationSheet.jsx` | `project/src/components/NotificationSheet.jsx` *(new)* |
| `src/hooks/useFavorites.js` | `project/src/hooks/useFavorites.js` *(new)* |
| `src/pages/Home.jsx` | `project/src/pages/Home.jsx` *(replaces)* |

## One line you must add

Already done for you in this version — `main.jsx` is included above with
both stylesheets wired in. Nothing to add by hand.

## What changed

**Header** — search and a notification bell sit beside the QR and
language buttons. Both open bottom sheets; the bell carries an unread
badge.

**Search** (`SearchSheet.jsx`) — one fetch on open, then local filtering
across announcements, events, committee, contacts, laddu and lottery
prizes. Matches on both English and Telugu text regardless of the
current language, with scope pills and highlighted matches.

**Notifications** (`NotificationSheet.jsx`) — a feed assembled from the
newest announcements and events, newest first. Read state persists to
`localStorage` under `gc_read_notifications`. The header badge and the
News nav dot read the same shared store, so opening the sheet clears
both. Exports `useUnreadCount()`.

**BottomNav** — frosted glass bar; the active icon sits in a lifted
capsule and pops on select; the marigold rail measures the active tab and
slides to it, so it stays centred when Telugu labels change width.

**Splash** — emblem blooms in, three toranam rings ripple outward, and a
marigold bar tracks the existing 1100 ms boot window in `App.jsx`.

**Home** — same sections you had, plus:
- Hero countdown now ticks in days / hours / minutes, and switches to a
  pulsing "live" state once the festival starts. A share button posts a
  pre-formatted WhatsApp message.
- **Quick access** grid — only renders tiles for content that exists.
- **Donation progress** — counts up from zero and fills a bar toward
  `festival.donationGoal` if your row has one; otherwise it targets the
  next ₹1 lakh milestone above the current total. Nothing renders if the
  public total is empty.
- **Today's schedule** — today's events on a live rail with done / now /
  next states, re-evaluated every minute. Falls back to the next event
  day when there's nothing today. Parses both `6:30 AM` and `18:30`.
- **Album story rail** — from `getGalleryAlbums()`.
- **Latest photos** — each tile has a heart; saved ids persist via
  `useFavorites()` (`gc_favorites`) and are shared app-wide.
- Sections reveal on scroll instead of all animating at load.

## Notes

- No new i18n keys are needed — the new strings are held bilingually
  inside each new component, so `en.js` / `te.js` stay untouched.
- `getGalleryAlbums()` is called with no year on Home and wrapped in a
  `.catch(() => [])`; if your signature requires a year, pass
  `festival.year` there.
- `donationGoal` is optional. Add it to the festival row (or
  `donation_goal`) to control the progress target explicitly.

## Still to come

Laddu, Lottery, Admin Dashboard and Login. `upgrade.css` already carries
the classes those screens will use.

---

# Stage 2 — added on top of Stage 1

Same drop-in rule: nothing in your folder is touched until you copy
these over. Requires Stage 1's `upgrade.css` import already in place.

| Copy this | To this path |
|---|---|
| `src/components/Reveal.jsx` | `project/src/components/Reveal.jsx` *(new)* |
| `src/components/SavedPhotosSheet.jsx` | `project/src/components/SavedPhotosSheet.jsx` *(new)* |
| `src/pages/Home.jsx` | `project/src/pages/Home.jsx` *(replaces — now imports shared Reveal)* |
| `src/pages/Announcements.jsx` | `project/src/pages/Announcements.jsx` *(replaces)* |
| `src/pages/Events.jsx` | `project/src/pages/Events.jsx` *(replaces)* |
| `src/pages/Gallery.jsx` | `project/src/pages/Gallery.jsx` *(replaces)* |
| `src/pages/Committee.jsx` | `project/src/pages/Committee.jsx` *(replaces)* |
| `src/pages/Contacts.jsx` | `project/src/pages/Contacts.jsx` *(replaces)* |
| `src/pages/More.jsx` | `project/src/pages/More.jsx` *(replaces)* |

No new imports needed beyond Stage 1's `upgrade.css` line — every class
these use (`reveal`, `search-scopes`/`scope-pill`, `fav-btn`/`photo-wrap`,
`video-tile`, `live-dot`, `offline-strip`, `sheet`/`sheet-backdrop`) already
shipped in Stage 1's `upgrade.css`.

## What changed

**Reveal** — extracted the fade/rise-on-scroll wrapper Home used into its
own component so every page shares it instead of re-declaring it.

**Announcements** — filter pills (All / Important) when there's at least
one important post; cards stagger in on scroll.

**Events** — Upcoming / Past / All filter pills (Upcoming is the default
view); a live pulsing "Today" chip on same-day events, a leaf chip for
"Tomorrow" / "in Nd" on the rest.

**Gallery** — album view photos now carry a heart to save/unsave (shared
with Home's favorites store); any photo whose row has `type: 'video'` or
a `videoUrl` renders as a video tile with a play badge and duration
instead of a plain image — no code change needed elsewhere, it reads
whatever's already in the photo row.

**Committee** — a quick filter-by-name/position search appears once
there are more than 6 members; grid tiles stagger in.

**Contacts** — same quick filter (name / role / phone) once there are
more than 6 contacts; rows stagger in.

**More** — a new **Saved Photos** entry (with a count badge) opens a
sheet aggregating every hearted photo across every album/year
(`SavedPhotosSheet.jsx`) with the same lightbox as everywhere else. An
offline strip appears at the top of the page when the device has no
connection. No route changes — the sheet opens from local state, so
`App.jsx` doesn't need touching.

## Still to come

Laddu, Lottery, Admin Dashboard, Login.

---

# Stage 3 — Laddu, Lottery, Admin, Login

Requires Stage 1's `upgrade.css` import already in place.

| Copy this | To this path |
|---|---|
| `src/hooks/useCountUp.js` | `project/src/hooks/useCountUp.js` *(new)* |
| `src/pages/Laddu.jsx` | `project/src/pages/Laddu.jsx` *(replaces)* |
| `src/pages/Lottery.jsx` | `project/src/pages/Lottery.jsx` *(replaces)* |
| `src/pages/admin/AdminDashboard.jsx` | `project/src/pages/admin/AdminDashboard.jsx` *(replaces)* |
| `src/components/admin/AdminLayout.jsx` | `project/src/components/admin/AdminLayout.jsx` *(replaces)* |
| `src/pages/admin/Login.jsx` | `project/src/pages/admin/Login.jsx` *(replaces)* |

No routing, auth, or Supabase logic changed anywhere in this stage —
only presentation.

## What changed

**Laddu** — a settled/pending status chip on the feature card, a
"Share on WhatsApp" button that sends the current laddu's price/winner
details, reveal-in on scroll. Still fully read-only — no bidding UI was
added, per the brief.

**Lottery** — same share button for the draw, first prize gets a
marigold glow and a "1st Prize" ribbon, winners list uses a trophy badge
instead of an empty photo tile, everything reveals in on scroll.

**Admin Dashboard** — the three money stats (donations, expenses,
balance) and the three count stats (donors, events, announcements) count
up on load instead of appearing static; Quick Actions moved from a
horizontal scroll strip to the same 4-column `quick-grid` tile the public
Home page uses, so admin and villager views share one visual language.

**AdminLayout** — its bottom nav now uses the same frosted `nav-v2`
treatment as the public app's `BottomNav` (Stage 1) — same classes, so no
new CSS is needed. Routes, the pending-invites dot, and sign-out are all
unchanged.

**Login** — the shield emblem blooms in on load (same easing as the
splash screen), and the password field gets a show/hide toggle. Sign-in
logic, role select, and error handling are untouched.

## That's every screen

All twelve screens from the original scope are now covered across the
three stages. Nothing in your project folder was modified — every file
above is a straight drop-in replacement (or new file) at the path shown.

---

# Stage 4 — Committee/Admin side, premium pass

This stage upgrades the whole `/admin` area — dashboard, content
management, money, gallery, settings, login/join. Requires Stage 1's
`upgrade.css` already in place.

## One more import line

Already done for you — included in the `main.jsx` above.

## Files in this stage

| Copy this | To this path |
|---|---|
| `src/styles/admin-premium.css` | `project/src/styles/admin-premium.css` *(new)* |
| `src/components/admin/AdminLayout.jsx` | `project/src/components/admin/AdminLayout.jsx` *(replaces — adds the `admin-shell` class)* |
| `src/components/admin/FormField.jsx` | `project/src/components/admin/FormField.jsx` *(replaces — adds a themed focus ring to every input/select/textarea)* |
| `src/pages/admin/Join.jsx` | `project/src/pages/admin/Join.jsx` *(replaces)* |
| `src/pages/admin/ContentHub.jsx` | `project/src/pages/admin/ContentHub.jsx` *(replaces)* |
| `src/pages/admin/MoneyHub.jsx` | `project/src/pages/admin/MoneyHub.jsx` *(replaces)* |
| `src/pages/admin/MoneyDashboard.jsx` | `project/src/pages/admin/MoneyDashboard.jsx` *(replaces)* |
| `src/pages/admin/ManageDonations.jsx` | `project/src/pages/admin/ManageDonations.jsx` *(replaces)* |
| `src/pages/admin/ManageExpenses.jsx` | `project/src/pages/admin/ManageExpenses.jsx` *(replaces)* |

`AdminDashboard.jsx` and `Login.jsx` were already upgraded in Stage 3 —
no changes needed here.

## What changed

**Everywhere at once, for free** — because `admin-premium.css` targets
the shared `.card`, `.icon-badge`, `.btn-primary`, `.chip`, `.empty-state`
and `.photo-dropzone` classes every admin screen already uses, *every*
admin page gets deeper card elevation, gradient icon tiles, a richer
primary-button gradient, tracked/uppercase status chips, a frosted modal
backdrop, and a nicer drag-and-drop zone — including screens this stage
didn't touch directly: Announcements, Events, Committee, Contacts, Laddu,
Lottery, Gallery, Settings, Pending Sends, Deleted Donations. Every form
field across all of those (via the shared `FormField.jsx`) also picks up
a themed focus ring instead of the browser default.

**AdminLayout** — root now carries `admin-shell`, the class the whole
premium layer keys off; routes and nav are unchanged from Stage 3.

**Join** — same emblem-bloom entrance as Login (Stage 3); signup logic
untouched.

**Content hub / Money hub** — the flat link lists became icon tile grids
(`quick-grid`), matching the villager Home's quick-access pattern instead
of looking like a plain settings menu.

**Money Dashboard** — the day/year totals count up on load; the
source/volunteer breakdown bars use a smoother gradient track; the day
picker is now sticky while scrolling the day's donation list.

**Manage Donations / Manage Expenses** — the headline totals count up;
list rows stagger in on scroll. All the safety-net logic (draft
recovery, offline handling, idempotent saves, search) is byte-for-byte
identical — only presentation changed.

## Still untouched by design

Settings, ManageAnnouncements, ManageEvents, ManageCommittee,
ManageContacts, ManageLaddu, ManageLottery, ManageGallery,
ManageDeletedDonations, PendingSends — their business logic is
unchanged and none of their files need copying; they inherit the
premium look purely from `admin-premium.css` + `FormField.jsx`. Say the
word if you'd like any of these individually restructured further (e.g.
count-up stats on Settings, or a nicer multi-step feel on Lottery's
draw/prizes/winners flow).

---

# Stage 5 — New features (weather, maps, live stream, panchang, RSVP,
# voice search, admin charts)

Every API used here is **free, no signup, no key** — nothing to pay for,
nothing to configure before it works:

- **Weather** — [Open-Meteo](https://open-meteo.com) forecast + geocoding.
- **Maps** — a plain OpenStreetMap embed (`openstreetmap.org/export/embed.html`)
  plus a Google Maps *directions* deep link (`google.com/maps/dir/?...`) —
  both are public URLs, not billed APIs.
- **Live video** — a standard YouTube `<iframe>` embed of a video ID the
  committee supplies.
- **Panchang** — the lunar tithi is computed in plain JS (no API); sunrise/
  sunset comes from [sunrise-sunset.org](https://sunrise-sunset.org), also
  free/keyless.
- **Voice search** — the browser's built-in Web Speech API. No network
  call, no key; silently hides the mic button on browsers that don't
  support it (older desktop Safari/Firefox).

All of it degrades gracefully: if a village name can't be geocoded, or a
festival has no live-video ID set, that widget simply doesn't render —
nothing breaks, nothing shows an error for a "nice to have."

## New files

| Copy this | To this path |
|---|---|
| `src/services/weather.js` | `project/src/services/weather.js` *(new)* |
| `src/lib/panchang.js` | `project/src/lib/panchang.js` *(new)* |
| `src/services/rsvp.js` | `project/src/services/rsvp.js` *(new)* |
| `src/components/WeatherWidget.jsx` | `project/src/components/WeatherWidget.jsx` *(new)* |
| `src/components/PanchangWidget.jsx` | `project/src/components/PanchangWidget.jsx` *(new)* |
| `src/components/VenueMap.jsx` | `project/src/components/VenueMap.jsx` *(new)* |
| `src/components/LiveStream.jsx` | `project/src/components/LiveStream.jsx` *(new)* |
| `src/components/admin/MiniBarChart.jsx` | `project/src/components/admin/MiniBarChart.jsx` *(new)* |
| `src/pages/Rsvp.jsx` | `project/src/pages/Rsvp.jsx` *(new)* |
| `src/pages/admin/ManageRsvp.jsx` | `project/src/pages/admin/ManageRsvp.jsx` *(new)* |
| `supabase/13_rsvp.sql` | `project/supabase/13_rsvp.sql` *(new — run it in the Supabase SQL editor after `12_push_notifications.sql`)* |

## Files replaced again in this stage

| Copy this | To this path |
|---|---|
| `src/components/SearchSheet.jsx` | *(replaces — adds the voice-search mic)* |
| `src/pages/Home.jsx` | *(replaces — adds weather, panchang, venue map, live stream, RSVP tile)* |
| `src/pages/admin/MoneyDashboard.jsx` | *(replaces — adds the 7-day trend chart)* |
| `src/pages/admin/ContentHub.jsx` | *(replaces — adds the RSVPs tile)* |
| `src/styles/upgrade.css` | *(replaces — adds the styles for all of the above)* |

## No manual routes needed

Already wired into the `App.jsx` above: `/rsvp` (public) and
`/admin/content/rsvps` (committee/admin).

## What changed on Home

Three new sections, each optional and self-hiding:

- **Weather** — a horizontal strip covering the festival's dated range
  (or the next few days if it hasn't been dated yet), geocoded from the
  festival's village name.
- **Panchang** — today's tithi (lunar day) plus sunrise/sunset and an
  approximate Abhijit Muhurta window, clearly labeled as reference-only.
- **Venue map** — an embedded OpenStreetMap preview with a "Get
  Directions" button. Uses `festival.venueAddress` if you add that
  column, otherwise falls back to `"<village> temple"`.
- **Live Now** — only appears if `festival.liveVideoId` is set (add that
  column, or set it directly in the table editor for now — same pattern
  the README already uses for `public_donation_total`).
- **RSVP** joined the quick-access grid, linking to the new `/rsvp` page.

## RSVP

A public headcount page: name, optional phone, a guest-count stepper,
and a live running total of everyone who's RSVP'd — reads/writes
through `services/rsvp.js`, which follows the same "Supabase if
configured, else localStorage" fallback every other service in this app
uses, so it works immediately on sample data. `ManageRsvp.jsx` (linked
from the new Content Hub tile) lists everyone and lets committee/admin
remove an entry.

## Admin: 7-day donation trend

`MoneyDashboard` gained a small hand-drawn bar chart (no chart library —
just SVG, `MiniBarChart.jsx`) showing the last 7 days of collections
above the existing day-picker, so a trend is visible at a glance instead
of only one day at a time.

## Voice search

The header search sheet's mic button uses the browser's own speech
recognition — tap it, speak in English or Telugu (it follows whichever
language the app is currently in), and the transcript fills the search
box. No audio ever leaves the device through anything this app added;
whatever privacy policy the browser's built-in recognizer has is the
only one in play.

---

# Stage 6 — Live session card (links out to YouTube Live)

`LiveStream.jsx` is a rich, tappable card on the villager Home page —
not an embed. It shows a "LIVE" pulsing badge over the broadcast's own
YouTube thumbnail and title (fetched free, no key, via YouTube's public
oEmbed endpoint), and tapping it opens the actual YouTube Live page.
Broadcasting itself happens the normal way, from the YouTube app or
Studio — this card is just the best possible doorway to it.

## New / replaced files

| Copy this | To this path |
|---|---|
| `src/services/livestream.js` | `project/src/services/livestream.js` *(new — same file as before, unchanged)* |
| `src/components/admin/LiveStreamControl.jsx` | `project/src/components/admin/LiveStreamControl.jsx` *(replaces — now takes a YouTube link instead of a Daily room URL)* |
| `supabase/14_live_stream.sql` | `project/supabase/14_live_stream.sql` *(new — additive, run after `13_rsvp.sql`, if you haven't already)* |
| `src/components/LiveStream.jsx` | *(replaces — the new live-session card)* |
| `src/pages/Home.jsx` | *(replaces — passes the saved link through to the card)* |
| `src/pages/admin/AdminDashboard.jsx` | *(replaces — adds the Live Session control card)* |
| `src/styles/upgrade.css` | *(replaces — adds the `.live-session-*` card styles)* |

## Using it

On festival day: start your YouTube Live broadcast as usual (phone app
or Studio), copy its watch link, paste it into **Admin → Dashboard →
Live Session**, and tap **Go Live** — the card appears on the villager
Home page immediately, thumbnail and title pulled from YouTube. Tapping
the card opens YouTube Live itself, so playback, chat, likes — all of
it — is the real YouTube experience. **End Stream** hides the card once
you're done; nothing on YouTube's side is affected either way.

*(Superseded by Stage 7 below — kept here for history.)*

---

# Stage 7 — Real in-app live stream, fully free (replaces Stage 6's YouTube card)

This is your own live broadcast, playing inside the app on a `<video>`
element you own — not a link out, not an iframe to another site.
Powered by [LiveKit Cloud](https://livekit.io)'s free tier: no credit
card, doesn't expire, no server for you to run. (The honest tradeoff:
LiveKit's free tier caps monthly streaming minutes — plenty for a
festival's live hours; if you ever need guaranteed unlimited capacity,
the same code points at a self-hosted LiveKit server later with just a
URL change.)

## One-time setup (free, ~5 minutes)

1. Create a free account at [cloud.livekit.io](https://cloud.livekit.io)
   and a project. Copy its **WebSocket URL** (`wss://your-project.livekit.cloud`)
   and, from Settings → Keys, an **API Key** and **API Secret**.
2. Install the one new dependency this needs:
   ```
   npm install livekit-client
   ```
3. Deploy the token-minting function (keeps your API Secret server-side,
   never in the browser) — needs the [Supabase CLI](https://supabase.com/docs/guides/cli):
   ```
   supabase functions deploy livekit-token
   supabase secrets set LIVEKIT_API_KEY=your_key LIVEKIT_API_SECRET=your_secret
   ```
4. Run `supabase/15_livekit.sql` in the Supabase SQL editor (after `14_live_stream.sql`).
5. In **Admin → Dashboard → Live Stream**, paste the WSS URL from step 1
   and a room name (anything, e.g. `festival-live`), then tap **Go Live**
   — your device's camera/mic turns on and every villager on Home sees
   you immediately, live, inside the app.

## New / replaced files

| Copy this | To this path |
|---|---|
| `src/services/livekit.js` | `project/src/services/livekit.js` *(new)* |
| `supabase/functions/livekit-token/index.ts` | `project/supabase/functions/livekit-token/index.ts` *(new)* |
| `supabase/15_livekit.sql` | `project/supabase/15_livekit.sql` *(new — additive, run after `14_live_stream.sql`)* |
| `src/services/livestream.js` | *(replaces — now stores `roomName`/`wsUrl` instead of a YouTube link)* |
| `src/components/LiveStream.jsx` | *(replaces — real in-app video + text chat)* |
| `src/components/admin/LiveStreamControl.jsx` | *(replaces — broadcasts this device's camera/mic)* |
| `src/pages/Home.jsx` | *(replaces — passes `roomName`/`wsUrl` through)* |
| `src/styles/upgrade.css` | *(replaces — video/chat styles; the old YouTube card CSS is now dead and hidden)* |

## What villagers see

A live card on Home with the broadcaster's camera, a live viewer count,
and a small text chat underneath — everyone watching can type and see
each other's messages in real time, no page leaves the app.

## Honest limits

- LiveKit's free tier has a monthly streaming-minutes cap — ample for
  festival days, worth checking your dashboard if you stream very
  often.
- The chat is live-only (LiveKit's data channel) — messages aren't
  saved anywhere, so nothing shows up for someone who joins late.
- Only one broadcaster per room in this version — everyone else
  connects as a viewer.
