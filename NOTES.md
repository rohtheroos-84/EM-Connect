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

  1. controller - HTTP request handlers (REST endpoints)
  2. service - Business logic
  3. repository - Database access
  4. entity - Database table mappings
  5. dto - Data Transfer Objects (request/response shapes)
  6. config - Configuration classes
  7. db/migration - Flyway SQL scripts

- And also replaced application.properties with application.yml for better structure and readability.


## Phase 2 Notes

### 2.1: User Entity & Repository

- JPA Entity is a java class that maps to a database table, it automatically converts between Java objects and database rows.

- A Spring data JPA Repository is an interface that provides CRUD operations for the entity, Spring Data JPA generates the implementation at runtime.
- JpaRepository gives you these without writing anything:
  - save() - Insert or update an entity
  - findById() - Retrieve an entity by its ID
  - findAll() - Retrieve all entities
  - deleteById() - Delete an entity by its ID
  - count() - Count total entities

- BCrypt(BCryptPasswordEncoder) is a strong hashing algorithm for securely storing passwords. With BCrypt, passwords are hashed with a unique salt, making it very difficult to reverse-engineer the original password. You can check passwords by hashing the input and comparing it to the stored hash but you cannot retrieve the original password from the hash.

- Database Constraints are rules applied to database columns to ensure data integrity. Common constraints include:
  1. NOT NULL - Ensures a column cannot have null values
  2. UNIQUE - Ensures all values in a column are unique
  3. PRIMARY KEY - Uniquely identifies each row in a table
  4. FOREIGN KEY - Ensures referential integrity between tables
  5. CHECK - Ensures values in a column meet a specific condition

### 2.2: Registration and Login APIs

- Registration API:
  Accepts user details, hashes the password using BCrypt, and saves the user to the database. It also validates that the email is unique before saving.

- Login API:
  Accepts email and password, retrieves the user by email, and verifies the password using BCrypt's match function. If valid, it returns a success response; otherwise, it returns an error.

- DTOs (Data Transfer Objects) are simple Java classes that define what data goes in and out of your API.

- Bean Validation annotations are used to enforce rules on DTO fields:
  1. @NotBlank - Field must not be null or empty
  2. @Email - Field must be a valid email format
  3. @Size - Field must meet specified length constraints

- When something goes wrong in the application, like a validation error or an exception, we want to return a clear and consistent error response to the client, but we usually get ugly errors that aint understandable. So we create Custom Exception Handlers using @ControllerAdvice and @ExceptionHandler to catch specific exceptions and return structured error responses.

- HTTP Status Codes:
  1. 200 OK - Request succeeded
  2. 201 Created - Resource successfully created
  3. 400 Bad Request - Client sent invalid data
  4. 401 Unauthorized - Authentication failed
  5. 404 Not Found - Resource not found
  6. 500 Internal Server Error - Server encountered an error

- The reason why we use DTOs instead of entities directly in controllers is to separate the internal data model from the external API contract. This provides better security, flexibility, and maintainability.

- Built Registration API at POST /api/auth/register
- Built Login API at POST /api/auth/login
- Built Health Check API at GET /api/health

- Can be checked using Postman or Invoke-RestMethod commands:
1. Registration
```
Invoke-RestMethod -Uri "http://localhost:8080/api/auth/register" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"email":"john@example.com","password":"password123","name":"John Doe"}'
```
2. Login
```
Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"email":"john@example.com","password":"password123"}'
```
3. Health Check
```
Invoke-RestMethod -Uri "http://localhost:8080/api/health"
```
- Also you have to do all these after starting up the Docker containers and spinning up springboot using:
```docker-compose up``` in the root directory and then ```.\mvnw.cmd spring-boot:run"``` in the services/api directory.

- Also created validation and exception handling mechanisms for better error responses like:
  1. Registering with a duplicate email
  2. Resgistering with invalid email format
  3. Logging in with incorrect password 
  4. Logging in with non-existent email

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
```
docker exec -it emconnect-postgres psql -U emconnect -d emconnect -c "SELECT id, email, name, role FROM users;
```
- Adding an admin user:
  1. Create a user who will become admin
  ```
  $newAdmin = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/register" `
    -Method POST `
    -ContentType "application/json" `
    -Body '{"email":"testadmin@test.com","password":"admin123","name":"Test Admin No. x"}'

  Write-Host "Created user with ID: $($newAdmin.user.id) and email: $($newAdmin.user.email)"
  ```

  2. Promote to admin in database
  ```
  docker exec -it emconnect-postgres psql -U emconnect -d emconnect -c "UPDATE users SET role = 'ADMIN' WHERE email = 'testadmin@test.com';"
  ```
  3. Login (get fresh token with ADMIN role)
  ```
  $adminLogin = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" `
    -Method POST `
    -ContentType "application/json" `
    -Body '{"email":"testadmin@test.com","password":"admin123"}'

  $adminToken = $adminLogin.token
  Write-Host "Role: $($adminLogin.user.role)"
  Write-Host "Token obtained: $($adminToken.Substring(0, 50))..."
  ```
  4. Test admin dashboard
  ```
  Write-Host "`nTesting Admin Dashboard:"
  Invoke-RestMethod -Uri "http://localhost:8080/api/admin/dashboard" `
    -Headers @{ Authorization = "Bearer $adminToken" }
  ```
  5. Test get all users
  ```
  Write-Host "`nTesting Get All Users:"
  Invoke-RestMethod -Uri "http://localhost:8080/api/admin/users" `
    -Headers @{ Authorization = "Bearer $adminToken" }
  ```

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
```
cd c:\Users\rohit\Downloads\EM-Connect\services\api
.\mvnw.cmd spring-boot:run
```
Step 2: Login to Get Token:
```
$login = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"email":"regularuser@example.com","password":"password123"}'

$token = $login.token
Write-Host "Token: $token"
```
Step 3: Create an Event:
```
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
```
Step 4: Publish the event:
```
$eventId = $event.id
Invoke-RestMethod -Uri "http://localhost:8080/api/events/$eventId/publish" `
  -Method POST `
  -Headers @{ Authorization = "Bearer $token" }
```
Step 5: Get all published events(NO AUTH REQUIRED!!!):
```
Invoke-RestMethod -Uri "http://localhost:8080/api/events"
```
Step 6: Get MY Events:
```
Invoke-RestMethod -Uri "http://localhost:8080/api/events/my-events" `
  -Headers @{ Authorization = "Bearer $token" }
```
Step 7: Update Events:
```
Invoke-RestMethod -Uri "http://localhost:8080/api/events/$eventId" `
  -Method PUT `
  -ContentType "application/json" `
  -Headers @{ Authorization = "Bearer $token" } `
  -Body '{"title": "Advanced Spring Boot Workshop", "capacity": 100}'
```
Step 8: Search Events:
```
Invoke-RestMethod -Uri "http://localhost:8080/api/events/search?keyword=spring"
```

p.s. THIS IS SO EFFING COOOOOOL

### 3.2: Event State Management:

- State machine defines the possible states of an entity and the allowed transitions between those states. For example, an Event can be in states like DRAFT, PUBLISHED, CANCELLED, and there are specific rules for how it can transition between these states.

- Valid Transitions table:

| From State | To State    | Action        | Who Can Do It              |
|------------|-------------|---------------|----------------------------|
| (new)      | DRAFT       | Create event  | Any authenticated user     |
| DRAFT      | PUBLISHED   | Publish       | Organizer only             |
| DRAFT      | (deleted)   | Delete        | Organizer only             |
| PUBLISHED  | CANCELLED   | Cancel        | Organizer only             |
| PUBLISHED  | COMPLETED   | Complete      | System (auto) or Organizer |
| CANCELLED  | -           | None          | Terminal state             |
| COMPLETED  | -           | None          | Terminal state             |



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
  ```
  $login = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" `
    -Method POST `
    -ContentType "application/json" `
    -Body '{"email":"regularuser@example.com","password":"password123"}'

  $token = $login.token
  ```
  4. create an event (it will be in DRAFT state):
  ```
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
  ```
  5. try invalid transtion: draft to complete (should fail):
  ```
  try {
      Invoke-RestMethod -Uri "http://localhost:8080/api/events/$eventId/complete" `
        -Method POST `
        -Headers @{ Authorization = "Bearer $token" }
  } catch {
      Write-Host "Expected error: Cannot transition DRAFT to COMPLETED"
      Write-Host "Status: $($_.Exception.Response.StatusCode.value__)"
  }
  ```
  6. publish the event (valid transition):
  ```
  $published = Invoke-RestMethod -Uri "http://localhost:8080/api/events/$eventId/publish" `
    -Method POST `
    -Headers @{ Authorization = "Bearer $token" }

  Write-Host "Status after publish: $($published.status)"
  ```
  7. valid transition: publish to complete:
  ```
  $completed = Invoke-RestMethod -Uri "http://localhost:8080/api/events/$eventId/complete" `
    -Method POST `
    -Headers @{ Authorization = "Bearer $token" }

  Write-Host "Status after complete: $($completed.status)"
  ```
  8. invalid transition: complete to any (should fail):
  ```
  try {
      Invoke-RestMethod -Uri "http://localhost:8080/api/events/$eventId/cancel" `
        -Method POST `
        -Headers @{ Authorization = "Bearer $token" }
  } catch {
      Write-Host "Expected error: Cannot transition from COMPLETED"
  }
  ```

  9. finally verify that only published events are visible in the public listing (This should NOT include DRAFT, CANCELLED, or COMPLETED events):
  ```
  Invoke-RestMethod -Uri "http://localhost:8080/api/events"
  ```

## Phase 4 Notes

### 4.1: Reg Entity & Basic Flow:

- As users should be able to register for many events and an event can have many attendees, we have a many-to-many relationship between users and events. In JPA, we can model this with a join table (e.g., registrations) that has foreign keys to both users and events.

- We also have to handle unique constraints to prevent duplicate registrations. For example, a user should not be able to register for the same event more than once.

- we do this at 2 levels:
1. Database Level(ITS A SAFETY NET, to handle race conditions): We can add a unique constraint on the combination of user_id and event_id in the registrations table to prevent duplicates at the database level.
```
ALTER TABLE registrations ADD CONSTRAINT unique_registration UNIQUE (user_id, event_id);
```

2. Application Level(gives better error msgs): Before creating a new registration, we can check if a registration already exists for the given user and event. If it does, we can return an error response.
```
if (registrationRepository.existsByUserIdAndEventId(userId, eventId)) {
    throw new DuplicateRegistrationException("User is already registered for this event");
}
```

- Business validation includes rules like:
  - Users cannot register for events that are full (capacity reached)
  - Users cannot register for events that have already started
  - Users cannot register for cancelled or completed events
  - Users can only cancel their own registrations
  - Organizers can view all registrations for their events

- The Registration flow would look like this:
1. User sends POST /api/events/{eventId}/register with JWT token
2. Server validates JWT and extracts user info
3. Server checks if event exists and is in a valid state for registration
4. Server checks if user is already registered (application level)
5. Server checks if event capacity is reached
6. Server creates the registration
7. Server returns success response or error if any validation fails

- TEST COMMANDS PERFORMED FOR STEP 4.1:

```powershell
# Step 1: Login
$login = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"email":"regularuser@example.com","password":"password123"}'

$token = $login.token
Write-Host "Logged in as: $($login.email)"

# Step 2: Create and Publish an Event
$event = Invoke-RestMethod -Uri "http://localhost:8080/api/events" `
  -Method POST `
  -ContentType "application/json" `
  -Headers @{ Authorization = "Bearer $token" } `
  -Body '{
    "title": "Registration Test Event",
    "description": "Testing the registration system",
    "location": "Test Venue",
    "startDate": "2026-05-01T10:00:00",
    "endDate": "2026-05-01T18:00:00",
    "capacity": 5
  }'

$eventId = $event.id
Write-Host "Created event ID: $eventId"

# Publish event
Invoke-RestMethod -Uri "http://localhost:8080/api/events/$eventId/publish" `
  -Method POST `
  -Headers @{ Authorization = "Bearer $token" }
Write-Host "Event published!"

