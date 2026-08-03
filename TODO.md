# TODO — Modern Admin Dashboard + Website Settings

## Part 1: Modern Admin Dashboard
- [x] 1. Rewrite `public/pages/dashboard.html` with complete modern admin dashboard layout
  - [x] 1a. Sidebar (brand, nav menu, logout) — responsive off-canvas on mobile
  - [x] 1b. Top navbar (hamburger, page title, live clock/date, theme toggle, user chip)
  - [x] 1c. Stat cards: Total Members, Total Active Members, Today's Events, This Week Events
  - [x] 1d. Latest Announcements list (from `/api/announcements`)
  - [x] 1e. User info card (from `/api/auth/me`)
  - [x] 1f. Upcoming Events list (from `/api/events`)
  - [x] 1g. Dark mode toggle (localStorage + system preference)
  - [x] 1h. Loading / empty / error states for all API-driven sections
- [x] 2. Verify dashboard is served correctly by the app

## Part 2: Website Settings (Admin)
- [ ] 1. Create `sql/migration-settings.sql` — singleton `settings` table + seed row
- [ ] 2. Create `api/settings/index.js` — public GET + admin-only PUT (multipart uploads)
- [ ] 3. Create `public/pages/settings.html` — modern admin settings page
- [ ] 4. Edit `public/index.html` — apply settings dynamically (name, logo, favicon, bg, dark mode)
- [ ] 5. Edit `public/pages/dashboard.html` — apply site branding + add "Pengaturan" nav link
- [ ] 6. Verify settings save/load end-to-end

