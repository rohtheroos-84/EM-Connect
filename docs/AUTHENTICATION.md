# Authentication and Security

Last updated: 2026-04-19

This document reflects the current auth and access-control behavior in the Spring Boot API and the React frontend.

## Auth Model

- Stateless JWT authentication for API access
- Role model: `USER`, `ADMIN`
- Password hashing: BCrypt
- Google OAuth login with account linking
- Forgot-password flow based on short-lived verification codes
- Login activity capture for successful password and Google sign-ins

## Core Endpoints

Public auth endpoints:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/google`
- `POST /api/auth/forgot-password`
- `POST /api/auth/resend-reset-code`
- `POST /api/auth/verify-reset-code`
- `POST /api/auth/reset-password`

Authenticated profile endpoints:

- `GET /api/users/me`
- `GET /api/users/me/login-activity`
- `PUT /api/users/me`
- `PUT /api/users/me/password`
- `POST /api/users/me/avatar`

## JWT Behavior

- Tokens are signed with HS256 via `jwt.secret`.
- Default expiration is `86400000` milliseconds, which is 24 hours.
- The API expects `Authorization: Bearer <token>`.
- `JwtAuthenticationFilter` validates the token and populates Spring Security's `SecurityContext`.
- The frontend stores the token in `localStorage` as `em_token` and the user snapshot as `em_user`.

## Registration And Login Behavior

### Email/Password

- Registration creates the user, hashes the password, returns a JWT immediately, and publishes a welcome event.
- Login validates credentials, returns a JWT, publishes a login event, and records login activity.
- OAuth-only users cannot use password login because their `password` column is `null`.

### Google OAuth

- The backend verifies the Google ID token using Google's `tokeninfo` endpoint.
- The `aud` claim must match `google.oauth.client-id`.
- A new verified Google user is auto-created with `oauthProvider = "GOOGLE"`.
- Existing email/password accounts can be linked to Google on first successful Google sign-in.
- Successful Google login also records login activity and publishes the same login-type event flow.

## Forgot Password Flow

The current flow is code-based, not link-based.

1. `POST /api/auth/forgot-password` requests a reset code.
2. `POST /api/auth/resend-reset-code` reissues a code with a server-side cooldown.
3. `POST /api/auth/verify-reset-code` validates the code without consuming it.
4. `POST /api/auth/reset-password` consumes the code and writes the new password hash.

Important behavior:

- Codes are 6 digits.
- Codes expire after 15 minutes.
- Resend is throttled with a 30-second cooldown.
- Existing unused codes are invalidated before a new code is issued.
- Responses intentionally do not reveal whether the email exists.
- Successful resets publish a password-changed event for downstream notification email.

## Login Activity

- Successful password and Google sign-ins create a `login_activity` row.
- The API stores login method, source IP, user agent, and timestamp.
- `AuthController` resolves client IP from `X-Forwarded-For`, then `X-Real-IP`, then `request.getRemoteAddr()`.
- The profile endpoint returns a summarized source string rather than raw user-agent details.
- `AuthService` trims stored activity to the latest 100 entries per user.

## Authorization Rules

Public routes include:

- `/api/auth/**`
- `/api/health`
- `/api/ping`
- `/actuator/**`
- `/api/test/**`
- `GET /api/events`
- `GET /api/events/search`
- `GET /api/events/categories`
- `GET /api/events/categories/active`
- `GET /api/events/{id}`
- `GET /api/registrations/ticket/**`
- `GET /api/users/avatars/**`
- `GET /api/events/banners/**`

Restricted routes:

- `/api/admin/**` requires `ADMIN`
- Everything else falls through to authenticated-only access

Current caveats:

- `TicketController.validateTicket()` allows `ADMIN` or `ORGANIZER`, but `ORGANIZER` is not a real role in the current `Role` enum.
- `RegistrationController.getEventRegistrations()` still has a TODO for explicit organizer/admin authorization and currently depends on the general authenticated-route guard.

## Browser CORS Behavior

- CORS is enabled in `SecurityConfig`.
- Allowed origins come from `CORS_ALLOWED_ORIGINS`.
- Default local allowlist: `http://localhost:3000,http://localhost:5173`
- Allowed methods: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `OPTIONS`
- Allowed headers include `Authorization`, `Content-Type`, `Accept`, `Origin`, and `X-Requested-With`
- Credentials are allowed

Example production value:

```text
CORS_ALLOWED_ORIGINS=https://tryemconnect.netlify.app
```

## Operational Security Notes

- `application-prod.yml` should not be treated as a safe place for live secrets. Prefer environment variables from the hosting platform.
- `/api/test/**` is still public in the current security config and should be removed or disabled in production deployments.
- File-backed avatar, banner, and ticket asset storage is convenient but not yet a durable shared-storage design.

## Related Docs

- [API.md](API.md)
- [DATABASE.md](DATABASE.md)
- [DEPLOY.md](DEPLOY.md)
- [SECURITY_AUDIT.md](SECURITY_AUDIT.md)
