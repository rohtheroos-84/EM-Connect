-- Add OAuth provider column (e.g. 'GOOGLE') for social login users
ALTER TABLE users ADD COLUMN oauth_provider VARCHAR(20);

-- Make password nullable so OAuth-only users don't need one
ALTER TABLE users ALTER COLUMN password DROP NOT NULL;

-- Index on oauth_provider for lookups
CREATE INDEX idx_users_oauth_provider ON users(oauth_provider);
