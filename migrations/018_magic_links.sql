-- Migration 018: Magic-link auto-account for guest bookings
-- Run against local dev:
--   wrangler d1 execute tonisha-kong-db --local --file=./migrations/018_magic_links.sql
-- Run against production:
--   wrangler d1 execute tonisha-kong-db --file=./migrations/018_magic_links.sql

CREATE TABLE IF NOT EXISTS magic_links (
  token      TEXT    PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL,
  used_at    INTEGER,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_magic_links_user ON magic_links(user_id);
