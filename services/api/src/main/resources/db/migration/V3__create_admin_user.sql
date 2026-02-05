-- Create an admin user for testing
-- Password is 'admin123' hashed with BCrypt
INSERT INTO users (email, password, name, role, created_at, updated_at)
VALUES (
    'admin@emconnect.com',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeQpRqzjBz.1pBpM1U3yJYW7lpb1VJfKC',
    'Admin User',
    'ADMIN',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT (email) DO NOTHING;