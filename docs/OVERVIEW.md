# EM-Connect - Overview

EM-Connect is an event management platform built with a Spring Boot API, Go background processors, and a React frontend connected through RabbitMQ events.

This document is the quick orientation guide. For setup and runbook details, see [../README.md](../README.md) and [DEPLOY.md](DEPLOY.md).

## Current Deployment

- Frontend: https://tryemconnect.netlify.app
- API: https://emconnect-backend.onrender.com
- API health: https://emconnect-backend.onrender.com/actuator/health
- WebSocket hub: https://emconnect-websocket.onrender.com
- WebSocket health: https://emconnect-websocket.onrender.com/health
- Notification service health: https://emconnect-notification-worker.onrender.com/health
- Ticket service health: https://emconnect-ticket-worker.onrender.com/health
- Uptime dashboard (public): https://stats.uptimerobot.com/HoUhFK8lmD

## System Summary

Core capabilities:
- JWT and Google OAuth authentication
- Event CRUD and lifecycle transitions (draft/published/cancelled/completed)
- Concurrency-safe registrations
- Asynchronous ticket generation and notification delivery
- Real-time websocket announcements and participant updates
- Profile management and admin analytics

Core runtime components:
- Spring Boot API (Java 17)
- PostgreSQL 16
- RabbitMQ 3.13 topic exchange and DLQ
- Go services: notification-worker, ticket-worker, websocket-hub
- React 19 + Vite 6 frontend

## Architecture at a Glance

1. Frontend calls API for CRUD/auth flows.
2. API writes domain state to PostgreSQL.
3. API publishes domain events to RabbitMQ.
4. Go services consume events:
   - Notification worker sends emails via SendGrid.
   - Ticket worker generates ticket QR assets/metadata.
   - WebSocket hub broadcasts live updates to clients.

## Important Free-Tier Behavior

On Render free tier, notification and ticket processors are deployed as web services (not native background workers) and can sleep after inactivity. They expose /health for port binding and wake-up behavior.

Current keep-alive setup:
- UptimeRobot is active with 4 HTTP monitors (API, websocket, notification worker, ticket worker).
- Polling interval is 5 minutes.
- Public status page: https://stats.uptimerobot.com/HoUhFK8lmD

## Admin Bootstrap

Flyway seeds a default admin account in migration V3:
- Email: admin@emconnect.com
- Password: password123

If missing, promote an existing user in PostgreSQL by setting role = 'ADMIN'.

## Documentation Map

- [API.md](API.md): endpoint reference
- [AUTHENTICATION.md](AUTHENTICATION.md): auth, JWT, roles, CORS
- [DATABASE.md](DATABASE.md): schema and migrations
- [EVENT_STATES.md](EVENT_STATES.md): event lifecycle rules
- [RABBITMQ_TOPOLOGY_DESIGN.md](RABBITMQ_TOPOLOGY_DESIGN.md): exchange/queue topology
- [DEPLOY.md](DEPLOY.md): production runbook (do not alter historical decisions)
