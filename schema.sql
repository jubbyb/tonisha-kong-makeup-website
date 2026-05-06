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

CREATE TABLE IF NOT EXISTS parishes (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  slug          TEXT UNIQUE NOT NULL,
  name          TEXT NOT NULL,
  region        TEXT,
  sort_order    INTEGER DEFAULT 0
);

INSERT OR IGNORE INTO parishes (slug, name, region, sort_order) VALUES
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

CREATE TABLE IF NOT EXISTS artists (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  name             TEXT NOT NULL,
  email            TEXT NOT NULL UNIQUE,
  password_hash    TEXT NOT NULL,
  bio              TEXT,
  specialties      TEXT,
  photo_url        TEXT,
  is_active        INTEGER NOT NULL DEFAULT 1,
  created_at       TEXT NOT NULL DEFAULT (datetime('now')),
  user_id          INTEGER REFERENCES users(id),
  slug             TEXT UNIQUE,
  about            TEXT,
  location         TEXT,
  experience       TEXT,
  instagram_url    TEXT,
  tiktok_url       TEXT,
  facebook_url     TEXT,
  website_url      TEXT,
  whatsapp_number  TEXT,
  parish_id        INTEGER REFERENCES parishes(id),
  lat              REAL,
  lng              REAL,
  service_radius_km REAL,
  cover_url        TEXT
);
CREATE INDEX IF NOT EXISTS idx_artists_user_id ON artists(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_artists_slug ON artists(slug);
CREATE INDEX IF NOT EXISTS idx_artists_parish ON artists(parish_id);
CREATE INDEX IF NOT EXISTS idx_artists_geo ON artists(lat, lng);

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
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id        INTEGER REFERENCES users(id) ON DELETE SET NULL,
  artist_id      INTEGER REFERENCES artists(id) ON DELETE SET NULL,
  name           TEXT NOT NULL,
  email          TEXT NOT NULL,
  phone          TEXT,
  service        TEXT NOT NULL,
  date           TEXT NOT NULL,       -- YYYY-MM-DD
  start_time     TEXT,                -- HH:MM
  end_time       TEXT,                -- HH:MM
  message        TEXT,
  status         TEXT NOT NULL DEFAULT 'pending',
  contact_method TEXT NOT NULL DEFAULT 'email',
  created_at     TEXT NOT NULL DEFAULT (datetime('now'))
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
  artist_id      INTEGER NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  service_id     INTEGER NOT NULL REFERENCES catalog_services(id) ON DELETE CASCADE,
  price_override REAL,
  PRIMARY KEY (artist_id, service_id)
);

