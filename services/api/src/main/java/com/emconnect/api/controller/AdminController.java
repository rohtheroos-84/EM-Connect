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
import java.util.ArrayList;
import java.time.LocalDateTime;
import java.time.LocalDate;
import java.sql.Date;
@SuppressWarnings({ "null", "unused" })
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

    // ── Analytics ──────────────────────────────────────────────────────────

    @GetMapping("/analytics")
    public ResponseEntity<Map<String, Object>> getAnalytics() {
        Map<String, Object> analytics = new HashMap<>();
        LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);

        // 1. Registration trend (last 30 days)
        List<Map<String, Object>> registrationTrend = new ArrayList<>();
        for (Object[] row : registrationRepository.countDailyRegistrations(thirtyDaysAgo)) {
            Map<String, Object> point = new HashMap<>();
            point.put("date", row[0].toString());
            point.put("count", ((Number) row[1]).intValue());
            registrationTrend.add(point);
        }
        analytics.put("registrationTrend", registrationTrend);

        // 2. User growth (last 30 days)
        List<Map<String, Object>> userGrowth = new ArrayList<>();
        for (Object[] row : userRepository.countDailyNewUsers(thirtyDaysAgo)) {
            Map<String, Object> point = new HashMap<>();
            point.put("date", row[0].toString());
            point.put("count", ((Number) row[1]).intValue());
            userGrowth.add(point);
        }
        analytics.put("userGrowth", userGrowth);

        // 3. Popular events (top 8)
        List<Map<String, Object>> popularEvents = new ArrayList<>();
        for (Object[] row : eventRepository.findPopularEvents(8)) {
            Map<String, Object> item = new HashMap<>();
            item.put("title", row[0]);
            item.put("registrations", ((Number) row[1]).intValue());
            item.put("capacity", row[2] != null ? ((Number) row[2]).intValue() : 0);
            popularEvents.add(item);
        }
        analytics.put("popularEvents", popularEvents);

        // 4. Peak hours
        List<Map<String, Object>> peakHours = new ArrayList<>();
        for (Object[] row : registrationRepository.countRegistrationsByHour()) {
            Map<String, Object> item = new HashMap<>();
            item.put("hour", ((Number) row[0]).intValue());
            item.put("count", ((Number) row[1]).intValue());
            peakHours.add(item);
        }
        analytics.put("peakHours", peakHours);

        // 5. Day of week distribution
        String[] dayNames = {"Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"};
        List<Map<String, Object>> dayOfWeek = new ArrayList<>();
        for (Object[] row : registrationRepository.countRegistrationsByDayOfWeek()) {
            Map<String, Object> item = new HashMap<>();
            int dow = ((Number) row[0]).intValue();
            item.put("day", dayNames[dow]);
            item.put("count", ((Number) row[1]).intValue());
            dayOfWeek.add(item);
        }
        analytics.put("dayOfWeek", dayOfWeek);

        // 6. Event status breakdown
        Map<String, Long> eventStatus = new HashMap<>();
        eventStatus.put("DRAFT", eventRepository.countByStatus(EventStatus.DRAFT));
        eventStatus.put("PUBLISHED", eventRepository.countByStatus(EventStatus.PUBLISHED));
        eventStatus.put("CANCELLED", eventRepository.countByStatus(EventStatus.CANCELLED));
        eventStatus.put("COMPLETED", eventRepository.countByStatus(EventStatus.COMPLETED));
        analytics.put("eventStatusBreakdown", eventStatus);

        // 7. Registration status breakdown
        Map<String, Long> regStatus = new HashMap<>();
        regStatus.put("CONFIRMED", registrationRepository.countByStatus(RegistrationStatus.CONFIRMED));
        regStatus.put("CANCELLED", registrationRepository.countByStatus(RegistrationStatus.CANCELLED));
        regStatus.put("ATTENDED", registrationRepository.countByStatus(RegistrationStatus.ATTENDED));
        regStatus.put("NO_SHOW", registrationRepository.countByStatus(RegistrationStatus.NO_SHOW));
        analytics.put("registrationStatusBreakdown", regStatus);

        // 8. Top locations
        List<Map<String, Object>> topLocations = new ArrayList<>();
        for (Object[] row : eventRepository.findTopLocations(6)) {
            Map<String, Object> item = new HashMap<>();
            item.put("location", row[0]);
            item.put("count", ((Number) row[1]).intValue());
            topLocations.add(item);
        }
        analytics.put("topLocations", topLocations);

        // 9. Recent activity
        List<Map<String, Object>> recentActivity = new ArrayList<>();
        for (Object[] row : registrationRepository.findRecentActivity()) {
            Map<String, Object> item = new HashMap<>();
            item.put("userName", row[0]);
            item.put("eventTitle", row[1]);
            item.put("status", row[2]);
            item.put("time", row[3] != null ? row[3].toString() : null);
            recentActivity.add(item);
        }
        analytics.put("recentActivity", recentActivity);

        // 10. Summary stats
        long totalEvents = eventRepository.count();
        long totalRegistrations = registrationRepository.count();
        long totalUsers = userRepository.count();
        long confirmedRegs = registrationRepository.countByStatus(RegistrationStatus.CONFIRMED);
        analytics.put("totalEvents", totalEvents);
        analytics.put("totalRegistrations", totalRegistrations);
        analytics.put("totalUsers", totalUsers);
        analytics.put("confirmedRegistrations", confirmedRegs);

        return ResponseEntity.ok(analytics);
    }
}