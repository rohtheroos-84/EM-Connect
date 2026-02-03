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

### 2.1: User Entity & Repository

- JPA Entity is a java class that maps to a database table, it automatically converts between Java objects and database rows.

- A Spring data JPA Repository is an interface that provides CRUD operations for the entity, Spring Data JPA generates the implementation at runtime.
- JpaRepository gives you these without writing anything:
  save() - Insert or update an entity
  findById() - Retrieve an entity by its ID
  findAll() - Retrieve all entities
  deleteById() - Delete an entity by its ID
  count() - Count total entities

- BCrypt(BCryptPasswordEncoder) is a strong hashing algorithm for securely storing passwords. With BCrypt, passwords are hashed with a unique salt, making it very difficult to reverse-engineer the original password. You can check passwords by hashing the input and comparing it to the stored hash but you cannot retrieve the original password from the hash.

- Database Constraints are rules applied to database columns to ensure data integrity. Common constraints include:
  NOT NULL - Ensures a column cannot have null values
  UNIQUE - Ensures all values in a column are unique
  PRIMARY KEY - Uniquely identifies each row in a table
  FOREIGN KEY - Ensures referential integrity between tables
  CHECK - Ensures values in a column meet a specific condition




## Phase 3 Notes


## Phase 4 Notes


## Phase 5 Notes


## Phase 6 Notes


## Phase 7 Notes


## Phase 8 Notes


## Phase 9 Notes


## Phase 10 Notes