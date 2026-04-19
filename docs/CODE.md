# CODE.md - Repository Code Guide

Last updated: 2026-04-19

This document maps the EM-Connect repository as it exists now. It covers maintained source code, config, deployment, documentation, and support files. Runtime-generated artifacts such as uploaded avatars/banners and generated ticket QR files are summarized by directory instead of documented one-by-one.

This guide documents the current repo layout, including the smaller active docs set and the `docs/archive/` area for historical notes.

## Recent Additions Since Earlier CODE.md Versions

- New operational docs were added under `docs/`: `DEPLOY.md`, `INCREMENTAL_FEATURES.md`, and `SECURITY_AUDIT.md`.
- The API gained password-reset resend support, login-activity tracking, a production Dockerfile, a production profile, and migration `V11__create_login_activity_table.sql`.
- The frontend gained `/about`, a real `NotFound` page, post-auth return-to-intent redirects, email-normalization helpers, deploy-aware API/WebSocket URL helpers, richer event discovery filters, and new registration UX dialogs.
- The notification worker now handles more than the original registration/event emails: welcome, login-alert, password-changed, check-in, and password-reset-code flows are all wired in.
- The notification and ticket workers expose lightweight `/health` endpoints for Render web-service deployment, and the WebSocket hub now supports `PORT` as well as `SERVER_PORT`.
- Deployment files (`frontend/netlify.toml`, `frontend/vercel.json`, `services/api/Dockerfile`) and helper scripts (`might-need-later/run-all.ps1`) are now part of the repo story and belong in this map.

## Root Files

| Path | Description |
| --- | --- |
| `.env` | Local scratch environment file for manual runs. Useful during development, but not the main source of truth for deployment config. |
| `.gitignore` | Ignore rules for build outputs, local runtime files, and developer-specific clutter. |
| `docker-compose.yaml` | Local infrastructure stack: PostgreSQL 16, RabbitMQ 3.13 with management UI, and MailHog under the optional `dev` profile. Includes persistent Docker volumes and health checks. |
| `README.md` | Project-level overview, live deployment links, architecture summary, local run instructions, and high-level feature inventory. |

## Documentation

| Path | Description |
| --- | --- |
| `docs/API.md` | REST API reference covering the active controller surface, query params, auth expectations, and current access-control caveats. |
| `docs/AUTHENTICATION.md` | Auth and security notes for JWT flow, Google OAuth, password reset, login activity, CORS, and current guardrail gaps. |
| `docs/CODE.md` | This file. Current repo map and code guide. |
| `docs/DATABASE.md` | Database schema, migration chain through V11, enums, and operational notes. |
| `docs/DEPLOY.md` | Live deployment runbook for Netlify/Vercel + Render + Neon + CloudAMQP, including required cross-origin/runtime fixes. |
| `docs/EVENT_STATES.md` | Event lifecycle and valid state-transition rules. |
| `docs/FUTURE.md` | Roadmap and backlog of future improvements. |
| `docs/INCREMENTAL_FEATURES.md` | Smaller UX/product improvements tracked separately from the main roadmap. Includes completed items like OTP paste, resend cooldown, login activity, return-to-intent redirect, and Not Found routing. |
| `docs/OVERVIEW.md` | Quick orientation doc for the deployed system. |
| `docs/RABBITMQ_TOPOLOGY_DESIGN.md` | Broker topology, routing keys, queues, and DLQ design. |
| `docs/SECURITY_AUDIT.md` | Repository-wide security review, findings, and phased remediation plan. |
| `docs/archive/README.md` | Index for archived docs that are kept for history but no longer part of the active reference set. |
| `docs/archive/CONTEXT.md` | Archived long-form handoff doc. |
| `docs/archive/PLAN.md` | Archived original phased plan. |
| `docs/archive/NOTES.md` | Archived development journal. |

## Support and Archive Files

| Path | Description |
| --- | --- |
| `might-need-later/run-all.ps1` | PowerShell helper that launches the API, all Go services, and the frontend in separate windows. Supports `local` vs `prod` profile selection and clears accidental datasource overrides for local runs. |
| `might-need-later/events.sql` | Saved SQL scratch file from earlier schema/data work. |
| `might-need-later/events_fixed.sql` | Revised SQL scratch file kept for reference. |

