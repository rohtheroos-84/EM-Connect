package com.emconnect.api.controller;

import com.emconnect.api.dto.EventResponse;
import com.emconnect.api.dto.UserResponse;
import com.emconnect.api.entity.Event;
import com.emconnect.api.entity.EventStatus;
import com.emconnect.api.entity.RegistrationStatus;
import com.emconnect.api.entity.Role;
import com.emconnect.api.entity.User;
import com.emconnect.api.repository.EventRepository;
import com.emconnect.api.repository.RegistrationRepository;
import com.emconnect.api.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
@SuppressWarnings("null")
@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final UserRepository userRepository;
    private final EventRepository eventRepository;
    private final RegistrationRepository registrationRepository;

    public AdminController(UserRepository userRepository,
                           EventRepository eventRepository,
                           RegistrationRepository registrationRepository) {
        this.userRepository = userRepository;
        this.eventRepository = eventRepository;
        this.registrationRepository = registrationRepository;
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
        stats.put("totalEvents", eventRepository.count());
        stats.put("draftEvents", eventRepository.findByStatus(EventStatus.DRAFT, PageRequest.of(0, 1)).getTotalElements());
        stats.put("publishedEvents", eventRepository.findByStatus(EventStatus.PUBLISHED, PageRequest.of(0, 1)).getTotalElements());
        stats.put("cancelledEvents", eventRepository.findByStatus(EventStatus.CANCELLED, PageRequest.of(0, 1)).getTotalElements());
        stats.put("completedEvents", eventRepository.findByStatus(EventStatus.COMPLETED, PageRequest.of(0, 1)).getTotalElements());
        stats.put("totalRegistrations", registrationRepository.count());
        stats.put("confirmedRegistrations", registrationRepository.countByStatus(RegistrationStatus.CONFIRMED));
        stats.put("message", "Welcome to Admin Dashboard");
        return ResponseEntity.ok(stats);
    }

    // Get ALL events regardless of status (Admin only)
    @GetMapping("/events")
    public ResponseEntity<Page<EventResponse>> getAllEvents(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String status) {

        Page<Event> events;
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));

        if (status != null && !status.isEmpty()) {
            events = eventRepository.findByStatus(EventStatus.valueOf(status.toUpperCase()), pageRequest);
        } else {
            events = eventRepository.findAll(pageRequest);
        }

        Page<EventResponse> response = events.map(EventResponse::new);
        return ResponseEntity.ok(response);
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