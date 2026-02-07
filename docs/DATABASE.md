# Database Schema

EM-Connect uses **PostgreSQL 15** as its database, managed through **Docker Compose**. Schema changes are handled by **Flyway** migrations.

## Database Connection

| Property | Value |
|----------|-------|
| Host | localhost |
| Port | 5432 |
| Database | emconnect |
| Username | emconnect |
| Password | emconnect123 |

**JDBC URL:** `jdbc:postgresql://localhost:5432/emconnect`

## Starting the Database

```bash
# Start PostgreSQL container
docker-compose up -d

# Check container status
docker ps

# View logs
docker-compose logs postgres
```

## Tables

### users

Stores user account information.

```sql
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'USER',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGSERIAL | PK, Auto-increment | Unique identifier |
| email | VARCHAR(255) | NOT NULL, UNIQUE | User's email (login) |
| password | VARCHAR(255) | NOT NULL | BCrypt hashed password |
| name | VARCHAR(100) | NOT NULL | Display name |
| role | VARCHAR(20) | NOT NULL, DEFAULT 'USER' | USER or ADMIN |
| created_at | TIMESTAMP | NOT NULL | Account creation time |
| updated_at | TIMESTAMP | NOT NULL | Last update time |

**Indexes:**
- `idx_users_email` on `email` (for fast login lookups)

---

### events

Stores event information.

```sql
CREATE TABLE events (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    location VARCHAR(255),
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    capacity INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    organizer_id BIGINT NOT NULL REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGSERIAL | PK, Auto-increment | Unique identifier |
| title | VARCHAR(255) | NOT NULL | Event title |
| description | TEXT | - | Full description |
| location | VARCHAR(255) | - | Event location |
| start_date | TIMESTAMP | NOT NULL | Event start time |
| end_date | TIMESTAMP | NOT NULL | Event end time |
| capacity | INTEGER | NOT NULL, DEFAULT 0 | Max attendees (0 = unlimited) |
| status | VARCHAR(20) | NOT NULL, DEFAULT 'DRAFT' | Event status |
| organizer_id | BIGINT | NOT NULL, FK → users(id) | Event creator |
| created_at | TIMESTAMP | NOT NULL | Creation time |
| updated_at | TIMESTAMP | NOT NULL | Last update time |

**Indexes:**
- `idx_events_organizer` on `organizer_id` (for "my events" queries)
- `idx_events_status` on `status` (for filtering by status)
- `idx_events_start_date` on `start_date` (for date-based queries)

**Foreign Keys:**
- `organizer_id` → `users(id)`

---

## Entity Relationship Diagram

```
┌─────────────────────┐         ┌─────────────────────┐
│       users         │         │       events        │
├─────────────────────┤         ├─────────────────────┤
│ id (PK)             │◄────────│ organizer_id (FK)   │
│ email               │    1:N  │ id (PK)             │
│ password            │         │ title               │
│ name                │         │ description         │
│ role                │         │ location            │
│ created_at          │         │ start_date          │
│ updated_at          │         │ end_date            │
└─────────────────────┘         │ capacity            │
                                │ status              │
                                │ created_at          │
                                │ updated_at          │
                                └─────────────────────┘
```

**Relationship:** One User can organize many Events (1:N)

---

## Flyway Migrations

Migrations are located in `services/api/src/main/resources/db/migration/`

| Version | File | Description |
|---------|------|-------------|
| V1 | V1__initial_schema.sql | Creates initial schema |
| V2 | V2__create_users_table.sql | Creates users table with indexes |
| V3 | V3__create_admin_user.sql | Seeds default admin user |
| V4 | V4__create_events_table.sql | Creates events table with indexes |

### Migration Naming Convention

```
V{version}__{description}.sql
```
- `V` prefix (required)
- Version number (e.g., 1, 2, 3)
- Double underscore `__`
- Description with underscores

### Running Migrations

Migrations run automatically when the application starts. Flyway checks `flyway_schema_history` table to track which migrations have been applied.

```yaml
# application.yml
spring:
  flyway:
    enabled: true
    locations: classpath:db/migration
```

### Useful Flyway Commands (Maven)

```bash
# View migration status
mvn flyway:info

# Run pending migrations manually
mvn flyway:migrate

# Validate migrations
mvn flyway:validate
```

---

## Seeded Data

### Admin User (V3)

A default admin user is created for testing:

| Field | Value |
|-------|-------|
| Email | admin@emconnect.com |
| Password | admin123 (BCrypt: `$2a$10$...`) |
| Name | Admin |
| Role | ADMIN |

> ⚠️ **Security:** Change admin password in production!

---

## JPA Entity Mappings

### User Entity → users table

```java
@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 255)
    private String email;

    @Column(nullable = false, length = 255)
    private String password;

    @Column(nullable = false, length = 100)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Role role = Role.USER;
    
    // ... timestamps
}
```

### Event Entity → events table

```java
@Entity
@Table(name = "events")
public class Event {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private EventStatus status = EventStatus.DRAFT;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organizer_id", nullable = false)
    private User organizer;
    
    // ... other fields
}
```

---

## Database Access

### Via psql CLI

```bash
# Connect to container
docker exec -it emconnect-postgres psql -U emconnect -d emconnect

# Common queries
\dt                          -- List tables
\d users                     -- Describe users table
SELECT * FROM users;         -- View all users
SELECT * FROM events;        -- View all events
\q                           -- Quit
```

### Via Repository Methods

```java
// UserRepository
Optional<User> findByEmail(String email);
boolean existsByEmail(String email);

// EventRepository
Page<Event> findByStatus(EventStatus status, Pageable pageable);
Page<Event> findByOrganizerId(Long organizerId, Pageable pageable);

@Query("SELECT e FROM Event e WHERE e.status = :status AND LOWER(e.title) LIKE LOWER(CONCAT('%', :keyword, '%'))")
Page<Event> searchByTitle(EventStatus status, String keyword, Pageable pageable);
```

---

## Configuration

### Docker Compose (docker-compose.yaml)

```yaml
services:
  postgres:
    image: postgres:15-alpine
    container_name: emconnect-postgres
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: emconnect
      POSTGRES_PASSWORD: emconnect123
      POSTGRES_DB: emconnect
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### Spring Data JPA (application.yml)

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/emconnect
    username: emconnect
    password: emconnect123
    driver-class-name: org.postgresql.Driver

  jpa:
    hibernate:
      ddl-auto: validate  # Flyway manages schema
    show-sql: true
    properties:
      hibernate:
        format_sql: true
        dialect: org.hibernate.dialect.PostgreSQLDialect
```

---

## Status Values

### Role (users.role)
| Value | Description |
|-------|-------------|
| USER | Regular user |
| ADMIN | Administrator |

### EventStatus (events.status)
| Value | Description |
|-------|-------------|
| DRAFT | Being created, not visible |
| PUBLISHED | Live, visible to everyone |
| CANCELLED | Event cancelled |
| COMPLETED | Event finished |
