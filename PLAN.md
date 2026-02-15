# EM-Connect Learning Plan

---

## Phase 1: Foundation & Core Setup

### Step 1.1: Project Structure & Tooling
**Goal:** Set up the development environment and understand the project layout.

**Learn:**
- [x] Docker basics and docker-compose
- [x] Project organization for multi-service architectures
- [x] Git workflow for monorepos vs polyrepos

**Tasks:**
- [x] Create the folder structure manually
- [x] Write a basic `docker-compose.yml` with just PostgreSQL
- [x] Verify you can connect to Postgres locally

---
 
### Step 1.2: Spring Boot API Skeleton
**Goal:** Get a running Spring Boot application with database connectivity.

**Learn:**
- [x] Spring Boot project initialization
- [x] Spring Data JPA basics
- [x] Database migrations (Flyway or Liquibase)
- [x] Application configuration and profiles

**Tasks:**
- [x] Initialize Spring Boot project with required dependencies
- [x] Configure database connection
- [x] Create your first migration script
- [x] Write a health check endpoint
- [x] Test the running application

---

## Phase 2: Authentication System

### Step 2.1: User Entity & Repository
**Goal:** Implement the user data layer.

**Learn:**
- [x] JPA entity mapping
- [x] Repository pattern in Spring Data
- [x] Password hashing (BCrypt)
- [x] Database constraints and validation

**Tasks:**
- [x] Design the user table schema
- [x] Create User entity with proper annotations
- [x] Implement UserRepository
- [x] Write integration tests for the repository

---

### Step 2.2: Registration & Login APIs
**Goal:** Build authentication endpoints.

**Learn:**
- [x] REST controller design
- [x] Request/Response DTOs
- [x] Input validation with Bean Validation
- [x] Exception handling in Spring

**Tasks:**
- [x] Create registration endpoint
- [x] Create login endpoint
- [x] Handle validation errors properly
- [x] Write controller tests

---

### Step 2.3: JWT Implementation
**Goal:** Secure your APIs with JWT tokens.

**Learn:**
- [x] How JWT works (header, payload, signature)
- [x] Spring Security filter chain
- [x] Stateless authentication
- [x] Token refresh strategies

**Tasks:**
- [x] Implement JWT generation and validation
- [x] Create authentication filter
- [x] Configure Spring Security
- [x] Protect endpoints based on authentication

---

### Step 2.4: Role-Based Access Control
**Goal:** Implement authorization.

**Learn:**
- [x] RBAC concepts
- [x] Spring Security method-level security
- [x] Role hierarchies

**Tasks:**
- [x] Add roles to user entity
- [x] Implement role-based endpoint restrictions
- [x] Test different role scenarios

---

## Phase 3: Event Management

### Step 3.1: Event Entity & CRUD
**Goal:** Implement core event management.

**Learn:**
- [x] Entity relationships (User → Event)
- [x] Service layer patterns
- [x] Business logic separation
- [x] Pagination in Spring Data

**Tasks:**
- [x] Design event table schema
- [x] Create Event entity with relationships
- [x] Implement CRUD operations
- [x] Add event listing with filters and pagination

---

### Step 3.2: Event State Management
**Goal:** Handle event lifecycle (draft → published → cancelled).

**Learn:**
- [x] State machine patterns
- [x] Business rule enforcement
- [x] Audit fields (createdAt, updatedAt)

**Tasks:**
- [x] Implement event states
- [x] Add state transition logic
- [x] Ensure only published events are visible to users

---

## Phase 4: Registration System

### Step 4.1: Registration Entity & Basic Flow
**Goal:** Allow users to register for events.

**Learn:**
- [x] Many-to-many relationships
- [x] Unique constraints
- [x] Business validation

**Tasks:**
- [x] Design registration table
- [x] Create registration endpoint
- [x] Prevent duplicate registrations
- [x] List user's registrations

---

### Step 4.2: Capacity Handling & Concurrency
**Goal:** Enforce capacity limits under concurrent load.

**Learn:**
- [x] Race conditions and why they matter
- [x] Pessimistic vs optimistic locking
- [x] Database-level atomicity
- [x] Transaction isolation levels

**Tasks:**
- [x] Implement capacity check in registration
- [x] Add locking mechanism
- [x] Write concurrent test to verify no overbooking
- [x] Understand what breaks without proper locking

---

## Phase 5: Event Architecture (with Golang)

### Step 5.1: Message Broker Setup
**Goal:** Add RabbitMQ and understand messaging.

**Learn:**
- [x] Message broker concepts (queues, exchanges, bindings)
- [x] Pub/sub vs point-to-point
- [x] Message durability and acknowledgments

**Tasks:**
- [x] Add RabbitMQ to docker-compose
- [x] Understand the RabbitMQ management UI
- [x] Manually publish/consume messages to learn the concepts

---

### Step 5.2: Publishing Events from Spring Boot
**Goal:** Emit domain events when things happen.

**Learn:**
- [x] Domain events pattern
- [x] Spring AMQP
- [x] Event payload design
- [x] Transactional outbox pattern (conceptually)

**Tasks:**
- [x] Configure RabbitMQ in Spring Boot
- [x] Publish event when registration is confirmed
- [x] Verify messages appear in RabbitMQ

---

### Step 5.3: First Golang Service - Notification Worker
**Goal:** Build your first Go service that consumes messages.

