# CODE.md — Source Code Documentation

This document provides a description of every source code file in the EM-Connect repository, organized by service and package.

---

## Table of Contents

- [Root Files](#root-files)
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

---

## Root Files

| File | Description |
|------|-------------|
| `docker-compose.yaml` | Defines the local development infrastructure: PostgreSQL 16 database, RabbitMQ 3.13 message broker (with management UI), and MailHog for local SMTP email testing. Includes health checks for all services. |

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
| `src/main/java/com/emconnect/api/controller/EventController.java` | Full CRUD for events. Endpoints: create (`POST /api/events`), get by ID (`GET /api/events/{id}`), list all published (`GET /api/events`), update (`PUT /api/events/{id}`), delete (`DELETE /api/events/{id}`), publish (`POST /api/events/{id}/publish`), cancel (`POST /api/events/{id}/cancel`), complete (`POST /api/events/{id}/complete`), get organizer's events (`GET /api/events/my-events`), and search (`GET /api/events/search`). Supports pagination. |
| `src/main/java/com/emconnect/api/controller/UserController.java` | Exposes `GET /api/users/me` to return the currently authenticated user's profile information. |
| `src/main/java/com/emconnect/api/controller/RegistrationController.java` | Manages event registrations. Endpoints: register for an event (`POST /api/registrations/events/{eventId}`), cancel registration (`POST /api/registrations/{id}/cancel`), get current user's registrations (`GET /api/registrations/my-registrations`), get registrations for an event (`GET /api/registrations/events/{eventId}`), check registration status (`GET /api/registrations/events/{eventId}/status`), and validate a ticket (`GET /api/registrations/tickets/{ticketCode}/validate`). |
| `src/main/java/com/emconnect/api/controller/AdminController.java` | Admin-only endpoints (requires ADMIN role): `GET /api/admin/users` (list all users), `GET /api/admin/dashboard` (stats: total users, events, registrations), `POST /api/admin/users/{id}/promote` (promote user to ADMIN), and `POST /api/admin/users/{id}/demote` (demote admin to USER). |
| `src/main/java/com/emconnect/api/controller/UserTestController.java` | Test-only controller at `/api/test/users`. Provides endpoints to create a hardcoded test user and list all users. Intended for development/testing, not production use. |
| `src/main/java/com/emconnect/api/controller/TestConcurrencyController.java` | Test-only controller at `/api/test/concurrent-register`. Simulates concurrent registration attempts for a given event by firing multiple threads simultaneously. Used to verify pessimistic locking prevents overbooking. Not intended for production. |

### Services

| File | Description |
|------|-------------|
| `src/main/java/com/emconnect/api/service/AuthService.java` | Business logic for authentication. `register()` checks for duplicate emails, hashes the password with BCrypt, saves the user, and generates a JWT. `login()` validates credentials and returns a JWT. |
| `src/main/java/com/emconnect/api/service/JwtService.java` | Handles JWT lifecycle. Generates tokens containing user ID, email, and role claims using HMAC-SHA signing. Provides methods to validate tokens and extract individual claims (user ID, email, role). |
| `src/main/java/com/emconnect/api/service/CustomUserDetailsService.java` | Implements Spring Security's `UserDetailsService`. Loads user details by email (username) or by user ID. Converts the application `Role` enum into Spring Security `GrantedAuthority` objects. |
| `src/main/java/com/emconnect/api/service/EventService.java` | Core event management logic. Creates events in DRAFT status, publishes events (validates future start date), cancels and completes events using the `EventStatus` state machine. Supports search by title and filtering by status. Uses pessimistic locking on event reads. Publishes domain events to RabbitMQ on publish and cancel actions. |
| `src/main/java/com/emconnect/api/service/RegistrationService.java` | Manages user-to-event registrations. Uses pessimistic locking on the event row to enforce capacity constraints under concurrent access. Validates that the event is published and has available capacity. Generates UUID-based ticket codes. Supports cancellation and re-registration (reactivation of a cancelled registration). Publishes registration domain events to RabbitMQ. |
| `src/main/java/com/emconnect/api/service/EventPublisher.java` | Publishes domain events to the RabbitMQ `em.events` exchange using routing keys: `registration.confirmed`, `registration.cancelled`, `event.published`, and `event.cancelled`. Serializes events as JSON. |

### Entities

| File | Description |
|------|-------------|
| `src/main/java/com/emconnect/api/entity/User.java` | JPA entity mapped to the `users` table. Fields: `id` (auto-generated), `email` (unique), `password` (BCrypt-hashed), `name`, `role` (USER or ADMIN), `createdAt`, `updatedAt`. Timestamps are auto-set via `@PrePersist` / `@PreUpdate`. |
| `src/main/java/com/emconnect/api/entity/Event.java` | JPA entity mapped to the `events` table. Fields: `title`, `description`, `location`, `startDate`, `endDate`, `capacity`, `status` (EventStatus enum), `organizer` (many-to-one FK to User), `createdAt`, `updatedAt`. |
| `src/main/java/com/emconnect/api/entity/Registration.java` | JPA entity mapped to the `registrations` table. Has a unique constraint on `(user_id, event_id)`. Fields: `user` (FK), `event` (FK), `status` (RegistrationStatus), `ticketCode` (UUID-based, unique), `registeredAt`, `cancelledAt`, `createdAt`, `updatedAt`. Includes a `cancel()` method that sets the status and cancelled timestamp. |
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

### Repositories

| File | Description |
|------|-------------|
| `src/main/java/com/emconnect/api/repository/UserRepository.java` | Spring Data JPA repository for `User`. Custom queries: `findByEmail()`, `existsByEmail()`. |
| `src/main/java/com/emconnect/api/repository/EventRepository.java` | Spring Data JPA repository for `Event`. Custom queries include: `findByStatus()`, `findByOrganizerId()`, `searchByTitle()` (case-insensitive LIKE), `countByOrganizerId()`, `findByIdWithLock()` (pessimistic write lock via `@Lock`), and `findUpcomingPublishedEvents()` (published events with future start dates, ordered by date). |
| `src/main/java/com/emconnect/api/repository/RegistrationRepository.java` | Spring Data JPA repository for `Registration`. Custom queries: existence checks by user/event/status, lookups by user or event with pagination, ticket code validation, confirmed registration count per event, and filtering for upcoming registrations. |

### Domain Events

| File | Description |
|------|-------------|
| `src/main/java/com/emconnect/api/event/BaseEvent.java` | Abstract base class for all domain events. Contains `eventId` (UUID string), `eventType` (string), and `timestamp` (epoch seconds). Provides static factory methods for creating child event instances. |
| `src/main/java/com/emconnect/api/event/RegistrationConfirmedEvent.java` | Domain event fired when a user successfully registers for an event. Carries: `registrationId`, `userId`, `userEmail`, `userName`, `eventId`, `eventTitle`, `eventLocation`, `eventStartDate`, `eventEndDate`, `ticketCode`. |
| `src/main/java/com/emconnect/api/event/RegistrationCancelledEvent.java` | Domain event fired when a registration is cancelled. Carries: `registrationId`, `userId`, `userEmail`, `userName`, `eventId`, `eventTitle`, `cancelledAt`. |
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
| `src/main/resources/application.yml` | Main application configuration. Configures: PostgreSQL datasource connection, JPA/Hibernate settings (validate mode, SQL logging), Flyway migration paths, RabbitMQ connection details, server port (8080), Spring Actuator health endpoints, and JWT secret/expiration (24 hours). |

### Database Migrations (Flyway)

| File | Description |
|------|-------------|
| `src/main/resources/db/migration/V1__initial_schema.sql` | Enables the `uuid-ossp` PostgreSQL extension and creates a `schema_info` table to verify that Flyway migrations are working. |
| `src/main/resources/db/migration/V2__create_users_table.sql` | Creates the `users` table with columns: `id`, `email` (unique), `password`, `name`, `role` (default USER), `created_at`, `updated_at`. Adds an index on `email`. |
| `src/main/resources/db/migration/V3__create_admin_user.sql` | Seeds a default admin user (`admin@emconnect.com`) with a BCrypt-hashed password. Uses `ON CONFLICT DO NOTHING` for idempotency. |
| `src/main/resources/db/migration/V4__create_events_table.sql` | Creates the `events` table with columns: `id`, `title`, `description`, `location`, `start_date`, `end_date`, `capacity`, `status` (default DRAFT), `organizer_id` (FK to `users`), timestamps. Adds indexes on `organizer_id`, `status`, and `start_date`. |
| `src/main/resources/db/migration/V5__create_registrations_table.sql` | Creates the `registrations` table with columns: `id`, `user_id` (FK), `event_id` (FK), `status` (default CONFIRMED), `ticket_code` (unique), `registered_at`, `cancelled_at`, timestamps. Adds a unique constraint on `(user_id, event_id)` and indexes on `user_id`, `event_id`, `status`, and `ticket_code`. |

### Tests

| File | Description |
|------|-------------|
| `src/test/java/com/emconnect/api/ApiApplicationTests.java` | Empty test class placeholder for the Spring Boot application context load test. |
| `src/test/java/com/emconnect/api/service/RegistrationConcurrencyTest.java` | Integration test that verifies pessimistic locking prevents event overbooking. Creates an event with limited capacity and fires 15 concurrent registration attempts across threads. Asserts that confirmed registrations never exceed the event capacity. Also tests concurrent cancel-and-re-register scenarios. Requires a running PostgreSQL instance. |

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
| `config/config.go` | Loads all configuration from environment variables with sensible defaults. Settings include: RabbitMQ connection (URL, exchange, queue, routing keys, consumer tag, prefetch count, DLQ settings), email/SMTP settings (host, port, from address, max retries, retry backoff), and service metadata (name, environment). Provides `getEnv()` and `getEnvInt()` helper functions. |

### Consumer

| File | Description |
|------|-------------|
| `consumer/consumer.go` | Manages the RabbitMQ consumer lifecycle. Connects to the AMQP broker, sets QoS prefetch count, declares and binds the Dead Letter Queue, and consumes messages with manual acknowledgment. For each message, it delegates processing to the handler; on failure, it routes the message to the DLQ with error metadata (original routing key, error message, original exchange). Provides graceful connection and channel closure. |

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
