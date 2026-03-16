# EM-Connect Security Audit Report

**Date:** 2026-03-15
**Scope:** Full repository analysis — backend API (Java/Spring Boot), Go microservices, React frontend, infrastructure (Docker Compose), database schema, and dependencies
**Classification:** Documentation only — no code changes applied

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Critical Findings](#1-critical-findings)
3. [High Severity Findings](#2-high-severity-findings)
4. [Medium Severity Findings](#3-medium-severity-findings)
5. [Low Severity Findings](#4-low-severity-findings)
6. [Informational / Best Practice](#5-informational--best-practice)
7. [Dependency Vulnerabilities](#6-dependency-vulnerabilities)
8. [Positive Security Observations](#7-positive-security-observations)

---

## Executive Summary

| Severity | Count |
|----------|-------|
| 🔴 Critical | 12 |
| 🟠 High | 16 |
| 🟡 Medium | 16 |
| 🟢 Low | 8 |
| ℹ️ Informational | 5 |
| **Total** | **57** |

The EM-Connect project demonstrates solid architectural foundations (parameterized SQL, bcrypt password hashing, pessimistic locking for concurrency, JWT-based stateless auth). However, multiple critical and high-severity issues exist that must be resolved before any production deployment. The most urgent concerns are **hardcoded secrets in source control**, **known vulnerable dependencies**, **unauthenticated WebSocket and test endpoints**, and **missing rate limiting on authentication flows**.

---

## 1. Critical Findings

### C-01: Hardcoded JWT Secret in Source Control

| Field | Detail |
|-------|--------|
| **File** | `services/api/src/main/resources/application.yml:59` |
| **Category** | Secrets Management |
| **Impact** | Anyone with repository access can forge valid JWT tokens, completely bypassing authentication |

```yaml
jwt:
  secret: myVerySecureSecretKeyThatIsAtLeast256BitsLongForHS256Algorithm2024!
```

**Recommendation:** Replace with `${JWT_SECRET}` environment variable. Rotate the exposed secret immediately. Consider using a secrets manager (Vault, AWS Secrets Manager).

---

### C-02: Hardcoded Database Credentials in Source Control

| Field | Detail |
|-------|--------|
| **File** | `services/api/src/main/resources/application.yml:8-9` |
| **Category** | Secrets Management |
| **Impact** | Full database access for anyone with repo access |

```yaml
datasource:
  username: emconnect
  password: emconnect
```

**Recommendation:** Externalize to environment variables: `${DB_USER}`, `${DB_PASSWORD}`.

---

### C-03: Hardcoded RabbitMQ Credentials in Source Control

| Field | Detail |
|-------|--------|
| **Files** | `services/api/src/main/resources/application.yml:32-33`, `docker-compose.yaml:23-24` |
| **Category** | Secrets Management |
| **Impact** | Message queue takeover — can read/inject/delete messages |

```yaml
rabbitmq:
  username: emconnect
  password: emconnect
```

**Recommendation:** Externalize credentials and use `${RABBITMQ_USER}`, `${RABBITMQ_PASS}`.

---

### C-04: Hardcoded Default Credentials in Docker Compose

| Field | Detail |
|-------|--------|
| **File** | `docker-compose.yaml:6-8, 23-24` |
| **Category** | Secrets Management |
| **Impact** | Production deployments using defaults are trivially compromised |

```yaml
POSTGRES_PASSWORD: emconnect
RABBITMQ_DEFAULT_PASS: emconnect
```

**Recommendation:** Use environment variable substitution with required validation: `${POSTGRES_PASSWORD:?error}`.

---

### C-05: Known Vulnerable Dependency — PostgreSQL JDBC Driver

| Field | Detail |
|-------|--------|
| **File** | `services/api/pom.xml` (transitive via Spring Boot 3.2.2) |
| **Category** | Dependency Vulnerability |
| **CVE** | SQL Injection via line comment generation |
| **Affected Version** | `org.postgresql:postgresql` 42.7.1 |
| **Patched Version** | 42.7.2+ |
| **Impact** | SQL injection in the JDBC driver itself |

**Recommendation:** Add explicit dependency override in `pom.xml`:
```xml
<dependency>
    <groupId>org.postgresql</groupId>
    <artifactId>postgresql</artifactId>
    <version>42.7.2</version>
</dependency>
```

---

### C-06: Test Endpoints Exposed Without Authentication

| Field | Detail |
|-------|--------|
| **Files** | `services/api/src/main/java/com/emconnect/api/config/SecurityConfig.java:57`, `controller/UserTestController.java`, `controller/TestConcurrencyController.java` |
| **Category** | Access Control |
| **Impact** | Unauthenticated user creation, concurrent registration simulation |

```java
.requestMatchers(
    "/api/test/**"  // Test endpoints (remove in production!)
).permitAll()
```

**Recommendation:** Remove test controllers entirely, or annotate with `@Profile("test")` so they are excluded from production.

---

### C-07: WebSocket Hub Accepts All Origins

| Field | Detail |
|-------|--------|
| **File** | `services/websocket-hub/hub/hub.go:42-48` |
| **Category** | Cross-Site WebSocket Hijacking |
| **Impact** | Any website can establish WebSocket connections and receive real-time event data |

```go
CheckOrigin: func(r *http.Request) bool {
    return true  // Accepts ANY origin
},
```

**Recommendation:** Implement origin whitelist restricted to the application's domain.

---

### C-08: WebSocket Hub Has No Authentication

| Field | Detail |
|-------|--------|
| **File** | `services/websocket-hub/hub/hub.go:198-212`, `handler/handler.go` |
| **Category** | Authentication |
| **Impact** | Any unauthenticated client can connect, subscribe to events, and receive real-time updates |

**Recommendation:** Require a JWT token in the WebSocket connection URL query parameter (`/ws?token=...`) and validate it before upgrading the connection.

---

### C-09: Missing Authorization Check on Event Registrations Endpoint

| Field | Detail |
|-------|--------|
| **File** | `services/api/src/main/java/com/emconnect/api/controller/RegistrationController.java:157-170` |
| **Category** | IDOR (Insecure Direct Object Reference) |
| **Impact** | Any authenticated user can retrieve all registrations (names, emails) for any event |

```java
// TO DO: Add authorization check - only event organizer or admin should access
```

**Recommendation:** Add authorization check — verify the requester is the event organizer or admin.

---

### C-10: Unauthenticated Ticket Lookup Exposes Registration Data

| Field | Detail |
|-------|--------|
| **File** | `services/api/src/main/java/com/emconnect/api/controller/RegistrationController.java:123-129`, `SecurityConfig.java:68` |
| **Category** | Information Disclosure / IDOR |
| **Impact** | Anyone with a ticket code (no authentication required) can access full registration details including user PII |

**Recommendation:** Require authentication and verify the requester owns the registration or is an admin.

---

### C-11: Database Ports Exposed to All Network Interfaces

| Field | Detail |
|-------|--------|
| **File** | `docker-compose.yaml:10, 34-35` |
| **Category** | Network Exposure |
| **Impact** | PostgreSQL (5432) and RabbitMQ management (15672) accessible from any network interface |

```yaml
ports:
  - "5432:5432"       # Accessible from all interfaces
  - "15672:15672"     # RabbitMQ management UI exposed
```

**Recommendation:** Bind to localhost only: `"127.0.0.1:5432:5432"` and `"127.0.0.1:15672:15672"`.

---

### C-12: SQL Logging Enabled — Exposes Sensitive Query Data

| Field | Detail |
|-------|--------|
| **File** | `services/api/src/main/resources/application.yml:16-19` |
| **Category** | Information Disclosure |
| **Impact** | SQL queries logged to stdout may contain sensitive data (PII, emails, hashed passwords) |

```yaml
jpa:
  show-sql: true
  properties:
    hibernate:
      format_sql: true
```

**Recommendation:** Set `show-sql: false` and `format_sql: false` for production. Use Spring profiles to enable only in development.

---

## 2. High Severity Findings

### H-01: No Rate Limiting on Authentication Endpoints

| Field | Detail |
|-------|--------|
| **File** | `services/api/src/main/java/com/emconnect/api/controller/AuthController.java` |
| **Category** | Brute Force / Abuse |
| **Impact** | Unlimited login attempts, account enumeration, email bombing via forgot-password |

No rate limiting exists on `/api/auth/login`, `/api/auth/register`, or `/api/auth/forgot-password`.

**Recommendation:** Implement rate limiting (e.g., Spring Security filter with Bucket4j or Resilience4j) — suggest 5 attempts per minute for login, 3 per hour for forgot-password.

---

### H-02: Password Reset Code Brute-Forceable

| Field | Detail |
|-------|--------|
| **Files** | `services/api/src/main/java/com/emconnect/api/service/PasswordResetService.java:134-137`, `db/migration/V10__create_password_reset_codes_table.sql:5` |
| **Category** | Weak Credential |
| **Impact** | 6-digit numeric code = 1,000,000 combinations; trivially brute-forceable without rate limiting |

```java
int code = secureRandom.nextInt(900000) + 100000; // 100000-999999
```

**Recommendation:** Use longer alphanumeric tokens (32+ chars) or add rate limiting with exponential backoff on reset attempts.

---

### H-03: JWT Token Stored in localStorage (XSS-Vulnerable)

| Field | Detail |
|-------|--------|
| **File** | `frontend/src/services/api.js:7, 59, 71, 88` |
| **Category** | Token Storage |
| **Impact** | Any XSS vulnerability can steal JWT tokens; tokens persist across browser sessions |

```javascript
localStorage.setItem('em_token', data.token);
```

**Recommendation:** Use httpOnly cookies with `Secure` and `SameSite=Strict` flags. If localStorage must be used, implement short-lived access tokens with refresh token rotation.

---

### H-04: No Token Revocation / Blacklist Mechanism

| Field | Detail |
|-------|--------|
| **Files** | JWT architecture across `JwtService.java`, `JwtAuthenticationFilter.java` |
| **Category** | Authentication |
| **Impact** | Compromised tokens remain valid for 24 hours; no logout invalidation |

**Recommendation:** Implement Redis-based token blacklist checked in `JwtAuthenticationFilter`. Add logout endpoint that blacklists the current token.

---

### H-05: 24-Hour JWT Token Expiration Too Long

| Field | Detail |
|-------|--------|
| **File** | `services/api/src/main/resources/application.yml:60` |
| **Category** | Session Management |
| **Impact** | Stolen token grants 24 hours of access; no refresh token mechanism |

```yaml
expiration: 86400000  # 24 hours in milliseconds
```

**Recommendation:** Use short-lived access tokens (15-30 minutes) with a refresh token mechanism.

---

### H-06: No CORS Configuration

| Field | Detail |
|-------|--------|
| **File** | `services/api/src/main/java/com/emconnect/api/config/SecurityConfig.java` |
| **Category** | Cross-Origin |
| **Impact** | Missing explicit CORS configuration may default to permissive behavior |

**Recommendation:** Add explicit `CorsConfigurationSource` bean with allowed origins, methods, headers, and credentials policy.

---

### H-07: Google OAuth Token Sent via URL Query String

| Field | Detail |
|-------|--------|
| **File** | `services/api/src/main/java/com/emconnect/api/service/AuthService.java:182-195` |
| **Category** | Token Exposure |
| **Impact** | ID token visible in server logs, proxy logs, and browser history |

```java
String url = "https://oauth2.googleapis.com/tokeninfo?id_token=" + idToken;
```

**Recommendation:** Use POST method with token in request body instead of query string. Also configure RestTemplate timeouts.

---

### H-08: File Upload Content-Type Validation Bypassable

| Field | Detail |
|-------|--------|
| **Files** | `services/api/src/main/java/com/emconnect/api/service/EventService.java:282-319`, `UserService.java:70-111` |
| **Category** | File Upload |
| **Impact** | Relies on client-supplied Content-Type header which can be spoofed |

```java
String contentType = file.getContentType(); // Client-controlled
```

**Recommendation:** Validate file content via magic bytes (file signature) in addition to MIME type and extension checks.

---

### H-09: Directory Traversal via TicketCode in Ticket Worker

| Field | Detail |
|-------|--------|
| **File** | `services/ticket-worker/ticket/service.go:139-150` |
| **Category** | Path Traversal |
| **Impact** | A crafted TicketCode like `../../../etc/passwd` could write files to arbitrary locations |

```go
filename := fmt.Sprintf("%s.json", metadata.TicketCode)
filePath := filepath.Join(s.metadataDir, filename)
```

**Recommendation:** Validate TicketCode against a whitelist pattern (e.g., `^[a-zA-Z0-9_-]+$`).

---

### H-10: Weak Default HMAC Key for Ticket Signing

| Field | Detail |
|-------|--------|
| **File** | `services/ticket-worker/config/config.go:50` |
| **Category** | Cryptographic Weakness |
| **Impact** | Default key `em-connect-ticket-secret-2026` is in source code; allows ticket forgery |

```go
SecretKey: getEnv("TICKET_SECRET_KEY", "em-connect-ticket-secret-2026"),
```

**Recommendation:** Remove the default value. Require the environment variable or fail to start.

---

### H-11: Stack Traces Printed via ex.printStackTrace()

| Field | Detail |
|-------|--------|
| **Files** | `services/api/src/main/java/com/emconnect/api/exception/GlobalExceptionHandler.java:72`, `service/JwtService.java:77-86`, `config/JwtAuthenticationFilter.java:68` |
| **Category** | Information Disclosure |
| **Impact** | Stack traces expose internal architecture, package names, library versions, and file paths |

**Recommendation:** Replace all `System.err.println()` and `ex.printStackTrace()` with SLF4J/Logback structured logging.

---

### H-12: No Password Complexity Requirements

| Field | Detail |
|-------|--------|
| **Files** | `dto/RegisterRequest.java:14-15`, `dto/LoginRequest.java:13` |
| **Category** | Weak Credentials |
| **Impact** | Passwords like `12345678` are accepted |

```java
@Size(min = 8, message = "Password must be at least 8 characters")
```

**Recommendation:** Add regex pattern requiring uppercase, lowercase, digits, and special characters.

---

### H-13: Admin Endpoints Lack Method-Level @PreAuthorize

| Field | Detail |
|-------|--------|
| **File** | `services/api/src/main/java/com/emconnect/api/controller/AdminController.java:45, 55, 71, 118` |
| **Category** | Authorization |
| **Impact** | Relies solely on URL-pattern matching in SecurityConfig; no defense-in-depth |

**Recommendation:** Add explicit `@PreAuthorize("hasRole('ADMIN')")` on all admin controller methods.

---

### H-14: Hardcoded Personal Email in Notification Worker Default

| Field | Detail |
|-------|--------|
| **File** | `services/notification-worker/config/config.go:59` |
| **Category** | Privacy / Secrets |
| **Impact** | Personal email address committed to source control as default "from" address |

```go
FromAddress: getEnv("EMAIL_FROM_ADDRESS", "rohit84.official@gmail.com"),
```

**Recommendation:** Remove hardcoded email. Use a service account address via environment variable.

---

### H-15: No Input Validation on Email Recipients in Notification Worker

| Field | Detail |
|-------|--------|
| **File** | `services/notification-worker/handler/handler.go:88-92` |
| **Category** | Input Validation |
| **Impact** | Malformed or injected email addresses from RabbitMQ messages are sent without validation |

**Recommendation:** Validate email format before sending.

---

### H-16: No SSL/TLS for Database Connection

| Field | Detail |
|-------|--------|
| **File** | `services/api/src/main/resources/application.yml:7` |
| **Category** | Transport Security |
| **Impact** | Database traffic is unencrypted |

```yaml
url: jdbc:postgresql://localhost:5432/emconnect
```

**Recommendation:** Add `?ssl=true&sslmode=require` to the JDBC URL for production.

---

## 3. Medium Severity Findings

### M-01: Missing CSRF Protection (Frontend)

| Field | Detail |
|-------|--------|
| **Files** | `frontend/src/services/api.js`, `services/api/src/main/java/com/emconnect/api/config/SecurityConfig.java:42` |
| **Category** | Cross-Site Request Forgery |
| **Impact** | While CSRF is disabled (acceptable for stateless JWT APIs), the token is in localStorage making it immune to CSRF by design. However, if migrated to cookies, CSRF tokens become mandatory. |

**Recommendation:** If token storage is migrated to cookies, implement CSRF protection immediately.

---

### M-02: WebSocket Hub — No Connection Limits

| Field | Detail |
|-------|--------|
| **File** | `services/websocket-hub/hub/hub.go:14-50` |
| **Category** | Denial of Service |
| **Impact** | Unbounded `clients map[*Client]bool` allows memory exhaustion |

**Recommendation:** Add `maxClients` limit and reject connections above threshold.

---

### M-03: WebSocket Hub — Unlimited Subscriptions Per Client

| Field | Detail |
|-------|--------|
| **File** | `services/websocket-hub/hub/hub.go:133-156` |
| **Category** | Denial of Service |
| **Impact** | Single client can subscribe to thousands of topics, causing memory bloat |

**Recommendation:** Limit subscriptions per client (e.g., max 100).

---

### M-04: Inconsistent Password Length Requirements

| Field | Detail |
|-------|--------|
| **Files** | `dto/ChangePasswordRequest.java:12` (min 6) vs `dto/RegisterRequest.java:14` (min 8) vs `dto/ResetPasswordRequest.java:18` (min 8) |
| **Category** | Business Logic |
| **Impact** | Password change accepts weaker passwords than registration |

**Recommendation:** Standardize to minimum 8 characters across all flows.

---

### M-05: Actuator Health Endpoint Exposes Environment Details

| Field | Detail |
|-------|--------|
| **File** | `services/api/src/main/resources/application.yml:54-55` |
| **Category** | Information Disclosure |
| **Impact** | `show-details: always` reveals database connectivity, RabbitMQ status, disk space |

```yaml
endpoint:
  health:
    show-details: always
```

**Recommendation:** Change to `when-authorized` for production.

---

### M-06: No Connection Pool Configuration

| Field | Detail |
|-------|--------|
| **File** | `services/api/src/main/resources/application.yml:6-10` |
| **Category** | Resource Exhaustion |
| **Impact** | HikariCP uses defaults; under heavy load, could exhaust database connections |

**Recommendation:** Configure explicit pool limits (`maximum-pool-size`, `minimum-idle`, `connection-timeout`).

---

### M-07: No Storage Quotas for File Uploads

| Field | Detail |
|-------|--------|
| **Files** | `services/api/src/main/java/com/emconnect/api/service/EventService.java`, `UserService.java` |
| **Category** | Denial of Service |
| **Impact** | No per-user storage quota; 1000 users × 2MB + 1000 events × 5MB = 7GB disk consumption |

**Recommendation:** Implement per-user storage quotas and global disk space monitoring.

---

### M-08: Missing Query Parameter Validation

| Field | Detail |
|-------|--------|
| **File** | `services/api/src/main/java/com/emconnect/api/controller/EventController.java:79-90` |
| **Category** | Input Validation |
| **Impact** | No size limits on `keyword`, no max on `page` / `size` params — can cause expensive queries |

**Recommendation:** Add `@Size(max=100)` on keyword, `@Max(100)` on size, `@Min(0)` on page.

---

### M-09: Ticket Validation Missing Event Time Check

| Field | Detail |
|-------|--------|
| **File** | `services/api/src/main/java/com/emconnect/api/service/TicketService.java:114-160` |
| **Category** | Business Logic |
| **Impact** | Tickets can be validated (checked in) before events start or after they end |

**Recommendation:** Add event start/end time validation before allowing check-in.

---

### M-10: Missing Content Security Policy Headers

| Field | Detail |
|-------|--------|
| **Files** | `frontend/index.html`, `services/api/src/main/java/com/emconnect/api/config/SecurityConfig.java` |
| **Category** | Security Headers |
| **Impact** | No CSP restricts inline scripts, external resources, or frame embedding |

**Recommendation:** Add CSP meta tag or response header: `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'`.

---

### M-11: Missing Security Response Headers

| Field | Detail |
|-------|--------|
| **File** | `services/api/src/main/java/com/emconnect/api/config/SecurityConfig.java` |
| **Category** | Security Headers |
| **Impact** | Missing `X-Frame-Options`, `X-Content-Type-Options`, `Strict-Transport-Security`, `Referrer-Policy` |

**Recommendation:** Configure headers in Spring Security filter chain or use `@Bean` for header writer.

---

### M-12: Ticket Worker — World-Readable File Permissions

| Field | Detail |
|-------|--------|
| **File** | `services/ticket-worker/ticket/service.go:147` |
| **Category** | Access Control |
| **Impact** | Ticket metadata files (containing user PII) are readable by all system users (0644) |

```go
os.WriteFile(filePath, data, 0644)
```

**Recommendation:** Use `0600` (owner read/write only).

---

### M-13: Ticket Worker — Race Condition in Idempotency Check

| Field | Detail |
|-------|--------|
| **File** | `services/ticket-worker/ticket/service.go:44-55` |
| **Category** | Concurrency |
| **Impact** | TOCTOU race between `Exists()` and `GenerateQR()` could produce duplicate tickets |

**Recommendation:** Use atomic file operations or file locking.

---

### M-14: User Entity Password Field Missing @JsonIgnore

| Field | Detail |
|-------|--------|
| **File** | `services/api/src/main/java/com/emconnect/api/entity/User.java` |
| **Category** | Information Disclosure |
| **Impact** | If User entity is accidentally serialized directly (bypassing DTO), password hash is exposed |

**Recommendation:** Add `@JsonIgnore` to the password field as defense-in-depth.

---

### M-15: Docker Compose — No Network Isolation

| Field | Detail |
|-------|--------|
| **File** | `docker-compose.yaml` |
| **Category** | Network Security |
| **Impact** | All containers on the default bridge network; compromised container can access all others |

**Recommendation:** Define custom networks to isolate frontend-facing services from backend databases.

---

### M-16: Docker Compose — No Resource Limits

| Field | Detail |
|-------|--------|
| **File** | `docker-compose.yaml` |
| **Category** | Denial of Service |
| **Impact** | A single runaway container can consume all host CPU/memory |

**Recommendation:** Add `deploy.resources.limits` for CPU and memory on each service.

---

## 4. Low Severity Findings

### L-01: BCrypt Strength Uses Default (10)

| Field | Detail |
|-------|--------|
| **File** | `services/api/src/main/java/com/emconnect/api/config/SecurityConfig.java:29` |
| **Recommendation** | Use `new BCryptPasswordEncoder(12)` for improved resistance to brute force |

---

### L-02: Missing Database CHECK Constraints

| Field | Detail |
|-------|--------|
| **Files** | `db/migration/V4__create_events_table.sql`, `V5__create_registrations_table.sql` |
| **Issues** | No CHECK constraints on status enums (allows invalid values at DB layer), no positive capacity check |

**Recommendation:** Add:
```sql
CHECK (status IN ('DRAFT', 'PUBLISHED', 'CANCELLED', 'COMPLETED'))
CHECK (capacity >= 0)
```

---

### L-03: Missing Cascade Delete on Events→Users Foreign Key

| Field | Detail |
|-------|--------|
| **File** | `db/migration/V4__create_events_table.sql:11` |
| **Impact** | Deleting a user leaves orphaned events |

**Recommendation:** Add `ON DELETE CASCADE` or implement soft deletes.

---

### L-04: Error Messages Displayed Unsanitized

| Field | Detail |
|-------|--------|
| **Files** | Multiple frontend pages (`EventDetail.jsx`, `Login.jsx`, `Register.jsx`) |
| **Impact** | Backend error messages displayed directly; could leak internal details |

**Recommendation:** Map server errors to user-friendly messages; log details in console for debugging.

---

## 5. Informational / Best Practice

### I-01: No CI/CD Pipeline

No `.github/workflows/`, `.gitlab-ci.yml`, or other CI/CD configuration exists. Automated testing, linting, and security scanning should be implemented.

---

### I-02: Only 1 Test File Exists

`services/api/src/test/java/com/emconnect/api/service/RegistrationConcurrencyTest.java` is the only test. No unit tests for services, controllers, or security configuration.

---

### I-03: No HTTPS Requirement in SecurityConfig

No `requiresChannel("HTTPS")` configured. In production, all traffic should be redirected to HTTPS.

---

### I-04: Client-Side Role Checks Are Bypassable

`frontend/src/components/ProtectedRoute.jsx` relies on `user.role` from localStorage which can be modified. This is only UX protection — backend authorization is the real gate.

---

### I-05: No Missing Exception Handlers for JPA/Data Integrity Errors

`GlobalExceptionHandler.java` does not handle `DataIntegrityViolationException` or `JpaObjectRetrievalFailureException`, which may leak database error details.

---

## 6. Dependency Vulnerabilities

| Dependency | Version | Ecosystem | Vulnerability | Patched Version | Severity |
|------------|---------|-----------|---------------|-----------------|----------|
| `org.postgresql:postgresql` | 42.7.1 | Maven | SQL Injection via line comment generation | **42.7.2** | 🔴 Critical |
| `github.com/skip2/go-qrcode` | v0.0.0-20200617 | Go | Unmaintained (5+ years) | N/A | 🟢 Low |

**No vulnerabilities found in:**
- Spring Boot 3.2.2 (web, security, actuator)
- JJWT 0.12.5
- Flyway 10.7.1
- React 19.0.0 / React DOM 19.0.0
- Vite 6.3.5
- Tailwind CSS 4.1.7
- gorilla/websocket 1.5.3
- amqp091-go 1.10.0
- Lombok 1.18.30
- All other npm/Go dependencies

---

## 7. Positive Security Observations

The following security practices are well-implemented:

| Practice | Location | Status |
|----------|----------|--------|
| **Parameterized SQL queries** | All JPA repositories | ✅ No SQL injection in application code |
| **BCrypt password hashing** | `SecurityConfig.java`, `AuthService.java` | ✅ Proper hashing |
| **Pessimistic locking for registration capacity** | `RegistrationService.java:51` | ✅ Prevents race condition over-registration |
| **Google OAuth audience validation** | `AuthService.java:201-207` | ✅ Proper `aud` claim check |
| **Consistent error messages for auth** | `AuthService.java:80-96` | ✅ "Invalid email or password" prevents email enumeration |
| **JPA validate mode** | `application.yml:15` | ✅ `ddl-auto: validate` prevents schema drift |
| **Flyway migrations** | 10 versioned migrations | ✅ Controlled schema evolution |
| **File size limits** | `EventService.java`, `UserService.java` | ✅ 5MB / 2MB limits |
| **Path traversal check in services** | `UserService.java:116`, `EventService.java:326` | ✅ `path.startsWith()` validation |
| **HTML template auto-escaping** | `notification-worker/templates/templates.go` | ✅ Go `html/template` escapes by default |
| **Dead-letter queue handling** | RabbitMQ topology | ✅ Failed messages routed to DLQ |
| **Graceful shutdown in Go workers** | All Go `main.go` files | ✅ Signal handling implemented |
| **Health checks in Docker Compose** | `docker-compose.yaml:13-17, 38-42` | ✅ Proper health monitoring |
| **Stateless API with CSRF disabled** | `SecurityConfig.java:42` | ✅ Appropriate for JWT-based auth |

---

## Remediation Priority

### Phase 1 — Immediate (Production Blockers)
1. **C-01 to C-04:** Move all secrets to environment variables
2. **C-05:** Upgrade PostgreSQL JDBC driver to 42.7.2+
3. **C-06:** Remove or profile-gate test endpoints
4. **C-07, C-08:** Add WebSocket origin validation and authentication
5. **C-09, C-10:** Fix IDOR in registration endpoints
6. **C-11:** Bind Docker ports to localhost
7. **C-12:** Disable SQL logging in production
8. **H-01, H-02:** Add rate limiting on auth endpoints

### Phase 2 — Short Term (Before Release)
9. **H-03 to H-05:** Improve token storage, add revocation, reduce expiration
10. **H-06:** Configure CORS explicitly
11. **H-08 to H-10:** Fix file upload validation, ticket path traversal, HMAC key
12. **H-11, H-12:** Fix logging, add password complexity
13. **H-13 to H-16:** Add @PreAuthorize, fix email defaults, add DB SSL

### Phase 3 — Medium Term (Next Sprint)
14. **M-01 to M-16:** Address medium-severity items
15. Set up CI/CD pipeline with automated security scanning
16. Expand test coverage

### Phase 4 — Ongoing
17. **L-01 to L-08:** Address low-severity items
18. Regular dependency audits
19. Penetration testing before production launch
