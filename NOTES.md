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

### 2.2: Registration and Login APIs

- Registration API:
  Accepts user details, hashes the password using BCrypt, and saves the user to the database. It also validates that the email is unique before saving.

- Login API:
  Accepts email and password, retrieves the user by email, and verifies the password using BCrypt's match function. If valid, it returns a success response; otherwise, it returns an error.

- DTOs (Data Transfer Objects) are simple Java classes that define what data goes in and out of your API.

- Bean Validation annotations are used to enforce rules on DTO fields:
  @NotBlank - Field must not be null or empty
  @Email - Field must be a valid email format
  @Size - Field must meet specified length constraints

- When something goes wrong in the application, like a validation error or an exception, we want to return a clear and consistent error response to the client, but we usually get ugly errors that aint understandable. So we create Custom Exception Handlers using @ControllerAdvice and @ExceptionHandler to catch specific exceptions and return structured error responses.

- HTTP Status Codes:
  200 OK - Request succeeded
  201 Created - Resource successfully created
  400 Bad Request - Client sent invalid data
  401 Unauthorized - Authentication failed
  404 Not Found - Resource not found
  500 Internal Server Error - Server encountered an error

- The reason why we use DTOs instead of entities directly in controllers is to separate the internal data model from the external API contract. This provides better security, flexibility, and maintainability.

- Built Registration API at POST /api/auth/register
- Built Login API at POST /api/auth/login
- Built Health Check API at GET /api/health

- Can be checked using Postman or Invoke-RestMethod commands:
1. Registration
Invoke-RestMethod -Uri "http://localhost:8080/api/auth/register" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"email":"john@example.com","password":"password123","name":"John Doe"}'

2. Login
Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"email":"john@example.com","password":"password123"}'

3. Health Check
Invoke-RestMethod -Uri "http://localhost:8080/api/health"

- Also you have to do all these after starting up the Docker containers and spinning up springboot using:
"docker-compose up"
        &
".\mvnw.cmd spring-boot:run"

- Also created validation and exception handling mechanisms for better error responses like:
i. Registering with a duplicate email
ii. Resgistering with invalid email format
iii. Logging in with incorrect password 
iv. Logging in with non-existent email

### 2.3: JWT Implementation:

- Traditional Web Sessions vs JWT:
  Web Sessions store session data on the server, while JWTs are self-contained tokens that carry user info and are stored client-side.

- Session Structure/Process:
  Client logs in -> Server creates session -> Session ID stored in cookie -> Server retrieves session data on requests

- JWT Structure(3 parts separated by dots):
  Header: Metadata about the token (type, algorithm)
  Payload: Claims (user info, expiration)
  Signature: Verifies token integrity
  
- JWT Format: header.payload.signature (Base64Url encoded)

- JWT Processing:
  Client logs in(POST Request) -> Server generates JWT -> Client stores JWT (localStorage/cookie) -> Client sends JWT in Authorization header on requests(GET Request) -> Server verifies JWT signature and extracts claims and send back the requested resource.

- Spring Security Filter chain is a series of filters that process incoming requests for authentication and authorization before reaching the controller.

### 2.4: Role-based Access Control (RBAC)

- RBAC is a method of restricting access to resources based on user roles. Each role has specific permissions that determine what actions a user can perform. Ex: Admin can manage users, User can view content.

- Spring Security has Authoritys and Roles:
  Authority: A granular permission (e.g., "READ_PRIVILEGES")
  Role: A collection of authorities (e.g., "ROLE_ADMIN" includes "READ_PRIVILEGES", "WRITE_PRIVILEGES")

- There are 3 ways to implement RBAC in Spring Security:
  1. Method-level security using @PreAuthorize and @Secured annotations
  2. URL-based security using HttpSecurity configuration
  3. Custom access decision voters for complex logic

- Role Hierarchy allows roles to inherit permissions from other roles. Ex: "ROLE_ADMIN" > "ROLE_USER" and "ROLE_USER" > "ROLE_GUEST" and super admin has all roles, etc.

- Listing all users:
docker exec -it emconnect-postgres psql -U emconnect -d emconnect -c "SELECT id, email, name, role FROM users;"