# Step 3: Register for Event
$registration = Invoke-RestMethod -Uri "http://localhost:8080/api/events/$eventId/register" `
  -Method POST `
  -Headers @{ Authorization = "Bearer $token" }

$registration
Write-Host "Ticket Code: $($registration.ticketCode)"
$regId = $registration.id
# RESULT: Registration created with status CONFIRMED and ticket code TKT-XXXXXXXX

# Step 4: Test Duplicate Registration (Should fail with 409)
try {
    Invoke-RestMethod -Uri "http://localhost:8080/api/events/$eventId/register" `
      -Method POST `
      -Headers @{ Authorization = "Bearer $token" }
} catch {
    Write-Host "Expected error: Duplicate registration"
    Write-Host "Status: $($_.Exception.Response.StatusCode.value__)"  # Returns 409
}

# Step 5: Check Registration Status
Invoke-RestMethod -Uri "http://localhost:8080/api/events/$eventId/registration-status" `
  -Headers @{ Authorization = "Bearer $token" }
# RESULT: {isRegistered: true, totalRegistrations: 1}

# Step 6: Get My Registrations
Invoke-RestMethod -Uri "http://localhost:8080/api/registrations/my-registrations" `
  -Headers @{ Authorization = "Bearer $token" }
# RESULT: Page with the user's registration(s)

# Step 7: Get Registration by Ticket Code (Public endpoint for check-in)
$ticketCode = $registration.ticketCode
Invoke-RestMethod -Uri "http://localhost:8080/api/registrations/ticket/$ticketCode"
# RESULT: Registration details with ticket code

# Step 8: Cancel Registration
$cancelled = Invoke-RestMethod -Uri "http://localhost:8080/api/registrations/$regId/cancel" `
  -Method POST `
  -Headers @{ Authorization = "Bearer $token" }

$cancelled
Write-Host "Status: $($cancelled.status)"  # Returns CANCELLED

# Step 9: Try to Cancel Again (Should fail - already cancelled)
try {
    Invoke-RestMethod -Uri "http://localhost:8080/api/registrations/$regId/cancel" `
      -Method POST `
      -Headers @{ Authorization = "Bearer $token" }
} catch {
    Write-Host "Expected error: Already cancelled"
}

# Step 10: Re-register After Cancelling (Should work - reactivates cancelled registration)
$newReg = Invoke-RestMethod -Uri "http://localhost:8080/api/events/$eventId/register" `
  -Method POST `
  -Headers @{ Authorization = "Bearer $token" }

Write-Host "New registration! Ticket: $($newReg.ticketCode)"
# RESULT: Registration reactivated with new ticket code
```

- ISSUES FOUND AND FIXED:
1. 403 Forbidden on `/api/registrations/ticket/{ticketCode}` - Endpoint wasn't in the public permit list in SecurityConfig. Fixed by adding it to permitAll().
2. 500 Internal Server Error on re-registration after cancel - The unique constraint (user_id, event_id) blocked creating a new row. Fixed by reactivating the existing cancelled registration instead of creating a new one.

### 4.2: Capacity Handling & Concurrency:

- a race condition happens when 2 or more operations try to modify the same data at the same time, leading to inconsistent results. For example, if 2 users try to register for the last available spot in an event simultaneously, both might pass the capacity check and end up overbooking the event.

- there are 2 strategies to handle this:
1. Pessimistic Locking: We can lock the event record when checking capacity and creating a registration. This ensures that only one transaction can modify the event at a time, but it can lead to performance issues and deadlocks under high contention.
2. Optimistic Locking: We can use a version field in the event entity and check it during updates. If the version has changed since we read the event, it means another transaction has modified it, and we can retry the operation. This is more efficient but requires handling retries.

- when to use which:
| Criteria      | Pessimistic                     | Optimistic                          |
|---------------|----------------------------------|--------------------------------------|
| Contention    | High (many users competing)      | Low (rare conflicts)                 |
| Performance   | Slower (blocking)                | Faster (no blocking)                 |
| Complexity    | Simpler code                     | Needs retry logic                    |
| Use case      | Ticket booking, bank transfers   | Profile updates, content edits       |
| Risk          | Deadlocks if not careful         | Starvation under high load           |

- DB level atomicity means that a series of operations either all succeed or all fail together. This is crucial for maintaining data integrity, especially in concurrent scenarios. For example, when registering for an event, we need to ensure that the capacity check and registration creation happen atomically to prevent overbooking.

- atomic reg. looks like this:
1. begin transaction
  - lock event record (pessimistic) or read version (optimistic)
  - check capacity
  - if capacity is available, create registration
  - commit transaction
2. if any step fails (e.g., capacity check fails, version mismatch), rollback transaction and return an error response.

- key insight: steps in 1 must happen as ONE INDIVISIBLE UNIT(aka atomic operation) to prevent race conditions and ensure data integrity.

- transaction isolation levels define how transactions interact with each other and how they see changes made by other transactions. The main levels are:

| Isolation Level   | Description                                      | Use Case                          |
|-------------------|--------------------------------------------------|-----------------------------------|
| READ UNCOMMITTED  | Can see uncommitted changes (dirty reads)        | Rarely used, can lead to issues   |
| READ COMMITTED    | Can only see committed changes (no dirty reads)  | Default in many databases, good for most cases |
| REPEATABLE READ   | Ensures consistent reads within a transaction     | Good for complex read operations, prevents non-repeatable reads |
| SERIALIZABLE      | Transactions are completely isolated              | Highest integrity, lowest concurrency |

1. dirty reads happen when a transaction reads data that has been modified by another transaction but not yet committed. This can lead to inconsistent data if the other transaction rolls back.
Ex: Transaction A updates event capacity to 0 but hasn't committed yet. Transaction B reads the capacity and sees 0, but if Transaction A rolls back, the capacity is actually still available.

2. non-repeatable reads happen when a transaction reads the same data twice and gets different results because another transaction modified it in between. This can lead to confusion and bugs if not handled properly.
Ex: Transaction A reads event capacity as 10. Transaction B updates capacity to 5 and commits. Transaction A reads capacity again and sees 5, leading to inconsistent results.

3. phantom reads happen when a transaction reads a set of rows that satisfy a condition, but another transaction inserts or deletes rows that affect the result set. This can lead to unexpected results if not handled properly.
Ex: Transaction A reads all events with capacity > 0 and gets a list of 5 events. Transaction B creates a new event with capacity 10 and commits. Transaction A reads again and now sees 6 events, which can lead to confusion.

- postgresql's default isolation level is READ COMMITTED, which prevents dirty reads but allows non-repeatable reads and phantom reads. For our registration scenario, we might want to use REPEATABLE READ or SERIALIZABLE to ensure data integrity under concurrent registrations.

- TEST COMMANDS PERFORMED FOR STEP 4.2:

```powershell
# Step 1: Restart Application
cd c:\Users\rohit\Downloads\EM-Connect\services\api
.\mvnw.cmd spring-boot:run

