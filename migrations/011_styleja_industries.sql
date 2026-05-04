-- 011_styleja_industries.sql
-- Adds multi-industry support for Styleja rebrand.

-- ── New tables ────────────────────────────────────────────────────────────────

CREATE TABLE industries (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  slug       TEXT    NOT NULL UNIQUE,
  name       TEXT    NOT NULL,
  tagline    TEXT,
  icon       TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active  INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE artist_industries (
  artist_id   INTEGER NOT NULL REFERENCES artists(id)    ON DELETE CASCADE,
  industry_id INTEGER NOT NULL REFERENCES industries(id) ON DELETE CASCADE,
  PRIMARY KEY (artist_id, industry_id)
);
CREATE INDEX idx_artist_industries_industry ON artist_industries(industry_id);

CREATE TABLE category_industries (
  category_id INTEGER NOT NULL REFERENCES service_categories(id) ON DELETE CASCADE,
  industry_id INTEGER NOT NULL REFERENCES industries(id)         ON DELETE CASCADE,
  PRIMARY KEY (category_id, industry_id)
);
CREATE INDEX idx_category_industries_industry ON category_industries(industry_id);

-- ── New columns on existing tables ───────────────────────────────────────────

ALTER TABLE artists  ADD COLUMN whatsapp_number TEXT;
ALTER TABLE bookings ADD COLUMN contact_method  TEXT NOT NULL DEFAULT 'email';

-- ── Seed industries ───────────────────────────────────────────────────────────

INSERT INTO industries (slug, name, tagline, sort_order) VALUES
  ('makeup',   'Makeup',   'Bridal, editorial, and everyday glam.',         1),
  ('hair',     'Hair',     'Cuts, color, styling, extensions.',              2),
  ('nails',    'Nails',    'Mani, pedi, gel, art, extensions.',              3),
  ('barber',   'Barber',   'Cuts, fades, beards, shaves.',                   4),
  ('stylist',  'Stylist',  'Personal styling and wardrobe curation.',        5),
  ('tailoring','Tailoring','Alterations, custom fits, repairs.',             6);

-- ── Backfill existing data → makeup ──────────────────────────────────────────

INSERT INTO category_industries (category_id, industry_id)
  SELECT sc.id, i.id FROM service_categories sc, industries i WHERE i.slug = 'makeup';

INSERT INTO artist_industries (artist_id, industry_id)
  SELECT a.id, i.id FROM artists a, industries i WHERE i.slug = 'makeup';

-- ── Hair catalog ─────────────────────────────────────────────────────────────

INSERT INTO service_categories (name, sort_order) VALUES ('Hair Services', 5);

INSERT INTO category_industries (category_id, industry_id)
  SELECT sc.id, i.id FROM service_categories sc, industries i
  WHERE sc.name = 'Hair Services' AND i.slug = 'hair';

INSERT INTO service_subcategories (category_id, name, sort_order)
  SELECT id, 'Cuts & Styling', 1 FROM service_categories WHERE name = 'Hair Services';
INSERT INTO service_subcategories (category_id, name, sort_order)
  SELECT id, 'Color',          2 FROM service_categories WHERE name = 'Hair Services';
INSERT INTO service_subcategories (category_id, name, sort_order)
  SELECT id, 'Extensions',     3 FROM service_categories WHERE name = 'Hair Services';

INSERT INTO catalog_services (subcategory_id, name, description, price, duration_min, sort_order)
  SELECT id, 'Wash & Style',    'Shampoo, condition, and style.',                 65,  60, 1 FROM service_subcategories WHERE name = 'Cuts & Styling';
INSERT INTO catalog_services (subcategory_id, name, description, price, duration_min, sort_order)
  SELECT id, 'Cut & Trim',      'Precision cut and finish.',                      55,  45, 2 FROM service_subcategories WHERE name = 'Cuts & Styling';
INSERT INTO catalog_services (subcategory_id, name, description, price, duration_min, sort_order)
  SELECT id, 'Silk Press',      'Thermal straightening for a sleek finish.',      85,  75, 3 FROM service_subcategories WHERE name = 'Cuts & Styling';
INSERT INTO catalog_services (subcategory_id, name, description, price, duration_min, sort_order)
  SELECT id, 'Single-Process Color', 'All-over color application.',              110, 90, 1 FROM service_subcategories WHERE name = 'Color';
INSERT INTO catalog_services (subcategory_id, name, description, price, duration_min, sort_order)
  SELECT id, 'Highlights',      'Partial or full highlights.',                   130, 120, 2 FROM service_subcategories WHERE name = 'Color';
INSERT INTO catalog_services (subcategory_id, name, description, price, duration_min, sort_order)
  SELECT id, 'Balayage',        'Hand-painted color for a natural gradient look.',175, 150, 3 FROM service_subcategories WHERE name = 'Color';
INSERT INTO catalog_services (subcategory_id, name, description, price, duration_min, sort_order)
  SELECT id, 'Sew-In',          'Full sew-in weave install.',                    200, 180, 1 FROM service_subcategories WHERE name = 'Extensions';
INSERT INTO catalog_services (subcategory_id, name, description, price, duration_min, sort_order)
  SELECT id, 'Tape-In Extensions','Tape-in hair extension application.',         220, 150, 2 FROM service_subcategories WHERE name = 'Extensions';

-- ── Nail catalog ─────────────────────────────────────────────────────────────

INSERT INTO service_categories (name, sort_order) VALUES ('Nail Services', 6);

INSERT INTO category_industries (category_id, industry_id)
  SELECT sc.id, i.id FROM service_categories sc, industries i
  WHERE sc.name = 'Nail Services' AND i.slug = 'nails';

INSERT INTO service_subcategories (category_id, name, sort_order)
  SELECT id, 'Manicure',    1 FROM service_categories WHERE name = 'Nail Services';
INSERT INTO service_subcategories (category_id, name, sort_order)
  SELECT id, 'Pedicure',    2 FROM service_categories WHERE name = 'Nail Services';
INSERT INTO service_subcategories (category_id, name, sort_order)
  SELECT id, 'Enhancements',3 FROM service_categories WHERE name = 'Nail Services';

INSERT INTO catalog_services (subcategory_id, name, description, price, duration_min, sort_order)
  SELECT id, 'Classic Mani',     'Shape, buff, and polish.',                       30, 30, 1 FROM service_subcategories WHERE name = 'Manicure';
INSERT INTO catalog_services (subcategory_id, name, description, price, duration_min, sort_order)
  SELECT id, 'Gel Mani',         'Long-lasting gel polish manicure.',              45, 45, 2 FROM service_subcategories WHERE name = 'Manicure';
INSERT INTO catalog_services (subcategory_id, name, description, price, duration_min, sort_order)
  SELECT id, 'Soak-Off & Repair','Remove existing gel and repair nails.',          35, 30, 3 FROM service_subcategories WHERE name = 'Manicure';
INSERT INTO catalog_services (subcategory_id, name, description, price, duration_min, sort_order)
  SELECT id, 'Classic Pedi',     'Soak, scrub, trim, and polish.',                 40, 45, 1 FROM service_subcategories WHERE name = 'Pedicure';
INSERT INTO catalog_services (subcategory_id, name, description, price, duration_min, sort_order)
  SELECT id, 'Spa Pedi',         'Deluxe pedicure with exfoliation and massage.',  65, 60, 2 FROM service_subcategories WHERE name = 'Pedicure';
INSERT INTO catalog_services (subcategory_id, name, description, price, duration_min, sort_order)
  SELECT id, 'Acrylic Full Set',  'Full acrylic nail set.',                        70, 75, 1 FROM service_subcategories WHERE name = 'Enhancements';
INSERT INTO catalog_services (subcategory_id, name, description, price, duration_min, sort_order)
  SELECT id, 'Gel-X',             'Soft gel extension set.',                       75, 60, 2 FROM service_subcategories WHERE name = 'Enhancements';
INSERT INTO catalog_services (subcategory_id, name, description, price, duration_min, sort_order)
  SELECT id, 'Nail Art Add-On',   'Custom nail art on any service.',               20, 20, 3 FROM service_subcategories WHERE name = 'Enhancements';

-- ── Barber catalog ────────────────────────────────────────────────────────────

INSERT INTO service_categories (name, sort_order) VALUES ('Barber', 7);

INSERT INTO category_industries (category_id, industry_id)
  SELECT sc.id, i.id FROM service_categories sc, industries i
  WHERE sc.name = 'Barber' AND i.slug = 'barber';

INSERT INTO service_subcategories (category_id, name, sort_order)
  SELECT id, 'Cuts',  1 FROM service_categories WHERE name = 'Barber';
INSERT INTO service_subcategories (category_id, name, sort_order)
  SELECT id, 'Beard', 2 FROM service_categories WHERE name = 'Barber';
INSERT INTO service_subcategories (category_id, name, sort_order)
  SELECT id, 'Combo', 3 FROM service_categories WHERE name = 'Barber';

INSERT INTO catalog_services (subcategory_id, name, description, price, duration_min, sort_order)
  SELECT id, 'Haircut',      'Classic haircut and style.',                     25, 30, 1 FROM service_subcategories WHERE name = 'Cuts';
INSERT INTO catalog_services (subcategory_id, name, description, price, duration_min, sort_order)
  SELECT id, 'Skin Fade',    'Precision fade down to skin.',                   30, 35, 2 FROM service_subcategories WHERE name = 'Cuts';
INSERT INTO catalog_services (subcategory_id, name, description, price, duration_min, sort_order)
  SELECT id, "Line-Up",      'Crisp edge-up and line-up.',                     15, 20, 3 FROM service_subcategories WHERE name = 'Cuts';
INSERT INTO catalog_services (subcategory_id, name, description, price, duration_min, sort_order)
  SELECT id, "Kid's Cut",    'Haircut for children under 12.',                 20, 25, 4 FROM service_subcategories WHERE name = 'Cuts';
INSERT INTO catalog_services (subcategory_id, name, description, price, duration_min, sort_order)
  SELECT id, 'Beard Trim',   'Shape and define the beard.',                    20, 20, 1 FROM service_subcategories WHERE name = 'Beard';
INSERT INTO catalog_services (subcategory_id, name, description, price, duration_min, sort_order)
  SELECT id, 'Hot Towel Shave','Traditional hot towel straight razor shave.', 35, 30, 2 FROM service_subcategories WHERE name = 'Beard';
INSERT INTO catalog_services (subcategory_id, name, description, price, duration_min, sort_order)
  SELECT id, 'Cut + Beard Combo','Haircut and full beard service.',            45, 50, 1 FROM service_subcategories WHERE name = 'Combo';

-- ── Stylist catalog ───────────────────────────────────────────────────────────

INSERT INTO service_categories (name, sort_order) VALUES ('Personal Styling', 8);

INSERT INTO category_industries (category_id, industry_id)
  SELECT sc.id, i.id FROM service_categories sc, industries i
  WHERE sc.name = 'Personal Styling' AND i.slug = 'stylist';

INSERT INTO service_subcategories (category_id, name, sort_order)
  SELECT id, 'Sessions',  1 FROM service_categories WHERE name = 'Personal Styling';
INSERT INTO service_subcategories (category_id, name, sort_order)
  SELECT id, 'Wardrobe',  2 FROM service_categories WHERE name = 'Personal Styling';

INSERT INTO catalog_services (subcategory_id, name, description, price, duration_min, sort_order)
  SELECT id, 'Style Consultation',     'One-on-one session to define your personal style.',   80, 60, 1 FROM service_subcategories WHERE name = 'Sessions';
INSERT INTO catalog_services (subcategory_id, name, description, price, duration_min, sort_order)
  SELECT id, 'Look Build',             'Curated outfits from your existing wardrobe.',        100, 90, 2 FROM service_subcategories WHERE name = 'Sessions';
INSERT INTO catalog_services (subcategory_id, name, description, price, duration_min, sort_order)
  SELECT id, 'Event Styling',          'Outfit and accessory curation for a specific event.', 120, 90, 3 FROM service_subcategories WHERE name = 'Sessions';
INSERT INTO catalog_services (subcategory_id, name, description, price, duration_min, sort_order)
  SELECT id, 'Closet Audit',           'Full wardrobe review and organisation.',              150, 120, 1 FROM service_subcategories WHERE name = 'Wardrobe';
INSERT INTO catalog_services (subcategory_id, name, description, price, duration_min, sort_order)
  SELECT id, 'Personal Shopping (Half Day)', 'Stylist-guided shopping trip.',                200, 240, 2 FROM service_subcategories WHERE name = 'Wardrobe';

-- ── Tailoring catalog ─────────────────────────────────────────────────────────

INSERT INTO service_categories (name, sort_order) VALUES ('Tailoring', 9);

INSERT INTO category_industries (category_id, industry_id)
  SELECT sc.id, i.id FROM service_categories sc, industries i
  WHERE sc.name = 'Tailoring' AND i.slug = 'tailoring';

INSERT INTO service_subcategories (category_id, name, sort_order)
  SELECT id, 'Alterations', 1 FROM service_categories WHERE name = 'Tailoring';
INSERT INTO service_subcategories (category_id, name, sort_order)
  SELECT id, 'Custom',      2 FROM service_categories WHERE name = 'Tailoring';

INSERT INTO catalog_services (subcategory_id, name, description, price, duration_min, sort_order)
  SELECT id, 'Hem (Pants/Skirt/Dress)', 'Professional hem adjustment.',                20, 30, 1 FROM service_subcategories WHERE name = 'Alterations';
INSERT INTO catalog_services (subcategory_id, name, description, price, duration_min, sort_order)
  SELECT id, 'Take-In Waist',           'Take in waistband for a better fit.',         25, 30, 2 FROM service_subcategories WHERE name = 'Alterations';
INSERT INTO catalog_services (subcategory_id, name, description, price, duration_min, sort_order)
  SELECT id, 'Sleeve Shorten',          'Shorten sleeves on jacket or shirt.',         20, 25, 3 FROM service_subcategories WHERE name = 'Alterations';
INSERT INTO catalog_services (subcategory_id, name, description, price, duration_min, sort_order)
  SELECT id, 'Suit Alteration',         'Full suit tailoring and adjustment.',         80, 60, 4 FROM service_subcategories WHERE name = 'Alterations';
INSERT INTO catalog_services (subcategory_id, name, description, price, duration_min, sort_order)
  SELECT id, 'Zipper Replace',          'Replace a broken zipper on any garment.',     15, 20, 5 FROM service_subcategories WHERE name = 'Alterations';
INSERT INTO catalog_services (subcategory_id, name, description, price, duration_min, sort_order)
  SELECT id, 'Custom Garment Consultation', 'Consultation for a bespoke garment.',    60, 60, 1 FROM service_subcategories WHERE name = 'Custom';