**Learn:**
- [x] Go project structure
- [x] Go modules and dependencies
- [x] Connecting to RabbitMQ from Go
- [x] Goroutines and channels basics

**Tasks:**
- [x] Set up Go project
- [x] Consume messages from the queue
- [x] Log the received events
- [x] Understand Go's error handling

---

### Step 5.4: Email Notifications
**Goal:** Actually send emails.

**Learn:**
- [x] SMTP basics
- [x] Email templating
- [x] Retry mechanisms
- [x] Dead letter queues

**Tasks:**
- [x] Integrate with an email service (Mailgun, SendGrid, or local SMTP)
- [x] Send registration confirmation emails
- [x] Implement retry logic for failures
- [x] Handle permanent failures gracefully

---

## Phase 6: Ticket Generation

### Step 6.1: Ticket Worker Service
**Goal:** Generate tickets asynchronously.

**Learn:**
- [x] QR code generation
- [x] File/image generation in Go
- [x] Storing generated assets

**Tasks:**
- [x] Create ticket worker Go service
- [x] Generate unique ticket codes
- [x] Create QR codes for tickets
- [x] Store ticket data

---

### Step 6.2: Ticket Retrieval & Validation
**Goal:** Complete the ticket flow.

**Learn:**
- [x] File serving from Spring Boot
- [x] Ticket validation logic
- [x] Idempotency in async systems

**Tasks:**
- [x] Endpoint to retrieve user's tickets
- [x] Endpoint to validate a ticket code
- [x] Handle edge cases (cancelled registration, used ticket)

---

## Phase 7: Real-Time Features

### Step 7.1: WebSocket Hub Service
**Goal:** Build real-time communication.

**Learn:**
- [x] WebSocket protocol basics
- [x] Connection management
- [x] Broadcasting patterns
- [x] Go concurrency for connection handling

**Tasks:**
- [x] Create WebSocket hub in Go
- [x] Handle client connections
- [x] Broadcast test messages

---

### Step 7.2: Live Updates Integration
**Goal:** Push real-time updates to clients.

**Learn:**
- [ ] Connecting services via message broker
- [ ] Fan-out patterns
- [ ] Client reconnection handling

**Tasks:**
- [ ] Push participant count updates
- [ ] Push event announcements
- [ ] Handle disconnections gracefully

---

## Phase 8: Frontend Integration

### Step 8.1: Basic React Setup
**Goal:** Create a functional frontend.

**Learn:**
- [ ] React project setup
- [ ] API integration patterns
- [ ] Authentication state management
- [ ] Protected routes

**Tasks:**
- [ ] Set up React project
- [ ] Create login/register pages
- [ ] Implement JWT storage and refresh
- [ ] Create protected route wrapper

---

### Step 8.2: Event & Registration UI
**Goal:** Build core user flows.

**Learn:**
- [ ] REST API consumption
- [ ] Loading and error states
- [ ] Optimistic UI updates

**Tasks:**
- [ ] Event listing page
- [ ] Event detail page
- [ ] Registration flow
- [ ] User's registrations view

---

### Step 8.3: Real-Time UI
**Goal:** Integrate WebSocket.

**Learn:**
- [ ] WebSocket client in browser
- [ ] React state updates from WebSocket
- [ ] Reconnection strategies

**Tasks:**
- [ ] Connect to WebSocket hub
- [ ] Update participant counts live
- [ ] Show real-time announcements

---

## Phase 9: Caching & Performance

### Step 9.1: Redis Integration
**Goal:** Add caching layer.

**Learn:**
- [ ] Redis data structures
- [ ] Cache-aside pattern
- [ ] Cache invalidation strategies
- [ ] TTL and eviction

**Tasks:**
- [ ] Add Redis to docker-compose
- [ ] Cache event listings
- [ ] Invalidate cache on event updates
- [ ] Measure performance improvement

---

## Phase 10: Observability & Production Readiness

### Step 10.1: Logging & Monitoring
**Goal:** Make the system observable.

**Learn:**
- [ ] Structured logging
- [ ] Correlation IDs across services
- [ ] Health checks and readiness probes
- [ ] Basic metrics

**Tasks:**
- [ ] Implement structured logging in all services
- [ ] Add correlation ID propagation
- [ ] Create health endpoints
- [ ] Set up basic metrics

---

### Step 10.2: Error Handling & Resilience
**Goal:** Handle failures gracefully.

**Learn:**
- [ ] Circuit breaker pattern
- [ ] Retry with backoff
- [ ] Graceful degradation
- [ ] Timeout handling

**Tasks:**
- [ ] Add timeouts to external calls
- [ ] Implement circuit breaker for email service
- [ ] Handle broker unavailability
- [ ] Test failure scenarios

---

## Progress Summary

| Phase | Description | Status |
|-------|-------------|--------|
| 1 | Foundation & Core Setup | ✅ Completed |
| 2 | Authentication System | ✅ Completed |
| 3 | Event Management | ✅ Completed |
| 4 | Registration System | ✅ Completed |
| 5 | Event-Driven Architecture | ✅ Completed |
| 6 | Ticket Generation | ✅ Completed |
| 7 | Real-Time Features | 🔄 IN PROGRESS |
| 8 | Frontend Integration | ⬜ Not Started |
| 9 | Caching & Performance | ⬜ Not Started |
| 10 | Observability & Production Readiness | ⬜ Not Started |

---