# Step 2: Create Test Users (10 users for concurrent testing)
for ($i = 1; $i -le 10; $i++) {
    try {
        Invoke-RestMethod -Uri "http://localhost:8080/api/auth/register" `
          -Method POST `
          -ContentType "application/json" `
          -Body "{`"email`":`"testuser$i@test.com`",`"password`":`"password123`",`"name`":`"Test User $i`"}"
        Write-Host "Created testuser$i@test.com"
    } catch {
        Write-Host "testuser$i@test.com already exists (OK)"
    }
}

# Step 3: Login and Create Event with Capacity 3
$login = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"email":"regularuser@example.com","password":"password123"}'

$token = $login.token

$event = Invoke-RestMethod -Uri "http://localhost:8080/api/events" `
  -Method POST `
  -ContentType "application/json" `
  -Headers @{ Authorization = "Bearer $token" } `
  -Body '{
    "title": "Concurrency Test - Only 3 Seats",
    "description": "Testing pessimistic locking",
    "location": "Small Room",
    "startDate": "2026-06-01T10:00:00",
    "endDate": "2026-06-01T18:00:00",
    "capacity": 3
  }'

$eventId = $event.id
Write-Host "Created event ID: $eventId with capacity 3"

Invoke-RestMethod -Uri "http://localhost:8080/api/events/$eventId/publish" `
  -Method POST `
  -Headers @{ Authorization = "Bearer $token" }

Write-Host "Event published!"

# Step 4: Fire 10 Concurrent Registrations for 3 Seats (THE BIG TEST!)
$emails = (1..10 | ForEach-Object { "testuser$_@test.com" }) -join ","

Write-Host "Firing 10 concurrent registrations for 3 seats..."

$result = Invoke-RestMethod -Uri "http://localhost:8080/api/test/concurrent-register?eventId=$eventId&userEmails=$emails" `
  -Method POST

Write-Host ""
Write-Host "════════════════════════════════════════════"
Write-Host "  CONCURRENCY TEST RESULTS"
Write-Host "════════════════════════════════════════════"
Write-Host "  Event capacity:            3"
Write-Host "  Total attempts:            $($result.totalAttempts)"
Write-Host "  Successful registrations:  $($result.successCount)"
Write-Host "  Rejected registrations:    $($result.failCount)"
Write-Host "  Confirmed in DB:           $($result.confirmedInDb)"
Write-Host "════════════════════════════════════════════"

if ($result.confirmedInDb -le 3) {
    Write-Host "  ✅ NO OVERBOOKING! Pessimistic locking works!" -ForegroundColor Green
} else {
    Write-Host "  ❌ OVERBOOKING DETECTED!" -ForegroundColor Red
}

Write-Host ""
Write-Host "Successes:"
$result.successes | ForEach-Object { Write-Host "  ✅ $_" }
Write-Host ""
Write-Host "Failures:"
$result.failures | ForEach-Object { Write-Host "  ❌ $_" }
# EXPECTED RESULT: Exactly 3 successes, 7 failures, 3 confirmed in DB

# Step 5: Verify in Database
Invoke-RestMethod -Uri "http://localhost:8080/api/events/$eventId/registration-status" `
  -Headers @{ Authorization = "Bearer $token" }
# RESULT: {isRegistered: false, totalRegistrations: 3}
# (regularuser isn't registered, but 3 test users are)
```


## Phase 5 Notes

### 5.1: Message Broker Setup:

- a message broker in simple terms is like a post office for your application. It allows different parts of your application (or even different applications) to communicate with each other by sending messages through a central hub. This helps decouple components, improve scalability, and handle asynchronous processing.

- ex: When a user registers for an event, instead of processing all the logic (e.g., sending confirmation email, updating analytics) in the same request, we can publish a message to a queue. Then, separate worker services can consume those messages and perform the necessary tasks without blocking the user's request, hence improving performance and user experience.

- RabbitMQ is a popular open-source message broker that implements the Advanced Message Queuing Protocol (AMQP). It provides features like message queuing, routing, and delivery guarantees, making it a great choice for building scalable and resilient applications.

- its architecture consists of:
  1. Producer: The component that creates and sends messages to the broker.
  2. Exchange: The component that receives messages from producers and routes them to the appropriate queues based on routing rules.
  3. Queue: The component that stores messages until they are consumed by a consumer.
  4. Consumer: The component that receives messages from the queue and processes them.
  5. Binding: The relationship between an exchange and a queue that defines how messages are routed.

- exchange types:
  1. Direct Exchange: Routes messages to queues based on an exact match between the routing key and the queue binding key.
  Ex: If a message has a routing key "event.registration", it will be routed to a queue that is bound with the same key.

  2. Fanout Exchange: Routes messages to all queues that are bound to it, regardless of the routing key.
  Ex: If a message is sent to a fanout exchange, it will be delivered to all queues bound to that exchange.

  3. Topic Exchange: Routes messages to queues based on pattern matching between the routing key and the queue binding key, allowing for more flexible routing.
  Ex: If a message has a routing key "event.*", it will be routed to any queue that is bound with a matching pattern like "event.registration" or "event.cancellation".

- We are going to use TOPIC exchange for our event-driven architecture because it allows us to route messages based on patterns, which is useful for handling different types of events (e.g., registration, cancellation) without needing a separate queue for each event type.

- Pub/Sub (Publish/Subscribe) is a messaging pattern where producers publish messages to an exchange, and multiple consumers can subscribe to receive those messages. Ex: When an event is published, all services that are subscribed to that event type will receive the message and can process it independently.


- Point-to-Point is a pattern where messages are sent directly from a producer to a specific consumer through a queue. Ex: When a user registers for an event, a message is sent to a specific queue that is consumed by a worker service responsible for sending confirmation emails.

- Message durability ensures that messages are not lost in case of broker failure. Acknowledgments allow consumers to confirm that they have successfully processed a message, which helps the broker know when it can safely remove the message from the queue.

- Message acknowledgments work like this:
  1. Producer sends message to exchange
  2. Exchange routes message to queue
  3. Consumer receives message and processes it
  4. If processing is successful, consumer sends an acknowledgment back to the broker indicating that the message has been handled and can be removed from the queue. If the consumer fails to acknowledge (e.g., due to an error or crash), the broker can re-deliver the message to another consumer, ensuring that it is eventually processed.

- EM Connect Message Flow:

  1. A user or admin triggers an action in the Spring Boot API  
    - Registration confirmed or cancelled  
    - Event published or cancelled  

  2. The Spring Boot API publishes a message to the topic exchange  
    - Exchange name: `em.events`  
    - Message includes a routing key describing the action  

  3. The topic exchange evaluates the routing key  

  4. Based on the routing key, the message is routed to one or more queues  

  5. If the routing key is `registration.confirmed`  
    - Message goes to `notification.q`  
    - Message goes to `ticket.q`  

  6. If the routing key is `registration.cancelled`  
    - Message goes to `notification.q`  

  7. If the routing key is `event.published`  
    - Message goes to `notification.q`  
    - Message goes to `websocket.q`  

  8. If the routing key is `event.cancelled`  
    - Message goes to `notification.q`  
    - Message goes to `websocket.q`  

  9. Go Notifier Worker consumes messages from `notification.q`  
    - Sends user notifications  

  10. Go Ticket Worker consumes messages from `ticket.q`  
      - Generates or manages tickets  

  11. Go WebSocket Hub consumes messages from `websocket.q`  
      - Pushes real-time updates to connected clients  

- After starting RabbitMQ using `docker-compose up`, we can verify the setup by:
1. Accessing the RabbitMQ Management UI at `http://localhost:15672` (default credentials: guest/guest)
2. Checking that the `em.events` exchange is created

- I created exchanges, queues and bindings using the RabbitMQ Management UI for simplicity, but in a production application, we would typically automate this setup using configuration code or infrastructure as code tools to ensure consistency across environments.

- What all i did:
  1. Started RabbitMQ using `docker-compose up`
  2. Accessed RabbitMQ Management UI at `http://localhost:15672`
  3. Created a topic exchange named `em.events`
  4. Created queues: `notification.queue`, `ticket.queue`, `websocket.queue`
  5. Created bindings with appropriate routing keys:
      - `registration.confirmed` -> `notification.queue`, `ticket.queue`
      - `registration.cancelled` -> `notification.queue`
      - `event.published` -> `notification.queue`, `websocket.queue`
      - `event.cancelled` -> `notification.queue`, `websocket.queue`
  6. Created DLE & DLQ: `em.events.dlx` and `em.events.dlq`
  7. Configured queues to use the DLX for failed messages

- Tested these by publishing test messages to the exchange with different routing keys and verifying that they are delivered to the correct queues in the RabbitMQ Management UI.

```powershell
# Check RabbitMQ is running
Invoke-RestMethod -Uri "http://localhost:15672/api/overview" `
  -Headers @{ Authorization = "Basic " + [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("emconnect:emconnect")) }

# List exchanges
Invoke-RestMethod -Uri "http://localhost:15672/api/exchanges" `
  -Headers @{ Authorization = "Basic " + [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("emconnect:emconnect")) } | 
  Where-Object { $_.name -like "em.*" } | 
  Format-Table name, type, durable

# List queues
Invoke-RestMethod -Uri "http://localhost:15672/api/queues" `
  -Headers @{ Authorization = "Basic " + [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("emconnect:emconnect")) } | 
  Where-Object { $_.name -like "*queue*" -or $_.name -like "*dlq*" } | 
  Format-Table name, messages, consumers

# Publish a test message via API
$body = @{
    properties = @{ content_type = "application/json" }
    routing_key = "registration.confirmed"
    payload = '{"eventType":"REGISTRATION_CONFIRMED","registrationId":99,"userEmail":"test@test.com","eventTitle":"API Test","ticketCode":"TKT-API-TEST","timestamp":"2026-02-10T12:00:00"}'
    payload_encoding = "string"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:15672/api/exchanges/%2F/em.events/publish" `
  -Method POST `
  -ContentType "application/json" `
  -Headers @{ Authorization = "Basic " + [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("emconnect:emconnect")) } `
  -Body $body

# Check queue depths after publishing
Invoke-RestMethod -Uri "http://localhost:15672/api/queues" `
  -Headers @{ Authorization = "Basic " + [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("emconnect:emconnect")) } | 
  Where-Object { $_.name -like "*queue*" -or $_.name -like "*dlq*" } | 
  Format-Table name, messages
```

### 5.2: Publishing Events from Spring Boot:

- domain events are a way to represent significant occurrences or changes in the state of our application. For example, when a user registers for an event, that can be represented as a "RegistrationConfirmed" event. These events can then be published to a message broker like RabbitMQ, allowing other parts of the system to react to them asynchronously. 

- spring AMQP in simple terms is a library that provides support for working with RabbitMQ in Spring applications. It allows us to easily publish and consume messages, manage connections, and handle message serialization/deserialization. 

- AMQP stands for Advanced Message Queuing Protocol, it provides these components:
  1. Connection Factory: Manages connections to the RabbitMQ broker.
  2. RabbitTemplate: A helper class for sending messages to the broker.
  3. MessageListenerContainer(`@RabbitListener`): A component that listens for messages from a queue and processes them.
  4. MessageConverter: Handles serialization and deserialization of messages.

- event payload design is crucial for ensuring that the messages we publish contain all the necessary information for consumers to process them effectively. A well-designed payload should include:

  1. Event Type: A string that identifies the type of event (e.g., "REGISTRATION_CONFIRMED").
  2. Event Data: A structured object that contains the relevant data for the event (e.g., registrationId, userEmail, eventTitle, ticketCode).
  3. Timestamp: The time when the event occurred, which can be useful for ordering and debugging
  4. Unique Event ID: A unique identifier for the event instance, which can help with tracking and idempotency.
  5. And all relevant Entity IDs (e.g., userId, eventId) to allow consumers to correlate the event with their own data.

- Example RegistrationConfirmed event payload:
```json
{
  "eventId": "uuid-123",
  "eventType": "REGISTRATION_CONFIRMED",
  "timestamp": "2026-02-10T10:00:00Z",
  "registrationId": 42,
  "userId": 6,
  "userEmail": "user@example.com",
  "userName": "John Doe",
  "registeredEventId": 3,
  "eventTitle": "Spring Workshop",
  "eventDate": "2026-05-01T10:00:00Z",
  "ticketCode": "TKT-ABC123"
}
```

#### Files Created/Modified:
- `RabbitMQConfig.java` - Configures exchanges, queues, bindings, and message converter
- `EventPublisher.java` - Service that publishes domain events to RabbitMQ
- `BaseEvent.java` - Abstract base class for all events
- `RegistrationConfirmedEvent.java`, `RegistrationCancelledEvent.java` - Registration events
- `EventPublishedEvent.java`, `EventCancelledEvent.java` - Event lifecycle events
- `RegistrationService.java` & `EventService.java` - Updated to publish events after DB operations

#### Issues Encountered & Fixes:
1. **Password mismatch**: `application.yml` had `emconnect123` but Docker used `emconnect` - fixed by syncing passwords
2. **Timezone error**: PostgreSQL 16 rejected "Asia/Calcutta" (deprecated) - fixed with JVM flag `-Duser.timezone=Asia/Kolkata`
3. **Flyway checksum mismatch**: Modified V3 migration after it was applied - fixed by updating checksum in `flyway_schema_history` table

#### Testing Performed:
```powershell
# 1. Login as admin
$admin = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" -Method POST -ContentType "application/json" -Body '{"email":"admin@emconnect.com","password":"password123"}'
$headers = @{ Authorization = "Bearer $($admin.token)" }

# 2. Create an event
$event = Invoke-RestMethod -Uri "http://localhost:8080/api/events" -Method POST -Headers $headers -ContentType "application/json" -Body '{"title":"RabbitMQ Test","description":"Test","location":"Online","startDate":"2026-03-01T10:00:00","endDate":"2026-03-01T12:00:00","capacity":50}'

# 3. Publish the event (triggers EventPublishedEvent → RabbitMQ)
Invoke-RestMethod -Uri "http://localhost:8080/api/events/$($event.id)/publish" -Method POST -Headers $headers

# 4. Register for the event (triggers RegistrationConfirmedEvent → RabbitMQ)
Invoke-RestMethod -Uri "http://localhost:8080/api/events/$($event.id)/register" -Method POST -Headers $headers

# 5. Check RabbitMQ queues via Management API
$creds = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("emconnect:emconnect"))
$rabbitHeaders = @{ Authorization = "Basic $creds" }
$queues = Invoke-RestMethod -Uri "http://localhost:15672/api/queues" -Headers $rabbitHeaders
$queues | ForEach-Object { "$($_.name): $($_.messages) messages" }
```

#### Test Results:
| Queue | Messages | Events Routed |
|-------|----------|---------------|
| notification.queue | 2 | EventPublished + RegistrationConfirmed |
| ticket.queue | 1 | RegistrationConfirmed |
| websocket.queue | 2 | EventPublished + RegistrationConfirmed |

#### Running Spring Boot (Updated Command):
Due to Windows timezone "Asia/Calcutta" being deprecated in PostgreSQL 16, use:
```powershell
# Start Docker containers first
docker-compose up -d

# Then run Spring Boot with timezone fix
cd services\api
$env:JAVA_TOOL_OPTIONS="-Duser.timezone=Asia/Kolkata"; .\mvnw.cmd spring-boot:run
```

#### Admin Credentials:
- Email: `admin@emconnect.com`
- Password: `password123`

### 5.3: First GOLANG service - Notification Worker:

- we use Go for background workers coz of a lot of reasons:
  1. fast startup: java/spring takes 3 to 10 seconds while Go takes 10-50 ms, making it great for scaling up/down workers
  2. low memory footprint: Go's memory usage(10-50 MB per instance) is much lower than Java(200-500 MB per instance), allowing us to run more worker instances on the same hardware
  3. built-in concurrency: Go's goroutines and channels make it easy to handle multiple tasks concurrently without complex thread management, which is ideal for processing messages from a queue
  4. simple deployment: Go compiles to a single binary with no external dependencies, making it easy to deploy and run in various environments without worrying about JVM versions or libraries
  5. strong standard library: Go has excellent built-in support for networking, HTTP, and working with RabbitMQ through libraries like `streadway/amqp`, which simplifies development of message-driven workers
  6. good performance: Go's performance is often comparable to Java, and in some cases better for I/O-bound tasks, making it a solid choice for background processing

#### Go vs Java Syntax Comparison

| Java                              | Go                              |
|-----------------------------------|----------------------------------|
| `class User { }`                  | `type User struct { }`          |
| `private String name;`            | `Name string` (exported)        |
| `public String getName()`         | `name string` (unexported)      |
| `UserService userService;`        | `var userService UserService`   |
| `@Autowired`                     | No DI framework needed          |
| `try { } catch { }`              | `if err != nil { return err }`  |
| `new Thread().start()`           | `go doSomething()`              |
| `interface Runnable { }`         | `type Runnable interface { }`   |
| `implements Runnable`            | Implicit implementation         |
| `List<String>`                   | `[]string`                      |
| `Map<String, User>`              | `map[string]User`               |
| `null`                           | `nil`                           |
| `NullPointerException`           | Compiler catches most issues    |


#### Our Notification Worker Structure:
```
services/
└── notification-worker/
├── go.mod # Module definition (like pom.xml)
├── go.sum # Dependency checksums
├── main.go # Entry point
├── config/
│ └── config.go # Configuration loading
├── consumer/
│ └── consumer.go # RabbitMQ consumer
├── handler/
│ └── handler.go # Message processing logic
└── model/
└── events.go # Event structs (DTOs)
```

#### Testing done:
1. Start RabbitMQ and Spring Boot API:
```powershell
docker-compose up -d
cd services\api
$env:JAVA_TOOL_OPTIONS="-Duser.timezone=Asia/Kolkata"; .\mvnw.cmd spring-boot:run
```

2. Run the Go Notification Worker:
```powershell
cd c:\Users\rohit\Downloads\EM-Connect\services\notification-worker
go build -o notification-worker.exe .
.\notification-worker.exe
```

3. Trigger events from the API (e.g., register for an event, publish an event) and observe the worker logs to see that messages are being consumed and processed correctly:

```powershell
# 1. Login and get token
$login = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" -Method POST -ContentType "application/json" -Body '{"email":"admin@emconnect.com","password":"password123"}'
$token = $login.token

# 2. Create and publish an event
$event = Invoke-RestMethod -Uri "http://localhost:8080/api/events" -Method POST -ContentType "application/json" -Headers @{ Authorization = "Bearer $token" } -Body '{"title":"Fixed Test Event","description":"Testing fixed Go worker","location":"Success Land","startDate":"2026-08-01T10:00:00","endDate":"2026-08-01T18:00:00","capacity":50}'

Invoke-RestMethod -Uri "http://localhost:8080/api/events/$($event.id)/publish" -Method POST -Headers @{ Authorization = "Bearer $token" }

# Output in Go worker logs should show the EventPublishedEvent being consumed and processed successfully:
'''
─────────────────────────────────────────
📬 Message received (routing key: event.published)
📨 Received event: EVENT_PUBLISHED (eventId: 2)
📢 EVENT PUBLISHED
   🎫 Event: Fixed Test Event
   📍 Location: Success Land
   📅 Date: Aug 1, 2026 at 10:00 AM
   👤 Organizer: Admin User (admin@emconnect.com)
   📮 [SIMULATION] Would notify subscribers about new event
✅ Message processed and acknowledged
─────────────────────────────────────────
'''
# 3. Register for the event to trigger RegistrationConfirmedEvent and see it processed by the worker:
Invoke-RestMethod -Uri "http://localhost:8080/api/events/$($event.id)/register" -Method POST -Headers @{ Authorization = "Bearer $token" }

# Output in Go worker logs should show the RegistrationConfirmedEvent being consumed and processed successfully:
'''
─────────────────────────────────────────
📬 Message received (routing key: registration.confirmed)
📨 Received event: REGISTRATION_CONFIRMED (eventId: 2)
✅ REGISTRATION CONFIRMED
   📧 To: admin@emconnect.com (Admin User)
   🎫 Event: Fixed Test Event
   📍 Location: Success Land
   🎟️  Ticket: TKT-XXXXXXXX
   📅 Date: Aug 1, 2026 at 10:00 AM
   📮 [SIMULATION] Would send confirmation email to admin@emconnect.com
✅ Message processed and acknowledged
─────────────────────────────────────────
'''
```

### 5.4: Email Notifications(ACTUAL):

#### 1. SMTP Basics
- SMTP is used to send emails via a mail server (not directly to users).
- Typical flow:
  1. Connect to SMTP server (port 587 or 465)
  2. TLS handshake
  3. Authenticate
  4. Send sender, recipient, headers, body
- Always use a trusted provider (Mailgun, SendGrid, SES).
- Never hardcode credentials in code. Use environment variables.

---

#### 2. Email Templating
- Never hardcode email text.
- Use `html/template` in Go for safe HTML rendering.
- Templates allow:
  - Personalization
  - Reusability
  - Cleaner separation of logic and content
- Keep templates version-controlled.
- Pass structured data object to template (DTO style).

Example data struct:
```go
type EmailData struct {
    UserName   string
    EventTitle string
    TicketCode string
}
```

---

#### 3. Retry Mechanism

- Email sending can fail due to:
  - Network issues
  - Rate limits
  - Temporary SMTP errors
- Use exponential backoff:
  - 1s → 2s → 4s → 8s → stop
- Set a max retry limit (e.g., 3–5 attempts).
- Retry only temporary failures.
- Do NOT retry permanent failures (invalid email, 550 errors).

---

#### 4. Dead Letter Queue (DLQ)

- If max retries fail → do NOT requeue.
- Nack without requeue → message goes to DLX.
- DLQ prevents infinite failure loops.
- Use DLQ to:
  - Debug poison messages
  - Inspect malformed payloads
  - Monitor failure rates

---

#### Production Principles:

- Never drop messages silently.
- Always log structured errors.
- Separate permanent vs transient failures.
- Monitor DLQ growth.
- Worker must be idempotent and resilient.

#### Testing & Working: 
- Basically Same as before but now we see actual email sending logs in the Go worker console, and we can verify receipt of emails in the inbox of the registered user, currently sends to Mailhogun's test inbox since we're using Mailhog for local development.

- Testing Commands:
```powershell
# 1. Start Docker containers (includes Mailhog)
docker-compose up -d

# 2. Run Spring Boot API
cd services\api
$env:JAVA_TOOL_OPTIONS="-Duser.timezone=Asia/Kolkata"; .\mvnw.cmd spring-boot:run

# 3. BUILD & Run Go Notification Worker
cd c:\Users\rohit\Downloads\EM-Connect\services\notification-worker
go build -o notification-worker.exe .
.\notification-worker.exe

# 4. Trigger events from API (e.g., register for an event, publish an event) and observe Go worker logs for email sending:

# Login
$login = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" `
  -Method POST -ContentType "application/json" `
  -Body '{"email":"admin@emconnect.com","password":"password123"}'
$token = $login.token

# Create event
$event = Invoke-RestMethod -Uri "http://localhost:8080/api/events" `
  -Method POST -ContentType "application/json" `
  -Headers @{ Authorization = "Bearer $token" } `
  -Body '{
    "title": "Email Test Event",
    "description": "Testing email notifications!",
    "location": "Conference Room A",
    "startDate": "2026-08-15T14:00:00",
    "endDate": "2026-08-15T17:00:00",
    "capacity": 100
  }'
Write-Host "Created event: $($event.id)"

# Publish event (sends email to organizer)
Invoke-RestMethod -Uri "http://localhost:8080/api/events/$($event.id)/publish" `
  -Method POST -Headers @{ Authorization = "Bearer $token" }
Write-Host "Event published!"

# Register (sends confirmation email)
Invoke-RestMethod -Uri "http://localhost:8080/api/events/$($event.id)/register" `
  -Method POST -Headers @{ Authorization = "Bearer $token" }
Write-Host "Registered for event!"

# 5. Check Go worker logs for email sending output
# 6. Verify receipt of emails in Mailhog's test inbox at http://localhost:8025 in your browser:
'''
You should see 2 emails:

"📢 Your Event is Live: Email Test Event" - Sent when event was published
"🎉 Registration Confirmed: Email Test Event" - Sent when you registered

Click on an email to see the beautiful HTML template!
'''

# 7. DLQ Testing:

docker-compose stop mailhog

# Create and publish another event
$event2 = Invoke-RestMethod -Uri "http://localhost:8080/api/events" `
  -Method POST -ContentType "application/json" `
  -Headers @{ Authorization = "Bearer $token" } `
  -Body '{
    "title": "DLQ Test Event",
    "description": "Testing DLQ",
    "location": "Test",
    "startDate": "2026-09-01T10:00:00",
    "endDate": "2026-09-01T12:00:00",
    "capacity": 50
  }'

Invoke-RestMethod -Uri "http://localhost:8080/api/events/$($event2.id)/publish" `
  -Method POST -Headers @{ Authorization = "Bearer $token" }

# Check Notification Worker logs for retry attempts and DLQ routing:
'''
2026/02/13 20:29:41 consumer.go:135: ─────────────────────────────────────────
2026/02/13 20:29:41 consumer.go:136: 📬 Message received (routing key: event.published)
2026/02/13 20:29:41 handler.go:32: 📨 Received event: EVENT_PUBLISHED (eventId: 6)
2026/02/13 20:29:41 handler.go:131: 📢 EVENT PUBLISHED
2026/02/13 20:29:41 handler.go:132:    🎫 Event: DLQ Test Event   
2026/02/13 20:29:41 handler.go:133:    📍 Location: Test
2026/02/13 20:29:41 handler.go:134:    👤 Organizer: Admin User (admin@emconnect.com)
2026/02/13 20:29:41 email.go:229: ⚠️ Email send failed (attempt 1//3): SMTP error: dial tcp [::1]:1025: connectex: No connection could be made because the target machine actively refused it.
2026/02/13 20:29:41 email.go:233: ⏳ Waiting 1s before retry...   
2026/02/13 20:29:42 email.go:229: ⚠️ Email send failed (attempt 2//3): SMTP error: dial tcp [::1]:1025: connectex: No connection could be made because the target machine actively refused it.
2026/02/13 20:29:42 email.go:233: ⏳ Waiting 2s before retry...
2026/02/13 20:29:44 email.go:229: ⚠️ Email send failed (attempt 3//3): SMTP error: dial tcp [::1]:1025: connectex: No connection could be made because the target machine actively refused it.
2026/02/13 20:29:44 consumer.go:142: ❌ Error processing message: failed to send email: failed to send email after 3 attempts: SMTP error: dial tcp [::1]:1025: connectex: No connection could be made because the target machine actively refused it.
2026/02/13 20:29:44 consumer.go:184: 📭 Message sent to Dead Letter Queue
2026/02/13 20:31:07 consumer.go:135: ─────────────────────────────────────────
'''
```

## Phase 6 Notes

### 6.1: Ticket Worker Service:

- The Ticket Worker is responsible for generating and managing tickets when a user registers for an event. It listens to the `registration.confirmed` messages from RabbitMQ, creates a unique ticket code, and updates the registration record in the database with this ticket information.

- QR stands for Quick Response code, which is a type of 2D barcode that can store information such as text, URLs, or other data. In our case, we can generate a QR code that encodes the ticket information (e.g., event name, date, ticket code) and include it in the confirmation email sent to the user. This allows users to easily access their ticket details by scanning the QR code with their smartphone.

- Parts of a QR code:
  1. Finder Pattern: The three large squares at the corners that help scanners locate and orient the code.
  2. Alignment Pattern: Smaller square(s) that help correct for distortion when the code is scanned from an angle.
  3. Timing Pattern: The alternating black and white modules that help determine the size of the data matrix.
  4. Data Area: The area where the actual data (e.g., ticket information) is encoded in a pattern of black and white modules.

- In EM Connect, each QR Code encodes:
  - Ticket Code (e.g., TKT-ABC123)
  - Event ID
  - User ID
  - Verification Signature (for security)

- Example:
``` powershell
# QR Code Data:
{
  "ticketCode": "TKT-ABC123",
  "eventId": 5,
  "userId": 10,
  "signature": "HMAC-SHA256(userId + eventId + secretKey)"
}
```

- Why we do QR generation in the worker instead of API:
  1. Offloads CPU-intensive task from API, improving response times for users.
  2. Allows for asynchronous processing, so users can receive confirmation immediately while QR code is generated in the background.
  3. Enables better scalability, as we can run multiple worker instances to handle high registration volumes without impacting API performance.

- Testing:
```powershell
# 1. Start Docker containers and Spring Boot API
docker-compose up -d
cd services\api
$env:JAVA_TOOL_OPTIONS="-Duser.timezone=Asia/Kolkata"; .\mvnw.cmd spring-boot:run 

# 2. Run Go Ticket Worker
cd c:\Users\rohit\Downloads\EM-Connect\services\ticket-worker
go build -o ticket-worker.exe .
.\ticket-worker.exe

# 3. Trigger a registration to generate a ticket and QR code

# Login and get token
$login = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" `
  -Method POST -ContentType "application/json" `
  -Body '{"email":"admin@emconnect.com","password":"password123"}'
$token = $login.token

# Create event
$event = Invoke-RestMethod -Uri "http://localhost:8080/api/events" `
  -Method POST -ContentType "application/json" `
  -Headers @{ Authorization = "Bearer $token" } `
  -Body '{
    "title": "QR Ticket Test",
    "description": "Testing QR code generation!",
    "location": "Main Hall",
    "startDate": "2026-09-10T09:00:00",
    "endDate": "2026-09-10T17:00:00",
    "capacity": 200
  }'
