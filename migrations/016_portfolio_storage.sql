-- Track which portfolio rows are first-party (R2) uploads so DELETE can clean
-- the underlying object. Legacy URL-paste rows leave storage_key NULL.
ALTER TABLE artist_portfolio ADD COLUMN storage_key TEXT;
CREATE INDEX IF NOT EXISTS idx_artist_portfolio_storage_key ON artist_portfolio(storage_key);
