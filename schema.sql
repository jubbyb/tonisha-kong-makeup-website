-- ─────────────────────────────────────────────
-- Base tables (run on fresh install)
-- For existing databases run: migrations/001_auth_and_artists.sql
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS services (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  price REAL NOT NULL,
  image_url TEXT
);

CREATE TABLE IF NOT EXISTS classes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  date TEXT NOT NULL,
  price REAL NOT NULL,
  certificate INTEGER NOT NULL DEFAULT 0,
  mentoring INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS artists (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  bio TEXT,
  specialties TEXT,
  photo_url TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Artist weekly working hours (one row per working day; if no row, that day is unavailable)
-- day_of_week: 0=Monday ... 6=Sunday
CREATE TABLE IF NOT EXISTS artist_hours (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  artist_id     INTEGER NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  day_of_week   INTEGER NOT NULL,
  start_time    TEXT NOT NULL DEFAULT '09:00',
  end_time      TEXT NOT NULL DEFAULT '17:00',
  slot_duration INTEGER NOT NULL DEFAULT 60,
  UNIQUE(artist_id, day_of_week)
);

-- Specific days or time ranges the artist has blocked off
CREATE TABLE IF NOT EXISTS artist_blocks (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  artist_id  INTEGER NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  date       TEXT NOT NULL,
  start_time TEXT,   -- NULL = full day block
  end_time   TEXT    -- NULL = full day block
);

CREATE TABLE IF NOT EXISTS bookings (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER REFERENCES users(id) ON DELETE SET NULL,
  artist_id  INTEGER REFERENCES artists(id) ON DELETE SET NULL,
  name       TEXT NOT NULL,
  email      TEXT NOT NULL,
  phone      TEXT,
  service    TEXT NOT NULL,
  date       TEXT NOT NULL,       -- YYYY-MM-DD
  start_time TEXT,                -- HH:MM
  end_time   TEXT,                -- HH:MM
  message    TEXT,
  status     TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS contact_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ─────────────────────────────────────────────
-- Seed data
-- ─────────────────────────────────────────────

INSERT INTO services (name, description, price) VALUES
  ('Bridal Makeup', 'Professional bridal makeup for your special day, including trial session.', 250),
  ('Event Glam', 'Full-face makeup for parties, proms, and special occasions.', 120),
  ('Makeup Lesson', 'One-on-one makeup lesson tailored to your needs and skill level.', 90),
  ('Photoshoot Makeup', 'Camera-ready makeup for photoshoots and media appearances.', 150),
  ('Natural Look', 'Subtle, natural makeup for everyday confidence.', 70),
  ('Group Class', 'Group makeup class for friends or team building events.', 200);

INSERT INTO classes (name, description, date, price, certificate, mentoring) VALUES
  ('Beginner Makeup Basics', 'Learn the fundamentals of makeup application, including skin prep, foundation, and natural looks.', '2025-08-10T14:00', 60, 1, 0),
  ('Smokey Eye Masterclass', 'Master the art of the smokey eye with step-by-step guidance and hands-on practice.', '2025-08-17T16:00', 75, 0, 1),
  ('Bridal Makeup Workshop', 'Perfect for aspiring bridal artists or brides-to-be. Covers long-lasting, flawless bridal looks.', '2025-08-24T13:00', 100, 1, 1),
  ('Contouring & Highlighting', 'Learn advanced contouring and highlighting techniques for all face shapes.', '2025-09-01T15:00', 80, 0, 0),
  ('Makeup for Photography', 'Discover tips and tricks for makeup that looks great on camera and under studio lights.', '2025-09-08T17:00', 90, 1, 0);
