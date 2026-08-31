# Stage 8 — files updated in this batch only

Copy each file below over the matching path in your project (same
relative path). This zip contains ONLY what changed in this round —
everything else in your project is untouched.

| File | What changed |
|---|---|
| `project/src/components/LiveStream.jsx` | Rewritten — teaser card + full-screen modal (fullscreen, emoji reactions, chat) |
| `project/src/components/admin/LiveStreamControl.jsx` | Rewritten — collapsed/expand row, fixed black-preview bug |
| `project/src/components/Header.jsx` | Title bar moved inside `<header>` (fixes overlap on scroll) |
| `project/src/components/admin/AdminLayout.jsx` | Same fix, admin side |
| `project/src/components/AppDownloadAd.jsx` | Now shows 5 sec every 5 min, alignment fixed |
| `project/src/components/WeatherWidget.jsx` | Shows a "couldn't find location" + Retry instead of vanishing |
| `project/src/components/VenueMap.jsx` | Same fallback + retry |
| `project/src/styles/upgrade.css` | Bottom-nav opacity fix, title-bar override, ad layout, new live-modal/teaser styles |
| `project/src/pages/Home.jsx` | RSVP tile removed |
| `project/src/pages/admin/ContentHub.jsx` | RSVP tile removed |
| `project/src/App.jsx` | RSVP import/route removed |

## Also delete these three files (RSVP feature removed)

- `project/src/pages/Rsvp.jsx`
- `project/src/pages/admin/ManageRsvp.jsx`
- `project/src/services/rsvp.js`
