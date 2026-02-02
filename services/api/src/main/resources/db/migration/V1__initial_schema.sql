-- This is our first migration - it sets up the foundation
-- Flyway runs files in order: V1, V2, V3, etc.

-- Create extension for UUID generation (we'll use this later)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create a simple table to verify migrations work
CREATE TABLE schema_info (
    id SERIAL PRIMARY KEY,
    description VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert a record to prove it worked
INSERT INTO schema_info (description) VALUES ('Initial schema created by Flyway');