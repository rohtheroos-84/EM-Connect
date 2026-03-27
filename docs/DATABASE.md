# Database Reference

This document reflects the active database model and migration chain used by the API.

## Runtime Defaults (Local)

- Engine: PostgreSQL 16 (docker-compose)
- Host: localhost
- Port: 5432
- Database: emconnect
- Username: emconnect
- Password: emconnect

JDBC default in local application config:

jdbc:postgresql://localhost:5432/emconnect?options=-c%20TimeZone=Asia/Kolkata

## Migrations

Location: services/api/src/main/resources/db/migration

- V1__initial_schema.sql
- V2__create_users_table.sql
- V3__create_admin_user.sql
- V4__create_events_table.sql
- V5__create_registrations_table.sql
- V6__add_avatar_to_users.sql
- V7__add_oauth_provider_to_users.sql
- V8__add_category_tags_banner_to_events.sql
- V9__create_event_reminders_table.sql
- V10__create_password_reset_codes_table.sql

Flyway runs automatically on API startup.

## Core Tables

users:
- id, email (unique), password (nullable for oauth users), name, role
- avatar_url, oauth_provider
- created_at, updated_at

events:
- id, title, description, location
- start_date, end_date, capacity
- status, organizer_id
- category, tags, banner_url
- created_at, updated_at

registrations:
- id, user_id, event_id, status
- ticket_code (unique)
- registered_at, cancelled_at, checked_in_at
- created_at, updated_at
- unique constraint on user_id + event_id

event_reminders:
- id, event_id, registration_id, reminder_type, sent_at
- unique constraint on event_id + registration_id + reminder_type

password_reset_codes:
- id, user_id, code, expires_at, used, created_at

## Relationships

- users 1:N events (organizer_id)
- users 1:N registrations
- events 1:N registrations
- events/registrations 1:N event_reminders

## Seeded Admin User

V3 seeds:
- email: admin@emconnect.com
- password: password123
- role: ADMIN

If needed, promote an existing account manually:

update users set role = 'ADMIN' where email = 'your-email@example.com';

## Production Notes

- Production database currently uses Neon via environment variables on Render.
- Never store production credentials in repository files.
- Ticket QR currently references filesystem paths (object storage migration is tracked separately).

## Quick Verification Queries

Count users by role:

select role, count(*) from users group by role;

Count published events:

select count(*) from events where status = 'PUBLISHED';

Count active registrations:

select count(*) from registrations where status = 'CONFIRMED';

## Related Docs

- [API.md](API.md)
- [AUTHENTICATION.md](AUTHENTICATION.md)
- [EVENT_STATES.md](EVENT_STATES.md)
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
