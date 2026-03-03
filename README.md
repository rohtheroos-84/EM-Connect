# em-connect

em-connect is a backend-first event management system i built to learn real-world system design using spring boot and golang together. it covers event creation, user registrations with capacity handling, async ticket generation, email notifications, real-time updates, and a full react frontend — all wired together through an event-driven architecture with rabbitmq.

the frontend uses a bauhaus-inspired design system — geometric shapes, thick borders, hard shadows, bold primary colors, and the outfit typeface. dark mode included.

---

## what this project is

an event management platform where:

- spring boot handles core business logic, rest apis, authentication, and database transactions
- three golang workers handle background processing — emails, tickets, and websocket broadcasts
- rabbitmq connects services through domain events instead of tight coupling
- a react frontend consumes the apis and websocket streams
- everything runs locally via docker compose

this started as a learning project and grew into a full-featured system across 8 development phases.

---

## core features

### authentication
- user registration and login with email/password
- google oauth2 login with automatic account linking
- jwt-based stateless authentication (24h expiry)
- role-based access control — user, organizer, admin
- bcrypt password hashing
- frontend handles auth state, token storage, and protected routes

### event management
- full crud — create, update, publish, cancel, complete events
- event state machine: draft → published → cancelled / completed
- only published events are visible to regular users
- event capacity, venue, date/time, and description
- event categories — technology, social, sports, music, education, business, health, art, other
- tag system for flexible event labeling and discovery
- banner image upload (jpeg, png, gif, webp — up to 5mb)
- generated bauhaus-style svg banners for events without uploaded images
- search and filter by keyword, category, and tags with pagination

### registrations
- users can register for published events
- capacity enforced atomically with pessimistic locking
- no overbooking under concurrent requests
- duplicate registration prevention
- users can cancel their registrations
- registration status tracking (confirmed, cancelled, waitlisted)

### ticketing
- each confirmed registration triggers async ticket generation
- unique ticket codes with qr code support
- ticket worker generates tickets via rabbitmq events
- tickets stored as files with json metadata
- tickets can be viewed, downloaded, and validated
- ticket modal with qr display in the frontend

### notifications
- registration confirmation emails with rich html templates
- event update and cancellation notification emails
- emails processed asynchronously via notification worker
- retry logic with exponential backoff for failed deliveries
- dead letter queue for permanently failed messages
- production smtp support (mailhog available for local dev)

### real-time updates
- live participant count updates via websocket
- real-time event announcements
- websocket hub built in go with client connection management
- frontend auto-reconnects and updates without page refresh
- live announcement banner on the frontend

### user profiles
- edit display name
- change password
- upload avatar image
- registration history and stats

### calendar export
- download .ics file for any registered event
- add to google calendar link
- add to outlook link

### analytics dashboard
- registration trends over time
- popular events ranking
- peak registration hours heatmap
- capacity utilization metrics
- charts powered by recharts

### admin panel
- three-tab layout — overview stats, event management, user management
- create, edit, publish, cancel, and complete events from the ui
- manage users — view all users, promote/demote roles
- category badges and banner upload on admin event forms
- system health and registration statistics

### dark mode
- bauhaus dark variant with inverted palette
- user preference persisted across sessions
- toggle accessible from the ui

---

## architecture overview

```
client (react)
    │
    ├── rest api ──► spring boot api ──► postgresql
    │                     │
    │                     ├── publishes domain events ──► rabbitmq
    │                     │                                  │
    │                     │                    ┌─────────────┼─────────────┐
    │                     │                    ▼             ▼             ▼
    │                     │              notification    ticket       websocket
    │                     │              worker (go)    worker (go)   hub (go)
    │                     │                    │             │             │
    │                     │                    ▼             ▼             │
    │                     │                  smtp         qr/files        │
    │                     │                                               │
    └── websocket ────────────────────────────────────────────────────────┘
```

- **spring boot api** — handles all rest endpoints, authentication, database operations, file uploads, and publishes domain events to rabbitmq
- **notification worker** (go) — consumes registration and event update events, sends html emails via smtp
- **ticket worker** (go) — consumes ticket generation events, creates unique codes and qr images
- **websocket hub** (go) — consumes broadcast events, pushes real-time updates to connected clients
- **postgresql 16** — primary data store with flyway-managed migrations (v1 through v8)
- **rabbitmq 3.13** — topic exchange (`em.events`) with dead letter exchange (`em.events.dlx`), three consumer queues
- **mailhog** — local smtp testing (dev profile only)

---

## tech stack

| layer | technology |
|-------|-----------|
| backend api | java 17, spring boot 3.2.2, spring security, spring data jpa, spring amqp |
| database | postgresql 16, flyway migrations |
| auth | jwt (jjwt 0.12.5), bcrypt, google oauth2 |
| message broker | rabbitmq 3.13 |
| notification worker | go, amqp091-go, html email templates |
| ticket worker | go, amqp091-go, go-qrcode |
| websocket hub | go, gorilla/websocket, amqp091-go |
| frontend | react 19, vite 6, tailwind css 4, recharts, lucide-react |
| design system | bauhaus — outfit font, geometric shapes, hard shadows, primary palette (red, blue, yellow, black) |
| infrastructure | docker compose (postgres, rabbitmq, mailhog) |

---

## repository structure

