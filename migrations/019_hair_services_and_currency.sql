-- ─────────────────────────────────────────────────────────────────────────────
-- 019_hair_services_and_currency.sql
-- Adds per-service currency (JMD|USD) and range pricing (price + price_max),
-- and seeds a hairstylist's price list into the shared "Hair Services" catalog.
-- Price shape is encoded in the (price, price_max) pair — see docs/adr/0001.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Currency + range pricing on the catalog ──────────────────────────────────
ALTER TABLE catalog_services ADD COLUMN price_max REAL;
ALTER TABLE catalog_services ADD COLUMN currency  TEXT NOT NULL DEFAULT 'JMD';

-- Existing catalog rows are USD-priced fixed prices. Backfill BEFORE the
-- new JMD hair rows are inserted below, so these UPDATEs only touch them.
UPDATE catalog_services SET currency = 'USD';
UPDATE catalog_services SET price_max = price;

-- ── Per-(artist, service) overrides ──────────────────────────────────────────
ALTER TABLE artist_services ADD COLUMN price_max_override REAL;
ALTER TABLE artist_services ADD COLUMN currency_override  TEXT;

-- ── Hair price-list subcategories (under the existing "Hair Services") ───────
INSERT INTO service_subcategories (category_id, name, sort_order)
  SELECT id, 'Braiding',     4 FROM service_categories WHERE name = 'Hair Services';
INSERT INTO service_subcategories (category_id, name, sort_order)
  SELECT id, 'Faux Locs',    5 FROM service_categories WHERE name = 'Hair Services';
INSERT INTO service_subcategories (category_id, name, sort_order)
  SELECT id, 'Wig Installs', 6 FROM service_categories WHERE name = 'Hair Services';
INSERT INTO service_subcategories (category_id, name, sort_order)
  SELECT id, 'Sew-Ins',      7 FROM service_categories WHERE name = 'Hair Services';
INSERT INTO service_subcategories (category_id, name, sort_order)
  SELECT id, 'Cutting',      8 FROM service_categories WHERE name = 'Hair Services';
INSERT INTO service_subcategories (category_id, name, sort_order)
  SELECT id, 'Coloring',     9 FROM service_categories WHERE name = 'Hair Services';
INSERT INTO service_subcategories (category_id, name, sort_order)
  SELECT id, 'Crochet',     10 FROM service_categories WHERE name = 'Hair Services';
INSERT INTO service_subcategories (category_id, name, sort_order)
  SELECT id, 'Add-Ons',     11 FROM service_categories WHERE name = 'Hair Services';

-- helper view of the hair subcategories, for the inserts below
-- (each insert resolves its own subcategory id by name within "Hair Services")

-- ── Braiding / Faux Locs / Wig Installs / Sew-Ins / Cutting (range priced) ───
INSERT INTO catalog_services (subcategory_id, name, description, price, price_max, currency, duration_min, sort_order)
  SELECT ss.id, 'Braiding',
         'Knotless, box braids, tribal, feed-in & more. Style only — hair must be washed, detangled & ready. Final price varies with length, density & style complexity.',
         6000, 18000, 'JMD', 240, 1
  FROM service_subcategories ss JOIN service_categories sc ON sc.id = ss.category_id
  WHERE sc.name = 'Hair Services' AND ss.name = 'Braiding';
INSERT INTO catalog_services (subcategory_id, name, description, price, price_max, currency, duration_min, sort_order)
  SELECT ss.id, 'Faux Locs',
         'Goddess locs, soft locs, butterfly locs & more. Style only — hair must be washed, detangled & ready. Final price varies with length, density & style complexity.',
         12000, 28000, 'JMD', 300, 1
  FROM service_subcategories ss JOIN service_categories sc ON sc.id = ss.category_id
  WHERE sc.name = 'Hair Services' AND ss.name = 'Faux Locs';
INSERT INTO catalog_services (subcategory_id, name, description, price, price_max, currency, duration_min, sort_order)
  SELECT ss.id, 'Wig Installs',
         'Glue or no-glue installs — lace closure & frontal. Style only — hair must be washed, detangled & ready.',
         6000, 12000, 'JMD', 120, 1
  FROM service_subcategories ss JOIN service_categories sc ON sc.id = ss.category_id
  WHERE sc.name = 'Hair Services' AND ss.name = 'Wig Installs';
