# Authentication & Security

EM-Connect uses **JWT (JSON Web Tokens)** for stateless authentication with **Spring Security**.

## Overview

```
┌─────────┐  1. Login Request     ┌─────────────┐
│ Client  │──────────────────────▶│ AuthService │
│         │                       │             │
│         │  2. JWT Token         │  - Verify   │
│         │◀──────────────────────│    password │
└────┬────┘                       │  - Generate │
     │                            │    token    │
     │ 3. Request + JWT           └─────────────┘
     │ (Authorization header)
     ▼
┌─────────────────────┐
│ JwtAuthFilter       │
│                     │
│ - Extract token     │
│ - Validate token    │
│ - Set auth context  │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│ Protected Endpoint  │
└─────────────────────┘
```

## Authentication Flow

### 1. Registration

```
POST /api/auth/register
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

**Process:**
1. `AuthController` receives request
2. `AuthService.register()`:
   - Check if email already exists
   - Hash password with BCrypt
   - Save user with role USER
   - Generate JWT token
3. Return token + user info

### 2. Login

```
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Process:**
1. `AuthController` receives request
2. `AuthService.login()`:
   - Find user by email
   - Verify password with BCrypt
   - Generate JWT token
3. Return token + user info

### 3. Authenticated Requests

```
GET /api/events/my-events
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Process:**
1. `JwtAuthenticationFilter` intercepts request
2. Extract token from `Authorization: Bearer <token>`
3. `JwtService.validateToken()` checks:
   - Valid signature
   - Not expired
4. Extract username (email) from token
5. Load user via `CustomUserDetailsService`
6. Create `Authentication` object
7. Set in `SecurityContextHolder`
8. Request continues to controller

---

## JWT Token

### Structure

JWT tokens have three parts separated by dots:
```
header.payload.signature
```

**Example decoded:**

```json
// Header
{
  "alg": "HS256",
  "typ": "JWT"
}

// Payload
{
  "sub": "user@example.com",
  "iat": 1704067200,
  "exp": 1704153600
}

// Signature
HMACSHA256(base64(header) + "." + base64(payload), secret)
```

### Token Claims

| Claim | Description |
|-------|-------------|
| sub | Subject (user email) |
| iat | Issued at (timestamp) |
| exp | Expiration (timestamp) |

### Configuration

```yaml
# application.yml
jwt:
  secret: your-256-bit-secret-key-here-make-it-long-and-random
  expiration: 86400000  # 24 hours in milliseconds
```

---

## Password Security

### BCrypt Hashing

Passwords are never stored in plain text. BCrypt is used for secure hashing:

```java
@Bean
public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
}
```

**Features:**
- Automatic salt generation
- Configurable work factor
- Resistant to rainbow tables

**Example hash:**
```
$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZRGljZVrdLfGu1IxM3L2vU.XXXXXXXXX
```

---

## Security Configuration

### SecurityConfig.java

```java
@Configuration
@EnableWebSecurity
@EnableMethodSecurity  // Enables @PreAuthorize annotations
public class SecurityConfig {
    // ...
}
```

### Authorization Rules

```java
.authorizeHttpRequests(auth -> auth
    // Public endpoints
    .requestMatchers(
        "/api/auth/**",      // Login, register
        "/api/health",       // Health check
        "/api/ping",         // Ping
        "/actuator/**"       // Actuator endpoints
    ).permitAll()
    
    // Public event endpoints (GET only)
    .requestMatchers("GET", "/api/events").permitAll()
    .requestMatchers("GET", "/api/events/search").permitAll()
    .requestMatchers("GET", "/api/events/{id}").permitAll()
    
    // Admin-only endpoints
    .requestMatchers("/api/admin/**").hasRole("ADMIN")
    
    // All other endpoints require authentication
    .anyRequest().authenticated()
)
```

### Endpoint Access Summary

| Endpoint | Access |
|----------|--------|
| POST /api/auth/register | Public |
| POST /api/auth/login | Public |
| GET /api/health | Public |
| GET /api/events | Public |
| GET /api/events/{id} | Public |
| GET /api/events/search | Public |
| POST /api/events | Authenticated |
| PUT /api/events/{id} | Authenticated (organizer only) |
| DELETE /api/events/{id} | Authenticated (organizer only) |
| POST /api/events/{id}/publish | Authenticated (organizer only) |
| GET /api/events/my-events | Authenticated |
| GET /api/users/me | Authenticated |
| GET /api/admin/users | ADMIN only |

---

## Role-Based Access Control (RBAC)

### Roles

| Role | Description | Permissions |
|------|-------------|-------------|
| USER | Regular user | Create/manage own events |
| ADMIN | Administrator | All permissions + admin endpoints |

### Using Roles in Code

```java
// Method-level security (requires @EnableMethodSecurity)
@PreAuthorize("hasRole('ADMIN')")
public List<UserResponse> getAllUsers() {
    // Only admins can access
}

