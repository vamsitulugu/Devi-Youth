// The public villager-facing URL people should land on when they scan the
// app's QR code — regardless of whether an admin, committee member, or
// villager is the one showing it. The app uses a HashRouter, so the bare
// root URL always resolves to the villager Home page ("/"), never an admin
// route, which is exactly what we want here.
//
// If your production domain changes, update it here — every QR code in the
// app (and the one generated for printing) reads from this single place.
export const SITE_URL = 'https://deviyouth.vercel.app/';
