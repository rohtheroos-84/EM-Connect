# API Reference

Base URL: `http://localhost:8080`

## Authentication

All authenticated endpoints require the JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

---

## Health Endpoints

### GET /api/health
Health check endpoint.

**Authentication:** None

**Response:**
```json
{
  "status": "healthy",
  "service": "api"
}
```

### GET /api/ping
Simple ping endpoint.

**Authentication:** None

**Response:**
```
pong
```

---

## Auth Endpoints

### POST /api/auth/register
Register a new user account.

**Authentication:** None

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| email | string | Yes | Valid email format, unique |
| password | string | Yes | Min 6 characters |
| name | string | Yes | Not blank |

**Response (201 Created):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "USER"
}
```

**Error Responses:**
- `400 Bad Request` - Validation failed
- `409 Conflict` - Email already exists

---

### POST /api/auth/login
Authenticate and receive a JWT token.

**Authentication:** None

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "USER"
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid credentials

---

## Event Endpoints

### GET /api/events
Get all published events (paginated).

**Authentication:** None (public)

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | int | 0 | Page number (0-indexed) |
| size | int | 10 | Items per page |

**Response (200 OK):**
```json
{
  "content": [
    {
      "id": 1,
      "title": "Tech Conference 2024",
      "description": "Annual tech conference",
      "location": "Convention Center",
      "startDate": "2024-06-15T09:00:00",
      "endDate": "2024-06-15T17:00:00",
      "capacity": 500,
      "status": "PUBLISHED",
      "organizerId": 1,
      "organizerName": "John Doe",
      "createdAt": "2024-01-10T10:00:00",
      "updatedAt": "2024-01-12T14:30:00"
    }
  ],
  "totalElements": 25,
  "totalPages": 3,
  "number": 0,
  "size": 10
}
```

---

### GET /api/events/{id}
Get a single event by ID.

**Authentication:** None (public for published events)

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| id | Long | Event ID |

**Response (200 OK):**
```json
{
  "id": 1,
  "title": "Tech Conference 2024",
  "description": "Annual tech conference",
  "location": "Convention Center",
  "startDate": "2024-06-15T09:00:00",
  "endDate": "2024-06-15T17:00:00",
  "capacity": 500,
  "status": "PUBLISHED",
  "organizerId": 1,
  "organizerName": "John Doe",
  "createdAt": "2024-01-10T10:00:00",
  "updatedAt": "2024-01-12T14:30:00"
}
```

**Error Responses:**
- `404 Not Found` - Event not found

---

### GET /api/events/search
Search published events by keyword in title.

**Authentication:** None (public)

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| keyword | string | Yes | Search term |
| page | int | No | Page number (default: 0) |
| size | int | No | Items per page (default: 10) |

**Example:** `GET /api/events/search?keyword=tech&page=0&size=10`

**Response:** Same pagination format as GET /api/events

---

### GET /api/events/my-events
Get events created by the authenticated user.

**Authentication:** Required

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | int | 0 | Page number |
| size | int | 10 | Items per page |

**Response:** Same pagination format, includes all statuses (DRAFT, PUBLISHED, etc.)

---

### POST /api/events
Create a new event.

**Authentication:** Required

**Request Body:**
```json
{
  "title": "My Event",
  "description": "Event description",
  "location": "123 Main St",
  "startDate": "2024-06-15T09:00:00",
  "endDate": "2024-06-15T17:00:00",
  "capacity": 100
}
```

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| title | string | Yes | Not blank, max 255 chars |
| description | string | No | - |
| location | string | No | Max 255 chars |
| startDate | datetime | Yes | ISO 8601 format |
| endDate | datetime | Yes | Must be after startDate |
| capacity | int | No | Default: 0 |

**Response (201 Created):**
```json
{
  "id": 5,
  "title": "My Event",
  "status": "DRAFT",
  ...
}
```

> **Note:** Events are always created with status `DRAFT`

**Error Responses:**
- `400 Bad Request` - Validation failed
- `401 Unauthorized` - Not authenticated

---

### PUT /api/events/{id}
Update an event (partial update supported).

**Authentication:** Required (must be organizer)

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| id | Long | Event ID |

**Request Body:** (all fields optional)
```json
{
  "title": "Updated Title",
  "description": "New description",
  "location": "New location",
  "startDate": "2024-07-15T09:00:00",
  "endDate": "2024-07-15T17:00:00",
  "capacity": 200
}
```

**Response (200 OK):** Updated event

**Error Responses:**
- `400 Bad Request` - Validation failed or cannot edit (wrong state)
- `403 Forbidden` - Not the organizer
- `404 Not Found` - Event not found

> **Note:** Can only edit events in DRAFT or PUBLISHED status

---

### DELETE /api/events/{id}
Delete an event.

**Authentication:** Required (must be organizer)

**Response (200 OK):**
```json
{
  "message": "Event deleted successfully"
}
```

**Error Responses:**
- `400 Bad Request` - Can only delete DRAFT events
- `403 Forbidden` - Not the organizer
- `404 Not Found` - Event not found

> **Note:** Only DRAFT events can be deleted. Use cancel for published events.

---

### POST /api/events/{id}/publish
Publish a draft event (makes it visible to users).

**Authentication:** Required (must be organizer)

**State Transition:** `DRAFT → PUBLISHED`

**Response (200 OK):** Updated event with status "PUBLISHED"

**Error Responses:**
- `400 Bad Request` - Invalid state transition
- `403 Forbidden` - Not the organizer
- `404 Not Found` - Event not found

---

### POST /api/events/{id}/cancel
Cancel an event.

**Authentication:** Required (must be organizer)

**State Transition:** `DRAFT → CANCELLED` or `PUBLISHED → CANCELLED`

**Response (200 OK):** Updated event with status "CANCELLED"

**Error Responses:**
- `400 Bad Request` - Invalid state transition
- `403 Forbidden` - Not the organizer
- `404 Not Found` - Event not found

---

### POST /api/events/{id}/complete
Mark an event as completed.

**Authentication:** Required (must be organizer)

**State Transition:** `PUBLISHED → COMPLETED`

**Response (200 OK):** Updated event with status "COMPLETED"

**Error Responses:**
- `400 Bad Request` - Invalid state transition
- `403 Forbidden` - Not the organizer
- `404 Not Found` - Event not found

---

## User Endpoints

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
