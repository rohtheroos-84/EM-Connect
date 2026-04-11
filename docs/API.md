# API Reference

This is the current endpoint map based on the active controllers in services/api.

## Base URLs

- Local API: http://localhost:8080
- Live API: https://em-connect-backend-api.onrender.com

## Auth Header

Authenticated routes require:

Authorization: Bearer <jwt>

## Public Endpoints

Health:
- GET /api/health
- GET /api/ping

Auth:
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/google
- POST /api/auth/forgot-password
- POST /api/auth/verify-reset-code
- POST /api/auth/reset-password

Event browsing:
- GET /api/events
- GET /api/events/{id}
- GET /api/events/search
- GET /api/events/categories
- GET /api/events/categories/active

Static media:
- GET /api/events/banners/{filename}
- GET /api/users/avatars/{filename}

## Authenticated Endpoints

User profile:
- GET /api/users/me
- PUT /api/users/me
- PUT /api/users/me/password
- POST /api/users/me/avatar

Events (organizer-owned operations):
- GET /api/events/my-events
- POST /api/events
- PUT /api/events/{id}
- DELETE /api/events/{id}
- POST /api/events/{id}/publish
- POST /api/events/{id}/cancel
- POST /api/events/{id}/complete
- POST /api/events/{id}/banner
- GET /api/events/{id}/participants/count

Registrations:
- POST /api/events/{eventId}/register
- POST /api/registrations/{id}/cancel
- GET /api/registrations/my-registrations
- GET /api/registrations/{id}
- GET /api/registrations/ticket/{ticketCode}
- GET /api/events/{eventId}/registration-status
- GET /api/events/{eventId}/registrations

Tickets:
- GET /api/tickets/my
- GET /api/tickets/{code}
- GET /api/tickets/{code}/qr
- POST /api/tickets/{code}/validate (guarded by role check in controller)

Admin:
- GET /api/admin/users
- GET /api/admin/dashboard
- GET /api/admin/events
- PUT /api/admin/users/{id}/promote
- PUT /api/admin/users/{id}/demote
- GET /api/admin/analytics

## Test Endpoints (Keep Disabled in Production)

- POST /api/test/users
- GET /api/test/users
- POST /api/test/concurrent-register

## Common Query Parameters

- Pagination: page, size
- Search/filter: keyword, category, tag
- Registrations: status, activeOnly

## Notes

- API publishes domain events to RabbitMQ for notification, ticket, and websocket services.
- For browser clients on another origin (Netlify/Vercel), API CORS allowlist must include the frontend origin through CORS_ALLOWED_ORIGINS.
- See [AUTHENTICATION.md](AUTHENTICATION.md), [DATABASE.md](DATABASE.md), and [RABBITMQ_TOPOLOGY_DESIGN.md](RABBITMQ_TOPOLOGY_DESIGN.md) for deeper details.

### GET /api/users/me
Get current authenticated user's profile.

**Authentication:** Required

**Response (200 OK):**
```json
{
  "id": 1,
  "email": "user@example.com",
  "name": "John Doe",
  "role": "USER",
  "createdAt": "2024-01-01T10:00:00"
}
```

---

## Admin Endpoints

### GET /api/admin/users
Get all users (admin only).

**Authentication:** Required (ADMIN role)

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "email": "admin@emconnect.com",
    "name": "Admin",
    "role": "ADMIN",
    "createdAt": "2024-01-01T00:00:00"
  },
  {
    "id": 2,
    "email": "user@example.com",
    "name": "John Doe",
    "role": "USER",
    "createdAt": "2024-01-05T10:00:00"
  }
]
```

**Error Responses:**
- `403 Forbidden` - Not an admin

---

## Error Response Format

All errors follow this format:

```json
{
  "status": 404,
  "error": "Not Found",
  "message": "Event not found with id: 999",
  "path": "/api/events/999",
  "timestamp": "2024-01-15T10:30:00"
}
```

### Common Error Codes

| Status | Description |
|--------|-------------|
| 400 | Bad Request - Validation error or business rule violation |
| 401 | Unauthorized - Missing or invalid token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 409 | Conflict - Resource already exists (e.g., duplicate email) |
| 500 | Internal Server Error |

---

## Testing with cURL

### Register
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test User"}'
```

### Login
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### Create Event (with token)
```bash
curl -X POST http://localhost:8080/api/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"title":"My Event","startDate":"2024-06-15T09:00:00","endDate":"2024-06-15T17:00:00","capacity":100}'
```

### Get Published Events
```bash
curl http://localhost:8080/api/events
```

### Publish Event
```bash
curl -X POST http://localhost:8080/api/events/1/publish \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```