INSERT INTO catalog_services (subcategory_id, name, description, price, price_max, currency, duration_min, sort_order)
  SELECT ss.id, 'Sew-Ins',
         'Traditional sew-in, leave out, closure sew-in & more. Style only — hair must be washed, detangled & ready.',
         8000, 25000, 'JMD', 180, 1
  FROM service_subcategories ss JOIN service_categories sc ON sc.id = ss.category_id
  WHERE sc.name = 'Hair Services' AND ss.name = 'Sew-Ins';
INSERT INTO catalog_services (subcategory_id, name, description, price, price_max, currency, duration_min, sort_order)
  SELECT ss.id, 'Cutting',
         'Trim, shape up, layers, bob cuts & more.',
         3000, 10000, 'JMD', 60, 1
  FROM service_subcategories ss JOIN service_categories sc ON sc.id = ss.category_id
  WHERE sc.name = 'Hair Services' AND ss.name = 'Cutting';

-- ── Coloring (open-ended "from" prices; Color Correction is consult-only) ────
INSERT INTO catalog_services (subcategory_id, name, description, price, price_max, currency, duration_min, sort_order)
  SELECT ss.id, 'Root Touch Up',         'Refresh regrowth at the roots.',                6000,  NULL, 'JMD',  90, 1
  FROM service_subcategories ss JOIN service_categories sc ON sc.id = ss.category_id
  WHERE sc.name = 'Hair Services' AND ss.name = 'Coloring';
INSERT INTO catalog_services (subcategory_id, name, description, price, price_max, currency, duration_min, sort_order)
  SELECT ss.id, 'Full Color',            'All-over single-process colour.',              10000,  NULL, 'JMD', 150, 2
  FROM service_subcategories ss JOIN service_categories sc ON sc.id = ss.category_id
  WHERE sc.name = 'Hair Services' AND ss.name = 'Coloring';
INSERT INTO catalog_services (subcategory_id, name, description, price, price_max, currency, duration_min, sort_order)
  SELECT ss.id, 'Highlights (Partial)',  'Partial highlights for dimension.',            12000,  NULL, 'JMD', 120, 3
  FROM service_subcategories ss JOIN service_categories sc ON sc.id = ss.category_id
  WHERE sc.name = 'Hair Services' AND ss.name = 'Coloring';
INSERT INTO catalog_services (subcategory_id, name, description, price, price_max, currency, duration_min, sort_order)
  SELECT ss.id, 'Highlights (Full)',     'Full head of highlights.',                     18000,  NULL, 'JMD', 180, 4
  FROM service_subcategories ss JOIN service_categories sc ON sc.id = ss.category_id
  WHERE sc.name = 'Hair Services' AND ss.name = 'Coloring';
INSERT INTO catalog_services (subcategory_id, name, description, price, price_max, currency, duration_min, sort_order)
  SELECT ss.id, 'Balayage / Ombré',      'Hand-painted, blended colour gradient.',       20000,  NULL, 'JMD', 180, 5
  FROM service_subcategories ss JOIN service_categories sc ON sc.id = ss.category_id
  WHERE sc.name = 'Hair Services' AND ss.name = 'Coloring';
INSERT INTO catalog_services (subcategory_id, name, description, price, price_max, currency, duration_min, sort_order)
  SELECT ss.id, 'Blonde Transformation', 'Lift to a full blonde result.',                25000,  NULL, 'JMD', 240, 6
  FROM service_subcategories ss JOIN service_categories sc ON sc.id = ss.category_id
  WHERE sc.name = 'Hair Services' AND ss.name = 'Coloring';
INSERT INTO catalog_services (subcategory_id, name, description, price, price_max, currency, duration_min, sort_order)
  SELECT ss.id, 'Fashion Colors',        'Vivid, creative fashion colours.',             12000,  NULL, 'JMD', 150, 7
  FROM service_subcategories ss JOIN service_categories sc ON sc.id = ss.category_id
  WHERE sc.name = 'Hair Services' AND ss.name = 'Coloring';
INSERT INTO catalog_services (subcategory_id, name, description, price, price_max, currency, duration_min, sort_order)
  SELECT ss.id, 'Toner / Gloss',         'Refresh tone and add shine.',                   5000,  NULL, 'JMD',  60, 8
  FROM service_subcategories ss JOIN service_categories sc ON sc.id = ss.category_id
  WHERE sc.name = 'Hair Services' AND ss.name = 'Coloring';
INSERT INTO catalog_services (subcategory_id, name, description, price, price_max, currency, duration_min, sort_order)
  SELECT ss.id, 'Color Correction',      'Corrective colour work — priced after consultation.', NULL, NULL, 'JMD', 240, 9
  FROM service_subcategories ss JOIN service_categories sc ON sc.id = ss.category_id
  WHERE sc.name = 'Hair Services' AND ss.name = 'Coloring';