Write-Host "Created event: $($event.id)"

# Publish
Invoke-RestMethod -Uri "http://localhost:8080/api/events/$($event.id)/publish" `
  -Method POST -Headers @{ Authorization = "Bearer $token" }
Write-Host "Event published!"

# Register (this triggers ticket generation!)
$reg = Invoke-RestMethod -Uri "http://localhost:8080/api/events/$($event.id)/register" `
  -Method POST -Headers @{ Authorization = "Bearer $token" }
Write-Host "Registered! Ticket: $($reg.ticketCode)"
```

- **Output** in Ticket Worker logs:
2026/02/14 15:21:03 consumer.go:106: ─────────────────────────────────────────
2026/02/14 15:21:03 consumer.go:107: 📬 Message received (routing key: registration.confirmed)
2026/02/14 15:21:03 handler.go:31: 📨 Received event: REGISTRATION_CONFIRMED (eventId: 7)
2026/02/14 15:21:03 handler.go:48: 🎫 Processing ticket for registration:
2026/02/14 15:21:03 handler.go:49:    👤 User: Admin User (admin@emconnect.com)
2026/02/14 15:21:03 handler.go:50:    📅 Event: QR Ticket Test        
2026/02/14 15:21:03 handler.go:51:    🎟️  Ticket Code: TKT-56E23A9A   
2026/02/14 15:21:03 service.go:41: 🎫 Generating ticket for: TKT-56E23A9A
2026/02/14 15:21:03 service.go:48:    🔏 Payload signed
2026/02/14 15:21:03 generator.go:37: 🎨 Generating QR code for ticket: TKT-56E23A9A
2026/02/14 15:21:03 generator.go:38:    📦 Payload size: 242 bytes    
2026/02/14 15:21:03 generator.go:50:    💾 QR image saved: tickets\qr\TKT-56E23A9A.png (1731 bytes)
2026/02/14 15:21:03 service.go:81:    ✅ Ticket generated successfully!
2026/02/14 15:21:03 service.go:82:    📁 QR Image: tickets\qr\TKT-56E23A9A.png
2026/02/14 15:21:03 service.go:83:    📋 Metadata saved for: TKT-56E23A9A
2026/02/14 15:21:03 consumer.go:123: ✅ Message processed and acknowledged
2026/02/14 15:21:03 consumer.go:106: ─────────────────────────────────────────

- The tickets are generated successfully, QR codes are created and saved to disk(currently to /tickets/qr/ directory) along with metadata(in tickets/metadata). In a real application, we would typically store the QR code in a cloud storage service and save the URL in the database instead of saving to local disk.

### 6.2: Ticket Validation & Retrieval:

- Now that the ticket-worker generates QR codes and saves them to disk, the Spring Boot API needs to:
  1. **Serve** those QR codes to users (retrieve the file from the shared filesystem)
  2. **Validate** tickets at the event entrance (scan the QR code and mark it as used)
  3. **List** a user's tickets with their status and QR readiness

- Shared Filesystem is the simplest approach for local development: Go worker writes QR images to `services/ticket-worker/tickets/qr/`, and Spring Boot reads from the same path using `@Value("${ticket.qr.storage-path}")`. In production, we'd use cloud storage (S3, GCS) instead.

- Spring's `Resource` and `UrlResource` are used to serve files as HTTP responses. `UrlResource` wraps a `Path` on disk and allows Spring to stream the file bytes directly to the client with the right `Content-Type` (e.g., `image/png`).

- Idempotency in ticket validation means scanning the SAME ticket twice doesn't cause an error or double check-in. Instead:
  - First scan → `valid: true`, "Welcome!" (sets `checkedInAt` timestamp)
  - Second scan → `valid: false`, "Already used at: {time}" (reads existing `checkedInAt`)
  - This is critical for real-world check-in systems where staff might accidentally scan a ticket twice, or a user might try to re-enter.

- Validation states as a decision tree:
  1. Ticket not found → INVALID ("Ticket not found")
  2. Registration cancelled → INVALID ("Registration cancelled")
  3. Already checked in (`checkedInAt != null`) → ALREADY USED (idempotent, no error)
  4. Event cancelled → INVALID ("Event cancelled")
  5. All checks pass → SUCCESS (set `checkedInAt = now()`, save to DB)

- Authorization for ticket endpoints:
  - `GET /api/tickets/my` → Any authenticated user (sees only their own tickets)
  - `GET /api/tickets/{code}` → Owner, ADMIN, or event Organizer
  - `GET /api/tickets/{code}/qr` → Owner or ADMIN
  - `POST /api/tickets/{code}/validate` → ADMIN or ORGANIZER only (`@PreAuthorize`)

- The `@Transactional` annotation on `validateTicket()` ensures that the check-in timestamp is written atomically — if anything fails mid-validation, the transaction rolls back and the ticket remains unscanned.

#### Issues Encountered & Fixes:

1. **`NOT_FOUND - no queue 'ticket.queue'`** — Go consumer called `channel.Consume()` without declaring the queue first. If Spring Boot hadn't started yet (or queues were deleted), the queue didn't exist. Fixed by adding `setupQueue()` that declares the exchange, queue, and bindings before consuming. Now Go workers are self-sufficient — no dependency on Spring Boot startup order.

2. **DLQ exchange name mismatch** — Go workers used `em.events.dlq` as the DLQ exchange name, but Spring Boot's `RabbitMQConfig.java` uses `em.events.dlx`. When Go declared the queue with `x-dead-letter-exchange: em.events.dlq`, RabbitMQ rejected Spring Boot's attempt to re-declare it with `em.events.dlx`, silently preventing bindings from being created. Fixed both Go configs to use `em.events.dlx`.

3. **DLQ exchange type mismatch** — Go workers declared the DLQ exchange as `direct`, but Spring Boot declares it as `topic`. RabbitMQ threw `PRECONDITION_FAILED - inequivalent arg 'type'`. Fixed both Go workers to use `topic` type.

4. **Missing queue-to-exchange bindings** — Even after queues existed, messages weren't routing because Go workers only declared queues, not the bindings to `em.events` exchange. Added explicit `QueueBind()` calls: ticket-worker binds to `registration.confirmed`, notification-worker binds to `registration.*` and `event.*`.

5. **Null Pageable in `getMyTickets()`** — `findByUserId(id, null)` could throw NPE. Fixed to use `Pageable.unpaged()`.

- **Key Lesson**: When multiple services declare the same RabbitMQ resources, ALL properties must match exactly (exchange name, exchange type, queue args like `x-dead-letter-exchange`). RabbitMQ treats mismatches as errors and silently prevents topology creation, leading to hard-to-debug "messages not arriving" issues.

#### Testing:

```powershell
# 1. Start Docker containers, Spring Boot API, and both Go workers
docker-compose up -d

