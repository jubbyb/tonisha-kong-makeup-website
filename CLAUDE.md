# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start Vite dev server (integrates Cloudflare Worker via @cloudflare/vite-plugin)
npm run build        # Build both React app (tsc + vite) and Cloudflare Worker (tsc)
npm run build-app    # Build React app only
npm run build-worker # Build Cloudflare Worker only (uses tsconfig.worker.json)
npm run lint         # ESLint
npm run test         # Vitest (watch mode)
npm run deploy       # Build + wrangler pages deploy to Cloudflare Pages
```

Run a single test file:
```bash
npx vitest run src/pages/Services.test.tsx
```

### D1 database setup (one-time)

```bash
wrangler d1 create tonisha-kong-db
# Copy the database_id into wrangler.jsonc

# Apply schema (production)
wrangler d1 execute tonisha-kong-db --file=./schema.sql

# Apply schema (local dev)
wrangler d1 execute tonisha-kong-db --local --file=./schema.sql
```

## Architecture

This is a makeup artist business website deployed to **Cloudflare Pages** with a **Cloudflare Worker** backend and **Cloudflare D1** (SQLite) database.

**Dual build targets** — two separate TypeScript configs exist:
- `tsconfig.app.json` — React frontend (compiled by Vite)
- `tsconfig.worker.json` — Cloudflare Worker at `worker/index.ts` (compiled separately, handles `/api/*` routes)

**Worker API** (`worker/index.ts`): Handles all data access via the `DB` D1 binding. Routes:
- `GET /api/services` — list services
- `GET /api/classes` — list classes (ordered by date)
- `POST /api/bookings` — insert a booking
- `POST /api/contact` — insert a contact message

**Database** (`schema.sql`): Core tables: `services`, `classes`, `bookings`, `contact_messages`, `users`, `artists`, `artist_hours`, `artist_blocks`. Seed data included for services and classes. D1 stores booleans as integers (0/1).

**Availability model**: Artists are available by default based on `artist_hours` (weekly schedule per day of week, 0=Mon). They block exceptions via `artist_blocks` (specific dates or time ranges). Available slots are computed dynamically in the worker — not stored — by subtracting blocks and existing bookings from working hours. `artist_hours` day_of_week uses Mon=0...Sun=6 (JS `getDay()` is Sun=0, convert with `(getDay() + 6) % 7`).

**Frontend routing** (`src/main.tsx`): React Router v7 wraps all pages under a root `App` layout (`src/App.tsx`) that provides `<Navbar>` + `<Footer>` + `<Outlet>`. Routes: `/`, `/home`, `/about`, `/services`, `/classes`, `/bookings`, `/contact`, `/admin`.

**Admin page** (`src/pages/Admin.tsx`): Uploads images to a separate Cloudflare Worker R2 bucket at `cloudflare-worker-r2-upload.jubbyb.workers.dev/upload` (external worker, not the one in this repo). Currently unprotected — admin auth is not yet implemented.

**Styling**: Tailwind CSS v4 (loaded via `@tailwindcss/vite` plugin directly in Vite, not PostCSS) + daisyUI v5 component library.

**Testing**: Vitest with jsdom environment and `@testing-library/react`. Setup file at `src/test/setup.ts`.

**Services → Bookings flow**: The `Bookings` page reads `location.state?.service?.name` to pre-populate the service field when navigated from the Services page.
