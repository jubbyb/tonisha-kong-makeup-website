-- Service catalog: categories, subcategories, and bookable services
-- Also: artist_services junction table to track which services each artist offers

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

-- Seed categories
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
