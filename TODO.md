# TODO — Fix Routing, Navigation, Authentication & Deployment

## Goal
Make the website domain `/` always open `index.html` (public landing page), and
`panel.html` only reachable via explicit navigation (never the default homepage).

## Root Cause
- `vercel.json` had no explicit `/` route -> Vercel resolved the root to the panel
  (because `public/` holds the panel and was treated as the site root).
- `public/pages/organization.html` and `public/pages/settings.html` redirected
  unauthenticated users to `../index.html` (public homepage) instead of the login page.

## Steps
- [x] 1. Update `vercel.json` — explicit `/` -> `/index.html`, service public site
      folders (`page/`, `berita/`, `assets/`), keep panel + API routes.
- [x] 2. Fix `public/pages/organization.html` — unauth/logout redirect -> `../panel.html`.
- [x] 3. Fix `public/pages/settings.html` — unauth/logout redirect -> `../panel.html`.
- [x] 4. Verify `index.html` navbar (Home -> `/`, Kader Panel -> `/panel.html`).
- [x] 5. Verify `public/panel.html` login behavior (redirect to dashboard only after auth).
- [x] 6. Verify no other automatic redirects to panel.html exist.
- [x] 7. Final verification of application flow.

## Files Modified
1. `vercel.json` — added explicit `/` -> `/index.html` route + public site folder routes.
2. `public/pages/organization.html` — unauth/logout redirect now -> `../panel.html`.
3. `public/pages/settings.html` — unauth/logout redirect now -> `../panel.html`.
4. `index.html` — footer "Beranda" link -> `/` (navbar already correct).

