# EM-Connect

EM-Connect is a backend-first event management system I am building to learn real-world system design using Spring Boot and Golang together. It focuses on core event management features like event creation, user registrations with capacity handling, ticket generation, and notifications, all implemented using an event-driven architecture, with a basic yet usable frontend on top.

---

## what this project is

EM-Connect is an event management system where:

- spring boot handles core business logic and rest apis
- golang services handle background work, notifications, and real-time updates
- a lightweight frontend consumes the apis and websocket streams
- services communicate using events instead of tight coupling

---

## core features

### authentication
- user registration and login
- jwt-based authentication
- role-based access control
- roles include user, organizer, and admin
- frontend handles auth state and token storage

### event management
- create, update, and publish events
- define event capacity, time, and venue
- only organizers or admins can manage events
- users can view only published events
- frontend provides event listing and event detail pages

### registrations
- users can register for events
- capacity is enforced atomically
- no overbooking under concurrent requests
- users can view their own registrations
- frontend shows registration status clearly

### ticketing
- each confirmed registration generates a ticket
- tickets have unique codes and qr support
- ticket generation happens asynchronously
- tickets can be viewed and downloaded from the frontend
- tickets can be validated at entry

### notifications
- email notifications for registrations and updates
- notifications are processed asynchronously
- retries are supported for failed deliveries
- frontend shows basic in-app notification status

### real-time updates
- live participant count via websocket
- real-time announcements for events
- frontend updates counts and messages without refresh

### admin and reporting
- event-level registration stats
- capacity usage metrics
- basic system health endpoints
- simple admin views in the frontend for organizers

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

- frontend application
  - consumes rest apis
  - connects to websocket hub
  - provides usable ui for users and organizers

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
- frontend using react or a simple js framework

---

## repository structure

/em-connect  
/api-service    ->    spring boot application  
/notifications    ->    golang notification worker  
/ticket-worker      ->    golang ticket generator  
/ws-hub             ->    golang websocket service  
/frontend           ->    basic web frontend  
/infra              ->    docker and deployment configs  
---

## running locally

1. install docker and docker compose
2. clone the repository
3. run docker compose up
4. access the frontend in the browser
5. spring boot api, rabbitmq, and postgres start automatically

---

## mvp scope

the minimum viable product includes:
- authentication with frontend integration
- event creation and listing
- user registration with capacity handling
- async ticket generation
- email notification on registration
- basic frontend for users and organizers
- dockerized local setup
