-- Migration 001: Add users, artists, time_slots and update bookings
-- Run against existing databases that already have the base schema:
--   wrangler d1 execute tonisha-kong-db --file=./migrations/001_auth_and_artists.sql
--   wrangler d1 execute tonisha-kong-db --local --file=./migrations/001_auth_and_artists.sql

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

CREATE TABLE IF NOT EXISTS time_slots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  artist_id INTEGER NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  is_available INTEGER NOT NULL DEFAULT 1,
  UNIQUE(artist_id, date, start_time)
);

-- Add new columns to existing bookings table
ALTER TABLE bookings ADD COLUMN user_id INTEGER;
ALTER TABLE bookings ADD COLUMN artist_id INTEGER;
ALTER TABLE bookings ADD COLUMN slot_id INTEGER;
ALTER TABLE bookings ADD COLUMN status TEXT NOT NULL DEFAULT 'pending';
