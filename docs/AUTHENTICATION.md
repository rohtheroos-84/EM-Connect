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
        
        if (jwtService.isTokenValid(token, userDetails)) {
            // 5. Create authentication
            UsernamePasswordAuthenticationToken authToken = 
                new UsernamePasswordAuthenticationToken(
                    userDetails, null, userDetails.getAuthorities()
                );
            
            // 6. Set in security context
            SecurityContextHolder.getContext().setAuthentication(authToken);
        }
        
        filterChain.doFilter(request, response);
    }
}
```

---

## Common Security Scenarios

### Scenario 1: User Creates Event

1. User logs in → gets JWT token
2. User calls `POST /api/events` with token
3. `JwtAuthenticationFilter` validates token
4. `EventController.createEvent()` receives request
5. `Authentication.getName()` returns user email
6. `EventService` creates event with that user as organizer

### Scenario 2: User Tries to Edit Another's Event

1. User A creates event (organizer_id = 1)
2. User B calls `PUT /api/events/1` with their token
3. `EventService.updateEvent()` calls `verifyOrganizer()`
4. `verifyOrganizer()` throws `AccessDeniedException`
5. Returns 403 Forbidden

### Scenario 3: Invalid/Expired Token

1. Client sends request with expired token
2. `JwtAuthenticationFilter` tries to validate
3. `JwtService.isTokenExpired()` returns true
4. No authentication set in context
5. `SecurityConfig` rejects: returns 401 Unauthorized

---

## Testing Authentication

### Get a Token

```bash
# Register new user
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123","name":"Test"}'

# Or login as admin
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@emconnect.com","password":"admin123"}'
```

### Use the Token

```bash
# Save token to variable (bash)
TOKEN="eyJhbGciOiJIUzI1NiIs..."

# Make authenticated request
curl http://localhost:8080/api/users/me \
  -H "Authorization: Bearer $TOKEN"
```

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| 401 Unauthorized | Missing/invalid token | Include valid token in header |
| 401 Unauthorized | Token expired | Login again to get new token |
| 403 Forbidden | Insufficient role | Use account with required role |
| 403 Forbidden | Not owner | Only organizer can modify event |

---

## Security Best Practices

1. **Never log/expose JWT secret** - Keep in environment variables
2. **Use HTTPS in production** - Tokens can be intercepted over HTTP
3. **Set appropriate token expiration** - 24 hours is reasonable for dev
4. **Validate all user input** - Use `@Valid` annotations
5. **Don't trust client data** - Always verify ownership server-side
6. **Hash passwords** - Never store plain text passwords
7. **Change default admin password** - In production, change immediately