cd services\api
$env:JAVA_TOOL_OPTIONS="-Duser.timezone=Asia/Kolkata"; .\mvnw.cmd spring-boot:run

cd c:\Users\rohit\Downloads\EM-Connect\services\ticket-worker
go build -o ticket-worker.exe .
.\ticket-worker.exe

cd c:\Users\rohit\Downloads\EM-Connect\services\notification-worker
go build -o notification-worker.exe .
.\notification-worker.exe

# 2. Login as admin
$login = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" `
  -Method POST -ContentType "application/json" `
  -Body '{"email":"admin@emconnect.com","password":"password123"}'
$token = $login.token

# 3. Create, publish, and register for an event
$event = Invoke-RestMethod -Uri "http://localhost:8080/api/events" `
  -Method POST -ContentType "application/json" `
  -Headers @{ Authorization = "Bearer $token" } `
  -Body '{
    "title": "Go Microservices Workshop",
    "description": "Building event-driven services with Go and RabbitMQ",
    "location": "Bangalore Tech Park",
    "startDate": "2026-04-15T09:00:00",
    "endDate": "2026-04-15T17:00:00",
    "capacity": 50
  }'

Invoke-RestMethod -Uri "http://localhost:8080/api/events/$($event.id)/publish" `
  -Method POST -Headers @{ Authorization = "Bearer $token" }

$reg = Invoke-RestMethod -Uri "http://localhost:8080/api/events/$($event.id)/register" `
  -Method POST -Headers @{ Authorization = "Bearer $token" }
Write-Host "Ticket Code: $($reg.ticketCode)"
# RESULT: TKT-174B170F

# Wait a few seconds for ticket-worker to generate QR code
Start-Sleep -Seconds 3

# 4. Test GET /api/tickets/my — list all tickets for current user
Invoke-RestMethod -Uri "http://localhost:8080/api/tickets/my" `
  -Headers @{ Authorization = "Bearer $token" }
# RESULT: Array of tickets with qrReady: true/false for each

# 5. Test GET /api/tickets/{code} — single ticket details
Invoke-RestMethod -Uri "http://localhost:8080/api/tickets/$($reg.ticketCode)" `
  -Headers @{ Authorization = "Bearer $token" }
# RESULT: Full ticket with event summary, user summary, qrReady: true

# 6. Test GET /api/tickets/{code}/qr — download QR code image
Invoke-WebRequest -Uri "http://localhost:8080/api/tickets/$($reg.ticketCode)/qr" `
  -Headers @{ Authorization = "Bearer $token" } `
  -OutFile "ticket-qr.png"
# RESULT: HTTP 200, Content-Type: image/png, 1678 bytes saved to disk

# 7. Test POST /api/tickets/{code}/validate — first scan (should succeed)
$v1 = Invoke-RestMethod -Uri "http://localhost:8080/api/tickets/$($reg.ticketCode)/validate" `
  -Method POST -Headers @{ Authorization = "Bearer $token" }
Write-Host "First scan - Valid: $($v1.valid), Message: $($v1.message)"
# RESULT: valid: true, "Ticket validated successfully. Welcome!"

# 8. Test second scan — idempotent (should show already used, NOT error)
$v2 = Invoke-RestMethod -Uri "http://localhost:8080/api/tickets/$($reg.ticketCode)/validate" `
  -Method POST -Headers @{ Authorization = "Bearer $token" }
Write-Host "Second scan - Valid: $($v2.valid), Message: $($v2.message)"
# RESULT: valid: false, "Ticket already used. Checked in at: 2026-02-14T16:35:24"

