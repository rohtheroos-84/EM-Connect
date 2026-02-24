-- Add avatar_url column to users table for profile pictures
ALTER TABLE users ADD COLUMN avatar_url VARCHAR(500);

COMMENT ON COLUMN users.avatar_url IS 'Relative path to user avatar image file';
