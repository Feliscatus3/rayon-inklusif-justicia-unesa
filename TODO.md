# TODO — Routing/Auth/Deployment Fix + Serverless Function Reduction

## Part A: Routing / Auth / Deployment (Goal: "/" loads landing, panel only via click)

### Root cause
- `vercel.json` pointed `/` to a non-existent root `/index.html` (the landing page actually lives under `public/`). With `outputDirectory: public`, the correct route is `/` → `/index.html` at the web root.
- The static site + panel all live under `public/`: `public/index.html` (landing), `public/panel.html` (login), `public/pages/*` (dashboard), `public/assets/`, `public/berita/`, `public/js/`, `public/uploads/`.

### Status
- [x] Landing page exists at `public/index.html` (public homepage, no auto-redirect to panel)
- [x] `public/panel.html` is the login page
- [x] Navbar "Kader Panel" → `/panel.html` (link on click only)
- [x] Navbar "Beranda" → `/` (links to landing)
- [x] Panel pages redirect unauthenticated users to `../panel.html` (login)
- [x] Logout buttons redirect to `../panel.html`
- [x] No automatic redirect from `index.html` → `panel.html`
- [x] `vercel.json` routes:
  - `/` → `/index.html` (public landing)
  - `/panel`, `/panel.html` → `/panel.html`
  - `/pages/*`, `/assets/*`, `/berita/*`, `/js/*`, `/css/*`, `/uploads/*`
  - `/api/*` → consolidated top-level handlers

## Part B: Reduce Serverless Functions 13 → 9

### Result
- [x] Consolidated all nested `api/*/index.js` and `api/auth/*.js` into 9 top-level handlers:
  - `api/admin.js`, `api/announcements.js`, `api/auth.js`, `api/events.js`,
  - `api/kader.js`, `api/organization.js`, `api/settings.js`, `api/users.js`, `api/health.js`
- [x] Removed all old nested files (`api/auth/login.js`, `api/events/index.js`, `api/admin/index.js`, etc.)
- [x] All handlers use correct `../lib/...` require paths
- [x] `vercel.json` uses `__path` query-param technique so consolidated handlers can reconstruct original URLs, preserving the exact public API contract
- [x] `node --check` passes on all 9 consolidated handlers (EXIT 0)

### Acceptance criteria
- [ ] `npx vercel build` → inspect `.vercel/output/functions` → function count ≤ 10, root `/` serves landing page
