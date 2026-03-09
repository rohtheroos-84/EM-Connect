# RabbitMQ Topology Design

## Exchange
- **Name:** `em.events`
- **Type:** `topic`
- **Durable:** `true`

## Dead Letter Exchange
- **Name:** `em.events.dlx`
- **Type:** `topic`
- **Durable:** `true`
- **Dead Letter Queue:** `em.events.dlq`

## Routing Keys

| Routing Key               | Publisher             | Description                        |
|---------------------------|-----------------------|------------------------------------|
| `registration.confirmed`  | RegistrationService   | User registers for an event        |
| `registration.cancelled`  | RegistrationService   | User cancels registration          |
| `registration.checkedin`  | TicketService         | Attendee checks in at event        |
| `event.published`         | EventService          | Event goes live (DRAFT→PUBLISHED)  |
| `event.cancelled`         | EventService          | Event is cancelled                 |
| `event.updated`           | EventService          | Published event details changed    |
| `event.reminder`          | ReminderScheduler     | Automated 24h/1h pre-event alert   |
| `user.registered`         | AuthService           | New account created                |
| `user.login`              | AuthService           | User signs in                      |
| `user.password_changed`   | UserService           | Password changed                   |

## Queues

| Queue Name            | Purpose               | Bound Routing Keys                              | Dead Letter Exchange |
|-----------------------|-----------------------|-------------------------------------------------|----------------------|
| `notification.queue` | Email notifications   | `registration.*`, `event.*`, `user.*`           | `em.events.dlx`      |
| `ticket.queue`       | Ticket generation     | `registration.confirmed`                        | `em.events.dlx`      |
| `websocket.queue`    | Real-time updates     | `registration.*`, `event.*`                     | `em.events.dlx`      |
| `em.events.dlq`      | Dead letter queue     | `#` (catch all from DLX)                        | -                    |

## Bindings

### Primary Exchange: `em.events`
- `notification.queue` → `registration.*`, `event.*`, `user.*`
- `ticket.queue` → `registration.confirmed`
- `websocket.queue` → `registration.*`, `event.*`

### Dead Letter Exchange: `em.events.dlx`
- `em.events.dlq` → `#` (catch all routing key)

## Email Templates

| Template                 | Trigger                    | Recipient    | Accent Color |
|--------------------------|----------------------------|--------------|--------------|
| `registration_confirmed` | `registration.confirmed`   | Attendee     | #16A34A      |
| `registration_cancelled` | `registration.cancelled`   | Attendee     | #D02020      |
| `event_published`        | `event.published`          | Organizer    | #1040C0      |
| `event_cancelled`        | `event.cancelled`          | Organizer    | #F0C020      |
| `event_reminder`         | `event.reminder`           | Attendee     | #F0C020      |
| `welcome`                | `user.registered`          | New user     | #1040C0      |
| `login_alert`            | `user.login`               | User         | #1040C0      |
| `password_changed`       | `user.password_changed`    | User         | #F0C020      |
| `check_in`               | `registration.checkedin`   | Attendee     | #16A34A      |

## Message Flow Summary
1. Producers publish messages to the `em.events` topic exchange.
2. Messages are routed to queues based on their routing keys.
3. Consumers process messages from their respective queues.
4. Failed or rejected messages are forwarded to `em.events.dlx`.
5. All dead-lettered messages are stored in `em.events.dlq`.
6. Event reminders are published by a scheduled job (every 15 min) for events starting in 24h and 1h.
