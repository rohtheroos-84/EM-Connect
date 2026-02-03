package com.emconnect.api.controller;

import com.emconnect.api.entity.User;
import com.emconnect.api.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/test")
public class UserTestController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserTestController(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    // Create a test user
    @PostMapping("/users")
    public ResponseEntity<Map<String, Object>> createTestUser() {
        // Check if test user already exists
        if (userRepository.existsByEmail("test@example.com")) {
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Test user already exists");
            return ResponseEntity.ok(response);
        }

        // Create new user with hashed password
        User user = new User(
            "test@example.com",
            passwordEncoder.encode("password123"),  // Hash the password!
            "Test User"
        );

        // Save to database
        User savedUser = userRepository.save(user);

        // Return response (don't include password!)
        Map<String, Object> response = new HashMap<>();
        response.put("id", savedUser.getId());
        response.put("email", savedUser.getEmail());
        response.put("name", savedUser.getName());
        response.put("role", savedUser.getRole());
        response.put("createdAt", savedUser.getCreatedAt());

        return ResponseEntity.ok(response);
    }

    // List all users
    @GetMapping("/users")
    public ResponseEntity<List<Map<String, Object>>> listUsers() {
        List<User> users = userRepository.findAll();
        
        // Map to response (exclude passwords!)
        List<Map<String, Object>> response = users.stream()
            .map(user -> {
                Map<String, Object> map = new HashMap<>();
                map.put("id", user.getId());
                map.put("email", user.getEmail());
                map.put("name", user.getName());
                map.put("role", user.getRole());
                map.put("createdAt", user.getCreatedAt());
                return map;
            })
            .toList();

        return ResponseEntity.ok(response);
    }
}