## Services / API (`services/api`)

Spring Boot 3.2.2 service responsible for auth, events, registrations, tickets, scheduling, analytics, persistence, and RabbitMQ publishing.

### Root and Build Files

| Path | Description |
| --- | --- |
| `services/api/Dockerfile` | Multi-stage build: Maven image compiles the jar, Temurin JRE image runs it. Entry point respects Render's `PORT` env var and falls back to `8080`. |
| `services/api/mvnw` | Unix Maven wrapper script. |
| `services/api/mvnw.cmd` | Windows Maven wrapper script. |
| `services/api/pom.xml` | Maven build config. Pulls in Spring Web, Data JPA, Validation, Security, Actuator, AMQP, Flyway, PostgreSQL, and JJWT. |
| `services/api/avatars/` | Local avatar upload directory. The repo currently contains sample runtime artifacts, but this folder is really application storage. |
| `services/api/banners/` | Local banner upload directory. Like `avatars/`, this is runtime storage and currently also contains sample artifacts. |

### Application and Config

| Path | Description |
| --- | --- |
| `services/api/src/main/java/com/emconnect/api/ApiApplication.java` | Main Spring Boot entry point. Enables scheduling and sets JVM default timezone to `Asia/Kolkata`. |
| `services/api/src/main/java/com/emconnect/api/config/SecurityConfig.java` | Spring Security setup: stateless JWT auth, explicit CORS allowlist via `CORS_ALLOWED_ORIGINS`, public endpoint rules, admin URL protection, and filter-chain registration. |
| `services/api/src/main/java/com/emconnect/api/config/JwtAuthenticationFilter.java` | Reads Bearer tokens, validates them through `JwtService`, loads the user, and seeds the `SecurityContext` for downstream handlers. |
| `services/api/src/main/java/com/emconnect/api/config/RabbitMQConfig.java` | Declares the topic exchange, DLX, queues, queue bindings, wildcard routing patterns, and JSON message conversion for RabbitMQ. |

### Controllers

| Path | Description |
| --- | --- |
| `services/api/src/main/java/com/emconnect/api/controller/AuthController.java` | Auth endpoints for register, login, Google OAuth, forgot-password, resend-reset-code, verify-reset-code, and final reset. Also captures client IP and sanitized user-agent for login activity. |
| `services/api/src/main/java/com/emconnect/api/controller/HealthController.java` | Lightweight `/api/health` and `/api/ping` endpoints. |
| `services/api/src/main/java/com/emconnect/api/controller/EventController.java` | Event CRUD/lifecycle endpoints, organizer event listing, public search with category/tag filters, category listing, participant count, and banner upload/serving. |
| `services/api/src/main/java/com/emconnect/api/controller/UserController.java` | Current-user profile endpoints, login-activity feed, name update, password change, avatar upload, and avatar serving. |
| `services/api/src/main/java/com/emconnect/api/controller/RegistrationController.java` | Event registration, cancellation, status lookup, current-user registration listing, single registration lookup, ticket-code lookup, and event-level registration listing. |
| `services/api/src/main/java/com/emconnect/api/controller/TicketController.java` | Current-user ticket listing, single-ticket lookup, QR image download, and ticket validation/check-in endpoint guarded by method security. |
| `services/api/src/main/java/com/emconnect/api/controller/AdminController.java` | Admin dashboard stats, all-user listing, admin event listing/filtering, promote/demote actions, and analytics payload assembly for the charts page. |
| `services/api/src/main/java/com/emconnect/api/controller/UserTestController.java` | Dev/test-only helper controller for creating and listing test users. |
| `services/api/src/main/java/com/emconnect/api/controller/TestConcurrencyController.java` | Dev/test-only endpoint for hammering registration concurrency and verifying locking behavior. |

### Services

