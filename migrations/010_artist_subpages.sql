-- Migration 010: Per-artist customizable subpages
-- Adds slug + extended profile fields to artists, price_override on artist_services,
-- and new artist_portfolio + artist_testimonials tables.
--
-- Run against local dev:
--   wrangler d1 execute tonisha-kong-db --local --file=./migrations/010_artist_subpages.sql
--
-- Run against production:
--   wrangler d1 execute tonisha-kong-db --file=./migrations/010_artist_subpages.sql

-- 1. Extend artists with slug + richer profile fields
ALTER TABLE artists ADD COLUMN slug TEXT;
ALTER TABLE artists ADD COLUMN about TEXT;
ALTER TABLE artists ADD COLUMN location TEXT;
ALTER TABLE artists ADD COLUMN experience TEXT;
ALTER TABLE artists ADD COLUMN instagram_url TEXT;
ALTER TABLE artists ADD COLUMN tiktok_url TEXT;
ALTER TABLE artists ADD COLUMN facebook_url TEXT;
ALTER TABLE artists ADD COLUMN website_url TEXT;

-- Backfill slug for existing artists from name (lowercase, alphanumerics + dashes).
-- This single-statement form handles common punctuation; further dedupe of any rare
-- collisions is done by the worker on next save.
UPDATE artists
SET slug = LOWER(
  REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
    TRIM(name),
    ' ', '-'), '''', ''), '"', ''), '.', ''), ',', ''), '!', ''), '?', ''),
    '(', ''), ')', ''), '/', '-'), '\', '-'), '&', 'and'), '--', '-')
)
WHERE slug IS NULL;

-- Append id suffix to any duplicates to guarantee uniqueness for backfill
UPDATE artists
SET slug = slug || '-' || id
WHERE id IN (
  SELECT a1.id FROM artists a1
  JOIN artists a2 ON a1.slug = a2.slug AND a1.id > a2.id
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_artists_slug ON artists(slug);

-- 2. Per-artist price override on shared catalog services
ALTER TABLE artist_services ADD COLUMN price_override REAL;

-- 3. Portfolio gallery (images per artist)
CREATE TABLE IF NOT EXISTS artist_portfolio (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  artist_id     INTEGER NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  image_url     TEXT NOT NULL,
  caption       TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_artist_portfolio_artist ON artist_portfolio(artist_id, display_order);

-- 4. Artist-authored testimonials
CREATE TABLE IF NOT EXISTS artist_testimonials (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  artist_id     INTEGER NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  client_name   TEXT NOT NULL,
  quote         TEXT NOT NULL,
  date          TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_artist_testimonials_artist ON artist_testimonials(artist_id, display_order);