- Adding an admin user:
  i. Create a user who will become admin
  $newAdmin = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/register" `
    -Method POST `
    -ContentType "application/json" `
    -Body '{"email":"testadmin@test.com","password":"admin123","name":"Test Admin No. x"}'

  Write-Host "Created user with ID: $($newAdmin.user.id)"

  ii. Promote to admin in database
  docker exec -it emconnect-postgres psql -U emconnect -d emconnect -c "UPDATE users SET role = 'ADMIN' WHERE email = 'testadmin@test.com';"

  iii. Login (get fresh token with ADMIN role)
  $adminLogin = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" `
    -Method POST `
    -ContentType "application/json" `
    -Body '{"email":"testadmin@test.com","password":"admin123"}'

  $adminToken = $adminLogin.token
  Write-Host "Role: $($adminLogin.user.role)"
  Write-Host "Token obtained: $($adminToken.Substring(0, 50))..."

  iv. Test admin dashboard
  Write-Host "`nTesting Admin Dashboard:"
  Invoke-RestMethod -Uri "http://localhost:8080/api/admin/dashboard" `
    -Headers @{ Authorization = "Bearer $adminToken" }

  v. Test get all users
  Write-Host "`nTesting Get All Users:"
  Invoke-RestMethod -Uri "http://localhost:8080/api/admin/users" `
    -Headers @{ Authorization = "Bearer $adminToken" }


## Phase 3 Notes

### 3.1: Event Entity & CRUD:

- in sql, we use foreign keys to link tables together, in JPA we use @ManyToOne and @OneToMany annotations to create relationships between entities. For example, an Event can have many Attendees, so we would have a @OneToMany relationship from Event to Attendee and a @ManyToOne relationship from Attendee to Event.

- without a service layer, all the business logic would be in the controller, which can lead to messy and hard-to-maintain code. The service layer allows us to separate concerns, making our code cleaner and more modular.

- pagination is a technique to split large datasets into smaller chunks (pages) to improve performance and user experience. In Spring Data JPA, we can use the Pageable interface to request specific pages of data from the repository.

Example:
Pageable pageable = PageRequest.of(page, size, Sort.by("date").descending());
Page<Event> eventsPage = eventRepository.findAll(pageable);

and a page object will be returned with the requested page of events, total pages, total elements, etc.

To test crud ops, follow below steps:

Step 1: Restart Application:
cd c:\Users\rohit\Downloads\EM-Connect\services\api
.\mvnw.cmd spring-boot:run

Step 2: Login to Get Token:
$login = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"email":"regularuser@example.com","password":"password123"}'

$token = $login.token
Write-Host "Token: $token"

Step 3: Create an Event:
$event = Invoke-RestMethod -Uri "http://localhost:8080/api/events" `
  -Method POST `
  -ContentType "application/json" `
  -Headers @{ Authorization = "Bearer $token" } `
  -Body '{
    "title": "Spring Boot Workshop",
    "description": "Learn Spring Boot from scratch",
    "location": "Online - Zoom",
    "startDate": "2026-03-15T10:00:00",
    "endDate": "2026-03-15T16:00:00",
    "capacity": 50
  }'

$event

Step 4: Publish the event:
$eventId = $event.id
Invoke-RestMethod -Uri "http://localhost:8080/api/events/$eventId/publish" `
  -Method POST `
  -Headers @{ Authorization = "Bearer $token" }

Step 5: Get all published events(NO AUTH REQUIRED!!!):
Invoke-RestMethod -Uri "http://localhost:8080/api/events"

Step 6: Get MY Events:
Invoke-RestMethod -Uri "http://localhost:8080/api/events/my-events" `
  -Headers @{ Authorization = "Bearer $token" }

Step 7: Update Events:
Invoke-RestMethod -Uri "http://localhost:8080/api/events/$eventId" `
  -Method PUT `
  -ContentType "application/json" `
  -Headers @{ Authorization = "Bearer $token" } `
  -Body '{"title": "Advanced Spring Boot Workshop", "capacity": 100}'

Step 8: Search Events:
Invoke-RestMethod -Uri "http://localhost:8080/api/events/search?keyword=spring"

p.s. THIS IS SO EFFING COOOOOOL

### 3.2: Event State Management:

- State machine defines the possible states of an entity and the allowed transitions between those states. For example, an Event can be in states like DRAFT, PUBLISHED, CANCELLED, and there are specific rules for how it can transition between these states.

