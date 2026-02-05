# EM-Connect Learning Plan

---

## Phase 1: Foundation & Core Setup

### Step 1.1: Project Structure & Tooling
**Goal:** Set up the development environment and understand the project layout.

**Learn:**
- Docker basics and docker-compose
- Project organization for multi-service architectures
- Git workflow for monorepos vs polyrepos

**Tasks:**
- [x] Create the folder structure manually
- [x] Write a basic `docker-compose.yml` with just PostgreSQL
- [x] Verify you can connect to Postgres locally

---
 
### Step 1.2: Spring Boot API Skeleton
**Goal:** Get a running Spring Boot application with database connectivity.

**Learn:**
- Spring Boot project initialization
- Spring Data JPA basics
- Database migrations (Flyway or Liquibase)
- Application configuration and profiles

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
- JPA entity mapping
- Repository pattern in Spring Data
- Password hashing (BCrypt)
- Database constraints and validation

**Tasks:**
- [x] Design the user table schema
- [x] Create User entity with proper annotations
- [x] Implement UserRepository
- [x] Write integration tests for the repository

---

### Step 2.2: Registration & Login APIs
**Goal:** Build authentication endpoints.

**Learn:**
- REST controller design
- Request/Response DTOs
- Input validation with Bean Validation
- Exception handling in Spring

**Tasks:**
- [x] Create registration endpoint
- [x] Create login endpoint
- [x] Handle validation errors properly
- [x] Write controller tests

---

### Step 2.3: JWT Implementation
**Goal:** Secure your APIs with JWT tokens.

**Learn:**
- How JWT works (header, payload, signature)
- Spring Security filter chain
- Stateless authentication
- Token refresh strategies

**Tasks:**
- [x] Implement JWT generation and validation
- [x] Create authentication filter
- [x] Configure Spring Security
- [x] Protect endpoints based on authentication

---

### Step 2.4: Role-Based Access Control
**Goal:** Implement authorization.

**Learn:**
- RBAC concepts
- Spring Security method-level security
- Role hierarchies

**Tasks:**
- [ ] Add roles to user entity
- [ ] Implement role-based endpoint restrictions
- [ ] Test different role scenarios

---

## Phase 3: Event Management

### Step 3.1: Event Entity & CRUD
**Goal:** Implement core event management.

**Learn:**
- Entity relationships (User → Event)
- Service layer patterns
- Business logic separation
- Pagination in Spring Data

**Tasks:**
- [ ] Design event table schema
- [ ] Create Event entity with relationships
- [ ] Implement CRUD operations
- [ ] Add event listing with filters and pagination

---

### Step 3.2: Event State Management
**Goal:** Handle event lifecycle (draft → published → cancelled).

**Learn:**
- State machine patterns
- Business rule enforcement
- Audit fields (createdAt, updatedAt)

**Tasks:**
- [ ] Implement event states
- [ ] Add state transition logic
- [ ] Ensure only published events are visible to users

---

## Phase 4: Registration System

### Step 4.1: Registration Entity & Basic Flow
**Goal:** Allow users to register for events.

**Learn:**
- Many-to-many relationships
- Unique constraints
- Business validation

**Tasks:**
- [ ] Design registration table
- [ ] Create registration endpoint
- [ ] Prevent duplicate registrations
- [ ] List user's registrations

---

### Step 4.2: Capacity Handling & Concurrency
**Goal:** Enforce capacity limits under concurrent load.

**Learn:**
- Race conditions and why they matter
- Pessimistic vs optimistic locking
- Database-level atomicity
- Transaction isolation levels

**Tasks:**
- [ ] Implement capacity check in registration
- [ ] Add locking mechanism
- [ ] Write concurrent test to verify no overbooking
- [ ] Understand what breaks without proper locking

---

## Phase 5: Event-Driven Architecture (Introduction to Golang)

### Step 5.1: Message Broker Setup
**Goal:** Add RabbitMQ and understand messaging.

**Learn:**
- Message broker concepts (queues, exchanges, bindings)
- Pub/sub vs point-to-point
- Message durability and acknowledgments

**Tasks:**
- [ ] Add RabbitMQ to docker-compose
- [ ] Understand the RabbitMQ management UI
- [ ] Manually publish/consume messages to learn the concepts

---

### Step 5.2: Publishing Events from Spring Boot
**Goal:** Emit domain events when things happen.

**Learn:**
- Domain events pattern
- Spring AMQP
- Event payload design
- Transactional outbox pattern (conceptually)

**Tasks:**
- [ ] Configure RabbitMQ in Spring Boot
- [ ] Publish event when registration is confirmed
- [ ] Verify messages appear in RabbitMQ

