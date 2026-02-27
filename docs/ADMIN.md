# Admin Panel — EM-Connect

## Overview

The Admin Panel provides a centralised management interface for platform administrators. Only users with the `ADMIN` role can access the panel at `/admin`. Unauthorised users are automatically redirected to `/dashboard`.

---

## Accessing the Panel

| Method          | Detail                                                       |
| --------------- | ------------------------------------------------------------ |
| **URL**         | `/admin`                                                     |
| **Requirement** | Authenticated user with `role = ADMIN`                       |
| **Nav link**    | Appears automatically in the top bar & mobile nav for admins |
| **Protection**  | `ProtectedRoute` with `adminOnly` flag + backend `ROLE_ADMIN` enforcement |

---

## Tabs

### 1. Overview

Displays real-time platform statistics pulled from `GET /api/admin/dashboard`.

| Metric                | Description                                |
| --------------------- | ------------------------------------------ |
| **Total Users**       | All registered accounts                    |
| **Total Events**      | Events in any status                       |
| **Total Registrations** | All registration records                 |
| **Confirmed Registrations** | Currently active (CONFIRMED) registrations |
| **Events by Status**  | Breakdown: Draft / Published / Cancelled / Completed |

### 2. Event Management

Full CRUD and lifecycle control over **all** events on the platform.

#### Listing & Filtering

- Paginated table of all events (15 per page)
- Filter by status: All / Draft / Published / Cancelled / Completed
- Each event card shows: status badge, title, location, start date/time, capacity, organiser name

#### Actions per Event

| Action       | Available When           | API Endpoint                      | Notes                                         |
| ------------ | ------------------------ | --------------------------------- | --------------------------------------------- |
| **Create**   | Always (New Event btn)   | `POST /api/events`                | Opens modal form; event starts as DRAFT       |
| **Edit**     | DRAFT only               | `PUT /api/events/{id}`            | Opens modal pre-filled with current data      |
| **Publish**  | DRAFT only               | `POST /api/events/{id}/publish`   | Transitions DRAFT → PUBLISHED                 |
| **Complete** | PUBLISHED only           | `POST /api/events/{id}/complete`  | Transitions PUBLISHED → COMPLETED             |
| **Cancel**   | DRAFT or PUBLISHED       | `POST /api/events/{id}/cancel`    | Transitions to CANCELLED (terminal)           |
| **Delete**   | Non-PUBLISHED            | `DELETE /api/events/{id}`         | Permanently removes event (confirmation req.) |
| **View Registrations** | Any event    | `GET /api/events/{id}/registrations` | Expandable inline list with status, name, email, ticket code |

#### Event State Machine

```
DRAFT ──► PUBLISHED ──► COMPLETED
  │            │
  │            ▼
  └────────► CANCELLED
```

- **DRAFT**: Editable, not visible to public, no registrations accepted
- **PUBLISHED**: Visible, accepts registrations, not editable
- **CANCELLED**: Terminal — no further transitions
- **COMPLETED**: Terminal — no further transitions

#### Event Form Fields

| Field         | Required | Validation                     |
| ------------- | -------- | ------------------------------ |
| Title         | Yes      | 3–255 characters, not blank    |
| Description   | No       | Max 5 000 characters           |
| Location      | No       | Max 255 characters             |
| Start Date    | Yes      | Must be in the future          |
| End Date      | Yes      | Must be in the future          |
| Capacity      | Yes      | Integer, 1–100 000             |

### 3. User Management

Complete control over platform users.

#### Listing & Search

- All users displayed with: role badge, name, email, OAuth provider indicator, join date
- Client-side search by name, email, or role
- Current user is labelled **(You)** and cannot be demoted

#### Actions

| Action      | Target       | API Endpoint                          | Notes                                  |
| ----------- | ------------ | ------------------------------------- | -------------------------------------- |
| **Promote** | USER → ADMIN | `PUT /api/admin/users/{id}/promote`   | Confirmation dialog before execution   |
| **Demote**  | ADMIN → USER | `PUT /api/admin/users/{id}/demote`    | Confirmation dialog; cannot demote self |

---

## API Endpoints (Admin)

All admin endpoints require `ROLE_ADMIN`. Security is enforced at two levels:

1. **Spring Security** — `/api/admin/**` requires `hasRole("ADMIN")` (SecurityConfig)
2. **Method-level** — `@PreAuthorize("hasRole('ADMIN')")` on promote/demote

| Method | Path                            | Description                    | Response                    |
| ------ | ------------------------------- | ------------------------------ | --------------------------- |
| GET    | `/api/admin/dashboard`          | Platform stats                 | `{ totalUsers, totalEvents, draftEvents, publishedEvents, cancelledEvents, completedEvents, totalRegistrations, confirmedRegistrations }` |
| GET    | `/api/admin/users`              | All users                      | `UserResponse[]`            |
| PUT    | `/api/admin/users/{id}/promote` | Promote user to ADMIN          | `UserResponse`              |
| PUT    | `/api/admin/users/{id}/demote`  | Demote admin to USER           | `UserResponse`              |
| GET    | `/api/admin/events`             | All events (paginated)         | `Page<EventResponse>`       |
| GET    | `/api/admin/events?status=X`    | Events filtered by status      | `Page<EventResponse>`       |

---

## Frontend Architecture

### Files

| File                                       | Purpose                                         |
| ------------------------------------------ | ------------------------------------------------ |
| `frontend/src/pages/Admin.jsx`             | Main admin page with Overview, Events, Users tabs |
| `frontend/src/components/EventFormModal.jsx`| Reusable create/edit event modal                 |
| `frontend/src/components/ProtectedRoute.jsx`| Route guard with `adminOnly` prop               |
| `frontend/src/components/AppLayout.jsx`    | Nav bar with conditional Admin link              |
| `frontend/src/services/api.js`             | Admin API functions                              |

### API Functions (frontend)

```javascript
getAdminDashboard()            // GET /api/admin/dashboard
getAllUsers()                   // GET /api/admin/users
promoteUser(id)                // PUT /api/admin/users/{id}/promote
demoteUser(id)                 // PUT /api/admin/users/{id}/demote
getAdminEvents(page, size, status)  // GET /api/admin/events
```

### Design

- Follows the Bauhaus design system (same theme tokens as all other pages)
- Full dark mode support via `[data-theme='dark']` CSS variables
- Cards with accent bars, uppercase section headers, mono tracking
- Responsive layout with mobile nav support

---

## First Admin Setup

The first admin must be promoted directly in the database:

```sql
UPDATE users SET role = 'ADMIN' WHERE email = 'your-email@example.com';
```

Once an admin exists, they can promote other users through the Admin Panel UI.
