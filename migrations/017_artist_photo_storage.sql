-- Track which artist profile photos are first-party (R2) uploads so PUT/upload
-- can clean the underlying object on replace or remove. Legacy paste-URL
-- photos leave photo_storage_key NULL.
ALTER TABLE artists ADD COLUMN photo_storage_key TEXT;
CREATE INDEX IF NOT EXISTS idx_artists_photo_storage_key ON artists(photo_storage_key);
