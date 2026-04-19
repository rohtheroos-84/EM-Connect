# Database Reference

Last updated: 2026-04-19

This document reflects the active PostgreSQL schema and Flyway migration chain used by `services/api`.

## Runtime Defaults

Local development defaults from `application.yml`:

- Engine: PostgreSQL 16
- Host: `localhost`
- Port: `5432`
- Database: `emconnect`
- Username: `emconnect`
- Password: `emconnect`
- JDBC URL: `jdbc:postgresql://localhost:5432/emconnect?options=-c%20TimeZone=Asia/Kolkata`

Flyway runs automatically on API startup with `ddl-auto=validate`.

## Migrations

Location: `services/api/src/main/resources/db/migration`

- `V1__initial_schema.sql`
- `V2__create_users_table.sql`
- `V3__create_admin_user.sql`
- `V4__create_events_table.sql`
- `V5__create_registrations_table.sql`
- `V6__add_avatar_to_users.sql`
- `V7__add_oauth_provider_to_users.sql`
- `V8__add_category_tags_banner_to_events.sql`
- `V9__create_event_reminders_table.sql`
- `V10__create_password_reset_codes_table.sql`
- `V11__create_login_activity_table.sql`

## Core Tables

### `users`

Primary fields:

- `id`
- `email` unique
- `password` nullable for OAuth-only users
- `name`
- `role`
- `avatar_url`
- `oauth_provider`
- `created_at`
- `updated_at`

Notes:

- `avatar_url` may be an API-served path or an external provider URL, such as a Google avatar.
- The current role enum only contains `USER` and `ADMIN`.

### `events`

Primary fields:

- `id`
- `title`
- `description`
- `location`
- `start_date`
- `end_date`
- `capacity`
- `status`
- `organizer_id`
- `category`
- `tags`
- `banner_url`
- `created_at`
- `updated_at`

Notes:

- `category` is stored as an enum-backed string.
- `tags` are stored as a comma-separated lowercase text field, while the API exposes them as a list.
- `banner_url` points at API-served banner files today.

### `registrations`

Primary fields:

- `id`
- `user_id`
- `event_id`
- `status`
- `ticket_code` unique
- `registered_at`
- `cancelled_at`
- `checked_in_at`
- `created_at`
- `updated_at`

Constraints:

- Unique constraint on `(user_id, event_id)`
- Used to support cancellation/reactivation rather than duplicate registrations

### `event_reminders`

Primary fields:

- `id`
- `event_id`
- `registration_id`
- `reminder_type`
- `sent_at`

Constraint:

- Unique constraint on `(event_id, registration_id, reminder_type)`

This table prevents duplicate reminder sends for the same registration and reminder stage.

### `password_reset_codes`

Primary fields:

- `id`
- `user_id`
- `code`
- `expires_at`
- `used`
- `created_at`

Notes:

- Codes are short-lived and invalidated aggressively by the service layer.
- The resend cooldown is enforced in application logic, not via a database constraint.

### `login_activity`

Primary fields:

- `id`
- `user_id`
- `login_method`
- `source_ip`
- `user_agent`
- `created_at`

Indexes:

- `idx_login_activity_user_created` on `(user_id, created_at desc)`

Notes:

- Login history is capped to the latest 100 rows per user by application logic.

## Relationships

- One user to many events through `events.organizer_id`
- One user to many registrations
- One event to many registrations
- One registration can have reminder rows
- One user to many login-activity rows

## Seeded Admin User

Migration `V3__create_admin_user.sql` seeds:

- Email: `admin@emconnect.com`
- Password: `password123`
- Role: `ADMIN`

Manual promotion example:

```sql
update users set role = 'ADMIN' where email = 'your-email@example.com';
```

## Enum And Status Values

### `users.role`

| Value | Meaning |
| --- | --- |
| `USER` | Regular app user |
| `ADMIN` | Admin user |

### `events.status`

| Value | Meaning |
| --- | --- |
| `DRAFT` | Editable, not public |
| `PUBLISHED` | Public and accepting registrations |
| `CANCELLED` | Terminal state |
| `COMPLETED` | Terminal state |

### `registrations.status`

| Value | Meaning |
| --- | --- |
| `CONFIRMED` | Active registration |
| `CANCELLED` | User cancelled |
| `ATTENDED` | Checked in / attended |
| `NO_SHOW` | Did not attend |

### `events.category`

| Value |
| --- |
| `TECHNOLOGY` |
| `SOCIAL` |
| `SPORTS` |
| `MUSIC` |
| `EDUCATION` |
| `BUSINESS` |
| `HEALTH` |
| `ART` |
| `OTHER` |

## Production Notes

- Production uses a managed PostgreSQL database and should receive credentials from environment variables, not committed config files.
- Flyway remains the schema authority in both local and production environments.
- Ticket QR files and media assets are still file-backed outside the database, so the database does not currently serve as the source of truth for binary asset persistence.

## Quick Verification Queries

```sql
select role, count(*) from users group by role;
select count(*) from events where status = 'PUBLISHED';
select count(*) from registrations where status = 'CONFIRMED';
select user_id, count(*) from login_activity group by user_id order by count(*) desc;
```

## Related Docs

- [API.md](API.md)
- [AUTHENTICATION.md](AUTHENTICATION.md)
- [EVENT_STATES.md](EVENT_STATES.md)
- [CODE.md](CODE.md)
