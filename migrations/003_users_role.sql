-- Add role column to users table (default 'user'; admin can set to 'artist')
ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'user';
