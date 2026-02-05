package com.emconnect.api.controller;

import com.emconnect.api.dto.UserResponse;
import com.emconnect.api.entity.Role;
import com.emconnect.api.entity.User;
import com.emconnect.api.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final UserRepository userRepository;

    public AdminController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    // Get all users (Admin only)
    @GetMapping("/users")
    public ResponseEntity<List<UserResponse>> getAllUsers() {
        List<User> users = userRepository.findAll();
        List<UserResponse> response = users.stream()
                .map(UserResponse::new)
                .toList();
        return ResponseEntity.ok(response);
    }

    // Get dashboard stats (Admin only)
    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> getDashboard() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalUsers", userRepository.count());
        stats.put("message", "Welcome to Admin Dashboard");
        return ResponseEntity.ok(stats);
    }

    // Promote user to admin (Admin only, using method-level security)
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/users/{id}/promote")
    public ResponseEntity<UserResponse> promoteToAdmin(@PathVariable Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        user.setRole(Role.ADMIN);
        User savedUser = userRepository.save(user);
        
        return ResponseEntity.ok(new UserResponse(savedUser));
    }

    // Demote admin to user (Admin only)
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/users/{id}/demote")
    public ResponseEntity<UserResponse> demoteToUser(@PathVariable Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        user.setRole(Role.USER);
        User savedUser = userRepository.save(user);
        
        return ResponseEntity.ok(new UserResponse(savedUser));
    }
}