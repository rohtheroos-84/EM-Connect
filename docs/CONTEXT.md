# CONTEXT.md — Full Project Context for AI Assistants

> **Purpose:** This document provides complete context about the EM-Connect codebase so that AI assistants can understand the entire project without re-reading every file. Feed this document at the start of any new AI chat session.
>
> **Last Updated:** 2026-03-03

---

## Table of Contents

- [1. Project Identity](#1-project-identity)
- [2. Tech Stack](#2-tech-stack)
- [3. Architecture Overview](#3-architecture-overview)
- [4. Service Map & Ports](#4-service-map--ports)
- [5. Directory Structure](#5-directory-structure)
- [6. Database Schema](#6-database-schema)
- [7. API Endpoints (Complete)](#7-api-endpoints-complete)
- [8. Event-Driven Architecture (RabbitMQ)](#8-event-driven-architecture-rabbitmq)
- [9. Go Workers (Notification, Ticket, WebSocket)](#9-go-workers-notification-ticket-websocket)
- [10. Frontend (React/Vite)](#10-frontend-reactvite)
- [11. Authentication & Security](#11-authentication--security)
- [12. Bauhaus Design System](#12-bauhaus-design-system)
- [13. Key Patterns & Decisions](#13-key-patterns--decisions)
- [14. Configuration & Environment](#14-configuration--environment)
- [15. Current Feature Status](#15-current-feature-status)
- [16. Known Gaps & Future Work](#16-known-gaps--future-work)
- [17. How to Run](#17-how-to-run)
- [18. Other Docs Index](#18-other-docs-index)

---

## 1. Project Identity

**EM-Connect** is an Event Management System built as a learning project. It supports event creation, user registration for events, ticket generation with QR codes, real-time updates via WebSocket, and email notifications — all wired together through an event-driven architecture.

- **Creator:** Rohit
- **Repository:** Monorepo — all services live under one folder
- **Default Admin:** `admin@emconnect.com` / `admin123`

---

## 2. Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Backend API** | Java 17, Spring Boot | 3.2.2 |
| **Database** | PostgreSQL | 16 |
| **Migrations** | Flyway | (bundled with Spring Boot) |
| **Message Broker** | RabbitMQ | 3.13 (management UI) |
| **Notification Worker** | Go | 1.25 |
| **Ticket Worker** | Go | 1.25 |
| **WebSocket Hub** | Go | 1.25 |
| **Frontend** | React 19, Vite 6, Tailwind CSS 4 | — |
| **UI Components** | Lucide React (icons), Recharts (analytics) | — |
| **Auth** | JWT (JJWT 0.12.5), Google OAuth2 | — |
| **Email (dev)** | MailHog (Docker, `dev` profile) | — |
| **Email (prod)** | SendGrid HTTP API | — |
| **Containerization** | Docker Compose | — |

---

## 3. Architecture Overview

```
┌──────────────┐   HTTP/REST    ┌──────────────────┐      JDBC       ┌────────────┐
│   Frontend   │───────────────▶│  Spring Boot API │───────────────▶│ PostgreSQL │
│  (React/Vite)│◀───────────────│    (port 8080)   │◀───────────────│ (port 5432)│
│  port 3000   │   JSON         └────────┬─────────┘                └────────────┘
└──────┬───────┘                         │
       │                                 │ AMQP (publish)
       │ WebSocket                       ▼
       │                         ┌──────────────┐
       │                         │   RabbitMQ   │
       │                         │  (port 5672) │
       │                         │  UI: 15672   │
       │                         └──┬────┬────┬─┘
       │                            │    │    │
       │              ┌─────────────┘    │    └─────────────┐
       │              ▼                  ▼                  ▼
       │    ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
       │    │ Notification │   │    Ticket     │   │  WebSocket   │
       │    │   Worker     │   │    Worker     │   │     Hub      │
       │    │   (Go)       │   │    (Go)       │   │   (Go)       │
       │    └──────┬───────┘   └──────┬───────┘   │  port 8081   │
       │           │                  │            └──────┬───────┘
       │           ▼                  ▼                   │
       │     ┌──────────┐      ┌──────────┐              │
       │     │  SMTP /   │     │ QR Files │              │
       │     │ SendGrid  │     │ (disk)   │              │
       │     └──────────┘      └──────────┘              │
       │                                                  │
       └──────────────── WebSocket (ws://) ───────────────┘
```

**Request Flows:**

1. **User registration for event:** Frontend → API (pessimistic lock on event row) → save registration → publish `registration.confirmed` to RabbitMQ → **3 consumers**: notification-worker (sends email), ticket-worker (generates QR), websocket-hub (broadcasts live participant count to subscribed clients)
2. **Event lifecycle:** API publishes `event.published` / `event.cancelled` → notification-worker (emails organizer/attendees), websocket-hub (broadcasts to all connected clients)

---

## 4. Service Map & Ports

| Service | Port | Purpose |
|---------|------|---------|
| Spring Boot API | 8080 | REST API, auth, event CRUD, registration, tickets |
| PostgreSQL | 5432 | Primary database |
| RabbitMQ AMQP | 5672 | Message broker (service connections) |
| RabbitMQ Management | 15672 | Broker web UI (guest: `emconnect`/`emconnect`) |
| WebSocket Hub (Go) | 8081 | Real-time WebSocket server, HTTP /health, /stats |
| Notification Worker (Go) | — | No port; pure RabbitMQ consumer → sends emails |
| Ticket Worker (Go) | — | No port; pure RabbitMQ consumer → generates QR PNGs |
| MailHog SMTP | 1025 | Dev-only SMTP sink |
| MailHog Web UI | 8025 | Dev-only email viewer |
| Vite Dev Server | 3000 | Frontend; proxies `/api` → 8080, `/ws` → 8081 |

---

## 5. Directory Structure

```
EM-Connect/
├── docker-compose.yaml              # PostgreSQL 16, RabbitMQ 3.13, MailHog (dev profile)
├── README.md
├── docs/
│   ├── ADMIN.md                     # Admin panel docs
│   ├── API.md                       # API reference (partially outdated — see Section 7 below)
│   ├── ARCHITECTURE.md              # Architecture diagrams
│   ├── AUTHENTICATION.md            # JWT + security deep dive
│   ├── CODE.md                      # Source code file descriptions
│   ├── CONTEXT.md                   # THIS FILE
│   ├── DATABASE.md                  # Schema reference
│   ├── EVENT_STATES.md              # State machine docs
│   ├── FUTURE.md                    # Feature roadmap
│   ├── NOTES.md                     # Dev journal / learning notes
│   ├── OVERVIEW.md                  # Project overview (early phase)
│   ├── PLAN.md                      # Phased learning plan
│   └── RABBITMQ_TOPOLOGY_DESIGN.md  # Exchange/queue/binding spec
│
├── frontend/                        # React 19 + Vite 6 + Tailwind 4
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── main.jsx                 # Root: BrowserRouter → ThemeProvider → AuthProvider → WebSocketProvider → ToastProvider → App
│       ├── App.jsx                  # Routes: public, protected, admin
│       ├── index.css                # Bauhaus design tokens, dark mode, animations
│       ├── components/
│       │   ├── AppLayout.jsx        # Navbar, footer, LIVE indicator, theme toggle, mobile nav
│       │   ├── EventFormModal.jsx   # Create/Edit event modal
│       │   ├── LiveAnnouncements.jsx # Headless WS→Toast bridge
│       │   ├── ProtectedRoute.jsx   # Auth + role gate (supports adminOnly prop)
│       │   ├── ThemeToggle.jsx      # Dark/light toggle button
│       │   └── TicketModal.jsx      # QR code display + download modal
│       ├── context/
│       │   ├── AuthContext.jsx      # Auth state, login/register/logout/googleLogin/refreshUser
│       │   ├── ThemeContext.jsx     # Theme state, dark mode, force-light on auth pages
│       │   ├── ToastContext.jsx     # Toast notifications (info/published/cancelled types)
│       │   └── WebSocketContext.jsx # WS connection, subscriptions, listeners, reconnect
│       ├── pages/
│       │   ├── Admin.jsx            # 3-tab admin: Overview, Events (full CRUD), Users (promote/demote)
│       │   ├── Analytics.jsx        # Recharts dashboard: trends, popular events, peak hours, etc.
│       │   ├── Dashboard.jsx        # User dashboard: stats, upcoming events, registrations
│       │   ├── EventDetail.jsx      # Event detail: live capacity bar, WS updates, register/cancel
│       │   ├── EventList.jsx        # Public event browsing with debounced search, pagination
│       │   ├── Login.jsx            # Bauhaus split-panel login + Google OAuth
│       │   ├── MyRegistrations.jsx  # User's registrations: QR, calendar export, cancel
│       │   ├── Profile.jsx          # Avatar, name edit, password change, registration stats
│       │   └── Register.jsx         # Bauhaus split-panel register + password strength meter
│       └── services/
│           ├── api.js               # Central HTTP client, all API functions, JWT injection
│           └── calendar.js          # ICS generation, Google Calendar URL
│
└── services/
    ├── api/                         # Spring Boot 3.2.2 (Java 17)
    │   ├── pom.xml                  # Maven dependencies
    │   ├── avatars/                 # Uploaded avatar images (git-ignored runtime directory)
    │   └── src/
    │       ├── main/java/com/emconnect/api/
    │       │   ├── ApiApplication.java
    │       │   ├── config/
    │       │   │   ├── SecurityConfig.java          # Spring Security filter chain
    │       │   │   ├── JwtAuthenticationFilter.java # JWT extraction + validation filter
    │       │   │   └── RabbitMQConfig.java          # Exchange/queue/binding declarations
    │       │   ├── controller/
    │       │   │   ├── AuthController.java          # /api/auth (register, login, google)
    │       │   │   ├── EventController.java         # /api/events (CRUD, state transitions)
    │       │   │   ├── RegistrationController.java  # /api/events/{id}/register, /api/registrations
    │       │   │   ├── TicketController.java        # /api/tickets (my, QR, validate)
    │       │   │   ├── UserController.java          # /api/users/me (profile, avatar, password)
    │       │   │   ├── AdminController.java         # /api/admin (dashboard, users, events, analytics)
    │       │   │   ├── HealthController.java        # /api/health, /api/ping
    │       │   │   ├── UserTestController.java      # /api/test (dev only)
    │       │   │   └── TestConcurrencyController.java # /api/test concurrent registration test
    │       │   ├── dto/                             # 12 DTOs: request/response objects
    │       │   ├── entity/                          # User, Event, Registration + enums
    │       │   ├── event/                           # 5 domain event classes (RabbitMQ payloads)
    │       │   ├── exception/                       # GlobalExceptionHandler + 6 custom exceptions
    │       │   ├── repository/                      # 3 JPA repositories with custom queries + analytics
    │       │   └── service/                         # 7 service classes (AuthService, EventService, etc.)
    │       └── main/resources/
    │           ├── application.yml                  # All configuration
    │           └── db/migration/                    # V1-V7 Flyway SQL migrations
    │
    ├── notification-worker/         # Go 1.25 — email notifications
    │   ├── main.go                  # Entry: config → email → handler → consumer
    │   ├── config/config.go         # Env-based config
    │   ├── consumer/consumer.go     # RabbitMQ consumer with manual ACK, DLQ
    │   ├── email/email.go           # SendGrid HTTP API, retry logic
    │   ├── handler/handler.go       # Routes events → renders template → sends email
    │   ├── model/events.go          # Go structs + Java↔Go timestamp unmarshalers
    │   └── templates/templates.go   # Bauhaus-branded HTML email templates (5 templates)
    │
    ├── ticket-worker/               # Go 1.25 — QR ticket generation
    │   ├── main.go
    │   ├── config/config.go
    │   ├── consumer/consumer.go     # Binds only registration.confirmed
    │   ├── handler/handler.go       # Only handles REGISTRATION_CONFIRMED
    │   ├── model/events.go
    │   ├── qr/generator.go          # QR PNG generation (skip2/go-qrcode)
    │   ├── ticket/service.go        # HMAC-SHA256 signing, idempotent generation, metadata
    │   └── tickets/                 # Runtime output: qr/ (PNG files), metadata/ (JSON files)
    │
    └── websocket-hub/               # Go 1.25 — real-time WebSocket server
        ├── main.go                  # HTTP server on :8081 (/ws, /health, /stats)
        ├── test.html                # Browser-based WS test dashboard
        ├── config/config.go
        ├── consumer/consumer.go     # Binds all 4 routing keys
        ├── handler/handler.go       # Routes events → broadcasts to WS clients
        ├── hub/
        │   ├── hub.go               # Core hub: register/unregister/broadcast channels, topic map
        │   ├── client.go            # Per-client ReadPump/WritePump goroutines, ping/pong
        │   └── message.go           # Message type definitions (client↔server)
        └── model/events.go
```

---

## 6. Database Schema

**Database:** PostgreSQL 16 — `emconnect` / `emconnect` / `emconnect`
**Migrations:** Flyway V1–V7 (auto-run on API startup)

### Tables

#### `users`
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | BIGSERIAL | PK |
| `email` | VARCHAR(255) | NOT NULL, UNIQUE |
| `password` | VARCHAR(255) | **Nullable** (OAuth users) |
| `name` | VARCHAR(100) | NOT NULL |
| `role` | VARCHAR(20) | NOT NULL, default `'USER'` — values: `USER`, `ADMIN` |
| `avatar_url` | VARCHAR(500) | Nullable |
| `oauth_provider` | VARCHAR(20) | Nullable (e.g. `'GOOGLE'`) |
| `created_at` | TIMESTAMP | NOT NULL |
| `updated_at` | TIMESTAMP | NOT NULL |

**Indexes:** `idx_users_email`, `idx_users_oauth_provider`

#### `events`
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | BIGSERIAL | PK |
| `title` | VARCHAR(255) | NOT NULL |
| `description` | TEXT | Nullable |
| `location` | VARCHAR(255) | Nullable |
| `start_date` | TIMESTAMP | NOT NULL |
| `end_date` | TIMESTAMP | NOT NULL |
| `capacity` | INTEGER | NOT NULL, default 0 |
| `status` | VARCHAR(20) | NOT NULL, default `'DRAFT'` — values: `DRAFT`, `PUBLISHED`, `CANCELLED`, `COMPLETED` |
| `organizer_id` | BIGINT | NOT NULL, FK → `users(id)` |
| `created_at` | TIMESTAMP | NOT NULL |
| `updated_at` | TIMESTAMP | NOT NULL |

**Indexes:** `idx_events_organizer`, `idx_events_status`, `idx_events_start_date`

#### `registrations`
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | BIGSERIAL | PK |
| `user_id` | BIGINT | NOT NULL, FK → `users(id)` ON DELETE CASCADE |
| `event_id` | BIGINT | NOT NULL, FK → `events(id)` ON DELETE CASCADE |
| `status` | VARCHAR(20) | NOT NULL, default `'CONFIRMED'` — values: `CONFIRMED`, `CANCELLED`, `ATTENDED`, `NO_SHOW` |
| `ticket_code` | VARCHAR(50) | UNIQUE, format `TKT-{UUID8}` |
| `registered_at` | TIMESTAMP | NOT NULL |
| `cancelled_at` | TIMESTAMP | Nullable |
| `checked_in_at` | TIMESTAMP | Nullable |
| `created_at` | TIMESTAMP | NOT NULL |
| `updated_at` | TIMESTAMP | NOT NULL |

**Constraints:** Unique on `(user_id, event_id)`
**Indexes:** `idx_reg_user`, `idx_reg_event`, `idx_reg_status`, `idx_reg_ticket_code`

### Entity Relationships
```
users 1:N events        (organizer_id)
users 1:N registrations (user_id)
events 1:N registrations (event_id)
```

### State Machine — Event Status
```
DRAFT → PUBLISHED → COMPLETED
  │          │
  └──────────┴──→ CANCELLED (terminal)
```
- DRAFT: Only organizer sees it. Editable. Deletable.
- PUBLISHED: Public. Accepts registrations. Editable. NOT deletable (cancel instead).
- CANCELLED: Terminal. No edits. No further transitions.
- COMPLETED: Terminal. No edits. No further transitions.

### Seeded Data (V3)
- Admin user: `admin@emconnect.com` / `admin123` / ADMIN role

---

## 7. API Endpoints (Complete)

Base URL: `http://localhost:8080`

### Auth — `/api/auth`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | Public | Register (email, password, name) → JWT |
| POST | `/api/auth/login` | Public | Login (email, password) → JWT |
| POST | `/api/auth/google` | Public | Google OAuth login/register (credential) → JWT |

### Events — `/api/events`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/events` | Public | Published events (paginated) |
| GET | `/api/events/{id}` | Public | Single event detail |
| GET | `/api/events/search?keyword=` | Public | Search published events by title |
| GET | `/api/events/my-events` | Authenticated | Organizer's own events |
| POST | `/api/events` | Authenticated | Create event (starts as DRAFT) |
| PUT | `/api/events/{id}` | Owner | Update DRAFT event (partial update) |
| DELETE | `/api/events/{id}` | Owner | Delete DRAFT or CANCELLED event |
| POST | `/api/events/{id}/publish` | Owner | DRAFT → PUBLISHED (validates future date) |
| POST | `/api/events/{id}/cancel` | Owner | PUBLISHED → CANCELLED |
| POST | `/api/events/{id}/complete` | Owner | PUBLISHED → COMPLETED |
| GET | `/api/events/{id}/participants/count` | Authenticated | Participant count + capacity JSON |

### Registrations — `/api/registrations` & `/api/events/{id}`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/events/{eventId}/register` | Authenticated | Register for event (pessimistic lock) |
| POST | `/api/registrations/{id}/cancel` | Owner | Cancel registration |
| GET | `/api/registrations/my-registrations?activeOnly=` | Authenticated | User's registrations (paginated, filterable) |
| GET | `/api/registrations/{id}` | Owner | Single registration |
| GET | `/api/registrations/ticket/{ticketCode}` | Public | Lookup registration by ticket code |
| GET | `/api/events/{eventId}/registration-status` | Authenticated | User's registration status for event + total count |
| GET | `/api/events/{eventId}/registrations` | Authenticated | Event's registrations (organizer view) |

### Tickets — `/api/tickets`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/tickets/my` | Authenticated | All user's tickets with `qrReady` flag |
| GET | `/api/tickets/{code}` | Owner/Admin/Organizer | Single ticket detail |
| GET | `/api/tickets/{code}/qr` | Owner/Admin | QR code PNG image download |
| POST | `/api/tickets/{code}/validate` | `@PreAuthorize ADMIN/ORGANIZER` | Check-in (idempotent) |

### Users — `/api/users`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/users/me` | Authenticated | Current user profile |
| PUT | `/api/users/me` | Authenticated | Update profile (name) |
| PUT | `/api/users/me/password` | Authenticated | Change password |
| POST | `/api/users/me/avatar` | Authenticated | Upload avatar (JPEG/PNG/GIF/WebP, ≤2MB) |
| GET | `/api/users/avatars/{filename}` | Public | Serve avatar image |

### Admin — `/api/admin` (ADMIN role required)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/admin/dashboard` | ADMIN | Platform stats |
| GET | `/api/admin/users` | ADMIN | All users |
| GET | `/api/admin/events?status=` | ADMIN | All events (paginated, filterable by status) |
| PUT | `/api/admin/users/{id}/promote` | ADMIN | Promote user → ADMIN |
| PUT | `/api/admin/users/{id}/demote` | ADMIN | Demote admin → USER |
| GET | `/api/admin/analytics` | ADMIN | Rich analytics (10 datasets) |

### Health
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/health` | Public | Health check JSON |
| GET | `/api/ping` | Public | Returns "pong" |

### Test (dev only)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/test/users` | Public | Create test user |
| GET | `/api/test/users` | Public | List all users |
| POST | `/api/test/concurrent-register` | Public | Concurrent registration stress test |

---

## 8. Event-Driven Architecture (RabbitMQ)

### Topology
```
Producer (Spring Boot API)
         │
         ▼
   ┌──────────────┐        em.events (topic exchange, durable)
   │   em.events   │───┬──────────────────────┬──────────────────────┐
   └──────────────┘   │                      │                      │
                       ▼                      ▼                      ▼
              notification.queue       ticket.queue          websocket.queue
              (registration.*,       (registration.confirmed  (event.published,
               event.*)               ONLY)                    event.cancelled,
                                                               registration.confirmed,
              ┌──────────────┐                                 registration.cancelled)
              │ Notification │       ┌──────────────┐       ┌──────────────┐
              │   Worker     │       │ Ticket Worker│       │ WebSocket Hub│
              └──────────────┘       └──────────────┘       └──────────────┘
                                          │
                     On failure:          │
                         ▼                ▼
              ┌──────────────────────────────────┐
              │   em.events.dlx (topic, durable) │
              └────────────┬─────────────────────┘
                           ▼
                      em.events.dlq
                    (catch-all with #)
```

### Routing Keys
| Key | Published When | Consumers |
|-----|---------------|-----------|
| `registration.confirmed` | User registers for event | notification, ticket, websocket |
| `registration.cancelled` | User cancels registration | notification, websocket |
| `event.published` | Event transitions to PUBLISHED | notification, websocket |
| `event.cancelled` | Event transitions to CANCELLED | notification, websocket |

### Domain Event Payloads
| Event Type | Key Fields |
|-----------|-----------|
| `REGISTRATION_CONFIRMED` | registrationId, userId, userEmail, userName, eventId, eventTitle, eventLocation, eventStartDate, eventEndDate, ticketCode, currentParticipants |
| `REGISTRATION_CANCELLED` | registrationId, userId, userEmail, userName, eventId, eventTitle, cancelledAt, currentParticipants |
| `EVENT_PUBLISHED` | eventId, eventTitle, eventDescription, eventLocation, startDate, endDate, capacity, organizerId, organizerName, organizerEmail |
| `EVENT_CANCELLED` | eventId, eventTitle, originalStartDate, organizerId, organizerEmail, affectedRegistrations |

### Dead Letter Queue
- On consumer handler error → message published to `em.events.dlx` with headers: `x-original-routing-key`, `x-error-message`, `x-original-exchange`
- Original message is ACKed (removed from main queue)
- `em.events.dlq` catches all DLX messages (bound with `#`)

---

## 9. Go Workers (Notification, Ticket, WebSocket)

### Shared Patterns (all 3 services)
- **Startup:** Load config from env → create dependencies → `connectWithRetry` (5 attempts, exponential backoff) → start consumer
- **Shutdown:** Listen for `SIGINT`/`SIGTERM` → call `consumer.Close()` (channel + connection)
- **Consumer:** Manual ACK, prefetch count 10, self-declares queue topology (exchange, queue, DLQ)
- **DLQ:** On handler error → publish to DLQ exchange with error headers → ACK original
- **Timestamp handling:** Custom `Timestamp` and `LocalDateTime` JSON unmarshalers handle Java epoch seconds, datetime arrays `[y,m,d,h,m,s]`, and various string formats

### Notification Worker
- **Queue:** `notification.queue` — binds `registration.*` + `event.*`
- **Handles:** `REGISTRATION_CONFIRMED`, `REGISTRATION_CANCELLED`, `EVENT_PUBLISHED`, `EVENT_CANCELLED`, `EVENT_REMINDER`
- **Email:** SendGrid HTTP API (raw HTTP, no SDK). Retry with linear backoff.
- **Templates:** 5 Bauhaus-branded HTML email templates embedded in Go code. Shared header/footer layout with tri-color brand bar matching frontend design.

### Ticket Worker
- **Queue:** `ticket.queue` — binds only `registration.confirmed`
- **Handles:** `REGISTRATION_CONFIRMED` only
- **Pipeline:** Create payload → HMAC-SHA256 sign (`ticketCode:eventID:userID:eventDate`) → marshal JSON → generate QR PNG → save metadata JSON
- **Idempotent:** Checks if QR + metadata already exist before generating
- **Output:** `tickets/qr/{ticketCode}.png` and `tickets/metadata/{ticketCode}.json`
- **Verification:** `hmac.Equal` (constant-time comparison) prevents timing attacks

### WebSocket Hub
- **Queue:** `websocket.queue` — binds all 4 routing keys
- **HTTP Server:** Port 8081 — `/ws` (upgrade), `/health`, `/stats`
- **Hub Pattern:** Go channels for register/unregister/broadcast. `sync.RWMutex` on topic map.
- **Client:** Per-client `ReadPump`/`WritePump` goroutines. Ping/pong (54s/60s). Send buffer: 256 messages. Slow clients disconnected.
- **Topic Subscriptions:** Clients subscribe to `event:{id}` topics. `EVENT_PUBLISHED`/`EVENT_CANCELLED` broadcast to ALL clients. `REGISTRATION_CONFIRMED`/`CANCELLED` broadcast to topic subscribers only.
- **WS → Frontend Messages:**
  - `participant.count` → { eventId, eventTitle, count, action, userName }
  - `event.published` → { eventId, eventTitle, location, startDate, organizerName, capacity }
  - `event.cancelled` → { eventId, eventTitle, affectedRegistrations }

---

## 10. Frontend (React/Vite)

### Tech
- React 19 + Vite 6 + Tailwind CSS 4 + Lucide React + Recharts
- Google OAuth (`@react-oauth/google`) — conditional on `VITE_GOOGLE_CLIENT_ID` env var
- Dev server on port 3000, proxies `/api` → `:8080`, `/ws` → `ws://:8081`

### Provider Tree (main.jsx)
```
BrowserRouter → ThemeProvider → AuthProvider → WebSocketProvider → ToastProvider → App
```
(Optionally wrapped in `GoogleOAuthProvider` if env var set)

### Routes (App.jsx)
| Path | Page | Access |
|------|------|--------|
| `/login` | Login | Public |
| `/register` | Register | Public |
| `/events` | EventList | Public |
| `/events/:id` | EventDetail | Public |
| `/dashboard` | Dashboard | Protected |
| `/my-registrations` | MyRegistrations | Protected |
| `/profile` | Profile | Protected |
| `/admin` | Admin | Protected (adminOnly) |
| `/analytics` | Analytics | Protected (adminOnly) |
| `*` | → `/login` | Catch-all redirect |

### Key Pages
- **Login/Register:** Bauhaus split-panel layout (decorative geometric shapes). Password strength meter on register. Google OAuth button.
- **Dashboard:** Welcome header, 4 stat cards (Events, Registrations, Tickets, Live Now), upcoming events preview, registrations preview.
- **EventList:** Debounced search (400ms), 3-column grid, loading skeletons, pagination.
- **EventDetail:** Live capacity bar (WebSocket-driven), real-time activity banner, registration actions, calendar export (.ics + Google Calendar).
- **MyRegistrations:** Paginated list, active-only filter, view QR, cancel, calendar export.
- **Profile:** Avatar upload (camera button), inline name editing, password change, registration history stats with visual distribution bar.
- **Admin:** 3 tabs — Overview (stats), Events (full CRUD + state management + registration viewer), Users (search, promote/demote).
- **Analytics:** 9 Recharts visualizations — 30-day trend, popular events, peak hours, event status pie, registration status pie, day-of-week, capacity utilization, top locations, recent activity.

### Key Components
- **AppLayout:** Navbar with brand bar (red/yellow/blue), LIVE indicator, theme toggle, admin badge, mobile bottom nav
- **ProtectedRoute:** Auth gate + `adminOnly` role gate
- **LiveAnnouncements:** Headless component — bridges WS events (`event.published`, `event.cancelled`) to toast notifications
- **TicketModal:** Authenticated QR image fetch (JWT in header → blob → objectURL), download button
- **EventFormModal:** Create/Edit event form with datetime localization

### API Client (api.js)
- Core `request(path, options)`: automatic JWT injection, 401 auto-redirect, error extraction
- 26+ exported functions covering auth, events, registrations, tickets, profile, admin, analytics

### Calendar Service (calendar.js)
- `generateICS(event)` — standard iCalendar format
- `downloadICS(event)` — browser download
- `getGoogleCalendarUrl(event)` — Google Calendar public URL

---

## 11. Authentication & Security

### JWT
- Algorithm: HS256
- Secret: Configured in `application.yml` (`jwt.secret`)
- Expiration: 24 hours
- Claims: `sub` (userId), `email`, `role`
- Stored in: `localStorage` as `em_token`

### Flow
1. Client calls `/api/auth/login` or `/api/auth/register` or `/api/auth/google`
2. Server validates credentials, returns JWT + user info
3. Frontend stores token in `localStorage`
4. All API calls include `Authorization: Bearer <token>` header
5. `JwtAuthenticationFilter` validates token on every request
6. 401 response → frontend clears token, redirects to `/login`

### Google OAuth
- Client ID via env var `GOOGLE_OAUTH_CLIENT_ID` (backend) / `VITE_GOOGLE_CLIENT_ID` (frontend)
- Backend verifies Google ID token via `https://oauth2.googleapis.com/tokeninfo?id_token=...`
- Validates `aud` claim matches configured client ID
- Finds or creates user; links existing email accounts to Google; sets `oauthProvider = "GOOGLE"`
- OAuth users have `password = null` — cannot use password login

### Spring Security
- Stateless sessions, CSRF disabled
- `JwtAuthenticationFilter` before `UsernamePasswordAuthenticationFilter`
- `@EnableMethodSecurity` for `@PreAuthorize`
- Public: `/api/auth/**`, `/api/health`, `/api/ping`, `/actuator/**`, `/api/test/**`, `GET /api/events`, `GET /api/events/search`, `GET /api/events/{id}`, `GET /api/registrations/ticket/**`, `GET /api/users/avatars/**`
- ADMIN only: `/api/admin/**`
- All other: authenticated

### Roles
| Role | Permissions |
|------|------------|
| USER | Create/manage own events, register for events, view own tickets/registrations, edit profile |
| ADMIN | All USER permissions + admin panel, analytics, promote/demote users, manage all events, validate tickets |

---

## 12. Bauhaus Design System

### Color Palette
| Token | Light | Dark |
|-------|-------|------|
| `bauhaus-bg` | `#F0F0F0` | `#050816` |
| `bauhaus-fg` | `#121212` | `#E5E7EB` |
| `bauhaus-red` | `#D02020` | `#FF4040` |
| `bauhaus-blue` | `#1040C0` | `#4080FF` |
| `bauhaus-yellow` | `#F0C020` | `#FFD84D` |
| `bauhaus-white` | `#FFFFFF` | `#1A1A2E` |

### Design Characteristics
- **Font:** Outfit (Google Fonts), weights 400/500/700/900
- **Shadows:** Hard offset (no blur) — `4px 4px 0px`, `6px 6px 0px`, `8px 8px 0px` (light) / darker variants in dark mode
- **Buttons:** Hard shadow with `:active` translate + shadow reduce (press effect)
- **Cards:** Thick black borders, accent-colored top bar
- **Brand Bar:** 3-color horizontal stripe (red, yellow, blue) — used in navbar, email templates
- **Decorative:** Geometric corner elements (`.bauhaus-corner`), diagonal stripes (`.bauhaus-stripe`)
- **Status Colors:** Green (confirmed/published), Red (cancelled), Blue (draft), Yellow (completed)

### Theme Switching
- `ThemeContext` sets `document.documentElement.dataset.theme` to `'light'` or `'dark'`
- CSS uses `[data-theme='dark']` selector to override all tokens
- Persisted in `localStorage` (`emconnect-theme`)
- Respects `prefers-color-scheme` on first visit
- **Force-light on auth pages** (`/login`, `/register`) for brand consistency

### Email Templates
- Notification worker's Go templates mirror the Bauhaus design:
  - Same brand bar (red/yellow/blue)
  - Same color palette
  - Dark header with "EM-CONNECT" logo
  - Status badges (green confirmed, red cancelled, blue published, yellow reminder)

---

## 13. Key Patterns & Decisions

| Pattern | Where | Details |
|---------|-------|---------|
| **Pessimistic Locking** | `EventRepository.findByIdWithLock()` | `@Lock(PESSIMISTIC_WRITE)` prevents race conditions during concurrent event registration |
| **State Machine** | `EventStatus` enum | `canTransitionTo()`, `isTerminal()`, `isEditable()`, `acceptsRegistrations()` |
| **Event-Driven** | RabbitMQ topic exchange | 4 domain events, 3 independent consumers, at-least-once delivery |
| **Dead Letter Queue** | All Go consumers | Failed messages → DLX with error headers → DLQ for debugging |
| **HMAC Ticket Signing** | Ticket worker | SHA-256 HMAC of `ticketCode:eventID:userID:eventDate`, constant-time verification |
| **Idempotent Generation** | Ticket worker | Checks for existing files before regenerating |
| **Idempotent Check-in** | `TicketService.validateTicket()` | Returns `alreadyUsed` on repeat scans |
| **Registration Reactivation** | `RegistrationService` | Cancelled registrations are reactivated (not duplicated) on re-register |
| **Hub Pattern** | WebSocket Hub | Go channels for thread-safe client management, topic-based routing |
| **Headless Component** | `LiveAnnouncements.jsx` | Invisible WS→Toast bridge, pure side-effect, rendered at root |
| **Force-Light Theme** | `ThemeContext.jsx` | Auth pages always use light theme for brand consistency |
| **JVM Timezone** | `ApiApplication.main()` | `TimeZone.setDefault("Asia/Kolkata")` |
| **Custom Timestamp Unmarshaling** | All Go `model/events.go` | Handles Java epoch seconds, datetime arrays, and string formats |
| **Avatar Path-Traversal Protection** | `UserService.getAvatarPath()` | Validates filename contains no path separators |

---

## 14. Configuration & Environment

### Spring Boot (`application.yml`)
| Key | Value | Notes |
|-----|-------|-------|
| `spring.datasource.url` | `jdbc:postgresql://localhost:5432/emconnect?options=-c%20TimeZone=Asia/Kolkata` | |
| `spring.datasource.username` | `emconnect` | |
| `spring.datasource.password` | `emconnect` | |
| `spring.rabbitmq.host` | `localhost` | Port 5672 |
| `spring.rabbitmq.username/password` | `emconnect` / `emconnect` | |
| `jwt.secret` | `myVerySecureSecretKey...` | Must be ≥256 bits for HS256 |
| `jwt.expiration` | `86400000` (24h) | Milliseconds |
| `google.oauth.client-id` | `${GOOGLE_OAUTH_CLIENT_ID:}` | Env var |
| `ticket.qr.storage-path` | `../ticket-worker/tickets/qr` | Relative to API working dir |
| `server.port` | `8080` | |
| `spring.servlet.multipart.max-file-size` | `2MB` | Avatar uploads |

### Go Worker Environment Variables
| Variable | Default | Service |
|----------|---------|---------|
| `RABBITMQ_URL` | `amqp://emconnect:emconnect@localhost:5672/` | All |
| `SENDGRID_API_KEY` | (none) | Notification worker |
| `EMAIL_FROM` | (default in config) | Notification worker |
| `TICKET_SECRET_KEY` | `em-connect-ticket-secret-2026` | Ticket worker |
| `QR_OUTPUT_DIR` | `./tickets/qr` | Ticket worker |
| `METADATA_DIR` | `./tickets/metadata` | Ticket worker |
| `SERVER_PORT` | `8081` | WebSocket hub |

### Docker Compose
| Service | Image | Ports |
|---------|-------|-------|
| `postgres` | `postgres:16` | 5432 |
| `rabbitmq` | `rabbitmq:3.13-management` | 5672, 15672 |
| `mailhog` | `mailhog/mailhog:latest` | 1025, 8025 (dev profile only) |

---

## 15. Current Feature Status

### Completed (Phases 1–8)
- [x] Docker Compose infrastructure (PostgreSQL, RabbitMQ, MailHog)
- [x] Spring Boot API with Flyway migrations
- [x] JWT authentication (register, login)
- [x] Google OAuth2 login/register
- [x] Role-based access control (USER, ADMIN)
- [x] Event CRUD with state machine (DRAFT → PUBLISHED → CANCELLED/COMPLETED)
- [x] Event registration with pessimistic locking (capacity enforcement)
- [x] Registration reactivation (cancelled → confirmed)
- [x] RabbitMQ event publishing (4 event types)
- [x] Notification worker (Go) — SendGrid email delivery with Bauhaus HTML templates
- [x] Ticket worker (Go) — HMAC-signed QR code generation
- [x] WebSocket hub (Go) — real-time broadcast with topic subscriptions
- [x] React frontend with Bauhaus design system
- [x] Dark mode with theme persistence
- [x] Live capacity updates (WebSocket → UI)
- [x] Toast notifications for real-time events
- [x] Admin panel (Overview, Events CRUD, Users promote/demote)
- [x] Analytics dashboard (Recharts — 9 visualizations)
- [x] User profile (avatar upload, name edit, password change)
- [x] Calendar export (.ics + Google Calendar)
- [x] Ticket QR modal with download
- [x] Idempotent ticket validation / check-in

### Not Yet Implemented (from FUTURE.md)
- [ ] Security hardening (audit, CSP, HSTS, input sanitization)
- [ ] Hosting & deployment strategy
- [ ] Background service auto-start orchestration
- [ ] Attendee check-in system (QR scanner page)
- [ ] Waitlist system
- [ ] Event reminders (scheduled 24h/1h)
- [ ] Event categories & tags
- [ ] Event image/banner upload
- [ ] Forgot password flow
- [ ] Rate limiting
- [ ] Full observability dashboard
- [ ] Audit logging

---

## 16. Known Gaps & Future Work

1. **Security:** JWT secret is hardcoded in `application.yml`. Google OAuth client ID needs env var. No rate limiting. No CSP/HSTS headers. Test endpoints are public.
2. **Deployment:** No Dockerfiles for services. No reverse proxy config. No production docker-compose.
3. **Email:** SendGrid API key must be configured via env var for production. MailHog only in dev profile.
4. **Ticket Worker HMAC Secret:** Default hardcoded. Should be env-var-driven in production.
5. **Code Duplication:** `model/events.go` timestamp unmarshaling is duplicated across all 3 Go services.
6. **Missing Features:** Waitlist, event reminders, forgot password, QR scanner for check-in, event images.
7. **Frontend:** No service worker / offline support. No SSR. No end-to-end tests.
8. **API Docs:** `docs/API.md` is partially outdated — missing newer endpoints (tickets, profile, OAuth, analytics, admin events).

---

## 17. How to Run

### Prerequisites
- Java 17+
- Go 1.25+
- Node.js 18+
- Docker Desktop

### Start Infrastructure
```bash
docker-compose up -d                          # PostgreSQL + RabbitMQ
# For dev email testing:
docker compose --profile dev up -d            # + MailHog
```

### Start API
```bash
cd services/api
./mvnw spring-boot:run                        # Windows: .\mvnw.cmd spring-boot:run
```

### Start Go Workers
```bash
# Terminal 1
cd services/notification-worker && go run .

# Terminal 2
cd services/ticket-worker && go run .

# Terminal 3
cd services/websocket-hub && go run .
```

### Start Frontend
```bash
cd frontend
npm install
npm run dev                                    # → http://localhost:3000
```

### Verify
- API: `curl http://localhost:8080/api/health`
- RabbitMQ UI: `http://localhost:15672` (emconnect / emconnect)
- Frontend: `http://localhost:3000`
- WebSocket test: `http://localhost:8081/test.html`

---

## 18. Other Docs Index

| File | Description | Staleness |
|------|-------------|-----------|
| [OVERVIEW.md](OVERVIEW.md) | Early project overview | Outdated — describes Phase 1–3 only |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Architecture diagrams | Partially outdated — missing Go workers, WS hub |
| [API.md](API.md) | API endpoint reference | Partially outdated — missing tickets, profile, OAuth, analytics, admin events |
| [AUTHENTICATION.md](AUTHENTICATION.md) | JWT + security deep dive | Partially outdated — missing Google OAuth |
| [DATABASE.md](DATABASE.md) | Schema reference | Partially outdated — missing V6/V7 migrations (avatar, OAuth) |
| [EVENT_STATES.md](EVENT_STATES.md) | State machine docs | Current |
| [ADMIN.md](ADMIN.md) | Admin panel docs | Current |
| [RABBITMQ_TOPOLOGY_DESIGN.md](RABBITMQ_TOPOLOGY_DESIGN.md) | Exchange/queue spec | Current |
| [PLAN.md](PLAN.md) | Phased learning plan | Current (all 8 phases completed) |
| [FUTURE.md](FUTURE.md) | Feature roadmap | Current |
| [NOTES.md](NOTES.md) | Dev journal | Current (ongoing) |
| [CODE.md](CODE.md) | Source file documentation | Will be updated alongside this file |
