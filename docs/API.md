# API Reference

Last updated: 2026-04-19

This is the active controller-level API map for `services/api`.

## Base URLs

- Local API: `http://localhost:8080`
- Live API: `https://em-connect-backend-api.onrender.com`

Browser clients typically use the `/api` prefix through the frontend URL helpers.

## Auth Header

Authenticated requests require:

```text
Authorization: Bearer <jwt>
```

## Response Patterns

- Most list endpoints return Spring `Page<T>` JSON with keys like `content`, `totalElements`, `totalPages`, `number`, and `size`.
- File upload endpoints use `multipart/form-data`.
- QR image responses return `image/png`.
- Error responses are normalized by the global exception handler into the usual Spring-style JSON shape with `status`, `error`, `message`, `path`, and `timestamp`.

## Public Endpoints

### Health

- `GET /api/health`
- `GET /api/ping`
- `GET /actuator/health`

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/google`
- `POST /api/auth/forgot-password`
- `POST /api/auth/resend-reset-code`
- `POST /api/auth/verify-reset-code`
- `POST /api/auth/reset-password`

### Event Browsing

- `GET /api/events`
- `GET /api/events/{id}`
- `GET /api/events/search`
- `GET /api/events/categories`
- `GET /api/events/categories/active`

### Public Lookups And Media

- `GET /api/registrations/ticket/{ticketCode}`
- `GET /api/events/banners/{filename}`
- `GET /api/users/avatars/{filename}`

## Authenticated Endpoints

### User Profile

- `GET /api/users/me`
- `GET /api/users/me/login-activity`
- `PUT /api/users/me`
- `PUT /api/users/me/password`
- `POST /api/users/me/avatar`

Notes:

- `GET /api/users/me/login-activity` returns recent sign-in entries with `timestamp`, `loginMethod`, and a summarized `source`.
- Avatar upload is file-backed and currently stored on disk under the API service.

### Events

- `POST /api/events`
- `GET /api/events/my-events`
- `PUT /api/events/{id}`
- `DELETE /api/events/{id}`
- `POST /api/events/{id}/publish`
- `POST /api/events/{id}/cancel`
- `POST /api/events/{id}/complete`
- `GET /api/events/{id}/participants/count`
- `POST /api/events/{id}/banner`

Notes:

- Public event listing and search only surface published events.
- Search supports `keyword`, `category`, `tag`, `page`, and `size`.
- Banner upload is also file-backed and currently served by the API.

### Registrations

- `POST /api/events/{eventId}/register`
- `POST /api/registrations/{id}/cancel`
- `GET /api/registrations/my-registrations`
- `GET /api/registrations/{id}`
- `GET /api/events/{eventId}/registration-status`
- `GET /api/events/{eventId}/registrations`

Notes:

- `GET /api/registrations/my-registrations` supports `page`, `size`, `status`, and legacy `activeOnly`.
- `GET /api/events/{eventId}/registrations` is intended for organizers/admins, but the controller still carries a TODO and currently relies on the general authenticated-route guard rather than an explicit ownership/role check.

### Tickets

- `GET /api/tickets/my`
- `GET /api/tickets/{code}`
- `GET /api/tickets/{code}/qr`
- `POST /api/tickets/{code}/validate`

Notes:

- Ticket reads are user-scoped and require the authenticated ticket owner.
- Validation is annotated with `hasAnyRole('ADMIN', 'ORGANIZER')`, but the current `Role` enum only contains `USER` and `ADMIN`, so this is effectively admin-only today.

### Admin

- `GET /api/admin/users`
- `GET /api/admin/dashboard`
- `GET /api/admin/events`
- `PUT /api/admin/users/{id}/promote`
- `PUT /api/admin/users/{id}/demote`
- `GET /api/admin/analytics`

`/api/admin/**` is role-protected in `SecurityConfig`.

## Test Endpoints

These routes are still public in the current security config and should stay disabled or removed outside controlled development use:

- `POST /api/test/users`
- `GET /api/test/users`
- `POST /api/test/concurrent-register`

## Common Query Parameters

- Pagination: `page`, `size`
- Event search: `keyword`, `category`, `tag`
- User registrations: `status`, `activeOnly`
- Admin events: `status`, `page`, `size`

## Example Success Shapes

### `GET /api/users/me`

```json
{
  "id": 1,
  "email": "user@example.com",
  "name": "John Doe",
  "role": "USER",
  "avatarUrl": "/api/users/avatars/avatar-123.png",
  "createdAt": "2026-04-01T10:00:00"
}
```

### `GET /api/users/me/login-activity`

```json
[
  {
    "timestamp": "2026-04-19T09:10:00",
    "loginMethod": "PASSWORD",
    "source": "127.0.0.1 - Chrome on Windows"
  }
]
```

## Related Docs

- [AUTHENTICATION.md](AUTHENTICATION.md)
- [DATABASE.md](DATABASE.md)
- [RABBITMQ_TOPOLOGY_DESIGN.md](RABBITMQ_TOPOLOGY_DESIGN.md)
- [SECURITY_AUDIT.md](SECURITY_AUDIT.md)