| Path | Description |
| --- | --- |
| `services/api/src/main/java/com/emconnect/api/service/AuthService.java` | Core auth logic. Handles register/login/Google login, publishes user events, records login activity, trims retained login-activity rows to the latest 100, and links existing email accounts to Google when needed. |
| `services/api/src/main/java/com/emconnect/api/service/CustomUserDetailsService.java` | Bridge between the app's `User` entity and Spring Security's `UserDetails` lookup model. Supports lookup by email and by user id. |
| `services/api/src/main/java/com/emconnect/api/service/EventPublisher.java` | RabbitMQ publisher for all domain events: registration confirmed/cancelled/check-in, event published/cancelled/updated/reminder, and user registered/login/password-changed/password-reset. |
| `services/api/src/main/java/com/emconnect/api/service/EventReminderScheduler.java` | Scheduled reminder service running every 15 minutes. Sends `24H` and `1H` reminder events while deduplicating via the `event_reminders` table. |
| `services/api/src/main/java/com/emconnect/api/service/EventService.java` | Event business logic: create, update, publish, cancel, complete, organizer ownership checks, category/tag filtering, participant counting, and banner upload/storage. |
| `services/api/src/main/java/com/emconnect/api/service/JwtService.java` | Generates and parses HS256 JWTs with user id, email, and role claims. |
| `services/api/src/main/java/com/emconnect/api/service/PasswordResetService.java` | Forgot-password backend: invalidates older codes, generates 6-digit codes, enforces 30-second resend cooldown, verifies codes without consuming them, and completes password resets. |
| `services/api/src/main/java/com/emconnect/api/service/RegistrationService.java` | Registration workflow with pessimistic locking, capacity enforcement, duplicate-prevention/reactivation, per-status listing, and RabbitMQ event publishing with live participant counts. |
| `services/api/src/main/java/com/emconnect/api/service/TicketService.java` | Ticket retrieval and check-in logic. Maps registrations to ticket DTOs, checks QR-file existence, serves QR images from disk, and performs idempotent validation/check-in. |
| `services/api/src/main/java/com/emconnect/api/service/UserService.java` | Profile logic: get/update current user, fetch login history, change password, upload avatars, and safely resolve avatar paths. |

### Entities and Enums

| Path | Description |
| --- | --- |
| `services/api/src/main/java/com/emconnect/api/entity/Event.java` | Event aggregate root with organizer relation, category/tags/banner fields, and lifecycle timestamps. |
| `services/api/src/main/java/com/emconnect/api/entity/EventCategory.java` | Event-category enum used by search filters and admin/event forms. |
| `services/api/src/main/java/com/emconnect/api/entity/EventReminder.java` | Dedupe record for reminder emails already sent for a registration/event/reminder-type combination. |
| `services/api/src/main/java/com/emconnect/api/entity/EventStatus.java` | Lifecycle enum (`DRAFT`, `PUBLISHED`, `CANCELLED`, `COMPLETED`) with transition helpers/business rules. |
| `services/api/src/main/java/com/emconnect/api/entity/LoginActivity.java` | Login audit row storing user, login method, source IP, user-agent summary inputs, and timestamp. |
| `services/api/src/main/java/com/emconnect/api/entity/PasswordResetCode.java` | Reset-code entity with expiry, used flag, and timestamp metadata. |
| `services/api/src/main/java/com/emconnect/api/entity/Registration.java` | Registration aggregate containing user/event relations, ticket code, status, cancel/check-in timestamps, and lifecycle helpers. |
| `services/api/src/main/java/com/emconnect/api/entity/RegistrationStatus.java` | Registration state enum (`CONFIRMED`, `CANCELLED`, `ATTENDED`, `NO_SHOW`). |
| `services/api/src/main/java/com/emconnect/api/entity/Role.java` | User role enum (`USER`, `ADMIN`). |
| `services/api/src/main/java/com/emconnect/api/entity/User.java` | User entity with email/password, role, avatar URL, optional OAuth provider, and timestamps. |

### DTOs

