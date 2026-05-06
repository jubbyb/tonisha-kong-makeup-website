-- Add geo functionality: parishes table and coordinates to artists

CREATE TABLE IF NOT EXISTS parishes (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  slug          TEXT UNIQUE NOT NULL,
  name          TEXT NOT NULL,
  region        TEXT,
  sort_order    INTEGER DEFAULT 0
);

-- Jamaica's 14 parishes
INSERT INTO parishes (slug, name, region, sort_order) VALUES
  ('kingston', 'Kingston', 'Surrey', 1),
  ('st-andrew', 'St. Andrew', 'Surrey', 2),
  ('st-thomas', 'St. Thomas', 'Surrey', 3),
  ('portland', 'Portland', 'Surrey', 4),
  ('st-mary', 'St. Mary', 'Middlesex', 5),
  ('st-ann', 'St. Ann', 'Middlesex', 6),
  ('trelawny', 'Trelawny', 'Middlesex', 7),
  ('st-james', 'St. James', 'Cornwall', 8),
  ('hanover', 'Hanover', 'Cornwall', 9),
  ('westmoreland', 'Westmoreland', 'Cornwall', 10),
  ('st-elizabeth', 'St. Elizabeth', 'Cornwall', 11),
  ('manchester', 'Manchester', 'Middlesex', 12),
  ('clarendon', 'Clarendon', 'Middlesex', 13),
  ('st-catherine', 'St. Catherine', 'Surrey', 14);

-- Add geo columns to artists table
ALTER TABLE artists ADD COLUMN parish_id INTEGER REFERENCES parishes(id);
ALTER TABLE artists ADD COLUMN lat REAL;
ALTER TABLE artists ADD COLUMN lng REAL;
ALTER TABLE artists ADD COLUMN service_radius_km REAL;
ALTER TABLE artists ADD COLUMN cover_url TEXT;

-- Create indexes for geo queries
CREATE INDEX IF NOT EXISTS idx_artists_parish ON artists(parish_id);
CREATE INDEX IF NOT EXISTS idx_artists_geo ON artists(lat, lng);
