-- Migration 007: Google OAuth support
-- Run against local dev:
--   wrangler d1 execute tonisha-kong-db --local --file=./migrations/007_google_oauth.sql
-- Run against production:
--   wrangler d1 execute tonisha-kong-db --file=./migrations/007_google_oauth.sql

ALTER TABLE users ADD COLUMN google_id TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id) WHERE google_id IS NOT NULL;