# 9. Test invalid ticket code
try {
    $v3 = Invoke-RestMethod -Uri "http://localhost:8080/api/tickets/INVALID-CODE/validate" `
      -Method POST -Headers @{ Authorization = "Bearer $token" }
    Write-Host "Invalid ticket - Valid: $($v3.valid), Message: $($v3.message)"
} catch {
    Write-Host "Error caught (expected)"
}
# RESULT: valid: false, "Ticket not found. Invalid ticket code."

# 10. Verify checkedInAt persisted
$ticket = Invoke-RestMethod -Uri "http://localhost:8080/api/tickets/$($reg.ticketCode)" `
  -Headers @{ Authorization = "Bearer $token" }
Write-Host "CheckedInAt: $($ticket.checkedInAt)"
# RESULT: checkedInAt: "2026-02-14T16:35:24.009233" (persisted in DB)
```

#### Test Results:

| Endpoint | Test | HTTP Status | Result |
|---|---|---|---|
| `GET /api/tickets/my` | List user's tickets | 200 | 2 tickets returned, qrReady correctly reflects QR file existence |
| `GET /api/tickets/TKT-174B170F` | Single ticket details | 200 | Full ticket with event & user summary |
| `GET /api/tickets/TKT-174B170F/qr` | Download QR image | 200 | PNG image, 1678 bytes, Content-Type: image/png |
| `POST /api/tickets/TKT-174B170F/validate` (1st) | First scan | 200 | `valid: true`, "Welcome!", checkedInAt set |
| `POST /api/tickets/TKT-174B170F/validate` (2nd) | Second scan | 200 | `valid: false`, "Already used" (idempotent!) |
| `POST /api/tickets/INVALID-CODE/validate` | Invalid code | 200 | `valid: false`, "Ticket not found" |

## Phase 7 Notes

### 7.1: WebSocket Hub Service:

- Right now, client always initiates WebSocket connection to Spring Boot API, which is fine for simple use cases. But in a real-world scenario, we might want a dedicated WebSocket Hub service that all clients connect to, and then the API can push messages to the Hub which broadcasts to clients. This decouples WebSocket management from the API and allows for better scalability and flexibility.

- Via this, the connection always stays open and both sides can send messages independently. The API can push real-time updates to clients without waiting for them to poll. Also, there is very low overhead per message(2-14 bytes header).

- **WebSocket Handshake**: It starts as a normal HTTP Request and then upgrades, then the server agrees and responds, then the COnnection is now websocket and the client and server communicate with websocket frames.

- A hub is a central place that manages all WebSocket connections and broadcasts messages to connected clients. It allows for decoupling the WebSocket management from the main API logic, making it handle real-time communication more efficiently.

- GO Approach: Channels to communicate and stay connected simultaneously, and a map to track active connections. When a message is received from RabbitMQ, the hub iterates over all active connections and sends the message to each client.

- **Don't communicate by sharing memory; share memory by communicating.**

- **BRODCASTING PATTERNS**:
  1. **Direct Broadcast**: Hub sends the same message to all connected clients.
  2. **Topic-Based Broadcast**: Clients subscribe to specific topics, and the hub only sends relevant messages to those subscribed.
  3. **User-Specific Broadcast**: Hub sends messages to specific users based on their connection ID or user ID.

- Message TYPES we'll be supporting:
  - **From CLIENT to SERVER:**
    - `subscribe`: Client wants to subscribe to a topic (e.g., event updates)
    - `unsubscribe`: Client wants to unsubscribe from a topic
    - `ping`: Keep-alive message to maintain connection

  - **From SERVER to CLIENT:**
    - `event.published`: Notify clients about a new event
    - `registration.updated`: Notify clients about registration status changes
    - `event.cancelled`: Notify clients about event cancellations
    - `participant.count`: Real-time updates on participant count for an event

- This WebSocket HUB will be on **PORT 8081**, being the 3rd GO Worker alongside Notification and Ticket workers. It will consume messages from RabbitMQ and broadcast to clients.

#### Testing:
```powershell
# 1. Start Docker containers, Spring Boot API, and WebSocket Hub
docker-compose up -d
cd services\api
$env:JAVA_TOOL_OPTIONS="-Duser.timezone=Asia/Kolkata"; 
.\mvnw.cmd spring-boot:run
cd c:\Users\rohit\Downloads\EM-Connect\services\websocket-hub
go build -o websocket-hub.exe .
.\websocket-hub.exe

# 2. Made a simple HTML client(`test.html`) to connect to the WebSocket Hub and log messages.

# 3. Open `test.html` in the browser (http://localhost:8081/test.html) and observe the console logs for messages received from the WebSocket Hub.

# 4. Trigger events from the API (e.g., publish an event, register for an event) and see real-time updates in the browser console:

# Login and get token
$login = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" `
  -Method POST -ContentType "application/json" `
  -Body '{"email":"admin@emconnect.com","password":"password123"}'
$token = $login.token

# Create and publish an event
$event = Invoke-RestMethod -Uri "http://localhost:8080/api/events" `
  -Method POST -ContentType "application/json" `
  -Headers @{ Authorization = "Bearer $token" } `
  -Body '{
    "title": "WebSocket Live Test",
    "description": "Testing real-time updates!",
    "location": "Virtual Room",
    "startDate": "2026-11-01T10:00:00",
    "endDate": "2026-11-01T17:00:00",
    "capacity": 50
  }'
Write-Host "Created event: $($event.id)"

# Publish → ALL connected browser clients should see "event.published"!
Invoke-RestMethod -Uri "http://localhost:8080/api/events/$($event.id)/publish" `
  -Method POST -Headers @{ Authorization = "Bearer $token" }
Write-Host "Published! Check the browser!"

# Now subscribe to this event ID in the browser test page, then:
# Register → clients subscribed to this event ID should see "participant.count"
Invoke-RestMethod -Uri "http://localhost:8080/api/events/$($event.id)/register" `
  -Method POST -Headers @{ Authorization = "Bearer $token" }
Write-Host "Registered! Check the browser for participant update!"

# Check stats
Invoke-RestMethod -Uri "http://localhost:8081/stats"

