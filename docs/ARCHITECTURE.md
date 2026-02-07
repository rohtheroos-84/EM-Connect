# Architecture

This document describes the overall architecture of the EM-Connect backend API.

## High-Level Architecture

```
┌─────────────────┐     HTTP      ┌─────────────────┐     JDBC     ┌─────────────────┐
│     Client      │──────────────▶│   Spring Boot   │─────────────▶│   PostgreSQL    │
│  (Browser/App)  │◀──────────────│      API        │◀─────────────│    Database     │
└─────────────────┘    JSON       └─────────────────┘              └─────────────────┘
                                          │
                                          │ JWT
                                          ▼
                                  ┌─────────────────┐
                                  │  JWT Service    │
                                  │  (Token Gen)    │
                                  └─────────────────┘
```

## Layered Architecture

The application follows a classic **3-tier architecture**:

```
┌────────────────────────────────────────────────────────────┐
│                     CONTROLLER LAYER                        │
│  (REST endpoints, request/response handling, validation)   │
│  AuthController, EventController, UserController, etc.     │
└─────────────────────────────┬──────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────┐
│                      SERVICE LAYER                          │
│    (Business logic, state transitions, authorization)      │
│    AuthService, EventService, JwtService, etc.             │
└─────────────────────────────┬──────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────┐
│                    REPOSITORY LAYER                         │
│           (Data access, JPA queries, persistence)          │
│           UserRepository, EventRepository                   │
└─────────────────────────────┬──────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────┐
│                      DATABASE LAYER                         │
│              PostgreSQL (Docker container)                  │
└────────────────────────────────────────────────────────────┘
```

## Package Structure

```
com.emconnect.api/
├── ApiApplication.java          # Main entry point
│
├── config/                      # Configuration classes
│   ├── SecurityConfig.java      # Spring Security setup
│   └── JwtAuthenticationFilter.java  # JWT filter
│
├── controller/                  # REST Controllers
│   ├── AuthController.java      # POST /api/auth/**
│   ├── EventController.java     # /api/events/**
│   ├── UserController.java      # /api/users/**
│   ├── AdminController.java     # /api/admin/**
│   └── HealthController.java    # /api/health, /api/ping
│
├── dto/                         # Data Transfer Objects
│   ├── RegisterRequest.java     # Input: registration
│   ├── LoginRequest.java        # Input: login
│   ├── AuthResponse.java        # Output: auth (with token)
│   ├── CreateEventRequest.java  # Input: create event
│   ├── UpdateEventRequest.java  # Input: update event
│   ├── EventResponse.java       # Output: event data
│   └── UserResponse.java        # Output: user data
│
├── entity/                      # JPA Entities
│   ├── User.java               # users table
│   ├── Role.java               # USER, ADMIN enum
│   ├── Event.java              # events table
│   └── EventStatus.java        # DRAFT, PUBLISHED, etc.
│
├── exception/                   # Custom Exceptions
│   ├── GlobalExceptionHandler.java      # @ControllerAdvice
│   ├── ErrorResponse.java               # Error format
│   ├── ResourceNotFoundException.java   # 404 errors
│   ├── EmailAlreadyExistsException.java # Duplicate email
│   ├── InvalidCredentialsException.java # Bad login
│   └── InvalidStateTransitionException.java  # State errors
│
├── repository/                  # Spring Data JPA Repos
│   ├── UserRepository.java      # findByEmail, etc.
│   └── EventRepository.java     # findByStatus, search, etc.
│
└── service/                     # Business Logic
    ├── AuthService.java         # Register, login
    ├── CustomUserDetailsService.java  # Spring Security
    ├── EventService.java        # CRUD, state transitions
    └── JwtService.java          # Token generation/validation
```

## Request Flow

### Authenticated Request (e.g., Create Event)

```
1. Client sends POST /api/events with JWT in Authorization header
                          │
                          ▼
2. JwtAuthenticationFilter intercepts request
   - Extracts token from "Bearer <token>" header
   - Validates token using JwtService
   - Creates Authentication object
   - Adds to SecurityContextHolder
                          │
                          ▼
3. SecurityConfig checks authorization rules
   - POST /api/events requires authentication ✓
                          │
                          ▼
4. EventController.createEvent() receives request
   - Gets user email from Authentication.getName()
   - Passes to EventService
                          │
                          ▼
5. EventService.createEvent()
   - Validates business rules (dates, etc.)
   - Creates Event entity with DRAFT status
   - Saves via EventRepository
                          │
                          ▼
6. Response returned as EventResponse (DTO)
```

### Public Request (e.g., Get Published Events)

```
1. Client sends GET /api/events (no auth required)
                          │
                          ▼
2. JwtAuthenticationFilter finds no token → continues
                          │
                          ▼
3. SecurityConfig allows GET /api/events without auth
                          │
                          ▼
4. EventController.getPublishedEvents() processes
                          │
                          ▼
5. EventService returns only PUBLISHED events
```

## Security Architecture

```
                    ┌─────────────────────────────────────┐
                    │         Spring Security             │
                    │         Filter Chain                │
                    └──────────────┬──────────────────────┘
                                   │
          ┌────────────────────────┼────────────────────────┐
          │                        │                        │
          ▼                        ▼                        ▼
   ┌──────────────┐      ┌─────────────────┐     ┌──────────────┐
   │ JwtAuthFilter│      │  Authorization  │     │    CSRF      │
   │ (validates   │      │    Rules        │     │  (disabled)  │
   │  tokens)     │      │ (permitAll,     │     │              │
   └──────────────┘      │  authenticated) │     └──────────────┘
                         └─────────────────┘
```

**Key Security Features:**
- Stateless sessions (no cookies/sessions stored)
- JWT-based authentication
- BCrypt password hashing
- Role-based access (USER, ADMIN)
- CSRF disabled (not needed for stateless API)

## Component Dependencies

```
AuthController ───▶ AuthService ───▶ UserRepository
                        │ 
                        └──▶ JwtService
                        │
                        └──▶ PasswordEncoder (BCrypt)

EventController ──▶ EventService ──▶ EventRepository
                        │
                        └──▶ UserRepository

Security:
JwtAuthenticationFilter ──▶ JwtService
                               │
CustomUserDetailsService ──────┘
         │
         └──▶ UserRepository
```

## Database Connection

The application connects to PostgreSQL via JDBC:

```yaml
# application.yml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/emconnect
    username: emconnect
    password: emconnect123
```

Flyway manages schema migrations automatically on startup:
```
V1__initial_schema.sql    → Creates schema
V2__create_users_table.sql → Creates users table
V3__create_admin_user.sql  → Seeds admin user
V4__create_events_table.sql → Creates events table
```

## Error Handling

All exceptions are handled by `GlobalExceptionHandler`:

```
Exception Thrown → @ControllerAdvice → ErrorResponse JSON
```

Standardized error format:
```json
{
  "status": 404,
  "error": "Not Found",
  "message": "Event not found with id: 999",
  "path": "/api/events/999",
  "timestamp": "2024-01-15T10:30:00"
}
```
