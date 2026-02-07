# EM-Connect - Overview

EM-Connect is an Event Management System built as a learning project to understand backend development concepts using modern technologies.

## What is EM-Connect?

EM-Connect allows users to:
- **Create and manage events** - Organizers can create events with details like title, description, location, date/time, and capacity
- **Register/Login** - Users authenticate via JWT tokens
- **Browse events** - Anyone can view published events
- **Event lifecycle management** - Events follow a state machine (Draft → Published → Completed/Cancelled)

## Tech Stack

| Component | Technology |
|-----------|------------|
| Backend API | Spring Boot 3.2.2 (Java 17) |
| Database | PostgreSQL 15 |
| Authentication | JWT (JSON Web Tokens) |
| Password Hashing | BCrypt |
| Database Migrations | Flyway |
| Containerization | Docker Compose |

## Project Structure

```
EM-Connect/
├── docker-compose.yaml     # PostgreSQL container setup
├── docs/                   # Documentation (you are here!)
├── services/
│   └── api/                # Spring Boot API service
│       ├── src/main/java/com/emconnect/api/
│       │   ├── config/     # Security & JWT configuration
│       │   ├── controller/ # REST API endpoints
│       │   ├── dto/        # Data Transfer Objects
│       │   ├── entity/     # JPA entities (User, Event)
│       │   ├── exception/  # Custom exceptions
│       │   ├── repository/ # Database repositories
│       │   └── service/    # Business logic
│       └── src/main/resources/
│           ├── application.yml  # App configuration
│           └── db/migration/    # Flyway SQL migrations
├── frontend/               # (Future) Frontend application
└── PLAN.md                 # Development roadmap
```

## Getting Started

### Prerequisites
- Java 17+
- Docker Desktop
- Maven

### Running the Application

1. **Start PostgreSQL database:**
   ```bash
   docker-compose up -d
   ```

2. **Run the API service:**
   ```bash
   cd services/api
   mvn spring-boot:run
   ```

3. **Test the health endpoint:**
   ```bash
   curl http://localhost:8080/api/health
   ```

## Key Concepts Implemented

### Phase 1: Foundation
- Docker Compose for PostgreSQL
- Spring Boot project setup
- Health check endpoints

### Phase 2: Authentication
- User entity with email/password/role
- Registration and login APIs
- JWT token generation and validation
- Role-based access control (USER, ADMIN)

### Phase 3: Event Management
- Event CRUD operations
- Event state machine (DRAFT → PUBLISHED → COMPLETED/CANCELLED)
- Organizer-based authorization
- Pagination and search

## Documentation Index

| Document | Description |
|----------|-------------|
| [ARCHITECTURE.md](ARCHITECTURE.md) | System architecture and component relationships |
| [API.md](API.md) | Complete API reference with examples |
| [DATABASE.md](DATABASE.md) | Database schema and migrations |
| [AUTHENTICATION.md](AUTHENTICATION.md) | Auth flow and security configuration |
| [EVENT_STATES.md](EVENT_STATES.md) | Event state machine documentation |

## Default Credentials

For development purposes, an admin user is seeded:
- **Email:** `admin@emconnect.com`
- **Password:** `admin123`

> ⚠️ Change these credentials in production!
