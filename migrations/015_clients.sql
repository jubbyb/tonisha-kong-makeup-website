-- Artist client notes: private per-artist annotations on clients derived from bookings.
-- Client identity is keyed by email (same as bookings table).
CREATE TABLE IF NOT EXISTS artist_client_notes (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  artist_id    INTEGER NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  client_email TEXT    NOT NULL,
  notes        TEXT,
  tags         TEXT,              -- JSON array stored as text, e.g. '["vip","bride"]'
  is_vip       INTEGER NOT NULL DEFAULT 0,
  created_at   TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT    NOT NULL DEFAULT (datetime('now')),
  UNIQUE(artist_id, client_email)
);
CREATE INDEX IF NOT EXISTS idx_acn_artist ON artist_client_notes(artist_id);
