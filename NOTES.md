# Notes & Learnings

Section to document insights, challenges, and solutions as things progress:

## Phase 1 Notes

### 1.1: Initial Setup with Docker Compose and PostgreSQL
- Completed Step 1.1 on 2nd Feb '26
- Docker version: 28.3.2
- PostgreSQL running on port 5432
- Note: 

docker-compose.yml = Recipe book for your entire kitchen

services:
  postgres = "I need a fridge (database storage)"
  rabbitmq = "I need an oven (message cooking)"  
  redis = "I need a microwave (quick reheating/caching)"
  api = "I need a chef (business logic)"
  workers = "I need assistants (background tasks)"

docker-compose up = "Start cooking!"
docker-compose down = "Close the kitchen"

### 1.2: Springboot API skeleton

- Spring Boot gives you pre-configured, ready-to-use building blocks for web applications.
- JPA (Java Persistence API) is a standard for mapping Java objects to database tables as Database speaks SQL and Java speaks Objects, JPA is the translator.
- Flyway manages database schema changes over time, ensuring all environments are in sync.

- Created a basic Spring Boot application using Spring Initializr with dependencies for web, JPA, and PostgreSQL.
- And added folder structure for future modules:

controller - HTTP request handlers (REST endpoints)
service - Business logic
repository - Database access
entity - Database table mappings
dto - Data Transfer Objects (request/response shapes)
config - Configuration classes
db/migration - Flyway SQL scripts

- And replaced application.properties with application.yml for better structure and readability.


## Phase 2 Notes


## Phase 3 Notes


## Phase 4 Notes


## Phase 5 Notes


## Phase 6 Notes


## Phase 7 Notes


## Phase 8 Notes


## Phase 9 Notes


## Phase 10 Notes