```
em-connect/
├── docker-compose.yaml         # postgres, rabbitmq, mailhog
├── docs/                       # project documentation
│   ├── OVERVIEW.md
│   ├── ARCHITECTURE.md
│   ├── API.md
│   ├── AUTHENTICATION.md
│   ├── DATABASE.md
│   ├── EVENT_STATES.md
│   ├── ADMIN.md
│   ├── CODE.md
│   ├── CONTEXT.md
│   ├── PLAN.md
│   ├── NOTES.md
│   ├── FUTURE.md
│   └── RABBITMQ_TOPOLOGY_DESIGN.md
├── services/
│   ├── api/                    # spring boot api (java)
│   │   ├── src/main/java/com/emconnect/api/
│   │   │   ├── config/         # security, rabbitmq, jwt, web config
│   │   │   ├── controller/     # rest controllers
│   │   │   ├── dto/            # request/response objects
│   │   │   ├── entity/         # jpa entities
│   │   │   ├── event/          # domain event classes
│   │   │   ├── exception/      # global error handling
│   │   │   ├── repository/     # spring data repositories
│   │   │   └── service/        # business logic
│   │   └── src/main/resources/
│   │       └── db/migration/   # flyway v1–v8
│   ├── notification-worker/    # email worker (go)
│   ├── ticket-worker/          # ticket + qr worker (go)
│   └── websocket-hub/          # real-time hub (go)
└── frontend/                   # react + vite app
    └── src/
        ├── components/         # shared ui components
        ├── context/            # auth, theme, toast, websocket providers
        ├── pages/              # route pages
        └── services/           # api client, calendar helpers
```

---

## running locally

### prerequisites
- docker and docker compose
- java 17+ and maven
- go 1.21+
- node.js 18+ and npm

### steps

```bash
# 1. start infrastructure
docker compose up -d

# 2. start the spring boot api
cd services/api
./mvnw spring-boot:run

# 3. start the go workers (each in its own terminal)
cd services/notification-worker && go run main.go
cd services/ticket-worker && go run main.go
cd services/websocket-hub && go run main.go

# 4. start the frontend
cd frontend
npm install
npm run dev
```

- frontend runs on `http://localhost:3000`
- api runs on `http://localhost:8080`
- rabbitmq management ui at `http://localhost:15672` (emconnect / emconnect)
- mailhog ui at `http://localhost:8025` (dev profile only)

### first-time setup
- register a user through the frontend
- the first registered user can be promoted to admin via the database
- admin users can then manage events and other users from the admin panel

---

## database migrations

| version | description |
|---------|------------|
| v1 | users table with roles |
| v2 | events table with state machine |
| v3 | registrations with capacity tracking |
| v4 | ticket fields on registrations |
| v5 | event announcements |
| v6 | user avatar support |
| v7 | oauth provider fields on users |
| v8 | event categories, tags, and banner url |

---

## design system

the frontend follows a bauhaus-inspired design language:

- **colors** — red (`#d02020`), blue (`#1040c0`), yellow (`#f0c020`), black (`#121212`), background (`#f0f0f0`)
- **typography** — outfit (google fonts)
- **borders** — thick solid borders (2–3px), no rounded corners on primary elements
- **shadows** — hard offset shadows (no blur) — typically `4px 4px 0px`
- **shapes** — geometric accents (circles, rectangles, diagonal lines)
- **generated banners** — events without uploaded images get deterministic bauhaus svg banners based on the event title

---

## what i learned

this project covered 8 phases of learning:

1. **foundation** — docker, postgres, spring boot setup, flyway migrations
2. **authentication** — jwt flow, spring security filter chain, bcrypt, rbac, google oauth2
3. **event management** — entity relationships, state machines, service layer patterns, pagination
4. **registrations** — many-to-many relationships, race conditions, pessimistic locking, transaction isolation
5. **event-driven architecture** — rabbitmq exchanges/queues/bindings, spring amqp, domain events, go consumers
6. **ticket generation** — qr codes in go, async processing, file storage, idempotency
7. **real-time features** — websocket protocol, go concurrency, fan-out broadcasting, client reconnection
8. **frontend** — react hooks, context api, protected routes, websocket integration, tailwind css, recharts

detailed notes for every phase are in [docs/NOTES.md](docs/NOTES.md).

---

## documentation

| document | what it covers |
|----------|---------------|
| [OVERVIEW.md](docs/OVERVIEW.md) | high-level project summary |
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | system architecture and request flow |
| [API.md](docs/API.md) | rest endpoint reference |
| [AUTHENTICATION.md](docs/AUTHENTICATION.md) | jwt and security deep dive |
| [DATABASE.md](docs/DATABASE.md) | schema and migration reference |
| [EVENT_STATES.md](docs/EVENT_STATES.md) | event lifecycle state machine |
| [ADMIN.md](docs/ADMIN.md) | admin panel documentation |
| [CODE.md](docs/CODE.md) | source code file descriptions |
| [RABBITMQ_TOPOLOGY_DESIGN.md](docs/RABBITMQ_TOPOLOGY_DESIGN.md) | message broker topology |
| [PLAN.md](docs/PLAN.md) | phased learning plan |
| [NOTES.md](docs/NOTES.md) | development journal and learnings |
| [FUTURE.md](docs/FUTURE.md) | feature roadmap |

---

## status

all 8 development phases are complete. the system is fully functional for local development. see [FUTURE.md](docs/FUTURE.md) for the remaining roadmap — security hardening, hosting, check-in system, reminders, and forgot password flow.
- user registration with capacity handling
- async ticket generation
- email notification on registration
- basic frontend for users and organizers
- dockerized local setup