| Path | Description |
| --- | --- |
| `services/api/src/main/java/com/emconnect/api/dto/AuthResponse.java` | Auth success payload containing message, user snapshot, and JWT token. |
| `services/api/src/main/java/com/emconnect/api/dto/ChangePasswordRequest.java` | Current/new password request body for the profile password-change flow. |
| `services/api/src/main/java/com/emconnect/api/dto/CreateEventRequest.java` | Request body for creating events. Includes title, time range, capacity, and optional category/tags. |
| `services/api/src/main/java/com/emconnect/api/dto/EventResponse.java` | Public/admin event response with organizer summary, category, tag list, and banner URL normalized to an API path. |
| `services/api/src/main/java/com/emconnect/api/dto/ForgotPasswordRequest.java` | Simple email-only request body used for both request-reset and resend-reset-code flows. |
| `services/api/src/main/java/com/emconnect/api/dto/GoogleTokenRequest.java` | Request body wrapping the Google credential token. |
| `services/api/src/main/java/com/emconnect/api/dto/LoginActivityResponse.java` | Profile login-activity item. Converts raw IP + user-agent into a friendlier `source` string such as `Chrome on Windows`. |
| `services/api/src/main/java/com/emconnect/api/dto/LoginRequest.java` | Email/password login request body. |
| `services/api/src/main/java/com/emconnect/api/dto/RegisterRequest.java` | User-registration request body. |
| `services/api/src/main/java/com/emconnect/api/dto/RegistrationResponse.java` | Registration payload with nested event summary and nested user summary. |
| `services/api/src/main/java/com/emconnect/api/dto/ResetPasswordRequest.java` | Final reset-password body with email, code, and new password. |
| `services/api/src/main/java/com/emconnect/api/dto/TicketResponse.java` | Ticket summary returned by `/api/tickets/*`, including nested event/user summaries and `qrReady` state. |
| `services/api/src/main/java/com/emconnect/api/dto/TicketValidationResponse.java` | Structured response for ticket validation/check-in, including success, already-used, and invalid variants. |
| `services/api/src/main/java/com/emconnect/api/dto/UpdateEventRequest.java` | Editable event fields for update flows. |
| `services/api/src/main/java/com/emconnect/api/dto/UpdateProfileRequest.java` | Current-user profile update body (name only). |
| `services/api/src/main/java/com/emconnect/api/dto/UserResponse.java` | Sanitized user snapshot returned to the frontend. Includes `avatarUrl` and `oauthProvider`. |
| `services/api/src/main/java/com/emconnect/api/dto/VerifyResetCodeRequest.java` | Email + code request body for the intermediate reset-code verification step. |

### Repositories

| Path | Description |
| --- | --- |
| `services/api/src/main/java/com/emconnect/api/repository/EventReminderRepository.java` | Dedupe lookup for reminder records. |
| `services/api/src/main/java/com/emconnect/api/repository/EventRepository.java` | Event queries: status filters, organizer listing, public search, category/tag queries, active categories, locking reads, and analytics aggregations. |
| `services/api/src/main/java/com/emconnect/api/repository/LoginActivityRepository.java` | Login-activity lookup/count helpers used by the profile timeline and retention trimming. |
| `services/api/src/main/java/com/emconnect/api/repository/PasswordResetCodeRepository.java` | Reset-code lookups, latest-code lookup for resend cooldown, invalidation query, and cleanup query. |
| `services/api/src/main/java/com/emconnect/api/repository/RegistrationRepository.java` | Registration lookups by user/event/status/ticket plus analytics helpers (daily/hourly/day-of-week trends, recent activity) and reminder scheduler query helpers. |
| `services/api/src/main/java/com/emconnect/api/repository/UserRepository.java` | User lookup/existence checks and daily new-user aggregation for analytics. |

### Domain Events

| Path | Description |
| --- | --- |
| `services/api/src/main/java/com/emconnect/api/event/BaseEvent.java` | Common event metadata shared by all RabbitMQ payloads. |
| `services/api/src/main/java/com/emconnect/api/event/CheckInEvent.java` | Published when a ticket is validated for the first time. |
| `services/api/src/main/java/com/emconnect/api/event/EventCancelledEvent.java` | Event-cancelled broadcast payload. |
| `services/api/src/main/java/com/emconnect/api/event/EventPublishedEvent.java` | Event-published broadcast payload. |
| `services/api/src/main/java/com/emconnect/api/event/EventReminderEvent.java` | Reminder-email payload emitted by the scheduler. |
| `services/api/src/main/java/com/emconnect/api/event/EventUpdatedEvent.java` | Event-updated broadcast payload. |
| `services/api/src/main/java/com/emconnect/api/event/PasswordResetRequestedEvent.java` | Password-reset-code email payload. |
| `services/api/src/main/java/com/emconnect/api/event/RegistrationCancelledEvent.java` | Registration-cancelled payload including current participant count. |
| `services/api/src/main/java/com/emconnect/api/event/RegistrationConfirmedEvent.java` | Registration-confirmed payload used by ticket generation, notifications, and realtime updates. |
| `services/api/src/main/java/com/emconnect/api/event/UserLoginEvent.java` | Login-alert payload with auth method. |
| `services/api/src/main/java/com/emconnect/api/event/UserPasswordChangedEvent.java` | Password-changed email payload. |
| `services/api/src/main/java/com/emconnect/api/event/UserRegisteredEvent.java` | Welcome-email payload for newly created users. |