CREATE TABLE IF NOT EXISTS artist_portfolio (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  artist_id     INTEGER NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  image_url     TEXT NOT NULL,
  caption       TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_artist_portfolio_artist ON artist_portfolio(artist_id, display_order);

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

CREATE TABLE IF NOT EXISTS contact_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token      TEXT    NOT NULL UNIQUE,
  expires_at TEXT    NOT NULL,
  used       INTEGER NOT NULL DEFAULT 0,
  created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_prt_token ON password_reset_tokens(token);

CREATE TABLE IF NOT EXISTS industries (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  slug       TEXT    NOT NULL UNIQUE,
  name       TEXT    NOT NULL,
  tagline    TEXT,
  icon       TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active  INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS artist_industries (
  artist_id   INTEGER NOT NULL REFERENCES artists(id)    ON DELETE CASCADE,
  industry_id INTEGER NOT NULL REFERENCES industries(id) ON DELETE CASCADE,
  PRIMARY KEY (artist_id, industry_id)
);
CREATE INDEX IF NOT EXISTS idx_artist_industries_industry ON artist_industries(industry_id);

CREATE TABLE IF NOT EXISTS category_industries (
  category_id INTEGER NOT NULL REFERENCES service_categories(id) ON DELETE CASCADE,
  industry_id INTEGER NOT NULL REFERENCES industries(id)         ON DELETE CASCADE,
  PRIMARY KEY (category_id, industry_id)
);
CREATE INDEX IF NOT EXISTS idx_category_industries_industry ON category_industries(industry_id);

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

-- ── Industries ────────────────────────────────────────────────────────────────

INSERT INTO industries (slug, name, tagline, sort_order) VALUES
  ('makeup',    'Makeup',   'Bridal, editorial, and everyday glam.',   1),
  ('hair',      'Hair',     'Cuts, color, styling, extensions.',        2),
  ('nails',     'Nails',    'Mani, pedi, gel, art, extensions.',        3),
  ('barber',    'Barber',   'Cuts, fades, beards, shaves.',             4),
  ('stylist',   'Stylist',  'Personal styling and wardrobe curation.',  5),
  ('tailoring', 'Tailoring','Alterations, custom fits, repairs.',       6);

-- Backfill existing makeup categories and artists
INSERT INTO category_industries (category_id, industry_id)
  SELECT sc.id, i.id FROM service_categories sc, industries i WHERE i.slug = 'makeup';

INSERT INTO artist_industries (artist_id, industry_id)
  SELECT a.id, i.id FROM artists a, industries i WHERE i.slug = 'makeup';

-- ── Hair catalog ─────────────────────────────────────────────────────────────

INSERT INTO service_categories (name, sort_order) VALUES ('Hair Services', 5);
INSERT INTO category_industries (category_id, industry_id)
  SELECT sc.id, i.id FROM service_categories sc, industries i WHERE sc.name='Hair Services' AND i.slug='hair';
INSERT INTO service_subcategories (category_id, name, sort_order)
  SELECT id, 'Cuts & Styling', 1 FROM service_categories WHERE name='Hair Services';
INSERT INTO service_subcategories (category_id, name, sort_order)
  SELECT id, 'Color', 2 FROM service_categories WHERE name='Hair Services';
INSERT INTO service_subcategories (category_id, name, sort_order)
  SELECT id, 'Extensions', 3 FROM service_categories WHERE name='Hair Services';
INSERT INTO catalog_services (subcategory_id, name, description, price, duration_min, sort_order)
  SELECT id, 'Wash & Style', 'Shampoo, condition, and style.', 65, 60, 1 FROM service_subcategories WHERE name='Cuts & Styling';
INSERT INTO catalog_services (subcategory_id, name, description, price, duration_min, sort_order)
  SELECT id, 'Cut & Trim', 'Precision cut and finish.', 55, 45, 2 FROM service_subcategories WHERE name='Cuts & Styling';
INSERT INTO catalog_services (subcategory_id, name, description, price, duration_min, sort_order)
  SELECT id, 'Silk Press', 'Thermal straightening for a sleek finish.', 85, 75, 3 FROM service_subcategories WHERE name='Cuts & Styling';
INSERT INTO catalog_services (subcategory_id, name, description, price, duration_min, sort_order)
  SELECT id, 'Single-Process Color', 'All-over color application.', 110, 90, 1 FROM service_subcategories WHERE name='Color';
INSERT INTO catalog_services (subcategory_id, name, description, price, duration_min, sort_order)
  SELECT id, 'Highlights', 'Partial or full highlights.', 130, 120, 2 FROM service_subcategories WHERE name='Color';
INSERT INTO catalog_services (subcategory_id, name, description, price, duration_min, sort_order)
  SELECT id, 'Balayage', 'Hand-painted color for a natural gradient look.', 175, 150, 3 FROM service_subcategories WHERE name='Color';
INSERT INTO catalog_services (subcategory_id, name, description, price, duration_min, sort_order)
  SELECT id, 'Sew-In', 'Full sew-in weave install.', 200, 180, 1 FROM service_subcategories WHERE name='Extensions';
INSERT INTO catalog_services (subcategory_id, name, description, price, duration_min, sort_order)
  SELECT id, 'Tape-In Extensions', 'Tape-in hair extension application.', 220, 150, 2 FROM service_subcategories WHERE name='Extensions';

-- ── Nail catalog ─────────────────────────────────────────────────────────────

INSERT INTO service_categories (name, sort_order) VALUES ('Nail Services', 6);
INSERT INTO category_industries (category_id, industry_id)
  SELECT sc.id, i.id FROM service_categories sc, industries i WHERE sc.name='Nail Services' AND i.slug='nails';
INSERT INTO service_subcategories (category_id, name, sort_order)
  SELECT id, 'Manicure', 1 FROM service_categories WHERE name='Nail Services';
INSERT INTO service_subcategories (category_id, name, sort_order)
  SELECT id, 'Pedicure', 2 FROM service_categories WHERE name='Nail Services';
INSERT INTO service_subcategories (category_id, name, sort_order)
  SELECT id, 'Enhancements', 3 FROM service_categories WHERE name='Nail Services';
INSERT INTO catalog_services (subcategory_id, name, description, price, duration_min, sort_order)
  SELECT id, 'Classic Mani', 'Shape, buff, and polish.', 30, 30, 1 FROM service_subcategories WHERE name='Manicure';
INSERT INTO catalog_services (subcategory_id, name, description, price, duration_min, sort_order)
  SELECT id, 'Gel Mani', 'Long-lasting gel polish manicure.', 45, 45, 2 FROM service_subcategories WHERE name='Manicure';
INSERT INTO catalog_services (subcategory_id, name, description, price, duration_min, sort_order)
  SELECT id, 'Soak-Off & Repair', 'Remove existing gel and repair nails.', 35, 30, 3 FROM service_subcategories WHERE name='Manicure';
INSERT INTO catalog_services (subcategory_id, name, description, price, duration_min, sort_order)
  SELECT id, 'Classic Pedi', 'Soak, scrub, trim, and polish.', 40, 45, 1 FROM service_subcategories WHERE name='Pedicure';
INSERT INTO catalog_services (subcategory_id, name, description, price, duration_min, sort_order)
  SELECT id, 'Spa Pedi', 'Deluxe pedicure with exfoliation and massage.', 65, 60, 2 FROM service_subcategories WHERE name='Pedicure';
INSERT INTO catalog_services (subcategory_id, name, description, price, duration_min, sort_order)
  SELECT id, 'Acrylic Full Set', 'Full acrylic nail set.', 70, 75, 1 FROM service_subcategories WHERE name='Enhancements';
INSERT INTO catalog_services (subcategory_id, name, description, price, duration_min, sort_order)
  SELECT id, 'Gel-X', 'Soft gel extension set.', 75, 60, 2 FROM service_subcategories WHERE name='Enhancements';
INSERT INTO catalog_services (subcategory_id, name, description, price, duration_min, sort_order)
  SELECT id, 'Nail Art Add-On', 'Custom nail art on any service.', 20, 20, 3 FROM service_subcategories WHERE name='Enhancements';

-- ── Barber catalog ────────────────────────────────────────────────────────────

INSERT INTO service_categories (name, sort_order) VALUES ('Barber', 7);
INSERT INTO category_industries (category_id, industry_id)
  SELECT sc.id, i.id FROM service_categories sc, industries i WHERE sc.name='Barber' AND i.slug='barber';
INSERT INTO service_subcategories (category_id, name, sort_order)
  SELECT id, 'Cuts', 1 FROM service_categories WHERE name='Barber';
INSERT INTO service_subcategories (category_id, name, sort_order)
  SELECT id, 'Beard', 2 FROM service_categories WHERE name='Barber';
INSERT INTO service_subcategories (category_id, name, sort_order)
  SELECT id, 'Combo', 3 FROM service_categories WHERE name='Barber';
INSERT INTO catalog_services (subcategory_id, name, description, price, duration_min, sort_order)
  SELECT id, 'Haircut', 'Classic haircut and style.', 25, 30, 1 FROM service_subcategories WHERE name='Cuts';
INSERT INTO catalog_services (subcategory_id, name, description, price, duration_min, sort_order)
  SELECT id, 'Skin Fade', 'Precision fade down to skin.', 30, 35, 2 FROM service_subcategories WHERE name='Cuts';
INSERT INTO catalog_services (subcategory_id, name, description, price, duration_min, sort_order)
  SELECT id, 'Line-Up', 'Crisp edge-up and line-up.', 15, 20, 3 FROM service_subcategories WHERE name='Cuts';
INSERT INTO catalog_services (subcategory_id, name, description, price, duration_min, sort_order)
  SELECT id, 'Kid''s Cut', 'Haircut for children under 12.', 20, 25, 4 FROM service_subcategories WHERE name='Cuts';
INSERT INTO catalog_services (subcategory_id, name, description, price, duration_min, sort_order)
  SELECT id, 'Beard Trim', 'Shape and define the beard.', 20, 20, 1 FROM service_subcategories WHERE name='Beard';
INSERT INTO catalog_services (subcategory_id, name, description, price, duration_min, sort_order)
  SELECT id, 'Hot Towel Shave', 'Traditional hot towel straight razor shave.', 35, 30, 2 FROM service_subcategories WHERE name='Beard';
INSERT INTO catalog_services (subcategory_id, name, description, price, duration_min, sort_order)
  SELECT id, 'Cut + Beard Combo', 'Haircut and full beard service.', 45, 50, 1 FROM service_subcategories WHERE name='Combo';

-- ── Stylist catalog ───────────────────────────────────────────────────────────

INSERT INTO service_categories (name, sort_order) VALUES ('Personal Styling', 8);
INSERT INTO category_industries (category_id, industry_id)
  SELECT sc.id, i.id FROM service_categories sc, industries i WHERE sc.name='Personal Styling' AND i.slug='stylist';
INSERT INTO service_subcategories (category_id, name, sort_order)
  SELECT id, 'Sessions', 1 FROM service_categories WHERE name='Personal Styling';
INSERT INTO service_subcategories (category_id, name, sort_order)
  SELECT id, 'Wardrobe', 2 FROM service_categories WHERE name='Personal Styling';
INSERT INTO catalog_services (subcategory_id, name, description, price, duration_min, sort_order)
  SELECT id, 'Style Consultation', 'One-on-one session to define your personal style.', 80, 60, 1 FROM service_subcategories WHERE name='Sessions';
INSERT INTO catalog_services (subcategory_id, name, description, price, duration_min, sort_order)
  SELECT id, 'Look Build', 'Curated outfits from your existing wardrobe.', 100, 90, 2 FROM service_subcategories WHERE name='Sessions';
INSERT INTO catalog_services (subcategory_id, name, description, price, duration_min, sort_order)
  SELECT id, 'Event Styling', 'Outfit and accessory curation for a specific event.', 120, 90, 3 FROM service_subcategories WHERE name='Sessions';
INSERT INTO catalog_services (subcategory_id, name, description, price, duration_min, sort_order)
  SELECT id, 'Closet Audit', 'Full wardrobe review and organisation.', 150, 120, 1 FROM service_subcategories WHERE name='Wardrobe';
INSERT INTO catalog_services (subcategory_id, name, description, price, duration_min, sort_order)
  SELECT id, 'Personal Shopping (Half Day)', 'Stylist-guided shopping trip.', 200, 240, 2 FROM service_subcategories WHERE name='Wardrobe';

-- ── Tailoring catalog ─────────────────────────────────────────────────────────

INSERT INTO service_categories (name, sort_order) VALUES ('Tailoring', 9);
INSERT INTO category_industries (category_id, industry_id)
  SELECT sc.id, i.id FROM service_categories sc, industries i WHERE sc.name='Tailoring' AND i.slug='tailoring';
INSERT INTO service_subcategories (category_id, name, sort_order)
  SELECT id, 'Alterations', 1 FROM service_categories WHERE name='Tailoring';
INSERT INTO service_subcategories (category_id, name, sort_order)
  SELECT id, 'Custom', 2 FROM service_categories WHERE name='Tailoring';
INSERT INTO catalog_services (subcategory_id, name, description, price, duration_min, sort_order)
  SELECT id, 'Hem (Pants/Skirt/Dress)', 'Professional hem adjustment.', 20, 30, 1 FROM service_subcategories WHERE name='Alterations';
INSERT INTO catalog_services (subcategory_id, name, description, price, duration_min, sort_order)
  SELECT id, 'Take-In Waist', 'Take in waistband for a better fit.', 25, 30, 2 FROM service_subcategories WHERE name='Alterations';
INSERT INTO catalog_services (subcategory_id, name, description, price, duration_min, sort_order)
  SELECT id, 'Sleeve Shorten', 'Shorten sleeves on jacket or shirt.', 20, 25, 3 FROM service_subcategories WHERE name='Alterations';
INSERT INTO catalog_services (subcategory_id, name, description, price, duration_min, sort_order)
  SELECT id, 'Suit Alteration', 'Full suit tailoring and adjustment.', 80, 60, 4 FROM service_subcategories WHERE name='Alterations';
INSERT INTO catalog_services (subcategory_id, name, description, price, duration_min, sort_order)
  SELECT id, 'Zipper Replace', 'Replace a broken zipper on any garment.', 15, 20, 5 FROM service_subcategories WHERE name='Alterations';
INSERT INTO catalog_services (subcategory_id, name, description, price, duration_min, sort_order)
  SELECT id, 'Custom Garment Consultation', 'Consultation for a bespoke garment.', 60, 60, 1 FROM service_subcategories WHERE name='Custom';
