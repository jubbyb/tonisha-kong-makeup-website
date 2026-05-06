# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Vite dev server (integrates Cloudflare Worker via @cloudflare/vite-plugin)
npm run build        # Build React app (tsc + vite) and Cloudflare Worker (tsc)
npm run build-app    # React app only
npm run build-worker # Worker only (tsconfig.worker.json)
npm run lint         # ESLint
npm run test         # Vitest (watch mode)
npm run deploy       # Build + wrangler pages deploy
```

Single test file: `npx vitest run src/pages/Services.test.tsx`

### D1 database

```bash
wrangler d1 create tonisha-kong-db        # one-time; copy database_id into wrangler.jsonc

# Fresh install — apply base schema
wrangler d1 execute tonisha-kong-db --file=./schema.sql           # prod
wrangler d1 execute tonisha-kong-db --local --file=./schema.sql   # local

# Existing database — apply a migration
wrangler d1 execute tonisha-kong-db --local --file=./migrations/010_artist_subpages.sql
```

`schema.sql` is the fresh-install snapshot. `migrations/NNN_*.sql` are incremental and numbered in apply order. When adding a feature that changes the DB, write a new migration **and** mirror the change into `schema.sql` so fresh installs stay in sync.

## Architecture

**StyleJA** — Multi-vendor marketplace for Jamaica's six beauty/style trades (Makeup, Nails, Hair, Barber, Stylist, Tailor) on **Cloudflare Pages** + **Cloudflare Worker** + **Cloudflare D1** (SQLite). Each artist has a public subpage at `/artists/<slug>` they customize via a dashboard. Geo-location features with parishes and map-based search.

### Build targets

Two TypeScript configs:
- `tsconfig.app.json` — React frontend, compiled by Vite.
- `tsconfig.worker.json` — Cloudflare Worker at `worker/index.ts`, compiled separately. Handles `/api/*`.

### Worker (`worker/index.ts`)

All data access goes through the `DB` D1 binding. Routes are grouped (the file is long — search by prefix rather than scrolling):

- **Public** — `GET /api/services`, `/api/classes`, `/api/parishes`, `/api/industries`, `/api/artists` (supports ?industry=slug, ?parish=slug), `/api/artists/:idOrSlug`, `/api/artists/:id/{services,slots,portfolio,testimonials}`, `/api/service-catalog`, `/api/reviews`, `GET|POST /api/surveys/:token`. Plus `POST /api/bookings` and `POST /api/contact`.
- **User auth** — `POST /api/auth/{signup,login}`, Google OAuth at `GET /api/auth/google` + `/api/auth/google/callback`, `GET|PUT /api/user/profile`, `GET /api/bookings/mine`, cancel.
- **Artist auth** — `POST /api/auth/artist-login`, plus `GET|PUT /api/artist/{profile,services,hours,blocks,portfolio,testimonials}` and `GET /api/artist/bookings`. Portfolio/testimonials also have `POST` and per-id `PUT|DELETE`.
- **Admin** — `Authorization: Bearer ${ADMIN_SECRET}`. Full CRUD for artists, bookings, classes, users (incl. `POST /api/admin/users/:id/promote`), and the service catalog (`/api/admin/service-catalog/{categories,subcategories,services}`).

Bindings/secrets in `Env` (top of `worker/index.ts`): `DB`, `ASSETS`, `ADMIN_SECRET`, `JWT_SECRET`, `RESEND_API_KEY`, `SITE_URL`, `FROM_EMAIL`, `GOOGLE_REVIEW_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`.

### Auth (`worker/auth.ts`)

- **JWT** — HS256 signed with `JWT_SECRET`. Payload: `{ sub, email, name, role: 'user'|'artist', artist_id?, iat, exp }`. 7-day lifetime (24h for the artist-only login). No refresh.
- **Passwords** — PBKDF2-SHA256, 100k iterations, stored as `iterations:saltB64URL:hashB64URL`.
- **Google OAuth** — Initiate redirects to Google with `state` carrying `returnTo`. Callback exchanges code, fetches user info, looks up by `google_id` then by email, links or creates a `users` row.
- **Roles** — `users.role` is `'user'` or `'artist'`. An artist user has a linked `artists.user_id`. Admin promotes via `POST /api/admin/users/:id/promote` (also auto-generates a slug for the new artist).
- **Admin** — Plain bearer token compared against `ADMIN_SECRET` (no JWT for admin).

### Artist subpages (slugs, portfolio, testimonials, price overrides)

- `/artists` lists active artists; clicking goes to `/artists/<slug>`. URL-routing uses slug only on the client; the worker accepts both slug and numeric id at `GET /api/artists/:idOrSlug`.
- Slugs are validated by `SLUG_RE = /^[a-z0-9](-?[a-z0-9])*$/` with length 3–50 and a `RESERVED_SLUGS` set (login, admin, api, dashboard, etc. — see `worker/index.ts`). `slugify()` + `uniqueSlug()` handle generation and collision suffixes.
- `artist_portfolio` and `artist_testimonials` are artist-self-managed via the dashboard. Image fields take URL strings (no file upload UI in this repo — paste a hosted URL).
- Per-service pricing: `artist_services.price_override` is nullable; effective price = `COALESCE(price_override, catalog_services.price)`. The public `/api/artists/:id/services` already returns the effective price.

### Service catalog hierarchy

`service_categories` → `service_subcategories` → `catalog_services` → `artist_services` (junction; `(artist_id, service_id)` PK). `services` is a legacy flat table still used by the homepage; treat `catalog_services` as the source of truth for booking flows.

### Availability & booking

Slots are **computed dynamically**, never stored:
- `artist_hours` — weekly schedule. `day_of_week` uses **Mon=0...Sun=6**. JS `getDay()` is Sun=0, so convert with `(getDay() + 6) % 7`.
- `artist_blocks` — date-specific exceptions. `start_time`/`end_time` NULL means a full-day block.
- `bookings` — existing bookings subtract from availability.

Helpers in `worker/index.ts`: `timeToMin`, `minToTime`, `generateSlots`, `isBlocked`, `datesInRange`. D1 stores booleans as integers (0/1).

### Surveys & reviews

Post-booking emails (Resend, via `sendEmail`/`buildSurveyEmail`) link to `/survey/<token>` with hex tokens (`generateToken`). Submitting a survey can produce a `reviews` row that the homepage shows via `GET /api/reviews`.

### Frontend (`src/`)

**Routing** (`src/main.tsx`) — React Router v7. Root `App` layout (`<Navbar>` + `<Outlet>` + `<Footer>`) wraps all pages. Public routes: `/`, `/about`, `/services`, `/classes`, `/bookings`, `/contact`, `/login`, `/artists`, `/artists/:slug`, `/admin`, `/survey/:token`, `/auth/callback`. Protected (`<ProtectedRoute role="...">`): `/my-bookings` and `/profile` (user), `/artist-dashboard` (artist).

**Contexts** (`src/context/`):
- `AuthContext` — exposes `{ user, token, setAuth, logout }`. Token persisted in `localStorage['token']`, decoded client-side.
- `ThemeContext` — toggles between daisyUI themes `luxury` (default) and `lux-light`; persisted in `localStorage['tk-theme']`; sets `data-theme` on `<html>`.

**API client** (`src/lib/api.ts`) — `apiFetch<T>(path, opts)` adds the Bearer token, JSON content type, and on 401 clears the token and redirects to `/login?returnTo=...`. Use it for any authed call; raw `fetch` is fine for public GETs.

**Pages** of note:
- `Login.tsx` — unified login/signup + Google button + artist-only login.
- `ArtistProfile.tsx` — public subpage; hero, About, Portfolio (daisyUI `<dialog>` lightbox), Services (effective price), Testimonials, Booking calendar.
- `ArtistDashboard.tsx` — six tabs: Bookings, Availability, Services (with price override inputs), Portfolio, Testimonials, Profile.
- `Admin.tsx` — large monolithic admin panel (artists, bookings, classes, users, service catalog).
- `BookingFlow.tsx` (component) — multi-step booking; central booking orchestration.

### Styling

Tailwind CSS v4 via `@tailwindcss/vite` (not PostCSS). daisyUI v5 themes `luxury` (dark, default) and `lux-light`. Custom CSS in `src/index.css` defines brand variables (`--tk-bg`, `--tk-gold`, etc.) and utility classes (`.btn-gold`, `.input-luxury`, `.lux-card`, `.divider-gold`, animation classes `.anim-*`). Display font is Cormorant Garamond, body is DM Sans.

### Testing

Vitest + jsdom + `@testing-library/react`. Setup at `src/test/setup.ts` (imports `@testing-library/jest-dom`). Test files alongside source: `src/App.test.tsx`, `src/pages/Services.test.tsx`.

## Conventions / gotchas

- D1 booleans are integers (0/1) — convert when reading or writing.
- `artist_hours.day_of_week`: Mon=0...Sun=6. JS `getDay()` is Sun=0; convert with `(getDay() + 6) % 7`.
- Email lookups: always `.toLowerCase().trim()` before comparing.
- Slugs: validate against `SLUG_RE`, reject reserved names, dedupe via `uniqueSlug()`.
- Artists can be created two ways — directly by admin (no `user_id`) or by promoting a user (sets `users.role='artist'` and `artists.user_id`). Both paths must keep `slug` populated.
- Effective service price uses `COALESCE(artist_services.price_override, catalog_services.price)` — don't read `catalog_services.price` directly in the booking flow.
- When changing the DB: write a new `migrations/NNN_*.sql` AND update `schema.sql`.
- ESLint flags `no-useless-escape` for `\/` inside character classes — write `[^/]+` not `[^\/]+`.

## Services → Bookings flow

The `Bookings` page reads `location.state?.service?.name` to pre-populate the service field when navigated from the Services page.
