# AGENTS.md

Vercel-serverless app for managing kader of PMII Rayon Inklusif Justicia. Vanilla HTML/CSS/JS frontend + Node serverless functions + Neon PostgreSQL. No framework, no build step, no test/lint/typecheck tooling, no CI.

## Commands

- There are **no npm scripts** (package.json has none). README's `npm run dev` is wrong.
- Local dev: `npx vercel dev` (static `public/` + serverless `api/`); CORS allows `localhost:3000` / `5173`.
- Syntax check changed handlers: `node --check api/<file>.js`
- Deploy check: `npx vercel build` then inspect `.vercel/output/functions` (TODO.md says target is ≤10 functions).
- `GET /api/health` verifies `DATABASE_URL` / `SESSION_SECRET` are set and DB connectivity after deploy.

## Environment

- `.env` needs `DATABASE_URL` (Neon PG) and `SESSION_SECRET`. `.env.example` is committed with real-looking creds; don't rely on it.
- `lib/db.js` auto-applies SSL only for non-local hosts; `pool.on('error')` never calls `process.exit` (would kill the serverless deployment).

## API architecture (critical)

- All endpoints are **10 consolidated top-level handlers** in `api/`: `admin.js`, `announcements.js`, `auth.js`, `events.js`, `health.js`, `kader.js`, `organization.js`, `savings.js`, `settings.js`, `users.js`.
- `vercel.json` rewrites `/api/<resource>/*` to the handler with a `__path` query param; each handler does `req.url = req.query.__path` and dispatches on the pathname. **Preserve this pattern** when adding endpoints; the public contract stays `/api/<resource>/<sub>`.
- `api/admin`, `api/announcements`, etc. are **empty leftover directories** from consolidation — don't recreate the nested structure.
- New API routes in `vercel.json` must be added before other rules if they share prefixes.

## CSRF (resolved 2026-08-11)

- Server-side, `api/announcements.js`, `api/events.js`, and logout in `api/auth.js` enforce `csrf.validateCsrf(req)` (`X-CSRF-Token` header + `csrf_token` cookie) on state changes.
- The CSRF cookie is **HttpOnly**, so `document.cookie` can never see it. `getCsrfToken()` on every dashboard page reads `csrfToken` from the `/api/auth/me` response body (auth.js returns it) and sends it as `X-CSRF-Token` on all POST/PUT/PATCH/DELETE calls.
- **Do not** re-introduce the old cookie-parsing `getCsrfToken()` (always returned null → 403s).
- If you enable CSRF on any endpoint, you must also wire the header on the calling page using the `/api/auth/me` token.

## Auth & roles

- Cookie auth: `session_token` (HttpOnly) → `sessions` table. Use `lib/auth.js` `requireAuth` / `requireRole` / `requireAuthRole`. Call `requireAuth` first; it sends 401/403 itself.
- Roles (hierarchy in `lib/auth.js`): `anggota, kader, wakabid, kabid, bendahara, sekretaris, ketua_rayon, admin, super_admin`.
- Separate `privilege` column (`member`/`admin`/`super_admin`, from migration v8) vs `role`; `hasAdminPrivilege()` checks both. Don't conflate them.
- User `status`: `active | inactive | suspended | pending | rejected`. Only `active` can log in / access the panel.
- Login rate limit: in-memory `lib/rateLimiter.js`, 5 attempts / 15 min per IP (per-process only — resets on cold start).

## Feature access control (events & announcements)

- **Events (`api/events.js`) and Announcements (`api/announcements.js`) are kader-panel-only features.** `GET` requires `requireAuth`; write ops are gated to `requireRole(user, 'admin', 'super_admin')` — that check honors both the `role` column and the `privilege` column, so e.g. `role=ketua_rayon` + `privilege=super_admin` (nizarfazari193) is allowed, while member/kader get 403.
- Frontend mirrors this with an `isAdmin()` helper (checks role OR privilege) that shows/hides `+ Tambah` / Edit / Delete controls. **Do not rely on the frontend alone — backend 403 is the source of truth.**
- Public landing page (`index.html`) has **no** Kalender or Pengumuman links and never calls `/api/events` or `/api/announcements`.

## Tabungan (savings) module

- Single consolidated handler `api/savings.js` (10th function, still ≤ Vercel Hobby limit). Public contract: `/api/savings/<sub>` — summary, categories (CRUD/toggle), settings (QRIS + min amount), transactions (create/list/detail/proof/validate/reject), admin/stats, admin/transactions.
- Migration `sql/migration-v9.sql` created `saving_categories`, `saving_transactions`, `savings_settings`. Money is **BIGINT integer rupiah** (never float). `users.id` is UUID; `saving_transactions.user_id` FKs to it.
- **No filesystem/blob storage exists** — media is stored as base64 **data-URI TEXT** (same as `settings.site_logo`). Payment proof → `saving_transactions.proof_url` (data-URI). "Storage cleanup" on validation = `proof_url = NULL` inside the same atomic `UPDATE ... WHERE payment_status='PENDING'`.
- `PAID` only set by admin validate (`requireRole(user,'admin','super_admin')`, honors `privilege`). Validation is idempotent: `UPDATE ... WHERE id=$1 AND payment_status='PENDING'` → second attempt matches 0 rows → 400. Saldo is always **computed** (`SUM(amount) WHERE payment_status='PAID'`), no balance cache, so double credit is impossible.
- Members: create transaction (PENDING), upload proof (only own txns, status stays PENDING; REJECTED → re-upload goes back to PENDING and clears reason). No gateways — QRIS is just a display image; "Saya Sudah Bayar" only opens proof upload.
- Categories soft-disabled with `is_active=false` (never deleted); disabled categories can't be used for new transactions but history keeps them.
- CSRF required on all state changes (`csrf.validateCsrf`); frontend sends `X-CSRF-Token` read from `/api/auth/me`. Audit via `logAudit` (SAVING_* actions).

## Database

- Neon PG. Migrations in `sql/` are **manual, additive, run in order**: `migration.sql`, then `migration-v2..v8` (latest is `migration-v8.sql`, registration/approval + privilege). Apply with `psql -d <DATABASE_URL> -f sql/<file>`.
- Seed super admin (idempotent, updates role/privilege/status only; preserves password unless `--reset-password`): `node scripts/seed-superadmin.js`. Contains hardcoded credentials in source.
- Audit events go to `audit_log` via `lib/audit.js` `logAudit()` — always call it on auth/state changes.

## Frontend

- `public/js/app.js` is empty; real logic is inline `<script>` in `public/pages/*.html`. Landing page uses `public/assets/js/*.js` (`main.js`, `search.js`, `pagination*.js`, etc.).
- Public site has **no** Kalender/Pengumuman pages or links (they are kader-panel-only). Do not add public pages for `pages/kalender.html` or public announcements; do not call `/api/events` or `/api/announcements` from `public/index.html`.
- Dashboard sidebars: Dashboard, Manajemen Pengguna, Event (calendar.html), Pengumuman (announcements.html), Tabungan (tabungan.html), Pengaturan. **No Publikasi link** in dashboard sidebars.
- Pages redirect unauthenticated users to `../panel.html`; `panel.html` is the login page (auto-redirects to `pages/dashboard.html` if already logged in).
- `public/index.html` is the public landing page — do not auto-redirect it to the panel.

## Stale files

- Root `fix_*.py`, `audit_assets.py` are one-off legacy scripts referencing an old path (`kader-panel-pmii-justicia`) and pre-consolidation nested files. Ignore them.
- `TODO.md` documents the routing/consolidation work already done (mostly complete) — read before touching `vercel.json` or API structure.
