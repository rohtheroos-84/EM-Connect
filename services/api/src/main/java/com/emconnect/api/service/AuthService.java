package com.emconnect.api.service;

import com.emconnect.api.dto.AuthResponse;
import com.emconnect.api.dto.LoginRequest;
import com.emconnect.api.dto.RegisterRequest;
import com.emconnect.api.dto.UserResponse;
import com.emconnect.api.entity.LoginActivity;
import com.emconnect.api.entity.User;
import com.emconnect.api.event.UserLoginEvent;
import com.emconnect.api.event.UserRegisteredEvent;
import com.emconnect.api.exception.EmailAlreadyExistsException;
import com.emconnect.api.exception.InvalidCredentialsException;
import com.emconnect.api.repository.LoginActivityRepository;
import com.emconnect.api.repository.UserRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Service
public class AuthService {

    private static final int LOGIN_ACTIVITY_RETENTION_LIMIT = 100;

    private final UserRepository userRepository;
    private final LoginActivityRepository loginActivityRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final EventPublisher eventPublisher;

    @Value("${google.oauth.client-id:}")
    private String googleClientId;

    public AuthService(UserRepository userRepository,
                       LoginActivityRepository loginActivityRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService,
                       EventPublisher eventPublisher) {
        this.userRepository = userRepository;
        this.loginActivityRepository = loginActivityRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.eventPublisher = eventPublisher;
    }

    public AuthResponse register(RegisterRequest request) {
        // Check if email already exists
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new EmailAlreadyExistsException(
                "An account with this email already exists"
            );
        }

        // Create new user
        User user = new User(
            request.getEmail(),
            passwordEncoder.encode(request.getPassword()),
            request.getName()
        );

        // Save to database
        User savedUser = userRepository.save(user);

        // Generate JWT token
        String token = jwtService.generateToken(
            savedUser.getId(),
            savedUser.getEmail(),
            savedUser.getRole()
        );

        // Publish welcome event
        eventPublisher.publishUserRegistered(UserRegisteredEvent.fromUser(savedUser));

        // Return response with token
        return new AuthResponse(
            "Registration successful",
            new UserResponse(savedUser),
            token
        );
    }

    public AuthResponse login(LoginRequest request) {
        return login(request, null, null);
    }

    public AuthResponse login(LoginRequest request, String sourceIp, String userAgent) {
        // Find user by email
        User user = userRepository.findByEmail(request.getEmail())
            .orElseThrow(() -> new InvalidCredentialsException(
                "Invalid email or password"
            ));

        // OAuth-only users can't use password login
        if (user.getPassword() == null) {
            throw new InvalidCredentialsException(
                "This account uses Google Sign-In. Please sign in with Google."
            );
        }

        // Check password
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new InvalidCredentialsException("Invalid email or password");
        }

        // Generate JWT token
        String token = jwtService.generateToken(
            user.getId(),
            user.getEmail(),
            user.getRole()
        );

        // Publish login event
        eventPublisher.publishUserLogin(UserLoginEvent.fromUser(user, "PASSWORD"));
        recordLoginActivity(user, "PASSWORD", sourceIp, userAgent);

        // Return response with token
        return new AuthResponse(
            "Login successful",
            new UserResponse(user),
            token
        );
    }

    /**
     * Authenticate or register a user via Google OAuth2 ID token.
     * Verifies the token with Google's tokeninfo endpoint, then finds or creates the user.
     */
    public AuthResponse googleLogin(String credential) {
        return googleLogin(credential, null, null);
    }

    public AuthResponse googleLogin(String credential, String sourceIp, String userAgent) {
        if (googleClientId == null || googleClientId.isBlank()) {
            throw new IllegalStateException("Google OAuth is not configured");
        }

        // Verify the ID token with Google
        Map<String, Object> claims = verifyGoogleIdToken(credential);

        String email = (String) claims.get("email");
        String name = (String) claims.get("name");
        String picture = (String) claims.get("picture");
        Boolean emailVerified = Boolean.TRUE.equals(claims.get("email_verified"))
                || "true".equals(String.valueOf(claims.get("email_verified")));

        if (email == null || !emailVerified) {
            throw new InvalidCredentialsException("Google account email is not verified");
        }

        // Find existing user or create new one
        User user = userRepository.findByEmail(email).orElse(null);

        if (user == null) {
            // New user — auto-register
            user = new User();
            user.setEmail(email);
            user.setName(name != null ? name : email.split("@")[0]);
            user.setOauthProvider("GOOGLE");
            // No password for OAuth users
            user = userRepository.save(user);
            // Publish welcome event for new Google users
            eventPublisher.publishUserRegistered(UserRegisteredEvent.fromUser(user));
        } else if (user.getOauthProvider() == null) {
            // Existing regular account — link with Google
            user.setOauthProvider("GOOGLE");
            if (user.getAvatarUrl() == null && picture != null) {
                user.setAvatarUrl(picture);
            }
            user = userRepository.save(user);
        }

        // Generate JWT token
        String token = jwtService.generateToken(
            user.getId(),
            user.getEmail(),
            user.getRole()
        );

        // Publish Google login event
        eventPublisher.publishUserLogin(UserLoginEvent.fromUser(user, "GOOGLE"));
        recordLoginActivity(user, "GOOGLE", sourceIp, userAgent);

        return new AuthResponse(
            "Google login successful",
            new UserResponse(user),
            token
        );
    }

    private void recordLoginActivity(User user, String loginMethod, String sourceIp, String userAgent) {
        LoginActivity activity = new LoginActivity(
                user,
                loginMethod,
                sanitize(sourceIp, 64),
                sanitize(userAgent, 500)
        );
        loginActivityRepository.save(activity);

        long total = loginActivityRepository.countByUserId(user.getId());
        if (total <= LOGIN_ACTIVITY_RETENTION_LIMIT) {
            return;
        }

        int overflow = (int) (total - LOGIN_ACTIVITY_RETENTION_LIMIT);
        var oldest = loginActivityRepository
                .findByUserIdOrderByCreatedAtAsc(user.getId(), PageRequest.of(0, overflow))
                .getContent();

        if (!oldest.isEmpty()) {
            loginActivityRepository.deleteAll(oldest);
        }
    }

    private String sanitize(String value, int maxLength) {
        if (value == null || value.isBlank()) {
            return null;
        }

        String trimmed = value.trim();
        return trimmed.length() <= maxLength ? trimmed : trimmed.substring(0, maxLength);
    }

    /**
     * Call Google's tokeninfo endpoint to verify the ID token.
     * Returns the claims map if valid, throws if invalid.
     */
    private Map<String, Object> verifyGoogleIdToken(String idToken) {
        try {
            RestTemplate rest = new RestTemplate();
            String url = "https://oauth2.googleapis.com/tokeninfo?id_token=" + idToken;

            @SuppressWarnings("null")
            ResponseEntity<Map<String, Object>> response = rest.exchange(
                url,
                HttpMethod.GET,
                null,
                new ParameterizedTypeReference<Map<String, Object>>() {}
            );

            Map<String, Object> claims = response.getBody();

            if (claims == null) {
                throw new InvalidCredentialsException("Invalid Google token");
            }

            // Verify audience matches our client ID
            String aud = (String) claims.get("aud");
            if (!googleClientId.equals(aud)) {
                throw new InvalidCredentialsException(
                    "Google token was not issued for this application"
                );
            }

            return claims;
        } catch (InvalidCredentialsException e) {
            throw e;
        } catch (Exception e) {
            throw new InvalidCredentialsException("Failed to verify Google token: " + e.getMessage());
        }
    }
}