-- Ensure Tonisha Kong has slug='tonisha-kong' and a cover_url
UPDATE artists SET slug = 'tonisha-kong' WHERE slug IS NULL AND (name LIKE '%Tonisha%' OR name LIKE '%Kong%');
UPDATE artists SET cover_url = 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1200&q=80' WHERE cover_url IS NULL AND (name LIKE '%Tonisha%' OR name LIKE '%Kong%');