### Exceptions

| Path | Description |
| --- | --- |
| `services/api/src/main/java/com/emconnect/api/exception/DuplicateRegistrationException.java` | Thrown when a new registration would duplicate an existing active one. |
| `services/api/src/main/java/com/emconnect/api/exception/EmailAlreadyExistsException.java` | Raised during register flows when the email is already taken. |
| `services/api/src/main/java/com/emconnect/api/exception/ErrorResponse.java` | Standard error payload wrapper returned by global exception handling. |
| `services/api/src/main/java/com/emconnect/api/exception/EventNotAvailableException.java` | Raised when an event cannot be registered against due to status/capacity constraints. |
| `services/api/src/main/java/com/emconnect/api/exception/GlobalExceptionHandler.java` | Maps common exceptions and validation errors to HTTP responses. |
| `services/api/src/main/java/com/emconnect/api/exception/InvalidCredentialsException.java` | Login/auth failure exception. |
| `services/api/src/main/java/com/emconnect/api/exception/InvalidStateTransitionException.java` | Used when event lifecycle transitions are not allowed. |
| `services/api/src/main/java/com/emconnect/api/exception/ResourceNotFoundException.java` | Generic not-found exception. |

### Resources and Migrations

| Path | Description |
| --- | --- |
| `services/api/src/main/resources/application.yml` | Local/default runtime config: PostgreSQL, RabbitMQ, Flyway, multipart limits, JWT settings, Google OAuth client id, and ticket QR storage path. |
| `services/api/src/main/resources/application-prod.yml` | Production-profile override currently wired to the hosted stack. Mirrors the same major settings as `application.yml` but with production endpoints/credentials. |
| `services/api/src/main/resources/db/migration/V1__initial_schema.sql` | Base schema bootstrap. |
| `services/api/src/main/resources/db/migration/V2__create_users_table.sql` | Users table creation. |
| `services/api/src/main/resources/db/migration/V3__create_admin_user.sql` | Seeds the initial admin account. |
| `services/api/src/main/resources/db/migration/V4__create_events_table.sql` | Events table creation. |
| `services/api/src/main/resources/db/migration/V5__create_registrations_table.sql` | Registrations table creation, including ticket/check-in-oriented fields. |
| `services/api/src/main/resources/db/migration/V6__add_avatar_to_users.sql` | Adds avatar support to users. |
| `services/api/src/main/resources/db/migration/V7__add_oauth_provider_to_users.sql` | Adds `oauth_provider` and supports password-less OAuth users. |
| `services/api/src/main/resources/db/migration/V8__add_category_tags_banner_to_events.sql` | Adds category, tag, and banner fields for richer event discovery. |
| `services/api/src/main/resources/db/migration/V9__create_event_reminders_table.sql` | Creates reminder-send tracking table used to prevent duplicate reminder emails. |
| `services/api/src/main/resources/db/migration/V10__create_password_reset_codes_table.sql` | Adds password reset code storage with expiry and used flags. |
| `services/api/src/main/resources/db/migration/V11__create_login_activity_table.sql` | Adds login activity timeline storage for profile security visibility. |

### Tests

| Path | Description |
| --- | --- |
| `services/api/src/test/java/com/emconnect/api/ApiApplicationTests.java` | Basic Spring context smoke test. |
| `services/api/src/test/java/com/emconnect/api/service/RegistrationConcurrencyTest.java` | Concurrency-focused test around registration locking/capacity behavior. |
| `services/api/src/test/resources/application-test.properties` | Test profile properties. |

## Services / Notification Worker (`services/notification-worker`)

Go service that consumes RabbitMQ events and sends HTML emails through the SendGrid HTTP API.

