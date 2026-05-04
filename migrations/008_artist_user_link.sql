-- Migration 008: Link artist profiles to user accounts
-- Allows users promoted to artist role to have a linked artists table record.
-- Existing standalone artists (created directly via admin) retain null user_id.
--
-- Run against local dev:
--   wrangler d1 execute tonisha-kong-db --local --file=./migrations/008_artist_user_link.sql
--
-- Run against production:
--   wrangler d1 execute tonisha-kong-db --file=./migrations/008_artist_user_link.sql

ALTER TABLE artists ADD COLUMN user_id INTEGER REFERENCES users(id);
CREATE INDEX IF NOT EXISTS idx_artists_user_id ON artists(user_id);
