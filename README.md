# Tonisha Kong Makeup — Application Guide

This is the website and booking system for Tonisha Kong Makeup Artist. It is built with React + TypeScript, backed by a Cloudflare Worker and D1 (SQLite) database, and deployed to Cloudflare Pages.

---

## Architecture Overview

- **Frontend** — React + TypeScript + Vite, Tailwind CSS v4, daisyUI v5, React Router v7
- **Backend** — Cloudflare Worker (`worker/index.ts`) handles all API routes
- **Database** — Cloudflare D1 (SQLite) via the `DB` binding
- **Auth** — JWT (HS256 via Web Crypto, no external libs) + PBKDF2 password hashing. Three roles: `user` (client), `artist`, `admin` (ADMIN_SECRET)
- **Storage** — Cloudflare R2 (external worker at `cloudflare-worker-r2-upload.jubbyb.workers.dev`)

---

## Prerequisites

- **Node.js 20+** (Vite 7 requires it)
- **Wrangler CLI** — installed as a dev dependency, run via `npx wrangler` or `npm run deploy`
- A **Cloudflare account** with Pages and D1 access

---

## Local Development

### 1. Install dependencies

```bash
npm install
```

### 2. Set secrets for local dev

Edit `.dev.vars` (already gitignored):

```
ADMIN_SECRET=your_local_admin_password
JWT_SECRET=a_long_random_string_at_least_32_chars
```

### 3. Set up the D1 database (first time only)

Create the database on Cloudflare (this gives you the `database_id`):

```bash
npx wrangler d1 create tonisha-kong-db
```

Paste the `database_id` into `wrangler.jsonc`.

Apply the schema and seed data locally:

```bash
npx wrangler d1 execute tonisha-kong-db --local --file=./schema.sql
```

**Existing database?** Run migrations in order instead:

```bash
npx wrangler d1 execute tonisha-kong-db --local --file=./migrations/001_auth_and_artists.sql
npx wrangler d1 execute tonisha-kong-db --local --file=./migrations/002_working_hours.sql
```

### 4. Start the dev server

```bash
npm run dev
```

The site runs at `http://localhost:5173`. The Cloudflare Worker (including D1) runs locally via Miniflare — no live Cloudflare connection needed during development.

---

## Deployment

### 1. Apply the schema to the production database (first time only)

```bash
npx wrangler d1 execute tonisha-kong-db --file=./schema.sql
```

### 2. Set production secrets

```bash
npx wrangler secret put ADMIN_SECRET
npx wrangler secret put JWT_SECRET
```

Use a long random string for `JWT_SECRET` (32+ characters). These are stored securely in Cloudflare and never appear in code or config files.

### 3. Deploy

```bash
npm run deploy
```

This builds the React app and Worker, then uploads everything to Cloudflare Pages.

---

## User Accounts

Clients sign up at `/login` (Sign Up tab). After registering they can:
- Browse artists at `/artists`
- View an artist's profile and availability calendar at `/artists/:id`
- Select a time slot and book (requires login — prompted automatically if not)
- View and cancel their bookings at `/my-bookings`

---

## Artist Accounts

Artist accounts are created by the admin (see below). Artists **cannot** self-register.

Once created, the artist logs in at `/login` → **Artist** tab using the email/password set by the admin.

After logging in, the artist is taken to `/artist-dashboard` with three tabs:

**Bookings** — view all bookings with client details. Actions:
- Pending → Confirm or Cancel
- Confirmed → Mark Complete or Cancel

**Availability** — two sections:

*Working Hours* — set default availability per day of week. Each day can be enabled/disabled with custom start/end times and slot length (30, 60, 90, or 120 minutes). The calendar is open by default on enabled days — no manual slot entry needed.

*Block Time Off* — block specific dates or hours (holiday, break, etc.). Full day or custom time range. Blocked times are automatically hidden from clients. Existing confirmed bookings are not affected.

**Profile** — update name, bio, specialties (comma-separated), and photo URL.

---

## Admin Panel

The admin panel is at `/admin` on the live site (not linked in the public navigation). Access it directly:

```
https://your-site.pages.dev/admin
```

### Logging in

Enter the `ADMIN_SECRET` password you set above. The session is stored in your browser's `sessionStorage` — it clears when you close the tab.

### Managing Artists

The **Artists** tab lists all artist accounts. From here you can:
- **Add an artist** — provide name, email, initial password, specialties, photo URL, and bio. The artist logs in with these credentials and can update their own profile.
- **Activate/deactivate** — click the status badge to toggle. Inactive artists are hidden from the public `/artists` page.
- **Delete** — permanently removes the artist account.

### Managing Bookings

The **Bookings** tab shows all booking requests (from all artists and the legacy anonymous form), newest first. Individual bookings can be deleted once actioned.

### Managing Classes

The **Classes** tab lists all upcoming classes. From here you can:

- **Add a class** — click "Add Class", fill in the name, description, date/time, price, and whether it includes a certificate or 1-on-1 mentoring.
- **Edit a class** — click "Edit" on any row to update its details.
- **Delete a class** — click "Delete" to permanently remove it. This does not affect any bookings already submitted for that class.

---

## Managing Services

Services are stored in the D1 database. They can be managed directly via the Wrangler CLI:

**List services:**
```bash
npx wrangler d1 execute tonisha-kong-db --command="SELECT * FROM services"
```

**Add a service:**
```bash
npx wrangler d1 execute tonisha-kong-db --command="INSERT INTO services (name, description, price) VALUES ('Airbrush Makeup', 'Flawless airbrush application for events and photoshoots.', 175)"
```

**Update a service price:**
```bash
npx wrangler d1 execute tonisha-kong-db --command="UPDATE services SET price = 275 WHERE name = 'Bridal Makeup'"
```

**Delete a service:**
```bash
npx wrangler d1 execute tonisha-kong-db --command="DELETE FROM services WHERE id = 3"
```

Add `--local` to any of these commands to run against your local dev database instead of production.

---

## Image Uploads (Admin)

The admin panel supports uploading portfolio images to Cloudflare R2 via an external worker at `cloudflare-worker-r2-upload.jubbyb.workers.dev`. These images can then be referenced by their URL in service records.

---

## Database Schema

| Table | Purpose |
|---|---|
| `services` | Services offered (name, description, price, optional image URL) |
| `classes` | Scheduled classes (name, description, date, price, certificate, mentoring flags) |
| `bookings` | Client booking requests submitted via the site |
| `contact_messages` | Messages submitted via the Contact page |

To reset and reseed the local database:
```bash
npx wrangler d1 execute tonisha-kong-db --local --command="DROP TABLE IF EXISTS services; DROP TABLE IF EXISTS classes; DROP TABLE IF EXISTS bookings; DROP TABLE IF EXISTS contact_messages;"
npx wrangler d1 execute tonisha-kong-db --local --file=./schema.sql
```
