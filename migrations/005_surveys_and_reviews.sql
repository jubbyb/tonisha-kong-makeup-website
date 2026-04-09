-- Migration 005: Survey email flow and testimonials/reviews system
-- Run against local dev:
--   wrangler d1 execute tonisha-kong-db --local --file=./migrations/005_surveys_and_reviews.sql
-- Run against production:
--   wrangler d1 execute tonisha-kong-db --file=./migrations/005_surveys_and_reviews.sql

ALTER TABLE bookings ADD COLUMN survey_sent INTEGER NOT NULL DEFAULT 0;
ALTER TABLE bookings ADD COLUMN completed_at TEXT;

-- Survey records: one per completed booking; token used in /survey/:token URL
CREATE TABLE IF NOT EXISTS surveys (
  id                     INTEGER PRIMARY KEY AUTOINCREMENT,
  booking_id             INTEGER NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
  token                  TEXT    NOT NULL UNIQUE,
  sent_at                TEXT    NOT NULL DEFAULT (datetime('now')),
  submitted_at           TEXT,
  rating                 INTEGER,
  body                   TEXT,
  review_requested       INTEGER NOT NULL DEFAULT 0,
  review_request_sent_at TEXT
);

-- Public-facing reviews (sourced from survey submissions or manually entered)
CREATE TABLE IF NOT EXISTS reviews (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  booking_id INTEGER REFERENCES bookings(id) ON DELETE SET NULL,
  name       TEXT    NOT NULL,
  service    TEXT    NOT NULL,
  rating     INTEGER NOT NULL,
  body       TEXT    NOT NULL,
  approved   INTEGER NOT NULL DEFAULT 0,
  created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_bookings_survey  ON bookings(status, survey_sent);
CREATE INDEX IF NOT EXISTS idx_surveys_token    ON surveys(token);
CREATE INDEX IF NOT EXISTS idx_reviews_approved ON reviews(approved);
