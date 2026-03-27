# Authentication and Security

This document reflects the current auth behavior in the Spring Boot API.

## Auth Model

- Stateless JWT authentication
- Role model: USER, ADMIN
- Password hashing: BCrypt
- OAuth: Google login supported
- Password reset: request code, verify code, reset password

## Core Endpoints

Public auth endpoints:
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/google
- POST /api/auth/forgot-password
- POST /api/auth/verify-reset-code
- POST /api/auth/reset-password

Profile endpoints (JWT required):
- GET /api/users/me
- PUT /api/users/me
- PUT /api/users/me/password
- POST /api/users/me/avatar

## JWT Notes

- Tokens are signed with HS256 via configured jwt.secret.
- Default expiration is 24h (jwt.expiration in ms).
- API expects Authorization: Bearer <token>.
- Security filter extracts token, validates, and sets Spring Security context.

## Google OAuth Behavior

- API verifies Google ID token with Google tokeninfo endpoint.
- aud claim must match configured google.oauth.client-id.
- Existing users can be linked to Google provider.
- OAuth-only users do not use password login.

## Password Reset Behavior

- Reset code is generated server-side and persisted in password_reset_codes.
- Existing active codes are invalidated before generating a new one.
- Code verification and reset have separate endpoints.
- Successful reset publishes a user password changed event.

## Authorization Rules

Public routes include:
- /api/auth/**
- /api/health
- /api/ping
- /actuator/**
- GET public event and media endpoints

Restricted routes include:
- /api/admin/** requires ADMIN
- Most mutating event/registration/user actions require JWT

## CORS (Cross-Origin Browser Access)

- CORS is enabled in SecurityConfig.
- Allowed origins are controlled by CORS_ALLOWED_ORIGINS env var.
- For Netlify/Vercel deploys, include exact frontend origin(s), comma-separated.
- Example:
  CORS_ALLOWED_ORIGINS=https://tryemconnect.netlify.app

## Operational Security Notes

- Do not keep development secrets in production.
- Rotate exposed credentials immediately (JWT secret, DB password, broker password, SendGrid key).
- Keep /api/test/** disabled or removed in production.

## Related Docs

- [API.md](API.md)
- [DATABASE.md](DATABASE.md)
- [DEPLOY.md](DEPLOY.md)