| Path | Description |
| --- | --- |
| `services/notification-worker/go.mod` | Go module definition for the notification worker. |
| `services/notification-worker/go.sum` | Locked transitive dependency hashes. |
| `services/notification-worker/main.go` | Bootstraps config, starts a lightweight `/health` server for hosted deployments, connects to RabbitMQ with retry, and keeps the consumer running with graceful shutdown. |
| `services/notification-worker/config/config.go` | Env-driven config loader for RabbitMQ, SendGrid sender settings, retry behavior, and service metadata. |
| `services/notification-worker/consumer/consumer.go` | RabbitMQ consumer implementation with queue declaration, wildcard bindings, manual ACKs, prefetch, and DLQ forwarding on handler failure. |
| `services/notification-worker/email/email.go` | Raw SendGrid v3 API client with retry/backoff and no SDK dependency. |
| `services/notification-worker/handler/handler.go` | Event router that handles registration confirmed/cancelled, event published/cancelled/reminder, user registered/login/password-changed, check-in, and password-reset-code events. Also formats dates in a configurable timezone. |
| `services/notification-worker/model/events.go` | Shared event structs plus custom timestamp unmarshalling helpers that can ingest Java array/string/timestamp formats. |
| `services/notification-worker/templates/templates.go` | Embedded HTML template registry. Contains Bauhaus-styled templates for registration confirmed/cancelled, event published/cancelled/reminder, welcome, login alert, password changed, check-in, and password reset code emails. |

## Services / Ticket Worker (`services/ticket-worker`)

Go service that consumes `registration.confirmed`, generates signed QR payloads, and saves ticket artifacts to disk.

| Path | Description |
| --- | --- |
| `services/ticket-worker/go.mod` | Go module definition for the ticket worker. |
| `services/ticket-worker/go.sum` | Locked transitive dependency hashes. |
| `services/ticket-worker/main.go` | Bootstraps config, starts a lightweight `/health` server, builds the QR/ticket services, connects to RabbitMQ with retry, and supervises the consumer loop. |
| `services/ticket-worker/config/config.go` | Env-driven RabbitMQ and ticket-generation config, including secret key, output directories, and QR size. |
| `services/ticket-worker/consumer/consumer.go` | Queue consumer that binds only the ticket queue and forwards failed messages to the DLQ exchange. |
| `services/ticket-worker/handler/handler.go` | Routes incoming messages and only acts on `REGISTRATION_CONFIRMED`. Other event types are ignored. |
| `services/ticket-worker/model/events.go` | Registration-confirmed event struct plus `TicketPayload` and `TicketMetadata` structs used during QR generation and metadata storage. |
| `services/ticket-worker/qr/generator.go` | Creates PNG QR codes and exposes helpers to check whether a QR already exists. |
| `services/ticket-worker/ticket/service.go` | Core ticket pipeline: idempotency checks, payload creation, HMAC-SHA256 signing, QR generation, metadata JSON saving, and signature verification. |
| `services/ticket-worker/tickets/qr/` | Runtime QR image output directory. The repo currently contains sample generated ticket PNGs. |
| `services/ticket-worker/tickets/metadata/` | Runtime metadata output directory. The repo currently contains sample generated ticket JSON files. |

## Services / WebSocket Hub (`services/websocket-hub`)

Go service that consumes RabbitMQ updates and fans them out to browser clients over WebSocket.

| Path | Description |
| --- | --- |
| `services/websocket-hub/go.mod` | Go module definition for the WebSocket hub. |
| `services/websocket-hub/go.sum` | Locked transitive dependency hashes. |
| `services/websocket-hub/main.go` | Loads config, boots the hub loop, starts the RabbitMQ consumer, and exposes `/ws`, `/health`, and `/stats` over HTTP. |
| `services/websocket-hub/config/config.go` | Env loader for RabbitMQ settings plus server port resolution. Supports `PORT` first, then `SERVER_PORT`, then `8081`. |
| `services/websocket-hub/consumer/consumer.go` | RabbitMQ consumer with explicit bindings for `event.published`, `event.cancelled`, `registration.confirmed`, and `registration.cancelled`. Includes DLQ handling. |
| `services/websocket-hub/handler/handler.go` | Converts backend events into frontend-facing socket messages such as `event.published`, `event.cancelled`, and `participant.count`. |
| `services/websocket-hub/hub/client.go` | Per-connection read/write pump implementation with send buffer, ping/pong handling, topic subscription messages, and slow-client cleanup. |
| `services/websocket-hub/hub/hub.go` | Central hub that tracks connected clients, topic subscriptions, broadcasting, connection stats, and the actual HTTP upgrade path. |
| `services/websocket-hub/hub/message.go` | Client/server message contracts, including subscribe/unsubscribe/ping requests and broadcast payload structs. |
| `services/websocket-hub/model/events.go` | Event structs required by the realtime fan-out layer, plus timestamp conversion helpers. |
| `services/websocket-hub/test.html` | Browser-based test dashboard for manual socket debugging, subscriptions, reconnect behavior, and log inspection. |
| `services/websocket-hub/websocket-dashboard-7.2result.png` | Screenshot artifact of the WebSocket dashboard/test tooling. |

