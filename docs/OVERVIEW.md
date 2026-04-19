# EM-Connect - Overview

Last updated: 2026-04-19

EM-Connect is a multi-service event management platform built around a Spring Boot API, three Go services, RabbitMQ domain events, and a React frontend.

Use this as the quick orientation doc. For a file-by-file repo map, see [CODE.md](CODE.md). For local setup and deployment details, see [../README.md](../README.md) and [DEPLOY.md](DEPLOY.md).

## Current Deployment

- Frontend: https://tryemconnect.netlify.app
- API: https://em-connect-backend-api.onrender.com
- API health: https://em-connect-backend-api.onrender.com/actuator/health
- WebSocket hub: https://em-connect-websocket-hub.onrender.com
- WebSocket health: https://em-connect-websocket-hub.onrender.com/health
- Notification worker health: https://em-connect-notification-worker.onrender.com/health
- Ticket worker health: https://em-connect-ticket-worker.onrender.com/health
- Uptime dashboard: https://stats.uptimerobot.com/v6aGZHL957

## What The System Does

- Auth: email/password login, Google OAuth, forgot-password verification codes, login activity tracking
- Events: create, edit, publish, cancel, complete, categorize, tag, and upload banners
- Registrations: concurrency-safe registration, cancellation, ticket-code lookups, registration history
- Tickets: async QR generation, authenticated QR download, validation/check-in flow
- Notifications: registration, event, reminder, welcome, login alert, password-reset, password-change, and check-in emails
- Realtime UX: WebSocket participant-count updates and live event announcements
- Admin and analytics: dashboard, user promotion/demotion, event oversight, charts and reporting

## Runtime Shape

1. The React app calls the Spring API for auth, event, registration, profile, admin, and ticket flows.
2. The API persists state in PostgreSQL and publishes domain events to RabbitMQ.
3. The notification worker consumes mail-related events and sends SendGrid email.
4. The ticket worker consumes registration confirmations and writes QR/metadata files.
5. The WebSocket hub consumes registration and event broadcasts and pushes live updates to browsers.

## Production Notes

- The app is deployed across Netlify/Vercel, Render, Neon, and CloudAMQP.
- On Render free tier, the notification and ticket workers run as web services with lightweight `/health` endpoints so they can stay routable.
- UptimeRobot pings all four Render services every 5 minutes to reduce cold-start pain.
- Avatar, banner, and ticket QR assets are still file-backed. That works for the current deployment, but durable shared object storage is still a future hardening task.

## Admin Bootstrap

Flyway seeds a default admin in migration `V3__create_admin_user.sql`:

- Email: `admin@emconnect.com`
- Password: `password123`

If you do not want to use the seeded admin, promote an existing user in PostgreSQL by setting `role = 'ADMIN'`.

## Active Docs

- [CODE.md](CODE.md): current repo and file guide
- [API.md](API.md): active endpoint reference
- [AUTHENTICATION.md](AUTHENTICATION.md): auth model, JWT, password reset, CORS, auth caveats
- [DATABASE.md](DATABASE.md): schema, migrations, enums, and operational notes
- [EVENT_STATES.md](EVENT_STATES.md): event lifecycle rules
- [RABBITMQ_TOPOLOGY_DESIGN.md](RABBITMQ_TOPOLOGY_DESIGN.md): exchange, queues, bindings, and DLQ
- [DEPLOY.md](DEPLOY.md): deployment runbook
- [SECURITY_AUDIT.md](SECURITY_AUDIT.md): security findings and follow-up
- [INCREMENTAL_FEATURES.md](INCREMENTAL_FEATURES.md): smaller shipped and pending UX improvements
- [FUTURE.md](FUTURE.md): forward-looking roadmap

## Archived Docs

Historical docs that are still kept but no longer part of the active reference set now live in [archive/README.md](archive/README.md).