// URL-based security (in SecurityConfig)
.requestMatchers("/api/admin/**").hasRole("ADMIN")
```

### Getting Current User

```java
// In controller
@GetMapping("/me")
public ResponseEntity<UserResponse> getCurrentUser(Authentication auth) {
    String email = auth.getName();  // Returns the email
    // ...
}
```

---

## JWT Service Implementation

### Key Methods

```java
public class JwtService {
    
    // Generate token for user
    public String generateToken(String username) {
        return Jwts.builder()
            .setSubject(username)
            .setIssuedAt(new Date())
            .setExpiration(new Date(System.currentTimeMillis() + expiration))
            .signWith(getSigningKey(), SignatureAlgorithm.HS256)
            .compact();
    }
    
    // Extract username from token
    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }
    
    // Validate token
    public boolean isTokenValid(String token, UserDetails userDetails) {
        String username = extractUsername(token);
        return username.equals(userDetails.getUsername()) 
            && !isTokenExpired(token);
    }
}
```

---

## JWT Authentication Filter

### Request Processing Flow

```java
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    
    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) {
        
        // 1. Get Authorization header
        String authHeader = request.getHeader("Authorization");
        
        // 2. Check for Bearer token
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }
        
        // 3. Extract and validate token
        String token = authHeader.substring(7);
        String username = jwtService.extractUsername(token);
        
        // 4. Load user and validate
        UserDetails userDetails = userDetailsService.loadUserByUsername(username);
        
        if (jwtService.isTokenValid(token, userDetails)) {
            // 5. Create authentication
            UsernamePasswordAuthenticationToken authToken = 
                new UsernamePasswordAuthenticationToken(
                    userDetails, null, userDetails.getAuthorities()
                );
            
            // 6. Set in security context
            SecurityContextHolder.getContext().setAuthentication(authToken);
        }
        
        filterChain.doFilter(request, response);
    }
}
```

---

## Common Security Scenarios

### Scenario 1: User Creates Event

1. User logs in → gets JWT token
2. User calls `POST /api/events` with token
3. `JwtAuthenticationFilter` validates token
4. `EventController.createEvent()` receives request
5. `Authentication.getName()` returns user email
6. `EventService` creates event with that user as organizer

### Scenario 2: User Tries to Edit Another's Event

1. User A creates event (organizer_id = 1)
2. User B calls `PUT /api/events/1` with their token
3. `EventService.updateEvent()` calls `verifyOrganizer()`
4. `verifyOrganizer()` throws `AccessDeniedException`
5. Returns 403 Forbidden

### Scenario 3: Invalid/Expired Token

1. Client sends request with expired token
2. `JwtAuthenticationFilter` tries to validate
3. `JwtService.isTokenExpired()` returns true
4. No authentication set in context
5. `SecurityConfig` rejects: returns 401 Unauthorized

---

## Testing Authentication

### Get a Token

```bash
# Register new user
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123","name":"Test"}'

# Or login as admin
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@emconnect.com","password":"admin123"}'
```

### Use the Token

```bash
# Save token to variable (bash)
TOKEN="eyJhbGciOiJIUzI1NiIs..."

# Make authenticated request
curl http://localhost:8080/api/users/me \
  -H "Authorization: Bearer $TOKEN"
```

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| 401 Unauthorized | Missing/invalid token | Include valid token in header |
| 401 Unauthorized | Token expired | Login again to get new token |
| 403 Forbidden | Insufficient role | Use account with required role |
| 403 Forbidden | Not owner | Only organizer can modify event |

---

## Security Best Practices

1. **Never log/expose JWT secret** - Keep in environment variables
2. **Use HTTPS in production** - Tokens can be intercepted over HTTP
3. **Set appropriate token expiration** - 24 hours is reasonable for dev
4. **Validate all user input** - Use `@Valid` annotations
5. **Don't trust client data** - Always verify ownership server-side
6. **Hash passwords** - Never store plain text passwords
7. **Change default admin password** - In production, change immediately