## Frontend (`frontend`)

React 19 + Vite 6 + Tailwind CSS 4 client for discovery, auth, registrations, profile, admin, analytics, and realtime UI.

### Root and Platform Files

| Path | Description |
| --- | --- |
| `frontend/package.json` | Frontend package manifest. Includes React 19, React Router 7, Lucide, Recharts, and Google OAuth support. |
| `frontend/package-lock.json` | Locked npm dependency tree. |
| `frontend/vite.config.js` | Vite dev config. Proxies `/api` to the Spring API and `/ws` to the WebSocket hub during local development. |
| `frontend/netlify.toml` | Netlify SPA fallback rule that rewrites every route to `index.html`. |
| `frontend/vercel.json` | Vercel SPA rewrite equivalent. |
| `frontend/index.html` | Root HTML shell. Loads the Outfit font family from Google Fonts and currently uses `logo-07-three-dots.svg` as the favicon. |

### Public Assets

| Path | Description |
| --- | --- |
| `frontend/public/favicon.svg` | Legacy standalone favicon asset. |
| `frontend/public/favicons/logo-01-monogram.svg` | Alternate logo concept: monogram-based mark. |
| `frontend/public/favicons/logo-02-connected-nodes.svg` | Alternate logo concept: connected-node motif. |
| `frontend/public/favicons/logo-03-ticket-badge.svg` | Alternate logo concept: ticket-badge motif. |
| `frontend/public/favicons/logo-04-shield-em.svg` | Alternate logo concept: shield-styled EM mark. |
| `frontend/public/favicons/logo-05-grid-stripe.svg` | Alternate logo concept: grid/stripe treatment. |
| `frontend/public/favicons/logo-06-minimal-mark.svg` | Alternate logo concept: stripped-down minimal mark. |
| `frontend/public/favicons/logo-07-three-dots.svg` | Current favicon used by `index.html`. Three-dot Bauhaus brand mark. |

### Entry, App Shell, and Styling

| Path | Description |
| --- | --- |
| `frontend/src/main.jsx` | Frontend bootstrap. Mounts `BrowserRouter -> ThemeProvider -> AuthProvider -> WebSocketProvider -> ToastProvider -> App`, and conditionally wraps everything in `GoogleOAuthProvider`. |
| `frontend/src/App.jsx` | Route table for the whole app. Public routes now include `/about`, and the wildcard route renders `NotFound` instead of redirecting to login. |
| `frontend/src/index.css` | Global Tailwind-backed design tokens, light/dark theme variables, scrollbars, focus treatment, loading/toast animations, and Google Identity button centering. |

### Context Providers

| Path | Description |
| --- | --- |
| `frontend/src/context/AuthContext.jsx` | Stores the current user from localStorage, wraps login/register/google flows, exposes logout and `refreshUser()`, and reports a computed `isAuthenticated` value. |
| `frontend/src/context/ThemeContext.jsx` | Theme state manager. Defaults to light mode, persists the chosen theme, and force-locks `/login` and `/register` to light mode. |
| `frontend/src/context/ToastContext.jsx` | Global toast overlay with auto-dismiss timers and published/cancelled/info styling. |
| `frontend/src/context/WebSocketContext.jsx` | Persistent socket manager. Uses deploy-aware URL helpers, auto-reconnect with backoff, heartbeat pings, topic subscriptions, wildcard listeners, and reconnect-time resubscription. |

### Components

