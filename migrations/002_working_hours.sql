-- Migration 002: Replace explicit time_slots with working-hours + blocks model
-- Run against existing databases:
--   wrangler d1 execute tonisha-kong-db --file=./migrations/002_working_hours.sql
--   wrangler d1 execute tonisha-kong-db --local --file=./migrations/002_working_hours.sql

-- Artist's default weekly schedule (one row per working day)
-- day_of_week: 0=Monday ... 6=Sunday
CREATE TABLE IF NOT EXISTS artist_hours (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  artist_id      INTEGER NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  day_of_week    INTEGER NOT NULL,
  start_time     TEXT NOT NULL DEFAULT '09:00',
  end_time       TEXT NOT NULL DEFAULT '17:00',
  slot_duration  INTEGER NOT NULL DEFAULT 60,
  UNIQUE(artist_id, day_of_week)
);

-- Specific dates/time ranges the artist is NOT available
CREATE TABLE IF NOT EXISTS artist_blocks (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  artist_id   INTEGER NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  date        TEXT NOT NULL,
  start_time  TEXT,  -- NULL = full day block
  end_time    TEXT   -- NULL = full day block
);

-- Add start_time / end_time to bookings for the new flow
ALTER TABLE bookings ADD COLUMN start_time TEXT;
ALTER TABLE bookings ADD COLUMN end_time   TEXT;