# 5. Observe the WebSocket Hub logs for connection management and message broadcasting:
'''
2026/02/15 14:37:08 hub.go:60: ✅ Client connected (total: 1)
2026/02/15 14:37:23 hub.go:145: 📌 Client subscribed to 'event:1' (topic subscribers: 1)
2026/02/15 14:38:16 consumer.go:147: ─────────────────────────────────────────
2026/02/15 14:38:16 consumer.go:148: 📬 Message received (routing key: event.published)
2026/02/15 14:38:16 handler.go:29: 📨 Received event: EVENT_PUBLISHED (eventId: 3)
2026/02/15 14:38:16 handler.go:52: 📢 EVENT PUBLISHED → Broadcasting to all clients
2026/02/15 14:38:16 handler.go:53:    🎫 WebSocket Live Test at Virtual Room
2026/02/15 14:38:16 hub.go:98: 📢 Broadcasting to ALL clients (1)     
2026/02/15 14:38:16 consumer.go:164: ✅ Message processed and acknowledged
2026/02/15 14:38:46 consumer.go:147: ─────────────────────────────────────────
2026/02/15 14:40:33 consumer.go:148: 📬 Message received (routing key: registration.confirmed)
2026/02/15 14:40:33 handler.go:29: 📨 Received event: REGISTRATION_CONFIRMED (eventId: 4)
2026/02/15 14:40:33 handler.go:121: ✅ REGISTRATION CONFIRMED → Broadcasting to topic 'event:4'
2026/02/15 14:40:33 handler.go:122:    👤 Admin User registered for WebSocket Live Test 2
2026/02/15 14:40:33 consumer.go:164: ✅ Message processed and acknowledged
2026/02/15 14:40:33 hub.go:116: 📢 Broadcasting to topic "event:4" (1 subscribers)
```


### 7.2: Live Updates Integration:

- Whats missing in the current implementation:

  1. Problem: Client Reconnection Logic is missing in the test.html client. If the WebSocket connection drops (e.g., server restarts, network issues, client sleeps or firewall timeout), the client won't automatically reconnect. We need to implement an exponential backoff reconnection strategy in the JavaScript client to ensure it can recover from temporary disconnections.

  2. Participant Count Updates: The current implementation doesn't send real-time participant count updates when users register or cancel. We need to add logic in the API to publish participant count messages to RabbitMQ whenever a registration is confirmed or cancelled, and then have the WebSocket Hub broadcast those updates to subscribed clients.

- Reconnection strategies:
  1. Simple Retry — Try to reconnect immediately.
  2. Fixed Interval — Try to reconnect every X seconds.
  3. Exponential Backoff(WHAT WE'LL BE USING) — Increase the interval exponentially (1s → 2s → 4s → 8s → 16s → 30s (cap)) to reduce load during outages. 

- NOTE: After reconnecting, the client must RE-SUBSCRIBE to the topics it was previously subscribed to, since the WebSocket Hub doesn't maintain any state about disconnected clients.

- Also add jitter to the reconnection attempts to avoid thundering herd problem if many clients try to reconnect at the same time.

#### Testing:

```powershell
# ========== SETUP ==========
# Ensure Docker containers are running
docker-compose up -d

# Terminal 1: Start Spring Boot API
cd services\api
$env:JAVA_TOOL_OPTIONS="-Duser.timezone=Asia/Kolkata"; .\mvnw.cmd spring-boot:run

# Terminal 2: Build & Start WebSocket Hub
cd services\websocket-hub
go build -o websocket-hub.exe .
.\websocket-hub.exe

# Open test.html dashboard in browser: http://localhost:8081/test.html
# Dashboard auto-connects with green status indicator

# ========== TEST 1: Event Published Broadcast (with capacity) ==========
# Login as admin
$login = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" `
  -Method POST -ContentType "application/json" `
  -Body '{"email":"admin@emconnect.com","password":"password123"}'
$token = $login.token

# Create & publish event
$event = Invoke-RestMethod -Uri "http://localhost:8080/api/events" `
  -Method POST -ContentType "application/json" `
  -Headers @{Authorization="Bearer $token"} `
  -Body '{"title":"Live Count Test","description":"Testing live participant counts via WebSocket","location":"Conference Hall A","startDate":"2026-12-01T10:00:00","endDate":"2026-12-01T18:00:00","capacity":100}'
Write-Host "Created event: $($event.id)"
# → Created event: 5

Invoke-RestMethod -Uri "http://localhost:8080/api/events/$($event.id)/publish" `
  -Method POST -Headers @{Authorization="Bearer $token"}
# → Status: PUBLISHED, Capacity: 100

# WebSocket Hub log:
# 📨 Received event: EVENT_PUBLISHED (eventId: 5)
# 📢 EVENT PUBLISHED → Broadcasting to all clients
#    🎫 Live Count Test at Conference Hall A
# 📢 Broadcasting to ALL clients (1)
# Dashboard: Green "EVENT PUBLISHED" message with capacity ✅

# ========== TEST 2: Registration → Participant Count Broadcast ==========
# Subscribe to event 5 in the dashboard first!

# Register a test user
Invoke-RestMethod -Uri "http://localhost:8080/api/auth/register" `
  -Method POST -ContentType "application/json" `
  -Body '{"name":"WS Test User","email":"wstest@test.com","password":"password123"}'

$userLogin = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" `
  -Method POST -ContentType "application/json" `
  -Body '{"email":"wstest@test.com","password":"password123"}'
$userToken = $userLogin.token

# Register for the event
$reg = Invoke-RestMethod -Uri "http://localhost:8080/api/events/$($event.id)/register" `
  -Method POST -Headers @{Authorization="Bearer $userToken"}
Write-Host "Registered: ID=$($reg.id), TicketCode=$($reg.ticketCode)"
# → Registration: ID=5, Status=CONFIRMED, TicketCode=TKT-385FEB10

# WebSocket Hub log:
# 📨 Received event: REGISTRATION_CONFIRMED (eventId: 5)
# ✅ REGISTRATION CONFIRMED → Broadcasting to topic 'event:5'
#    👤 WS Test User registered for Live Count Test (participants: 1)
# 📢 Broadcasting to topic 'event:5' (1 subscribers)
# Dashboard: Blue "participant.count" message, count card shows 1 ✅

# ========== TEST 3: Participant Count REST Endpoint ==========
$count = Invoke-RestMethod -Uri "http://localhost:8080/api/events/$($event.id)/participants/count" `
  -Headers @{Authorization="Bearer $token"}
Write-Host "eventId=$($count.eventId), title=$($count.eventTitle), count=$($count.participantCount), capacity=$($count.capacity)"
# → eventId=5, title=Live Count Test, count=1, capacity=100 ✅

# ========== TEST 4: Registration Cancellation → Count Decrements ==========
$myRegs = Invoke-RestMethod -Uri "http://localhost:8080/api/registrations/my-registrations?page=0&size=10" `
  -Headers @{Authorization="Bearer $userToken"}
$regId = $myRegs.content[0].id

$cancelled = Invoke-RestMethod -Uri "http://localhost:8080/api/registrations/$regId/cancel" `
  -Method POST -Headers @{Authorization="Bearer $userToken"}
Write-Host "Cancelled: ID=$($cancelled.id), Status=$($cancelled.status)"
# → Cancelled: ID=5, Status=CANCELLED

# WebSocket Hub log:
# 📨 Received event: REGISTRATION_CANCELLED (eventId: 5)
# ❌ REGISTRATION CANCELLED → Broadcasting to topic 'event:5'
#    👤 WS Test User cancelled from Live Count Test (participants: 0)
# 📢 Broadcasting to topic 'event:5' (1 subscribers)
# Dashboard: Count card drops to 0 ✅

# Verify via REST:
$count2 = Invoke-RestMethod -Uri "http://localhost:8080/api/events/$($event.id)/participants/count" `
  -Headers @{Authorization="Bearer $token"}
Write-Host "After cancel - count=$($count2.participantCount)"
# → After cancel - count=0 ✅

# ========== TEST 5: Event Cancellation Broadcast (with affectedRegistrations) ==========
# Create new event, publish, register, then cancel event
$ev2 = Invoke-RestMethod -Uri "http://localhost:8080/api/events" `
  -Method POST -ContentType "application/json" `
  -Headers @{Authorization="Bearer $token"} `
  -Body '{"title":"Cancel Test Event","description":"Testing event cancellation","location":"Room B","startDate":"2026-12-05T09:00:00","endDate":"2026-12-05T17:00:00","capacity":50}'
Invoke-RestMethod -Uri "http://localhost:8080/api/events/$($ev2.id)/publish" `
  -Method POST -Headers @{Authorization="Bearer $token"} | Out-Null
Invoke-RestMethod -Uri "http://localhost:8080/api/events/$($ev2.id)/register" `
  -Method POST -Headers @{Authorization="Bearer $userToken"} | Out-Null

# Cancel the event
Invoke-RestMethod -Uri "http://localhost:8080/api/events/$($ev2.id)/cancel" `
  -Method POST -Headers @{Authorization="Bearer $token"}
# → Status=CANCELLED

# WebSocket Hub log:
# 📨 Received event: EVENT_CANCELLED (eventId: 6)
# 🚫 EVENT CANCELLED → Broadcasting to all + topic subscribers
#    🎫 Cancel Test Event
# 📢 Broadcasting to ALL clients (1)
# Dashboard: Red "EVENT CANCELLED" message ✅

# ========== TEST 6: Stats Endpoint ==========
Invoke-RestMethod -Uri "http://localhost:8081/stats" | ConvertTo-Json
# → {"topics": {"event:5": 1}, "totalClients": 1} ✅

# ========== TEST 7: Reconnection with Exponential Backoff ==========
# 1. Stop websocket-hub.exe (Ctrl+C)
# 2. Dashboard turns red: "Disconnected — reconnecting in 1.0s"
# 3. Each failed attempt increases delay: 1s → 2s → 4s → 8s → ... → 30s cap (with ±20% jitter)
# 4. Restart: .\websocket-hub.exe
# 5. Dashboard auto-reconnects (green), auto re-subscribes to all topics ✅
```

**Summary of all tests:**

| Test | Feature | Result |
|------|---------|--------|
| 1 | Event published broadcast includes `capacity` | ✅ Passed |
| 2 | Registration → `participant.count` with live `currentParticipants` count | ✅ Passed |
| 3 | `GET /api/events/{id}/participants/count` REST endpoint | ✅ Passed |
| 4 | Registration cancel → count decrements to 0 | ✅ Passed |
| 5 | Event cancelled broadcast includes `affectedRegistrations` | ✅ Passed |
| 6 | WebSocket Hub `/stats` endpoint | ✅ Passed |
| 7 | Dashboard reconnection with exponential backoff + auto re-subscribe | ✅ Passed |

**What the dashboard looks like after tests:**
![WebSocket Dashboard](services/websocket-hub/websocket-dashboard-7.2result.png)


## Phase 8 Notes

### 8.1: Basic React Setup

**Stack:** Vite 6.x + React 19 + React Router 7 + Tailwind CSS 4 + Lucide React icons

**Design System:** Bauhaus-inspired theme
- **Colors:** Background `#F0F0F0`, Foreground `#121212`, Red `#D02020`, Blue `#1040C0`, Yellow `#F0C020`
- **Font:** Outfit (Google Fonts) — weights 400, 500, 700, 900
- **Borders:** Thick (2–4px), always `#121212`, no rounded corners (except circles)
- **Shadows:** Hard offset only (`shadow-[Xpx_Xpx_0px_0px_#121212]`), button press effect via translate
- **Buttons:** Uppercase, bold, tracking-wider, press animation (shadow shrinks + translate on hover/active)
- **Cards:** White bg, `border-4 border-[#121212]`, `shadow-[8px_8px_0px_0px_#121212]`, geometric corner decorations

**Project structure:**
```
frontend/
  index.html          — Entry HTML with Outfit font from Google Fonts
  package.json        — Dependencies: react, react-dom, react-router-dom, lucide-react, tailwindcss, vite
  vite.config.js      — Vite config with React plugin, Tailwind plugin, API proxy to :8080
  src/
    main.jsx          — React root: BrowserRouter + AuthProvider + App
    App.jsx           — Route definitions (login, register, dashboard, catch-all → login)
    index.css         — Tailwind import + Bauhaus design tokens (@theme) + utility classes + spinner
    context/
      AuthContext.jsx — Auth state (user, loading, error), login/register/logout, useAuth hook
    services/
      api.js          — Fetch wrapper with JWT injection, 401 auto-redirect, login/register/logout helpers
    components/
      ProtectedRoute.jsx — Redirects to /login if not authenticated
    pages/
      Login.jsx       — Bauhaus-styled login form with split-panel layout (decorative left, form right)
      Register.jsx    — Bauhaus-styled register form with split-panel (form left, decorative right)
      Dashboard.jsx   — Navbar + welcome banner + stat cards + placeholder cards for future phases
```

**Key implementation details:**

1. **Auth flow:** `AuthContext` wraps the entire app. `login(email, password)` and `register(email, password, name)` call API, store token + user in localStorage, update React state.

2. **API response shape (actual from Java backend):**
   ```json
   {
     "message": "Login successful",
     "user": { "id": 1, "email": "...", "name": "...", "role": "ADMIN", "createdAt": "..." },
     "token": "eyJ..."
   }
   ```
   Note: This differs from API.md which shows flat `{token, email, name, role}`. The `api.js` service handles the nested `data.user` structure.

3. **Vite proxy config:** `/api` → `http://localhost:8080` (changeOrigin: true). This means the frontend dev server proxies all `/api/*` requests to the Spring Boot backend.

4. **ProtectedRoute:** Simple wrapper that checks `useAuth().isAuthenticated` and redirects to `/login` if false.

5. **401 handling:** The `api.js` fetch wrapper auto-clears localStorage and redirects to `/login` on 401 responses.

6. **Tailwind CSS 4:** Uses new `@import "tailwindcss"` syntax and `@theme` directive for design tokens instead of `tailwind.config.js`.

**Commands:**
```powershell
# Dev server (from frontend directory)
Set-Location c:\Users\rohit\Downloads\EM-Connect\frontend
node node_modules/vite/bin/vite.js --port 3000
# → Runs on http://localhost:3000 with proxy to :8080

# Production build
npx vite build
# → Output: dist/ folder (~258KB JS + ~20KB CSS gzipped to ~79KB + ~5KB)
```

**Testing results:**
```powershell
# Backend health
Invoke-RestMethod -Uri "http://localhost:8080/api/health"
# → { status: "UP", service: "emconnect-api" }

# Login through Vite proxy
$body = '{"email":"admin@emconnect.com","password":"password123"}'
$resp = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" `
  -Method POST -ContentType "application/json" `
  -Body ([System.Text.Encoding]::UTF8.GetBytes($body))
$resp | ConvertTo-Json -Depth 3
# → { message: "Login successful", user: { id: 1, email: "admin@emconnect.com", name: "Admin User", role: "ADMIN" }, token: "eyJ..." }

# Register through Vite proxy
$body = '{"email":"test8_1@emconnect.com","password":"password123","name":"Phase 8.1 Test"}'
$resp = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/register" `
  -Method POST -ContentType "application/json" `
  -Body ([System.Text.Encoding]::UTF8.GetBytes($body))
$resp | ConvertTo-Json -Depth 3
# → { message: "Registration successful", user: { id: 3, email: "test8_1@emconnect.com", name: "Phase 8.1 Test", role: "USER" }, token: "eyJ..." }

# Build check
npx vite build
# → ✓ 1647 modules transformed, dist/index.html + JS + CSS generated, built in ~7s
```

| Test | Result |
|------|--------|
| `npm install` | ✅ All deps installed |
| `npx vite build` | ✅ Production build succeeds (~258KB JS, ~20KB CSS) |
| Vite dev server on :3000 | ✅ Running with HMR |
| API proxy `/api` → `:8080` | ✅ Login/register work through proxy |
| Login page renders with Bauhaus styling | ✅ Split-panel layout, geometric shapes, thick borders |
| Register page renders | ✅ Mirrored layout, blue accent, form validation |
| Dashboard renders after login | ✅ Navbar, welcome banner, stat cards, coming-soon placeholders |
| ProtectedRoute redirects to /login | ✅ Unauthenticated access to /dashboard redirects |
| 401 auto-redirect | ✅ api.js clears token and navigates to /login |

**NOTE:** When using PowerShell with `Invoke-RestMethod`, always use `[System.Text.Encoding]::UTF8.GetBytes($body)` for the `-Body` parameter to avoid JSON encoding issues. The default PowerShell string encoding can corrupt JSON double-quotes.

#### 8.1.1: UI/UX Overhaul — Function-First Redesign

**Problem:** Initial implementation prioritized decorative composition over usability:
- Giant geometric shapes (circles, squares, grid lines) in decorative panels competed with forms and CTAs
- Inputs felt cramped — thick dark borders + gray backgrounds + oversized icons overlapping text
- No visible loading, error, focus, disabled, or validation states
- Dashboard had clipped text (corner accent positioning caused `ml-10` text offset), empty space, and a floating unanchored role badge
- No clear CTA hierarchy — "Sign In" and "Create Account" both styled as equal-weight buttons
- TW4 `@theme` hex tokens don't support `/opacity` modifiers (e.g., `text-bauhaus-fg/50` fails silently)

**Design Principles Applied:**
1. **Function > Decoration**: Forms are the HERO element. Decorative shapes reduced to ghosted outlines (`opacity-[0.07]`) and small peripheral accents (`w-10 h-10`), NOT giant competing shapes
2. **Generous Spacing**: `py-3.5` inputs, `p-8 sm:p-10` card padding, `space-y-5` form gaps, `mb-8` between header and form
3. **Input Field Design**: Icons 18px (`w-[18px]`), gray (`text-[#9CA3AF]`), `pointer-events-none`, positioned at `left-4`. Text at `pl-12` — 14px gap between icon end and text start. White background. Focus: `focus:border-[#1040C0] focus:shadow-[0_0_0_3px_rgba(16,64,192,0.12)]`
4. **CTA Hierarchy**: ONE primary button (full-width, colored, shadow-offset). Secondary action is inline text link with arrow icon
5. **State Coverage**: Loading spinner in buttons, disabled inputs + button during load, error banners with `border-l-4` accent, inline validation on blur, password strength meter (4-bar indicator), confirm-password match icon (green check / red X)
6. **Dashboard Layout**: `min-h-screen flex flex-col` with `flex-1` on `<main>`. Stats use top-border accent (no overlapping corners). Feature cards use `h-1` top accent bar + title + phase badge. Footer with color stripe fills remaining space
7. **Accessibility**: `focus-visible` outlines on links/buttons, `htmlFor`/`id` on all inputs, `aria-label` on dismiss buttons, proper placeholder contrast (`#9CA3AF` vs input text `#121212`)

**Files Changed:**
- `index.css` — Removed unused `.bauhaus-corner`, `.bauhaus-stripe` classes. Fixed `.bauhaus-spinner` (was 40px, now 18px inline). Added `focus-visible` states, font smoothing, input line-height. Removed `input:focus` box-shadow rule (now handled per-component).
- `Login.jsx` — Brand panel 40% width with ghosted outlines. Form card 480px max, `border-[3px]`. Inline email validation on blur. "Forgot password?" hint. Submit as sole CTA. "Create one →" text link.
- `Register.jsx` — Same form-first layout. Password strength meter (Weak/Fair/Good/Strong with colored 4-bar display). Confirm password match indicator (✓/✗ icon). Inline validation for all fields. Terms notice. `getInputBorder()` helper for error vs normal border.
- `Dashboard.jsx` — Navbar lighter (h-14). Welcome banner without decorative shapes. Role tag in banner. Stats with top-border accent bars. Feature cards with `phase` badge + "Coming Soon" muted. Footer with color stripe. No floating badge.

**Key Learnings:**
- In TW4, `@theme` color tokens defined as hex (`#121212`) CANNOT use opacity modifiers (`text-bauhaus-fg/50`). Use direct hex + separate opacity utilities, or use `oklch()` format tokens.
- Corner accent decorations (`absolute top-0 left-0` + `ml-10` content offset) are fragile — text clips if card width is constrained. Use `h-1` top-border accents or `border-l-4` left accents instead.
- For icon integration in inputs: icons should be MUTED color (`#9CA3AF`), slightly SMALLER than default (`18px` not `20px`), and `pointer-events-none`. This prevents visual competition with input text.
- Always use `disabled:pointer-events-none` on buttons (not just `disabled:cursor-not-allowed`) to prevent hover transform effects during loading.
- Build output: 21.7KB CSS, 261KB JS (vs previous 23KB CSS, 257KB JS). Slightly larger JS from password strength + validation logic.


### 8.2 Event Listing, Detail, Registration Flow & My Registrations

**Scope**: Public event browsing, event detail view, registration/cancellation flow, user registration history.

**Files Created**:
| File | Purpose |
|------|---------|
| `frontend/src/components/AppLayout.jsx` | Shared layout — navbar with auth-aware links, Bauhaus footer, viewport-locked flex column |
| `frontend/src/pages/EventList.jsx` | Public paginated event listing with search, status badges, capacity display |
| `frontend/src/pages/EventDetail.jsx` | Full event detail with registration status check, register/cancel buttons, ticket display |
| `frontend/src/pages/MyRegistrations.jsx` | User's registrations with status filters, cancel action, pagination, ticket codes |

**Files Modified**:
| File | Changes |
|------|---------|
| `frontend/src/services/api.js` | Added: `getPublishedEvents()`, `getEvent()`, `getRegistrationStatus()`, `registerForEvent()`, `cancelRegistration()`, `getMyRegistrations()` |
| `frontend/src/App.jsx` | Added routes: `/events`, `/events/:id` (public), `/my-registrations` (protected). All dashboard routes use `<AppLayout>` |
| `frontend/src/pages/Dashboard.jsx` | Refactored to use `<AppLayout>`, updated feature cards to link to `/events` and `/my-registrations` |

**API Endpoints Used**:
| Method | Endpoint | Auth | Page |
|--------|----------|------|------|
| GET | `/api/events/published?page=&size=&search=` | No | EventList |
| GET | `/api/events/{id}` | No | EventDetail |
| GET | `/api/registrations/events/{eventId}/status` | Yes | EventDetail |
| GET | `/api/registrations/my-registrations?page=&size=` | Yes | MyRegistrations |
| POST | `/api/registrations/events/{eventId}` | Yes | EventDetail |
| POST | `/api/registrations/{id}/cancel` | Yes | EventDetail, MyRegistrations |

**Testing Results**:
| Test | Result |
|------|--------|
| Event listing loads published events | ✅ |
| Search filters events | ✅ |
| Pagination works | ✅ |
| Event detail shows full info | ✅ |
| Unauthenticated user sees "Sign in" prompt | ✅ |
| Authenticated user can register | ✅ |
| Registration shows success + ticket code | ✅ |
| Cancel registration works | ✅ |
| My Registrations lists all registrations | ✅ |
| Active Only filter works | ✅ |
| Cancel from My Registrations works | ✅ |
| Navigation links work correctly | ✅ |
| Protected routes redirect to login | ✅ |
| Build succeeds with no errors | ✅ (1651 modules, 260KB JS, 19KB CSS) |

---

#### 8.2.1: Bug Fixes — Public Access, QR Tickets, Search

**Three bugs identified and fixed after 8.2 completion:**

##### Fix 1: Events page redirected to login (should be public)
**Root cause:** Three issues compounding:
1. `App.jsx` wrapped `/events` and `/events/:id` routes in `<ProtectedRoute>`, forcing login
2. `api.js` 401 handler redirected to `/login` on ALL 401 responses — even unauthenticated users hitting public endpoints that don't need auth
3. `AppLayout.jsx` only showed nav items for logged-in users — no way for anonymous users to browse

**Fix:**
- Removed `<ProtectedRoute>` wrapper from `/events` and `/events/:id` routes in `App.jsx`
- Changed 401 handler in `api.js` to only redirect if user had a token: `if (response.status === 401 && token)`
- Split `AppLayout` nav into `PUBLIC_NAV` (Events only) and `AUTH_NAV` (Dashboard, Events, My Registrations)
- Added Login button for unauthenticated users in navbar (blue button with LogIn icon)
- Updated `EventDetail.jsx` to check `isAuthenticated` before calling registration-status APIs; shows "Sign in to register" for anonymous users

##### Fix 2: QR codes not visible anywhere
**Root cause:** Backend generates QR codes via ticket-worker and serves them at `GET /api/tickets/{code}/qr`, but frontend never displayed them.

**Fix — EventDetail.jsx:**
- Added `showTicket` state and "View Ticket" button next to ticket code for registered users
- Created `TicketModal` component: shows event name, ticket code, QR image (fetched from `/api/tickets/{code}/qr`), loading/error/generating states, download button (uses blob + createObjectURL)

**Fix — MyRegistrations.jsx:**
- Added `ticketModal` state and `onViewTicket` callback passed to `RegistrationRow`
- Added "Ticket" button (with QrCode icon) in registration row actions for CONFIRMED registrations
- Created `TicketModal` component (same pattern as EventDetail's) with QR fetch, download, loading states

**QR code flow:** Register → RabbitMQ `REGISTRATION_CONFIRMED` event → `ticket-worker` (Go) generates QR PNG at `./tickets/qr/{CODE}.png` + metadata JSON at `./tickets/metadata/{CODE}.json` → API serves via `GET /api/tickets/{code}/qr` (requires auth: owner or admin)

##### Fix 3: Search bar not working
**Root cause:** `EventList.jsx` used `getEvents()` for default listing (which hits `/api/events` — returns ALL events including DRAFT) and only called `searchEvents()` on form submit. The backend search endpoint (`/api/events/search?keyword=`) already supports partial matching with case-insensitive `%keyword%` LIKE on PUBLISHED events only.

**Fix:**
- Changed to always use `searchEvents()` — empty keyword returns all published events
- Added debounced live-search (400ms) with `useRef` timeout — no submit button needed
- Added X clear button to reset search
- Removed old `getEvents` import (no longer needed)

**Build:** ✅ 1651 modules, no errors

---

### 8.3: Real-Time UI — WebSocket Integration

**What was built:**
1. **WebSocket connection** to the Go WebSocket hub (`ws://localhost:8081/ws` via Vite proxy)
2. **Live participant counts** on EventDetail page — updates instantly when anyone registers/cancels
3. **Real-time announcements** as toast notifications — event published / event cancelled

**Files Created:**
| File | Purpose |
|------|---------|
| `frontend/src/context/WebSocketContext.jsx` | WebSocket provider: connection management, auto-reconnect with exponential backoff, subscribe/unsubscribe to event topics, message listener API |
| `frontend/src/context/ToastContext.jsx` | Toast notification system: auto-dismiss after 6-10s, slide-in animation, published (green) / cancelled (red) styling |
| `frontend/src/components/LiveAnnouncements.jsx` | Headless component bridging WebSocket `event.published` and `event.cancelled` messages to toast notifications |

**Files Modified:**
| File | Changes |
|------|---------|
| `vite.config.js` | Added `/ws` proxy to `ws://localhost:8081` |
| `main.jsx` | Wrapped app with `<WebSocketProvider>` and `<ToastProvider>` |
| `App.jsx` | Added `<LiveAnnouncements />` component for global event announcements |
| `AppLayout.jsx` | Added "LIVE" indicator (green pulsing dot + text) next to brand when WebSocket is connected |
| `EventDetail.jsx` | Subscribes to event topic via `subscribe(eventId)`, listens for `participant.count` messages, updates capacity bar + shows live activity banner ("✅ UserName just registered"), unsubscribes on unmount |
| `index.css` | Added `animate-slide-in` (toast entrance) and `animate-live-pulse` (live indicator) keyframe animations |

**WebSocket Protocol (Go Hub ↔ Browser):**

Client → Server messages:
```json
{ "type": "subscribe", "payload": { "eventId": 5 } }
{ "type": "unsubscribe", "payload": { "eventId": 5 } }
{ "type": "ping" }
```

Server → Client messages:
```json
// On connect (to individual client)
{ "type": "connected", "payload": { "message": "Connected to EM-Connect WebSocket Hub", "totalClients": 3 } }

// Global broadcast (all clients)
{ "type": "event.published", "payload": { "eventId": 5, "eventTitle": "...", "eventType": "EVENT_PUBLISHED", "location": "...", "startDate": "...", "organizerName": "...", "capacity": 100 } }
{ "type": "event.cancelled", "payload": { "eventId": 5, "eventTitle": "...", "eventType": "EVENT_CANCELLED", "affectedRegistrations": 12 } }

// Topic broadcast (only clients subscribed to event:N)
{ "type": "participant.count", "payload": { "eventId": 5, "eventTitle": "...", "count": 42, "action": "registered", "userName": "John Doe" } }
```

**Architecture:**
```
Browser ──WebSocket──→ Vite proxy (:3000/ws) ──→ WebSocket Hub (:8081/ws)
                                                       ↑
                                                  RabbitMQ consumer
                                                       ↑
Spring Boot API → RabbitMQ (REGISTRATION_CONFIRMED / EVENT_PUBLISHED / EVENT_CANCELLED)
```

**Auto-reconnect:** Exponential backoff starting at 1s, max 30s. Re-subscribes to all active topics on reconnect.

**Keep-alive:** Sends `ping` every 30s. Hub has 60s pong timeout.

**Testing Instructions:**

1. **Start all services:**
```powershell
# 1. Docker (PostgreSQL + RabbitMQ)
docker-compose up -d

# 2. Spring Boot API (from services/api/)
$env:JAVA_TOOL_OPTIONS="-Duser.timezone=Asia/Kolkata"
.\mvnw spring-boot:run

# 3. WebSocket Hub (from services/websocket-hub/)
go run .

# 4. Ticket Worker (from services/ticket-worker/)
go run .

# 5. Notification Worker (from services/notification-worker/)
go run .

# 6. Frontend (from frontend/)
node node_modules/vite/bin/vite.js --port 3000
```

2. **Test live participant counts:**
   - Open `http://localhost:3000/events/{id}` in Browser A (logged in as User A)
   - Open same URL in Browser B (logged in as User B)
   - Register in Browser A → Browser B sees the capacity bar update live + activity banner
   - Cancel in Browser A → Browser B sees count decrease + activity banner

3. **Test real-time announcements:**
   - Open any page in multiple browser tabs
   - Publish an event via admin API:
     ```powershell
     $token = (Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" -Method POST -ContentType "application/json" -Body ([System.Text.Encoding]::UTF8.GetBytes('{"email":"admin@emconnect.com","password":"password123"}'))).token
     Invoke-RestMethod -Uri "http://localhost:8080/api/events/{id}/publish" -Method PUT -Headers @{ Authorization = "Bearer $token" }
     ```
   - All tabs should show a green toast: "New Event Published — {title} — {location}"
   - Cancel an event → all tabs show red toast: "Event Cancelled — {title} has been cancelled."

4. **Test WebSocket reconnection:**
   - Open frontend with DevTools network tab
   - Stop the WebSocket hub service
   - Observe reconnection attempts (exponential backoff)
   - Restart the hub → "LIVE" indicator should reappear, subscriptions should be re-established

**Build:** ✅ 1654 modules, 300KB JS (gzip: 88KB), 28KB CSS (gzip: 6KB)





## FUTURE PHASES (9 & 10)
<!-- ## Phase 9 Notes


## Phase 10 Notes -->