| Path | Description |
| --- | --- |
| `frontend/src/components/AppLayout.jsx` | Shared shell with desktop nav, mobile overflow nav, About route link, user dropdown, theme toggle, login CTA, and live socket indicator. |
| `frontend/src/components/EventFormModal.jsx` | Create/edit event modal with title/description/location/time/capacity/category/tags plus optional banner upload and preview. |
| `frontend/src/components/LiveAnnouncements.jsx` | Headless bridge from socket messages to toasts for `event.published` and `event.cancelled`. |
| `frontend/src/components/ProtectedRoute.jsx` | Route guard that preserves the current location for post-login redirection and optionally enforces admin access. |
| `frontend/src/components/ThemeToggle.jsx` | Small theme switch used in the shared layout. |
| `frontend/src/components/TicketModal.jsx` | Authenticated QR fetcher modal. Shows event info, ticket code, a QR image when ready, and a PNG download action. |

### Pages

| Path | Description |
| --- | --- |
| `frontend/src/pages/About.jsx` | Product/about page with architecture blocks, live service links, project links, and founder profile/contact links. |
| `frontend/src/pages/Admin.jsx` | Admin control panel with three tabs: overview stats, event management (including banner upload and registration viewer), and user search/promote/demote. |
| `frontend/src/pages/Analytics.jsx` | Admin analytics dashboard using Recharts. Combines trend, status, fill-rate, location, and recent-activity views from a single analytics payload. |
| `frontend/src/pages/Dashboard.jsx` | Authenticated landing page with headline stats, recent event preview cards, recent registration cards, and quick ticket viewing. |
| `frontend/src/pages/EventDetail.jsx` | Full event page with live participant counts, live activity banner, schedule-clash check before register, confirmation dialogs, post-register success dialog, copy-ticket-code action, calendar export, and QR modal access. |
| `frontend/src/pages/EventList.jsx` | Public event browser with debounced search, active-category fetch, quick category pills, tag filter, client-side sort, live seat-count updates on visible cards, and deterministic fallback banners. |
| `frontend/src/pages/ForgotPassword.jsx` | Three-step reset flow with resend cooldown, OTP paste intelligence, code verification, password reset, email normalization, and Caps Lock indicators on password fields. |
| `frontend/src/pages/Login.jsx` | Bauhaus login page with email normalization, post-auth return-to-intent redirect, Caps Lock warning, password visibility toggle, and optional Google sign-in. |
| `frontend/src/pages/MyRegistrations.jsx` | Registration history page with status filter, local search, cancel-confirm dialog, ticket modal, and calendar export actions. Defaults to showing confirmed registrations first. |
| `frontend/src/pages/NotFound.jsx` | Dedicated 404 page with auth-aware recovery actions (`Dashboard`, `Admin`, `Events`, `Login`, `Register`) and a `Go Back` fallback. |
| `frontend/src/pages/Profile.jsx` | User profile page with inline name editing, avatar upload, registration history stats, login activity timeline, and change-password form. |
| `frontend/src/pages/Register.jsx` | Bauhaus sign-up page with password strength meter, email normalization, post-auth return-to-intent redirect, Caps Lock indicators, and optional Google sign-up. |

### Frontend Services

| Path | Description |
| --- | --- |
| `frontend/src/services/api.js` | Central fetch wrapper plus exported helpers for auth, events, registrations, tickets, profile, admin, analytics, avatar/banner upload, and session-expiry handling. |
| `frontend/src/services/bauhausBanner.js` | Deterministic SVG banner generator used when events have no uploaded banner. |
| `frontend/src/services/calendar.js` | Browser-side `.ics` generation and Google Calendar deep-link creation. |
| `frontend/src/services/email.js` | Tiny email normalization helper used across auth/reset flows. |
| `frontend/src/services/redirect.js` | Safe redirect helper for return-to-intent auth flows. Rejects invalid, root-only, auth-route, or external targets. |
| `frontend/src/services/urls.js` | API and WebSocket URL helpers that make local proxy mode and split-origin deployments work cleanly. |

## Notes on Runtime Artifacts

- Uploaded banners and avatars currently live on local disk under `services/api/banners/` and `services/api/avatars/`.
- Ticket QR images and JSON metadata live under `services/ticket-worker/tickets/`.
- Sample runtime files are present in the repo today, but those directories should still be thought of as generated/storage paths rather than hand-maintained source code.
