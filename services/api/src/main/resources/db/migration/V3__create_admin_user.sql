-- Create an admin user for testing
-- Password is 'password123' hashed with BCrypt
INSERT INTO users (email, password, name, role, created_at, updated_at)
VALUES (
    'admin@emconnect.com',
    '$2a$10$4ZYtlH4mSzUPji.Nputrv.3qdL6wDFIa0RwQiLuUQRi6vJPuaud4O',
    'Admin User',
    'ADMIN',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT (email) DO NOTHING;