-- ── Crochet (open-ended "from" prices) ───────────────────────────────────────
INSERT INTO catalog_services (subcategory_id, name, description, price, price_max, currency, duration_min, sort_order)
  SELECT ss.id, 'Crochet Braids',   'Crochet braid install.',           7000, NULL, 'JMD', 180, 1
  FROM service_subcategories ss JOIN service_categories sc ON sc.id = ss.category_id
  WHERE sc.name = 'Hair Services' AND ss.name = 'Crochet';
INSERT INTO catalog_services (subcategory_id, name, description, price, price_max, currency, duration_min, sort_order)
  SELECT ss.id, 'Crochet Locs',     'Crochet loc install.',             8000, NULL, 'JMD', 180, 2
  FROM service_subcategories ss JOIN service_categories sc ON sc.id = ss.category_id
  WHERE sc.name = 'Hair Services' AND ss.name = 'Crochet';
INSERT INTO catalog_services (subcategory_id, name, description, price, price_max, currency, duration_min, sort_order)
  SELECT ss.id, 'Curly Crochet',    'Curly crochet install.',           7000, NULL, 'JMD', 150, 3
  FROM service_subcategories ss JOIN service_categories sc ON sc.id = ss.category_id
  WHERE sc.name = 'Hair Services' AND ss.name = 'Crochet';
INSERT INTO catalog_services (subcategory_id, name, description, price, price_max, currency, duration_min, sort_order)
  SELECT ss.id, 'Boho Crochet',     'Boho-style crochet install.',      9000, NULL, 'JMD', 180, 4
  FROM service_subcategories ss JOIN service_categories sc ON sc.id = ss.category_id
  WHERE sc.name = 'Hair Services' AND ss.name = 'Crochet';
INSERT INTO catalog_services (subcategory_id, name, description, price, price_max, currency, duration_min, sort_order)
  SELECT ss.id, 'Crochet Ponytail', 'Crochet ponytail style.',          6000, NULL, 'JMD',  90, 5
  FROM service_subcategories ss JOIN service_categories sc ON sc.id = ss.category_id
  WHERE sc.name = 'Hair Services' AND ss.name = 'Crochet';

-- ── Add-Ons (Wash is a fixed price; the rest are "from" prices) ──────────────
INSERT INTO catalog_services (subcategory_id, name, description, price, price_max, currency, duration_min, sort_order)
  SELECT ss.id, 'Wash',           'Shampoo and rinse.',                    2000, 2000, 'JMD', 30, 1
  FROM service_subcategories ss JOIN service_categories sc ON sc.id = ss.category_id
  WHERE sc.name = 'Hair Services' AND ss.name = 'Add-Ons';
INSERT INTO catalog_services (subcategory_id, name, description, price, price_max, currency, duration_min, sort_order)
  SELECT ss.id, 'Deep Condition', 'Intensive conditioning treatment.',     2500, NULL, 'JMD', 45, 2
  FROM service_subcategories ss JOIN service_categories sc ON sc.id = ss.category_id
  WHERE sc.name = 'Hair Services' AND ss.name = 'Add-Ons';
INSERT INTO catalog_services (subcategory_id, name, description, price, price_max, currency, duration_min, sort_order)
  SELECT ss.id, 'Trim',           'Light trim to remove split ends.',      2000, NULL, 'JMD', 30, 3
  FROM service_subcategories ss JOIN service_categories sc ON sc.id = ss.category_id
  WHERE sc.name = 'Hair Services' AND ss.name = 'Add-Ons';
INSERT INTO catalog_services (subcategory_id, name, description, price, price_max, currency, duration_min, sort_order)
  SELECT ss.id, 'Silk Press',     'Smooth, sleek thermal press.',          3500, NULL, 'JMD', 75, 4
  FROM service_subcategories ss JOIN service_categories sc ON sc.id = ss.category_id
  WHERE sc.name = 'Hair Services' AND ss.name = 'Add-Ons';
INSERT INTO catalog_services (subcategory_id, name, description, price, price_max, currency, duration_min, sort_order)
  SELECT ss.id, 'Treatment',      'Restorative hair treatment.',           3000, NULL, 'JMD', 45, 5
  FROM service_subcategories ss JOIN service_categories sc ON sc.id = ss.category_id
  WHERE sc.name = 'Hair Services' AND ss.name = 'Add-Ons';
