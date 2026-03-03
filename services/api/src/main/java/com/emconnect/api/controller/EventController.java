package com.emconnect.api.controller;

import com.emconnect.api.dto.CreateEventRequest;
import com.emconnect.api.dto.EventResponse;
import com.emconnect.api.dto.UpdateEventRequest;
import com.emconnect.api.entity.Event;
import com.emconnect.api.entity.EventCategory;
import com.emconnect.api.service.EventService;
import jakarta.validation.Valid;
import org.springframework.core.io.UrlResource;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/events")
public class EventController {

    private final EventService eventService;

    public EventController(EventService eventService) {
        this.eventService = eventService;
    }

    // Create event (requires authentication)
    @PostMapping
    public ResponseEntity<EventResponse> createEvent(
            @Valid @RequestBody CreateEventRequest request,
            Authentication authentication) {
        
        Event event = eventService.createEvent(request, authentication.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(new EventResponse(event));
    }

    // Get single event by ID (public for published, owner for draft)
    @GetMapping("/{id}")
    public ResponseEntity<EventResponse> getEvent(@PathVariable Long id) {
        Event event = eventService.getEventById(id);
        return ResponseEntity.ok(new EventResponse(event));
    }

    // Get all published events (public endpoint)
    @GetMapping
    public ResponseEntity<Page<EventResponse>> getPublishedEvents(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        Page<Event> events = eventService.getPublishedEvents(page, size);
        Page<EventResponse> response = events.map(EventResponse::new);
        return ResponseEntity.ok(response);
    }

    // Get my events (organizer's events)
    @GetMapping("/my-events")
    public ResponseEntity<Page<EventResponse>> getMyEvents(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Authentication authentication) {
        
        Page<Event> events = eventService.getEventsByOrganizer(authentication.getName(), page, size);
        Page<EventResponse> response = events.map(EventResponse::new);
        return ResponseEntity.ok(response);
    }

    // Search events with optional category and tag filters
    @GetMapping("/search")
    public ResponseEntity<Page<EventResponse>> searchEvents(
            @RequestParam(defaultValue = "") String keyword,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String tag,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        Page<Event> events = eventService.searchEvents(keyword, category, tag, page, size);
        Page<EventResponse> response = events.map(EventResponse::new);
        return ResponseEntity.ok(response);
    }

    // Get available categories (distinct from published events)
    @GetMapping("/categories")
    public ResponseEntity<List<String>> getCategories() {
        List<String> categories = Arrays.stream(EventCategory.values())
                .map(Enum::name)
                .collect(Collectors.toList());
        return ResponseEntity.ok(categories);
    }

    // Get categories that have published events
    @GetMapping("/categories/active")
    public ResponseEntity<List<String>> getActiveCategories() {
        List<String> active = eventService.getAvailableCategories().stream()
                .map(Enum::name)
                .collect(Collectors.toList());
        return ResponseEntity.ok(active);
    }

    // Update event
    @PutMapping("/{id}")
    public ResponseEntity<EventResponse> updateEvent(
            @PathVariable Long id,
            @Valid @RequestBody UpdateEventRequest request,
            Authentication authentication) {
        
        Event event = eventService.updateEvent(id, request, authentication.getName());
        return ResponseEntity.ok(new EventResponse(event));
    }

    // Delete event
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteEvent(
            @PathVariable Long id,
            Authentication authentication) {
        
        eventService.deleteEvent(id, authentication.getName());
        
        Map<String, String> response = new HashMap<>();
        response.put("message", "Event deleted successfully");
        return ResponseEntity.ok(response);
    }

    // Publish event
    @PostMapping("/{id}/publish")
    public ResponseEntity<EventResponse> publishEvent(
            @PathVariable Long id,
            Authentication authentication) {
        
        Event event = eventService.publishEvent(id, authentication.getName());
        return ResponseEntity.ok(new EventResponse(event));
    }

    // Cancel event
    @PostMapping("/{id}/cancel")
    public ResponseEntity<EventResponse> cancelEvent(
            @PathVariable Long id,
            Authentication authentication) {
        
        Event event = eventService.cancelEvent(id, authentication.getName());
        return ResponseEntity.ok(new EventResponse(event));
    }

    // Complete event (mark as finished)
    @PostMapping("/{id}/complete")
    public ResponseEntity<EventResponse> completeEvent(
            @PathVariable Long id,
            Authentication authentication) {
        
        Event event = eventService.completeEvent(id, authentication.getName());
        return ResponseEntity.ok(new EventResponse(event));
    }

    // Get participant count for an event
    @GetMapping("/{id}/participants/count")
    public ResponseEntity<Map<String, Object>> getParticipantCount(@PathVariable Long id) {
        Event event = eventService.getEventById(id);
        long count = eventService.getParticipantCount(id);

        Map<String, Object> response = new HashMap<>();
        response.put("eventId", id);
        response.put("eventTitle", event.getTitle());
        response.put("participantCount", count);
        response.put("capacity", event.getCapacity());
        return ResponseEntity.ok(response);
    }

    // Upload banner image for an event
    @PostMapping("/{id}/banner")
    public ResponseEntity<EventResponse> uploadBanner(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file,
            Authentication authentication) throws IOException {
        
        Event event = eventService.uploadBanner(id, authentication.getName(), file);
        return ResponseEntity.ok(new EventResponse(event));
    }

    // Serve banner images (public)
    @GetMapping("/banners/{filename}")
    public ResponseEntity<?> serveBanner(@PathVariable String filename) throws IOException {
        Path filePath = eventService.getBannerPath(filename);
        if (!Files.exists(filePath)) {
            return ResponseEntity.notFound().build();
        }
        @SuppressWarnings("null")
        UrlResource resource = new UrlResource(filePath.toUri());
        String contentType = Files.probeContentType(filePath);
        if (contentType == null) contentType = "application/octet-stream";
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .body(resource);
    }
}