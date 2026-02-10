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






## Phase 6 Notes


## Phase 7 Notes


## Phase 8 Notes


## Phase 9 Notes


## Phase 10 Notes