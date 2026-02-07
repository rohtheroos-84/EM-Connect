package com.emconnect.api.controller;

import com.emconnect.api.dto.CreateEventRequest;
import com.emconnect.api.dto.EventResponse;
import com.emconnect.api.dto.UpdateEventRequest;
import com.emconnect.api.entity.Event;
import com.emconnect.api.service.EventService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

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

    // Search events
    @GetMapping("/search")
    public ResponseEntity<Page<EventResponse>> searchEvents(
            @RequestParam String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        Page<Event> events = eventService.searchEvents(keyword, page, size);
        Page<EventResponse> response = events.map(EventResponse::new);
        return ResponseEntity.ok(response);
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
}