- Valid Transitions table:
From State	  To State	   Action	        Who Can Do It
(new)	          DRAFT	  Create event	Any authenticated user
DRAFT	        PUBLISHED	   Publish	      Organizer only
DRAFT	        (deleted)	    Delete	      Organizer only
PUBLISHED	    CANCELLED	    Cancel	      Organizer only
PUBLISHED	    COMPLETED	   Complete	  System (auto) or Organizer
CANCELLED	        -	        None	        Terminal state
COMPLETED	        -	        None	        Terminal state

- Business rules for state transitions are enforced in the service layer. For example, only the organizer can publish or cancel an event, and once an event is published, it cannot be deleted, only cancelled.

- They are also enforced at the API level by checking the current state of the event before allowing certain actions. For example, you cannot publish an event that is already published or cancelled.

- THEY ENSURE data validation and integrity by preventing invalid state changes. For example, you cannot cancel an event that is still in draft state or complete an event that is cancelled.

- Layers of validation:
1. DTO Validation: Ensures incoming data is valid (e.g., title is not blank, dates are valid)
2. Business Logic Validation: Ensures actions are valid based on current state and user role (e.g., only organizer can publish, cannot publish if already published)
3. State Validation: Ensures state transitions are valid (e.g., cannot cancel a draft event, cannot complete a cancelled event)
4. Authorization Validation: Ensures user has permission to perform the action (e.g., only organizer can update or delete their events)

- Audit fields like createdAt, updatedAt, createdBy, updatedBy can be automatically managed using JPA Auditing features. This allows us to track when an event was created or updated and by whom.

- To test state management, you can follow the same steps as CRUD operations but also try to perform invalid actions to see the error responses. For example:

1. start docker desktop and run "docker-compose up" in the root directory to start all services
2. start the api service using ".\mvnw.cmd spring-boot:run" in the services/api directory
3. login to get token:

$login = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"email":"regularuser@example.com","password":"password123"}'

$token = $login.token

4. create an event (it will be in DRAFT state):
$event = Invoke-RestMethod -Uri "http://localhost:8080/api/events" `
  -Method POST `
  -ContentType "application/json" `
  -Headers @{ Authorization = "Bearer $token" } `
  -Body '{
    "title": "State Machine Test Event",
    "description": "Testing state transitions",
    "location": "Test Location",
    "startDate": "2026-04-01T10:00:00",
    "endDate": "2026-04-01T18:00:00",
    "capacity": 100
  }'

Write-Host "Event ID: $($event.id), Status: $($event.status)"
$eventId = $event.id

5. try invalid transtion: draft to complete (should fail):
try {
    Invoke-RestMethod -Uri "http://localhost:8080/api/events/$eventId/complete" `
      -Method POST `
      -Headers @{ Authorization = "Bearer $token" }
} catch {
    Write-Host "Expected error: Cannot transition DRAFT to COMPLETED"
    Write-Host "Status: $($_.Exception.Response.StatusCode.value__)"
}

6. publish the event (valid transition):
$published = Invoke-RestMethod -Uri "http://localhost:8080/api/events/$eventId/publish" `
  -Method POST `
  -Headers @{ Authorization = "Bearer $token" }

Write-Host "Status after publish: $($published.status)"

7. valid transition: publish to complete:
$completed = Invoke-RestMethod -Uri "http://localhost:8080/api/events/$eventId/complete" `
  -Method POST `
  -Headers @{ Authorization = "Bearer $token" }

Write-Host "Status after complete: $($completed.status)"

8. invalid transition: complete to any (should fail):
try {
    Invoke-RestMethod -Uri "http://localhost:8080/api/events/$eventId/cancel" `
      -Method POST `
      -Headers @{ Authorization = "Bearer $token" }
} catch {
    Write-Host "Expected error: Cannot transition from COMPLETED"
}

9. finally verify that only published events are visible in the public listing (This should NOT include DRAFT, CANCELLED, or COMPLETED events):

Invoke-RestMethod -Uri "http://localhost:8080/api/events"



## Phase 4 Notes


## Phase 5 Notes


## Phase 6 Notes


## Phase 7 Notes


## Phase 8 Notes


## Phase 9 Notes


## Phase 10 Notes