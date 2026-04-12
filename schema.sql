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
  mentoring INTEGER NOT NULL DEFAULT 0,
  host_artist_id INTEGER REFERENCES artists(id) ON DELETE SET NULL,
  total_slots INTEGER NOT NULL DEFAULT 0,
  duration_min INTEGER NOT NULL DEFAULT 60
);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  phone TEXT,
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
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  user_id INTEGER REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_artists_user_id ON artists(user_id);

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

CREATE TABLE IF NOT EXISTS service_categories (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS service_subcategories (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  category_id INTEGER NOT NULL REFERENCES service_categories(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS catalog_services (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  subcategory_id INTEGER NOT NULL REFERENCES service_subcategories(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  description    TEXT,
  price          REAL,
  duration_min   INTEGER NOT NULL DEFAULT 60,
  sort_order     INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS artist_services (
  artist_id  INTEGER NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  service_id INTEGER NOT NULL REFERENCES catalog_services(id) ON DELETE CASCADE,
  PRIMARY KEY (artist_id, service_id)
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

INSERT INTO service_categories (name, sort_order) VALUES
  ('Bridal', 1),
  ('Special Occasions', 2),
  ('Lessons & Education', 3),
  ('Photography & Media', 4);

INSERT INTO service_subcategories (category_id, name, sort_order) VALUES
  (1, 'Wedding Day', 1),
  (1, 'Pre-Wedding', 2),
  (2, 'Parties & Events', 1),
  (2, 'Prom & Formals', 2),
  (3, 'Private Lessons', 1),
  (3, 'Group Classes', 2),
  (4, 'Photoshoots', 1),
  (4, 'Film & Media', 2);

INSERT INTO catalog_services (subcategory_id, name, description, price, duration_min, sort_order) VALUES
  (1, 'Full Bridal Glam', 'Complete bridal makeup including trial and wedding day application.', 250, 120, 1),
  (1, 'Bridal Party Makeup', 'Makeup for bridesmaids and bridal party members.', 90, 60, 2),
  (2, 'Bridal Trial', 'Preview your wedding day look in advance.', 120, 90, 1),
  (2, 'Engagement Shoot Makeup', 'Camera-ready makeup for engagement photography.', 130, 75, 2),
  (3, 'Event Glam', 'Full-face glamour for parties, galas, and special occasions.', 120, 60, 1),
  (3, 'Natural Everyday Look', 'Subtle, polished makeup for everyday wear.', 70, 45, 2),
  (4, 'Prom Makeup', 'Bold and beautiful looks for prom and formal events.', 85, 60, 1),
  (5, 'One-on-One Lesson', 'Personalized lesson tailored to your skill level and goals.', 90, 60, 1),
  (6, 'Group Workshop', 'Makeup class for 3–6 participants, great for events.', 200, 120, 1),
  (7, 'Photoshoot Makeup', 'Camera-ready looks for professional photoshoots.', 150, 75, 1),
  (8, 'Editorial / Film Makeup', 'High-fashion and film-ready makeup for creative projects.', 175, 90, 1);

INSERT INTO classes (name, description, date, price, certificate, mentoring) VALUES
  ('Beginner Makeup Basics', 'Learn the fundamentals of makeup application, including skin prep, foundation, and natural looks.', '2025-08-10T14:00', 60, 1, 0),
  ('Smokey Eye Masterclass', 'Master the art of the smokey eye with step-by-step guidance and hands-on practice.', '2025-08-17T16:00', 75, 0, 1),
  ('Bridal Makeup Workshop', 'Perfect for aspiring bridal artists or brides-to-be. Covers long-lasting, flawless bridal looks.', '2025-08-24T13:00', 100, 1, 1),
  ('Contouring & Highlighting', 'Learn advanced contouring and highlighting techniques for all face shapes.', '2025-09-01T15:00', 80, 0, 0),
  ('Makeup for Photography', 'Discover tips and tricks for makeup that looks great on camera and under studio lights.', '2025-09-08T17:00', 90, 1, 0);