---

### Step 5.3: First Golang Service - Notification Worker
**Goal:** Build your first Go service that consumes messages.

**Learn:**
- Go project structure
- Go modules and dependencies
- Connecting to RabbitMQ from Go
- Goroutines and channels basics

**Tasks:**
- [ ] Set up Go project
- [ ] Consume messages from the queue
- [ ] Log the received events
- [ ] Understand Go's error handling

---

### Step 5.4: Email Notifications
**Goal:** Actually send emails.

**Learn:**
- SMTP basics
- Email templating
- Retry mechanisms
- Dead letter queues

**Tasks:**
- [ ] Integrate with an email service (Mailgun, SendGrid, or local SMTP)
- [ ] Send registration confirmation emails
- [ ] Implement retry logic for failures
- [ ] Handle permanent failures gracefully

---

## Phase 6: Ticket Generation

### Step 6.1: Ticket Worker Service
**Goal:** Generate tickets asynchronously.

**Learn:**
- QR code generation
- File/image generation in Go
- Storing generated assets

**Tasks:**
- [ ] Create ticket worker Go service
- [ ] Generate unique ticket codes
- [ ] Create QR codes for tickets
- [ ] Store ticket data

---

### Step 6.2: Ticket Retrieval & Validation
**Goal:** Complete the ticket flow.

**Learn:**
- File serving from Spring Boot
- Ticket validation logic
- Idempotency in async systems

**Tasks:**
- [ ] Endpoint to retrieve user's tickets
- [ ] Endpoint to validate a ticket code
- [ ] Handle edge cases (cancelled registration, used ticket)

---

## Phase 7: Real-Time Features

### Step 7.1: WebSocket Hub Service
**Goal:** Build real-time communication.

**Learn:**
- WebSocket protocol basics
- Connection management
- Broadcasting patterns
- Go concurrency for connection handling

**Tasks:**
- [ ] Create WebSocket hub in Go
- [ ] Handle client connections
- [ ] Broadcast test messages

---

### Step 7.2: Live Updates Integration
**Goal:** Push real-time updates to clients.

**Learn:**
- Connecting services via message broker
- Fan-out patterns
- Client reconnection handling

**Tasks:**
- [ ] Push participant count updates
- [ ] Push event announcements
- [ ] Handle disconnections gracefully

---

## Phase 8: Frontend Integration

### Step 8.1: Basic React Setup
**Goal:** Create a functional frontend.

**Learn:**
- React project setup
- API integration patterns
- Authentication state management
- Protected routes

**Tasks:**
- [ ] Set up React project
- [ ] Create login/register pages
- [ ] Implement JWT storage and refresh
- [ ] Create protected route wrapper

---

### Step 8.2: Event & Registration UI
**Goal:** Build core user flows.

**Learn:**
- REST API consumption
- Loading and error states
- Optimistic UI updates

**Tasks:**
- [ ] Event listing page
- [ ] Event detail page
- [ ] Registration flow
- [ ] User's registrations view

---

### Step 8.3: Real-Time UI
**Goal:** Integrate WebSocket.

**Learn:**
- WebSocket client in browser
- React state updates from WebSocket
- Reconnection strategies

**Tasks:**
- [ ] Connect to WebSocket hub
- [ ] Update participant counts live
- [ ] Show real-time announcements

---

## Phase 9: Caching & Performance

### Step 9.1: Redis Integration
**Goal:** Add caching layer.

**Learn:**
- Redis data structures
- Cache-aside pattern
- Cache invalidation strategies
- TTL and eviction

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
- Structured logging
- Correlation IDs across services
- Health checks and readiness probes
- Basic metrics

**Tasks:**
- [ ] Implement structured logging in all services
- [ ] Add correlation ID propagation
- [ ] Create health endpoints
- [ ] Set up basic metrics

---

### Step 10.2: Error Handling & Resilience
**Goal:** Handle failures gracefully.

**Learn:**
- Circuit breaker pattern
- Retry with backoff
- Graceful degradation
- Timeout handling

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
| 2 | Authentication System | In Progress |
| 3 | Event Management | ⬜ Not Started |
| 4 | Registration System | ⬜ Not Started |
| 5 | Event-Driven Architecture | ⬜ Not Started |
| 6 | Ticket Generation | ⬜ Not Started |
| 7 | Real-Time Features | ⬜ Not Started |
| 8 | Frontend Integration | ⬜ Not Started |
| 9 | Caching & Performance | ⬜ Not Started |
| 10 | Observability & Production Readiness | ⬜ Not Started |

---


