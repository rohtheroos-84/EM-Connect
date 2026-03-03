-- V8: Add category, tags, and banner_url columns to events table

ALTER TABLE events ADD COLUMN category VARCHAR(50);
ALTER TABLE events ADD COLUMN tags TEXT;
ALTER TABLE events ADD COLUMN banner_url VARCHAR(500);

-- Index for category filtering
CREATE INDEX idx_events_category ON events(category);
