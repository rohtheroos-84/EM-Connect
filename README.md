# em-connect

em-connect is backend-first event management system im building to learn real-world system design using spring boot and golang together. It focuses on core event management features like event creation, user registrations with capacity handling, ticket generation, and notifications, all implemented in an event-driven architecture.

---

## what this project is

em-connect is an event management backend where:

- spring boot handles core business logic and rest apis
- golang services handle background work, notifications, and real-time updates
- services communicate using events instead of tight coupling

---

## core features

### authentication
- user registration and login
- jwt-based authentication
- role-based access control
- roles include user, organizer, and admin

### event management
- create, update, and publish events
- define event capacity, time, and venue
- only organizers or admins can manage events
- users can view only published events

### registrations
- users can register for events
- capacity is enforced atomically
- no overbooking under concurrent requests
- users can view their own registrations

### ticketing
- each confirmed registration generates a ticket
- tickets have unique codes and qr support
- ticket generation happens asynchronously
- tickets can be validated at entry

### notifications
- email notifications for registrations and updates
- notifications are processed asynchronously
- retries are supported for failed deliveries

### real-time updates
- live participant count via websocket
- real-time announcements for events

### admin and reporting
- event-level registration stats
- capacity usage metrics
- basic system health endpoints

---

## architecture overview

- spring boot api service
  - handles rest apis
  - manages database transactions
  - publishes domain events

- golang workers
  - notification worker for email and messages
  - ticket worker for ticket and qr generation
  - websocket hub for real-time updates

- postgres
  - primary data store

- message broker
  - used for event-driven communication

- redis
  - caching and ephemeral data

---

## tech stack

- java with spring boot
- golang
- postgresql
- rabbitmq or redis streams
- redis
- docker and docker compose

---

## repository structure

/em-connect
/api-service        spring boot application  
/notifications      golang notification worker  
/ticket-worker      golang ticket generator  
/ws-hub             golang websocket service  
/infra               docker and deployment configs  

---

## running locally

1. install docker and docker compose
2. clone the repository
3. run docker compose up
4. access the spring boot api on localhost
5. rabbitmq and postgres start automatically

---

## mvp scope

the minimum viable product includes:
- authentication
- event creation and listing
- user registration with capacity handling
- async ticket generation
- email notification on registration
- dockerized local setup




