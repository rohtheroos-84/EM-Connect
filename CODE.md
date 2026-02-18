# CODE.md — Source Code Documentation

This document provides a description of every source code file in the EM-Connect repository, organized by service and package.

---

## Table of Contents

- [Root Files](#root-files)
- [Documentation](#documentation)
- [Services / API (Java — Spring Boot)](#services--api-java--spring-boot)
  - [Entry Point](#entry-point)
  - [Configuration](#configuration)
  - [Controllers](#controllers)
  - [Services](#services)
  - [Entities](#entities)
  - [DTOs (Data Transfer Objects)](#dtos-data-transfer-objects)
  - [Repositories](#repositories)
  - [Domain Events](#domain-events)
  - [Exception Handling](#exception-handling)
  - [Resources](#resources)
  - [Database Migrations (Flyway)](#database-migrations-flyway)
  - [Tests](#tests)
- [Services / Notification Worker (Go)](#services--notification-worker-go)
  - [Entry Point](#entry-point-1)
  - [Config](#config)
  - [Consumer](#consumer)
  - [Email](#email)
  - [Handler](#handler)
  - [Model](#model)
  - [Dependencies](#dependencies)
- [Services / Ticket Worker (Go)](#services--ticket-worker-go)
  - [Entry Point](#entry-point-2)
  - [Config](#config-1)
  - [Consumer](#consumer-1)
  - [Handler](#handler-1)
  - [Model](#model-1)
  - [QR Code Generation](#qr-code-generation)
  - [Ticket Service](#ticket-service)
  - [Dependencies](#dependencies-1)
- [Services / WebSocket Hub (Go)](#services--websocket-hub-go)
  - [Entry Point](#entry-point-3)
  - [Config](#config-2)
  - [Consumer](#consumer-2)
  - [Hub](#hub)
  - [Handler](#handler-2)
  - [Model](#model-2)
  - [Test Dashboard](#test-dashboard)
  - [Dependencies](#dependencies-2)
- [Frontend (React — Vite)](#frontend-react--vite)
  - [Root Files](#root-files-1)
  - [Entry Point & App](#entry-point--app)
  - [Styling](#styling)
  - [Context Providers](#context-providers)
  - [Components](#components)
  - [Pages](#pages)
  - [Services](#services-1)

---

## Root Files

| File | Description |
|------|-------------|
| `docker-compose.yaml` | Defines the local development infrastructure: PostgreSQL 16 database, RabbitMQ 3.13 message broker (with management UI), and MailHog for local SMTP email testing. Includes health checks for all services. |
| `README.md` | Project overview. Describes EM-Connect as a backend-first event management system built with Spring Boot and Golang, covering event creation, registration, ticket generation, and notifications via an event-driven architecture. |
| `PLAN.md` | Phased learning plan for the project. Outlines milestones from Phase 1 (Foundation & Core Setup) through Phase 7+, detailing what to build, what concepts to learn, and acceptance criteria for each phase. |
| `NOTES.md` | Development journal. Documents insights, challenges, debugging sessions, and solutions encountered during each phase — including theory explanations, error traces, and fix rationale. |
| `CODE.md` | This file. Provides a description of every source code file in the EM-Connect repository, organized by service and package. |
| `event.json` | Sample JSON payload for creating an event via `POST /api/events`. Used for manual API testing with cURL or REST clients. |
| `login.json` | Sample JSON payload for authenticating via `POST /api/auth/login`. Used for manual API testing with cURL or REST clients. |

---

## Documentation

**Path:** `docs/`

Reference documentation covering the system's design, API surface, and infrastructure.

| File | Description |
|------|-------------|
| `docs/OVERVIEW.md` | High-level project overview. Describes what EM-Connect is, its core features (event management, registration, ticketing, notifications), and the technologies used. |
| `docs/ARCHITECTURE.md` | System architecture documentation. Illustrates the high-level request flow (Client → Spring Boot API → PostgreSQL / RabbitMQ → Go Workers → SMTP), component responsibilities, and how services communicate. |
| `docs/API.md` | Complete API reference. Documents all REST endpoints grouped by resource (Auth, Events, Registrations, Tickets, Admin, Health), including request/response examples, HTTP methods, and required authentication. |
| `docs/AUTHENTICATION.md` | Authentication and security deep dive. Explains the JWT flow (login → token generation → token validation), Spring Security filter chain, role-based access control (USER, ADMIN), and password hashing with BCrypt. |
| `docs/DATABASE.md` | Database schema reference. Documents all tables (users, events, registrations), their columns, constraints, indexes, and foreign key relationships. Includes Flyway migration overview. |
| `docs/EVENT_STATES.md` | Event state machine documentation. Describes the lifecycle states (DRAFT → PUBLISHED → CANCELLED / COMPLETED), valid transitions, and the business rules enforced at each state (e.g., only published events accept registrations). |
| `docs/RABBITMQ_TOPOLOGY_DESIGN.md` | RabbitMQ topology specification. Defines the exchange (`em.events`, topic), dead-letter exchange (`em.events.dlx`, topic), queues (notification, ticket, websocket), routing keys, and binding patterns. |

---

## Services / API (Java — Spring Boot)

**Path:** `services/api/`

The API service is a Spring Boot 3.2.2 application that provides RESTful endpoints for user authentication, event management, and event registration. It uses PostgreSQL for persistence, RabbitMQ for publishing domain events, and JWT for stateless authentication.

| File | Description |
|------|-------------|
| `pom.xml` | Maven build configuration. Declares dependencies on Spring Boot (Web, Security, Data JPA, Validation, AMQP/RabbitMQ, Actuator), PostgreSQL driver, JJWT 0.12.5 for JWT handling, and Flyway for database migrations. |

### Entry Point

| File | Description |
|------|-------------|
| `src/main/java/com/emconnect/api/ApiApplication.java` | The Spring Boot application main class. Contains the `main()` method that bootstraps the application. |

### Configuration

| File | Description |
|------|-------------|
| `src/main/java/com/emconnect/api/config/SecurityConfig.java` | Spring Security configuration. Disables CSRF (stateless API), sets session management to stateless, defines public endpoints (`/api/auth/**`, `/api/health`, `GET /api/events`), restricts `/api/admin/**` to the ADMIN role, and registers the JWT authentication filter. |
| `src/main/java/com/emconnect/api/config/JwtAuthenticationFilter.java` | A `OncePerRequestFilter` that intercepts every HTTP request. Extracts the JWT from the `Authorization` header, validates it via `JwtService`, loads the user via `CustomUserDetailsService`, and sets the `SecurityContext` for the request. |
| `src/main/java/com/emconnect/api/config/RabbitMQConfig.java` | Defines the RabbitMQ topology: topic exchanges (`em.events`, `em.events.dlx`), queues (`notification.queue`, `ticket.queue`, `websocket.queue`, dead-letter queue), routing key bindings (e.g., `registration.*`, `event.*`), and a Jackson-based JSON message converter. |

### Controllers

| File | Description |
|------|-------------|
| `src/main/java/com/emconnect/api/controller/AuthController.java` | Handles authentication endpoints: `POST /api/auth/register` (creates a new user account) and `POST /api/auth/login` (authenticates and returns a JWT token). Validates request bodies. |
| `src/main/java/com/emconnect/api/controller/HealthController.java` | Provides health check endpoints: `GET /api/health` (returns service status, timestamp, and version) and `GET /api/ping` (simple liveness check returning "pong"). |
| `src/main/java/com/emconnect/api/controller/EventController.java` | Full CRUD for events. Endpoints: create (`POST /api/events`), get by ID (`GET /api/events/{id}`), list all published (`GET /api/events`), update (`PUT /api/events/{id}`), delete (`DELETE /api/events/{id}`), publish (`POST /api/events/{id}/publish`), cancel (`POST /api/events/{id}/cancel`), complete (`POST /api/events/{id}/complete`), get organizer's events (`GET /api/events/my-events`), search (`GET /api/events/search`), and get participant count (`GET /api/events/{id}/participants/count` — returns JSON with `eventId`, `eventTitle`, `participantCount`, `capacity`). Supports pagination. |
| `src/main/java/com/emconnect/api/controller/UserController.java` | Exposes `GET /api/users/me` to return the currently authenticated user's profile information. |
| `src/main/java/com/emconnect/api/controller/RegistrationController.java` | Manages event registrations. Endpoints: register for an event (`POST /api/registrations/events/{eventId}`), cancel registration (`POST /api/registrations/{id}/cancel`), get current user's registrations (`GET /api/registrations/my-registrations`), get registrations for an event (`GET /api/registrations/events/{eventId}`), check registration status (`GET /api/registrations/events/{eventId}/status`), and validate a ticket (`GET /api/registrations/tickets/{ticketCode}/validate`). |
| `src/main/java/com/emconnect/api/controller/TicketController.java` | Ticket retrieval and validation endpoints at `/api/tickets`. Endpoints: get all tickets for the authenticated user (`GET /api/tickets/my`), get a single ticket by code (`GET /api/tickets/{code}`), download QR code image as PNG (`GET /api/tickets/{code}/qr`), and validate a ticket for check-in (`POST /api/tickets/{code}/validate`, restricted to ADMIN/ORGANIZER via `@PreAuthorize`). |
| `src/main/java/com/emconnect/api/controller/AdminController.java` | Admin-only endpoints (requires ADMIN role): `GET /api/admin/users` (list all users), `GET /api/admin/dashboard` (stats: total users, events, registrations), `POST /api/admin/users/{id}/promote` (promote user to ADMIN), and `POST /api/admin/users/{id}/demote` (demote admin to USER). |
| `src/main/java/com/emconnect/api/controller/UserTestController.java` | Test-only controller at `/api/test/users`. Provides endpoints to create a hardcoded test user and list all users. Intended for development/testing, not production use. |
| `src/main/java/com/emconnect/api/controller/TestConcurrencyController.java` | Test-only controller at `/api/test/concurrent-register`. Simulates concurrent registration attempts for a given event by firing multiple threads simultaneously. Used to verify pessimistic locking prevents overbooking. Not intended for production. |

### Services

| File | Description |
|------|-------------|
| `src/main/java/com/emconnect/api/service/AuthService.java` | Business logic for authentication. `register()` checks for duplicate emails, hashes the password with BCrypt, saves the user, and generates a JWT. `login()` validates credentials and returns a JWT. |
| `src/main/java/com/emconnect/api/service/JwtService.java` | Handles JWT lifecycle. Generates tokens containing user ID, email, and role claims using HMAC-SHA signing. Provides methods to validate tokens and extract individual claims (user ID, email, role). |
| `src/main/java/com/emconnect/api/service/CustomUserDetailsService.java` | Implements Spring Security's `UserDetailsService`. Loads user details by email (username) or by user ID. Converts the application `Role` enum into Spring Security `GrantedAuthority` objects. |
| `src/main/java/com/emconnect/api/service/EventService.java` | Core event management logic. Creates events in DRAFT status, publishes events (validates future start date), cancels and completes events using the `EventStatus` state machine. Supports search by title and filtering by status. Uses pessimistic locking on event reads. Publishes domain events to RabbitMQ on publish and cancel actions. Provides `getParticipantCount(Long eventId)` to query confirmed registration count for live updates. |
| `src/main/java/com/emconnect/api/service/RegistrationService.java` | Manages user-to-event registrations. Uses pessimistic locking on the event row to enforce capacity constraints under concurrent access. Validates that the event is published and has available capacity. Generates UUID-based ticket codes. Supports cancellation and re-registration (reactivation of a cancelled registration). Publishes registration domain events to RabbitMQ with `currentParticipants` count for real-time WebSocket broadcasts. |
| `src/main/java/com/emconnect/api/service/EventPublisher.java` | Publishes domain events to the RabbitMQ `em.events` exchange using routing keys: `registration.confirmed`, `registration.cancelled`, `event.published`, and `event.cancelled`. Serializes events as JSON. |
| `src/main/java/com/emconnect/api/service/TicketService.java` | Ticket business logic. `getMyTickets()` retrieves all registrations for a user with `Pageable.unpaged()` and maps them to `TicketResponse` DTOs (including a `qrReady` flag based on QR file existence on disk). `getTicketByCode()` enforces ownership/admin/organizer access. `getQRCodeImage()` serves QR PNG files from the configured `ticket.qr.storage-path` via `UrlResource`. `validateTicket()` performs idempotent check-in: sets `checkedInAt` timestamp on first scan, returns `alreadyUsed` on subsequent scans. Uses `@Transactional` for check-in. |

### Entities

| File | Description |
|------|-------------|
| `src/main/java/com/emconnect/api/entity/User.java` | JPA entity mapped to the `users` table. Fields: `id` (auto-generated), `email` (unique), `password` (BCrypt-hashed), `name`, `role` (USER or ADMIN), `createdAt`, `updatedAt`. Timestamps are auto-set via `@PrePersist` / `@PreUpdate`. |
| `src/main/java/com/emconnect/api/entity/Event.java` | JPA entity mapped to the `events` table. Fields: `title`, `description`, `location`, `startDate`, `endDate`, `capacity`, `status` (EventStatus enum), `organizer` (many-to-one FK to User), `createdAt`, `updatedAt`. |
| `src/main/java/com/emconnect/api/entity/Registration.java` | JPA entity mapped to the `registrations` table. Has a unique constraint on `(user_id, event_id)`. Fields: `user` (FK), `event` (FK), `status` (RegistrationStatus), `ticketCode` (UUID-based, unique), `registeredAt`, `cancelledAt`, `checkedInAt` (set when ticket is validated/scanned), `createdAt`, `updatedAt`. Includes a `cancel()` method that sets the status and cancelled timestamp. |
| `src/main/java/com/emconnect/api/entity/EventStatus.java` | Enum defining the event lifecycle state machine: `DRAFT` → `PUBLISHED` → `CANCELLED` or `COMPLETED`. Each state defines allowed transitions, whether it is terminal, publicly visible, editable, and whether it can accept registrations. |
| `src/main/java/com/emconnect/api/entity/RegistrationStatus.java` | Enum with two values: `CONFIRMED` and `CANCELLED`. |
| `src/main/java/com/emconnect/api/entity/Role.java` | Enum with two values: `USER` and `ADMIN`. |

### DTOs (Data Transfer Objects)

| File | Description |
|------|-------------|
| `src/main/java/com/emconnect/api/dto/RegisterRequest.java` | Request body for user registration: `email`, `password`, and `name`. |
| `src/main/java/com/emconnect/api/dto/LoginRequest.java` | Request body for login: `email` and `password`. |
| `src/main/java/com/emconnect/api/dto/AuthResponse.java` | Response for authentication endpoints. Contains a `message`, nested `UserResponse`, and the JWT `token`. |
| `src/main/java/com/emconnect/api/dto/UserResponse.java` | User details response (password omitted): `id`, `email`, `name`, `role`, `createdAt`. |
| `src/main/java/com/emconnect/api/dto/CreateEventRequest.java` | Request body for creating an event: `title`, `description`, `location`, `startDate`, `endDate`, `capacity`. |
| `src/main/java/com/emconnect/api/dto/UpdateEventRequest.java` | Request body for updating an event. All fields are optional to support partial updates. |
| `src/main/java/com/emconnect/api/dto/EventResponse.java` | Event response DTO. Includes event details plus a nested `OrganizerSummary` (id, name, email) for the event organizer. |
| `src/main/java/com/emconnect/api/dto/RegistrationResponse.java` | Registration response DTO. Includes registration details plus nested `EventSummary` and `UserSummary` objects. |
| `src/main/java/com/emconnect/api/dto/TicketResponse.java` | Ticket response DTO. Fields: `id`, `ticketCode`, `status`, `registeredAt`, `checkedInAt`, `qrReady` (boolean indicating whether the QR PNG file exists on disk). Contains nested `EventSummary` (id, title, location, dates, status) and `UserSummary` (id, name, email) inner classes. |
| `src/main/java/com/emconnect/api/dto/TicketValidationResponse.java` | Ticket validation result DTO. Fields: `valid` (boolean), `message`, `ticketCode`, `userName`, `userEmail`, `eventTitle`, `checkedInAt`. Provides static factory methods: `success()`, `alreadyUsed()`, and `invalid()` for clean construction of the three possible validation outcomes. |

### Repositories

| File | Description |
|------|-------------|
| `src/main/java/com/emconnect/api/repository/UserRepository.java` | Spring Data JPA repository for `User`. Custom queries: `findByEmail()`, `existsByEmail()`. |
| `src/main/java/com/emconnect/api/repository/EventRepository.java` | Spring Data JPA repository for `Event`. Custom queries include: `findByStatus()`, `findByOrganizerId()`, `searchByTitle()` (case-insensitive LIKE), `countByOrganizerId()`, `findByIdWithLock()` (pessimistic write lock via `@Lock`), and `findUpcomingPublishedEvents()` (published events with future start dates, ordered by date). |
| `src/main/java/com/emconnect/api/repository/RegistrationRepository.java` | Spring Data JPA repository for `Registration`. Custom queries: existence checks by user/event/status, lookups by user or event with pagination, `findByTicketCode()` for ticket retrieval, ticket code validation, confirmed registration count per event, and filtering for upcoming registrations. |

### Domain Events

| File | Description |
|------|-------------|
| `src/main/java/com/emconnect/api/event/BaseEvent.java` | Abstract base class for all domain events. Contains `eventId` (UUID string), `eventType` (string), and `timestamp` (epoch seconds). Provides static factory methods for creating child event instances. |
| `src/main/java/com/emconnect/api/event/RegistrationConfirmedEvent.java` | Domain event fired when a user successfully registers for an event. Carries: `registrationId`, `userId`, `userEmail`, `userName`, `eventId`, `eventTitle`, `eventLocation`, `eventStartDate`, `eventEndDate`, `ticketCode`, `currentParticipants` (live confirmed count for WebSocket broadcasts). Provides overloaded `fromRegistration(Registration, long)` factory method. |
| `src/main/java/com/emconnect/api/event/RegistrationCancelledEvent.java` | Domain event fired when a registration is cancelled. Carries: `registrationId`, `userId`, `userEmail`, `userName`, `eventId`, `eventTitle`, `cancelledAt`, `currentParticipants` (live confirmed count for WebSocket broadcasts). Provides overloaded `fromRegistration(Registration, long)` factory method. |
| `src/main/java/com/emconnect/api/event/EventPublishedEvent.java` | Domain event fired when an event transitions to PUBLISHED status. Carries: `eventId`, `title`, `description`, `location`, `startDate`, `endDate`, `capacity`, `organizerId`, `organizerName`, `organizerEmail`. |
| `src/main/java/com/emconnect/api/event/EventCancelledEvent.java` | Domain event fired when an event is cancelled. Carries: `eventId`, `title`, `originalStartDate`, `organizerId`, `organizerEmail`, `affectedRegistrations` (count of impacted registrations). |

### Exception Handling

| File | Description |
|------|-------------|
| `src/main/java/com/emconnect/api/exception/GlobalExceptionHandler.java` | Centralized `@ControllerAdvice` that handles all exceptions. Maps validation errors, custom business exceptions, access-denied errors, and generic exceptions to structured JSON `ErrorResponse` objects with appropriate HTTP status codes. |
| `src/main/java/com/emconnect/api/exception/ErrorResponse.java` | Simple DTO for error responses. Contains an HTTP status `code` and a `message` string. |
| `src/main/java/com/emconnect/api/exception/EmailAlreadyExistsException.java` | Thrown when a user tries to register with an email that already exists. Returns HTTP 409 Conflict. |
| `src/main/java/com/emconnect/api/exception/InvalidCredentialsException.java` | Thrown when login credentials are invalid. Returns HTTP 401 Unauthorized. |
| `src/main/java/com/emconnect/api/exception/ResourceNotFoundException.java` | Thrown when a requested entity (user, event, registration) is not found. Returns HTTP 404 Not Found. |
| `src/main/java/com/emconnect/api/exception/DuplicateRegistrationException.java` | Thrown when a user attempts to register for an event they are already registered for. Returns HTTP 409 Conflict. |
| `src/main/java/com/emconnect/api/exception/EventNotAvailableException.java` | Thrown when an event cannot accept registrations (e.g., not published, at capacity). Returns HTTP 400 Bad Request. |
| `src/main/java/com/emconnect/api/exception/InvalidStateTransitionException.java` | Thrown when an invalid state machine transition is attempted on an event (e.g., publishing a cancelled event). Returns HTTP 400 Bad Request. |

### Resources

| File | Description |
|------|-------------|
| `src/main/resources/application.yml` | Main application configuration. Configures: PostgreSQL datasource connection (with `TimeZone=Asia/Kolkata`), JPA/Hibernate settings (validate mode, SQL logging), Flyway migration paths, RabbitMQ connection details (with publisher confirms), server port (8080), Spring Actuator health endpoints, JWT secret/expiration (24 hours), and ticket QR storage path (`ticket.qr.storage-path` pointing to the ticket-worker's QR output directory). |

### Database Migrations (Flyway)

| File | Description |
|------|-------------|
| `src/main/resources/db/migration/V1__initial_schema.sql` | Enables the `uuid-ossp` PostgreSQL extension and creates a `schema_info` table to verify that Flyway migrations are working. |
| `src/main/resources/db/migration/V2__create_users_table.sql` | Creates the `users` table with columns: `id`, `email` (unique), `password`, `name`, `role` (default USER), `created_at`, `updated_at`. Adds an index on `email`. |
| `src/main/resources/db/migration/V3__create_admin_user.sql` | Seeds a default admin user (`admin@emconnect.com`) with a BCrypt-hashed password. Uses `ON CONFLICT DO NOTHING` for idempotency. |
| `src/main/resources/db/migration/V4__create_events_table.sql` | Creates the `events` table with columns: `id`, `title`, `description`, `location`, `start_date`, `end_date`, `capacity`, `status` (default DRAFT), `organizer_id` (FK to `users`), timestamps. Adds indexes on `organizer_id`, `status`, and `start_date`. |
| `src/main/resources/db/migration/V5__create_registrations_table.sql` | Creates the `registrations` table with columns: `id`, `user_id` (FK), `event_id` (FK), `status` (default CONFIRMED), `ticket_code` (unique), `registered_at`, `cancelled_at`, timestamps. Adds a unique constraint on `(user_id, event_id)` and indexes on `user_id`, `event_id`, `status`, and `ticket_code`. Also adds a `checked_in_at` column via `ALTER TABLE` for tracking ticket validation timestamps. |

### Tests

| File | Description |
|------|-------------|
| `src/test/java/com/emconnect/api/ApiApplicationTests.java` | Empty test class placeholder for the Spring Boot application context load test. |
| `src/test/java/com/emconnect/api/service/RegistrationConcurrencyTest.java` | Integration test that verifies pessimistic locking prevents event overbooking. Creates an event with limited capacity and fires 15 concurrent registration attempts across threads. Asserts that confirmed registrations never exceed the event capacity. Also tests concurrent cancel-and-re-register scenarios. Requires a running PostgreSQL instance. |
| `src/test/java/com/emconnect/api/resources/application-test.properties` | Test profile configuration. Overrides datasource URL, enables Flyway with `ddl-auto=none`, configures a test JWT secret with shorter expiration, and enables DEBUG logging for `com.emconnect` and Hibernate SQL. |

---

## Services / Notification Worker (Go)

**Path:** `services/notification-worker/`

The notification worker is a Go service that consumes domain events from RabbitMQ and sends templated HTML notification emails via SMTP. It includes retry logic, dead-letter queue support, and graceful shutdown handling.

### Entry Point

| File | Description |
|------|-------------|
| `main.go` | Application entry point. Initializes structured logging, loads configuration, creates the email and handler services, establishes a RabbitMQ connection with exponential backoff retry logic, listens for OS signals (`SIGINT`, `SIGTERM`) for graceful shutdown, and starts the message consumer. |

### Config

| File | Description |
|------|-------------|
| `config/config.go` | Loads all configuration from environment variables with sensible defaults. Settings include: RabbitMQ connection (URL, exchange `em.events`, queue, routing keys `registration.*` and `event.*`, consumer tag, prefetch count, DLQ exchange `em.events.dlx`, DLQ queue `notification.dlq`), email/SMTP settings (host, port, from address, max retries, retry backoff), and service metadata (name, environment). Provides `getEnv()` and `getEnvInt()` helper functions. |

### Consumer

| File | Description |
|------|-------------|
| `consumer/consumer.go` | Manages the RabbitMQ consumer lifecycle. Connects to the AMQP broker, sets QoS prefetch count. Self-declares queue topology: declares the `em.events` topic exchange, declares the consumption queue with `x-dead-letter-exchange` argument pointing to `em.events.dlx`, and binds the queue to `registration.*` and `event.*` routing keys. Declares the Dead Letter Queue infrastructure (DLX exchange + DLQ queue + binding). Consumes messages with manual acknowledgment; on failure, routes messages to the DLQ with error metadata headers (original routing key, error message, original exchange). Provides graceful connection and channel closure. |

### Email

| File | Description |
|------|-------------|
| `email/email.go` | Provides email sending capabilities. Loads four embedded HTML email templates (registration confirmed, registration cancelled, event published, event cancelled) with inline CSS styling. Sends emails via SMTP with configurable retry logic and exponential backoff. Exposes `RenderTemplate()` for rendering templates with dynamic data, and `SendEmail()` for dispatching formatted emails with proper MIME headers. |

### Handler

| File | Description |
|------|-------------|
| `handler/handler.go` | Routes incoming RabbitMQ messages by `eventType` field. Supports four event types: `REGISTRATION_CONFIRMED`, `REGISTRATION_CANCELLED`, `EVENT_PUBLISHED`, and `EVENT_CANCELLED`. For each event, it unmarshals the JSON payload into the corresponding Go struct, renders the appropriate HTML email template with event-specific data, and sends the email. Logs all operations with emoji indicators for readability. |

### Model

| File | Description |
|------|-------------|
| `model/events.go` | Defines Go structs for all domain events consumed from RabbitMQ. Includes custom JSON unmarshaling for two timestamp formats to handle Java-Go interoperability: `Timestamp` (handles both epoch seconds and RFC 3339 strings) and `LocalDateTime` (handles both Java `LocalDateTime` arrays `[year, month, day, hour, minute, second]` and ISO 8601 strings). Structs: `BaseEvent`, `RegistrationConfirmedEvent`, `RegistrationCancelledEvent`, `EventPublishedEvent`, `EventCancelledEvent`. |

### Dependencies

| File | Description |
|------|-------------|
| `go.mod` | Go module definition. Declares module path `github.com/emconnect/notification-worker`, requires Go 1.25.0, and depends on `github.com/rabbitmq/amqp091-go v1.10.0` for RabbitMQ AMQP support. |
| `go.sum` | Go module checksum file. Contains cryptographic hashes for dependency verification (auto-generated, not manually edited). |

---

## Services / Ticket Worker (Go)

**Path:** `services/ticket-worker/`

The ticket worker is a Go service that consumes `REGISTRATION_CONFIRMED` events from RabbitMQ and generates signed QR code tickets. It creates HMAC-SHA256–signed payloads embedded in QR code PNG images and saves ticket metadata as JSON files. Includes idempotent ticket generation, retry logic, dead-letter queue support, and graceful shutdown handling.

### Entry Point

| File | Description |
|------|-------------|
| `main.go` | Application entry point. Initializes structured logging, loads configuration, creates the QR generator, ticket service, and message handler. Establishes a RabbitMQ connection with exponential backoff retry logic (5 attempts with 2×/4×/8×/16× delays). Listens for OS signals (`SIGINT`, `SIGTERM`) for graceful shutdown, and starts the message consumer. |

### Config

| File | Description |
|------|-------------|
| `config/config.go` | Loads all configuration from environment variables with sensible defaults. Three config sections: RabbitMQ (URL, queue `ticket.queue`, consumer tag, prefetch count, DLQ exchange `em.events.dlx`, DLQ queue `ticket.dlq`), Ticket (secret key for HMAC signing, QR output directory, metadata directory, QR image size defaulting to 512px), and Service metadata (name, environment). Provides `getEnv()` and `getEnvInt()` helper functions. |

### Consumer

| File | Description |
|------|-------------|
| `consumer/consumer.go` | Manages the RabbitMQ consumer lifecycle. Connects to the AMQP broker, sets QoS prefetch count. Self-declares queue topology: declares the `em.events` topic exchange, declares the `ticket.queue` with `x-dead-letter-exchange` argument pointing to `em.events.dlx`, and binds the queue to the `registration.confirmed` routing key. Declares the Dead Letter Queue infrastructure (DLX topic exchange + `ticket.dlq` queue + binding with `ticket.failed` routing key). Consumes messages with manual acknowledgment; on failure, routes messages to the DLQ with error metadata headers (original routing key, error message, original exchange). Provides graceful connection and channel closure via `Close()`. |

### Handler

| File | Description |
|------|-------------|
| `handler/handler.go` | Routes incoming RabbitMQ messages by `eventType` field. Only processes `REGISTRATION_CONFIRMED` events: unmarshals the JSON payload into `RegistrationConfirmedEvent`, logs the event details, and delegates to `ticketService.GenerateTicket()`. Gracefully ignores all other event types (logs and skips). |

### Model

| File | Description |
|------|-------------|
| `model/events.go` | Defines Go structs for domain events and ticket data. Includes custom JSON unmarshaling for two timestamp formats to handle Java-Go interoperability: `Timestamp` (handles both epoch seconds and RFC 3339 strings) and `LocalDateTime` (handles both Java `LocalDateTime` arrays `[year, month, day, hour, minute, second]` and ISO 8601 strings). Structs: `BaseEvent`, `RegistrationConfirmedEvent` (with event/user/ticket details), `TicketPayload` (data encoded into QR codes, including HMAC signature), and `TicketMetadata` (stored alongside QR images with ticket status tracking). |

### QR Code Generation

| File | Description |
|------|-------------|
| `qr/generator.go` | Handles QR code image generation using `github.com/skip2/go-qrcode`. Creates the output directory on initialization. `GenerateQR()` encodes a string payload into a PNG file with medium error correction (~15% damage recovery), named `{ticketCode}.png`. Also provides `GetQRPath()` for path resolution and `Exists()` for idempotency checks. |

### Ticket Service

| File | Description |
|------|-------------|
| `ticket/service.go` | Core ticket generation and signing logic. `GenerateTicket()` is idempotent — checks for existing QR image and metadata file before proceeding. Pipeline: (1) create payload from event data, (2) sign with HMAC-SHA256 using a deterministic string `ticketCode:eventId:userId:eventDate`, (3) marshal to JSON, (4) generate QR code PNG, (5) save ticket metadata as JSON. Also provides `VerifySignature()` for payload validation, `saveMetadata()` / `LoadMetadata()` for JSON file I/O. |

### Dependencies

| File | Description |
|------|-------------|
| `go.mod` | Go module definition. Declares module path `github.com/emconnect/ticket-worker`, requires Go 1.25.0, and depends on `github.com/rabbitmq/amqp091-go v1.10.0` for RabbitMQ AMQP support and `github.com/skip2/go-qrcode` for QR code generation. |

---

## Services / WebSocket Hub (Go)

**Path:** `services/websocket-hub/`

The WebSocket Hub is a Go service that provides real-time communication between the backend and browser clients. It consumes domain events from RabbitMQ (event published/cancelled, registration confirmed/cancelled) and broadcasts them to connected WebSocket clients based on topic subscriptions. Uses the Hub pattern with per-client read/write goroutine pumps, topic-based routing, and supports live participant count updates.

### Entry Point

| File | Description |
|------|-------------|
| `main.go` | Application entry point. Initializes structured logging, loads configuration, creates the Hub and starts it in a goroutine. Creates the message handler and RabbitMQ consumer, connects with exponential backoff retry logic (5 attempts with 2× delays). Registers HTTP routes: `/ws` (WebSocket upgrade), `/health` (JSON health check), `/stats` (live client/topic stats). Serves `test.html` as a static file. Listens for OS signals (`SIGINT`, `SIGTERM`) for graceful shutdown. Starts HTTP server on configured port. |

### Config

| File | Description |
|------|-------------|
| `config/config.go` | Loads all configuration from environment variables with sensible defaults. Three config sections: RabbitMQ (URL, exchange `em.events`, queue `websocket.queue`, routing keys for all 4 event types `event.published`, `event.cancelled`, `registration.confirmed`, `registration.cancelled`, consumer tag, prefetch count 10, DLQ exchange `em.events.dlx`, DLQ queue `websocket.dlq`), Server (port, default `8081`), and Service metadata (name, environment). Provides `getEnv()` and `getEnvInt()` helper functions. |

### Consumer

| File | Description |
|------|-------------|
| `consumer/consumer.go` | Manages the RabbitMQ consumer lifecycle. Connects to the AMQP broker, sets QoS prefetch count. Self-declares queue topology: declares the `em.events` topic exchange, declares `websocket.queue` with `x-dead-letter-exchange` argument pointing to `em.events.dlx`, and binds the queue to all 4 routing keys (`event.published`, `event.cancelled`, `registration.confirmed`, `registration.cancelled`). Declares Dead Letter Queue infrastructure (DLX topic exchange + `websocket.dlq` queue + binding with `websocket.failed` routing key). Consumes messages with manual acknowledgment; on failure, routes messages to the DLQ with error metadata headers (original routing key, error message, original exchange). Provides graceful connection and channel closure via `Close()`. |

### Hub

| File | Description |
|------|-------------|
| `hub/hub.go` | Core Hub implementation using Go channels for thread-safe client management. Maintains a map of active clients and a map of topic subscriptions (`topic -> set of clients`). The `Run()` loop handles three channel operations: `register` (adds client, sends welcome message with client count), `unregister` (removes client from all topics, closes send channel), and `broadcast` (routes messages). Broadcast routing: empty topic = all clients, non-empty topic = only subscribed clients. Handles slow clients by closing their connections when send buffer is full. Provides `Subscribe(client, eventID)` / `Unsubscribe(client, eventID)` with confirmation messages. `Stats()` returns current client count and per-topic subscriber counts. Uses `sync.RWMutex` for topic map access. WebSocket upgrader allows all origins for development. |
| `hub/client.go` | Represents a single WebSocket connection. Each client has a `send` channel (buffered, 256 messages) and a `subscriptions` map tracking subscribed topics. `ReadPump()` goroutine reads client messages with a 1KB size limit and 60s pong timeout, dispatches to `handleClientMessage()` which routes by `type` field: `subscribe` (adds to topic), `unsubscribe` (removes from topic), `ping` (responds with `pong` + timestamp). `WritePump()` goroutine writes queued messages with 10s write deadline, batches multiple pending messages into a single WebSocket write frame, and sends periodic ping frames every 54s for keepalive. Constants: `writeWait=10s`, `pongWait=60s`, `pingPeriod=54s`, `maxMessageSize=1024`. |
| `hub/message.go` | Defines all WebSocket message types. Client-to-server: `ClientMessage` (type + raw JSON payload), `SubscribePayload` (eventId). Server-to-client: `ServerMessage` (type + payload interface), `ParticipantCountPayload` (eventId, eventTitle, count, action `registered`/`cancelled`, userName), `EventUpdatePayload` (eventId, eventTitle, eventType `EVENT_PUBLISHED`/`EVENT_CANCELLED`, location, startDate, organizerName, capacity, affectedRegistrations). Internal: `BroadcastMessage` (Topic string + ServerMessage, empty topic = broadcast to all). |

### Handler

| File | Description |
|------|-------------|
| `handler/handler.go` | Routes incoming RabbitMQ messages to WebSocket broadcasts by `eventType` field. Supports four event types: `EVENT_PUBLISHED` (broadcasts `event.published` to ALL clients with title, location, start date, organizer name, and capacity), `EVENT_CANCELLED` (broadcasts `event.cancelled` to ALL clients AND topic subscribers with affected registrations count), `REGISTRATION_CONFIRMED` (broadcasts `participant.count` to topic `event:{id}` subscribers with current participant count, action `registered`, and user name), `REGISTRATION_CANCELLED` (broadcasts `participant.count` to topic subscribers with decremented count and action `cancelled`). Logs all operations with emoji indicators and participant counts. |

### Model

| File | Description |
|------|-------------|
| `model/events.go` | Defines Go structs for all domain events consumed from RabbitMQ. Includes custom JSON unmarshaling for two timestamp formats to handle Java-Go interoperability: `Timestamp` (handles both epoch seconds and RFC 3339 strings) and `LocalDateTime` (handles both Java `LocalDateTime` arrays `[year, month, day, hour, minute, second]` and ISO 8601 strings). Structs: `BaseEvent` (eventId, eventType, timestamp), `EventPublishedEvent` (title, description, location, dates, capacity, organizer details), `EventCancelledEvent` (title, originalStartDate, organizerEmail, affectedRegistrations), `RegistrationConfirmedEvent` (registration/user/event details, ticketCode, currentParticipants), `RegistrationCancelledEvent` (registration/user details, cancelledAt, currentParticipants). |

### Test Dashboard

| File | Description |
|------|-------------|
| `test.html` | Browser-based WebSocket test dashboard served at `http://localhost:8081/test.html`. Features: auto-connect on page load, connection status indicator (green/red/yellow dot with color-coded status bar), exponential backoff reconnection (1s → 2s → 4s → ... → 30s cap with ±20% jitter), automatic re-subscription to all topics after reconnect, topic subscription management (subscribe/unsubscribe with visual tags), live participant count cards (per-event counters that update in real-time showing count + last action), color-coded message log (green for event.published, red for event.cancelled, blue for participant.count, yellow for system messages), ping/pong support, and a 200-message log buffer limit. |

### Dependencies

| File | Description |
|------|-------------|
| `go.mod` | Go module definition. Declares module path `github.com/emconnect/websocket-hub`, requires Go 1.25.0, and depends on `github.com/gorilla/websocket v1.5.3` for WebSocket support and `github.com/rabbitmq/amqp091-go v1.10.0` for RabbitMQ AMQP support. |

---

## Frontend (React — Vite)

**Stack:** Vite 6.x, React 19, React Router 7, Tailwind CSS 4, Lucide React
**Design System:** Bauhaus — geometric shapes, thick borders, hard shadows, primary palette (red/blue/yellow/black), Outfit font
**Dev Server:** Port 3000 with API proxy to `:8080` and WebSocket proxy to `:8081`

### Root Files

| File | Description |
|------|-------------|
| `index.html` | Entry HTML file. Links Google Fonts (Outfit, weights 400/500/700/900), mount point `<div id="root">`, loads `src/main.jsx` as ES module. |
| `package.json` | Project config. Dependencies: `react`, `react-dom`, `react-router-dom`, `lucide-react`. Dev deps: `vite`, `@vitejs/plugin-react`, `tailwindcss`, `@tailwindcss/vite`. Scripts: `dev`, `build`, `preview`. |
| `vite.config.js` | Vite config with `@vitejs/plugin-react` and `@tailwindcss/vite` plugins. Server runs on port 3000 with dual proxy: `/api` → `http://localhost:8080` (Spring Boot REST API, changeOrigin true), `/ws` → `ws://localhost:8081` (WebSocket Hub, `ws: true`). |

### Entry Point & App

| File | Description |
|------|-------------|
| `src/main.jsx` | React 19 root. Mounts `<App />` inside provider hierarchy: `<BrowserRouter>` → `<AuthProvider>` → `<WebSocketProvider>` → `<ToastProvider>`. Imports global CSS (`index.css`). Wrapped in `<React.StrictMode>`. Provider nesting order ensures auth is available to WebSocket, and WebSocket events are available to toasts. |
| `src/App.jsx` | Top-level route definitions using React Router 7 `<Routes>`. Public routes: `/login` → Login, `/register` → Register, `/events` → EventList, `/events/:id` → EventDetail. Protected routes (wrapped in `<ProtectedRoute>`): `/dashboard` → Dashboard, `/my-registrations` → MyRegistrations. Catch-all `*` → redirects to `/login`. Renders `<LiveAnnouncements>` globally so WebSocket-driven toast notifications appear on every page. |

### Styling

| File | Description |
|------|-------------|
| `src/index.css` | Global styles with Tailwind CSS 4 (`@import "tailwindcss"`). Defines Bauhaus design tokens via `@theme` directive: custom colors (`bauhaus-bg #F0F0F0`, `bauhaus-fg #121212`, `bauhaus-red #D02020`, `bauhaus-blue #1040C0`, `bauhaus-yellow #F0C020`), font family (`outfit`), hard shadows (`bauhaus-sm/md/lg/pressed` — offset-only, no blur). Includes utility classes for geometric corner decorations (`.bauhaus-corner`), diagonal stripe accents (`.bauhaus-stripe`), Bauhaus-style input focus rings (blue offset shadow), scrollbar styling, a tri-color loading spinner animation (`.bauhaus-spinner`), toast slide-in animation (`.animate-slide-in`), and a live-pulse keyframe (`.animate-live-pulse`) for the WebSocket status indicator. |

### Context Providers

| File | Description |
|------|-------------|
| `src/context/AuthContext.jsx` | Authentication state management via React Context API. Provides `AuthProvider` component and `useAuth()` hook. State: `user` (from localStorage on init), `loading`, `error`. Actions: `login(email, password)` calls API and stores user + token in localStorage, `register(email, password, name)` same flow, `logout()` clears storage and state, `clearError()` resets error. `isAuthenticated` is computed from user presence AND token existence via `useCallback` for stable references. |
| `src/context/WebSocketContext.jsx` | Persistent WebSocket connection manager via React Context. Provides `WebSocketProvider` and `useWebSocket()` hook. Connects to `/ws` endpoint (proxied to port 8081). Features: auto-reconnect with exponential backoff (1s→30s max), keep-alive pings every 30s, topic subscribe/unsubscribe by `eventId`, typed message listener registry (supports wildcard `*` listener), and automatic re-subscription on reconnect. Uses `useRef` for mutable WS state (socket, timers, listener map, subscription set) to avoid unnecessary re-renders. Exposes `isConnected`, `subscribe(eventId)`, `unsubscribe(eventId)`, `addListener(type, fn)`, `removeListener(type, fn)`. |
| `src/context/ToastContext.jsx` | Toast notification system via React Context. Provides `ToastProvider` and `useToast()` hook. `addToast({ title, message, type, duration })` creates a toast with auto-dismiss timer (default 5s). Toast UI renders as a fixed overlay in top-right corner with slide-in animation. Supports three color schemes: `published` (green accent), `cancelled` (red accent), and default (blue accent). Each toast has a close button. Module-level counter ensures unique IDs. `useRef` tracks timers to prevent stale closure issues. |

### Components

| File | Description |
|------|-------------|
| `src/components/AppLayout.jsx` | Shared layout shell used by all authenticated and public pages. Top navbar: Bauhaus tri-color dots + "EM-Connect" brand, responsive nav links (conditional on auth state — public: Browse Events; auth: Dashboard, Browse Events, My Registrations), user email display with admin badge (yellow), logout button. Includes a green "LIVE" indicator badge that pulsates when WebSocket is connected. Mobile hamburger menu with `sm:hidden` responsive breakpoint. Footer: copyright text + colored accent bar. |
| `src/components/LiveAnnouncements.jsx` | Headless component (renders `null`) that bridges WebSocket events to toast notifications. Subscribes to `event.published` and `event.cancelled` message types via `useWebSocket().addListener`. When events arrive, fires corresponding toasts via `useToast().addToast` with appropriate titles, messages, and auto-dismiss durations. Cleanup via `removeListener` in `useEffect` return. Decoupled observer pattern — no UI of its own, rendered globally in `App.jsx`. |
| `src/components/ProtectedRoute.jsx` | Route guard component. Uses `useAuth()` to check `isAuthenticated` — if false, renders `<Navigate to="/login" replace />`. Otherwise renders `children`. Used in `App.jsx` to wrap Dashboard and MyRegistrations routes. |
| `src/components/TicketModal.jsx` | Shared ticket modal overlay used by Dashboard, EventDetail, and MyRegistrations. Displays QR code image, event info, and ticket code. Fetches QR from `/api/tickets/{code}/qr` using authenticated `fetch()` with JWT Bearer token (from `localStorage` `em_token`) → blob → `URL.createObjectURL()`. This approach is necessary because browser `<img>` tags cannot send custom Authorization headers. Features: loading spinner during fetch, error/"QR generating..." fallback, download button (creates a temporary `<a>` element for programmatic PNG save). Backdrop click-to-close with `stopPropagation` on inner card. Green accent bar, event details section, centered QR image, ticket code display. |

### Pages

| File | Description |
|------|-------------|
| `src/pages/Login.jsx` | Full-screen Bauhaus-styled login page with split-panel layout. Left panel (desktop): solid blue (`#1040C0`) background with decorative geometric shapes (yellow circle, red square with hard shadow, black circle, white grid lines) and "EM-Connect" branding. Right panel: white card with thick black border and hard shadow, corner decorations (yellow square + red square), icon header (red square with LogIn icon), email/password inputs, red primary submit button with press animation, error alert bar (red tint with AlertCircle icon), divider, and "Create Account" link button. Bottom: three colored squares (red, blue circle, yellow) as decorative dots. Mobile: hides left panel, shows compact brand header. Clear-on-type pattern clears auth errors as user types. Client-side email regex validation. |
| `src/pages/Register.jsx` | Full-screen Bauhaus-styled registration page, mirrored layout from Login. Left panel: form side. Right panel (desktop): solid red (`#D02020`) background with blue rectangle, yellow circle, white square, grid lines, and "Join Us" branding. Card: blue corner decorations, blue icon (UserPlus), four fields (name, email, password, confirm password). Password strength meter with `useMemo`-based computation — evaluates length, uppercase, digits, and special chars, displays 4-bar visual indicator (Weak→Fair→Good→Strong with color gradient). `touched` state tracking for field-level validation, password match indicator icons, dynamic border colors. Blue primary submit button. Same Bauhaus card design as Login with reversed brand panel side (right, red). |
| `src/pages/Dashboard.jsx` | Post-login user dashboard. Welcome header with user name and role badge. Four stat cards (Events, Registrations, Tickets, Live Now) fetched in parallel via `Promise.all` — events count from `searchEvents` totalElements, registrations count from `getMyRegistrations` totalElements, tickets count from `getMyTickets` list length, live-now computed client-side by filtering events where `startDate <= now <= endDate`. Two-column preview section: left shows top 3 published events as linked cards (with status accent bar, location, date/time), right shows top 3 user registrations as cards (with status badge, ticket code, event link, date, cancel QR button for confirmed tickets). QR button opens shared `TicketModal`. Graceful degradation with `.catch(() => defaults)` for each API call. Loading states with spinner indicators. `StatCard` sub-component with colored icon square, value, and subtitle. Status-to-color mapping for accent bars. `en-IN` locale for date/time formatting. |
| `src/pages/EventList.jsx` | Paginated, searchable event browsing page. Debounced search input (400ms via `useRef` + `setTimeout`) calls `searchEvents(keyword, page, size)`. Displays events in a responsive 3-column grid via `EventCard` sub-component — each card shows status badge, title, description (truncated via `line-clamp-2`), date range, location, and hover effect (`hover:shadow-[3px_3px_0px_0px_#121212]`). Includes loading skeleton placeholders (8 animated cards), empty state message, error state with retry button, and prev/next pagination controls. Status-styled badges with color mapping. |
| `src/pages/EventDetail.jsx` | Full event detail page loaded via `useParams()` for event ID. Top section: status badge, event title, meta grid with `MetaItem` helper (date, time, location, capacity). Description section. Capacity progress bar with live WebSocket updates — subscribes to `participant.count` events for the specific event, animates bar width transitions. Live activity banner shows "X just registered" when real-time registration events arrive. Registration action section with complex conditional rendering based on auth state × registration state × event state: register button (with loading), cancel button (for confirmed registrations), "Sold Out" indicator, "Event Ended" state, "View Ticket" button (opens shared `TicketModal`). Uses `useWebSocket().subscribe/unsubscribe` with cleanup on unmount. |
| `src/pages/MyRegistrations.jsx` | Paginated list of user's registrations loaded via `getMyRegistrations(page, size, activeOnly)`. Toggle for active-only filtering (re-fetches from page 0). Each registration rendered via `RegistrationRow` sub-component showing: status badge (colored by status), ticket code (monospace font), event title (linked to event detail), date/location info, and action buttons. Actions: view ticket QR (opens shared `TicketModal`, available for confirmed registrations), view event link, cancel registration (inline with loading state, only for confirmed + future events). Prev/next pagination. |

### Services

| File | Description |
|------|-------------|
| `src/services/api.js` | Central HTTP client layer. Core `request(path, options)` function wraps `fetch()` with automatic JWT injection (from `localStorage` `em_token`), JSON content-type header, 401 auto-redirect (clears token, redirects to `/login` only if token existed), structured error message extraction, and 204/content-type handling. **Auth functions:** `login(email, password)` → POST `/api/auth/login` (stores token + user), `register(email, password, name)` → POST `/api/auth/register`, `logout()` clears storage, `getStoredUser()` / `getToken()` / `isAuthenticated()` read from localStorage. **Event functions:** `getEvents(page, size)`, `getEvent(id)`, `searchEvents(keyword, page, size)`, `getMyEvents()`, `createEvent(data)`, `updateEvent(id, data)`, `deleteEvent(id)`, `publishEvent(id)`, `cancelEvent(id)`, `completeEvent(id)`. **Registration functions:** `registerForEvent(eventId)`, `cancelRegistration(id)`, `getMyRegistrations(page, size, activeOnly)`, `getRegistration(id)`, `getRegistrationByTicket(code)`, `getEventRegistrationStatus(eventId)`, `getEventRegistrations(eventId, page, size)`. **Ticket functions:** `getMyTickets()` → GET `/api/tickets/my`. **Generic CRUD:** `api.get/post/put/delete` for ad-hoc requests. |

