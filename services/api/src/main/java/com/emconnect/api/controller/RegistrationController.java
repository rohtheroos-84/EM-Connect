package com.emconnect.api.controller;

import com.emconnect.api.dto.RegistrationResponse;
import com.emconnect.api.entity.Registration;
import com.emconnect.api.service.RegistrationService;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class RegistrationController {

    private final RegistrationService registrationService;

    public RegistrationController(RegistrationService registrationService) {
        this.registrationService = registrationService;
    }

    /**
     * Register for an event
     * POST /api/events/{eventId}/register
     */
    @PostMapping("/events/{eventId}/register")
    public ResponseEntity<RegistrationResponse> registerForEvent(
            @PathVariable Long eventId,
            Authentication authentication) {
        
        Registration registration = registrationService.registerForEvent(
            eventId, 
            authentication.getName()
        );
        
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new RegistrationResponse(registration));
    }

    /**
     * Cancel a registration
     * POST /api/registrations/{id}/cancel
     */
    @PostMapping("/registrations/{id}/cancel")
    public ResponseEntity<RegistrationResponse> cancelRegistration(
            @PathVariable Long id,
            Authentication authentication) {
        
        Registration registration = registrationService.cancelRegistration(
            id, 
            authentication.getName()
        );
        
        return ResponseEntity.ok(new RegistrationResponse(registration));
    }

    /**
     * Get my registrations
     * GET /api/registrations/my-registrations
     */
    @GetMapping("/registrations/my-registrations")
    public ResponseEntity<Page<RegistrationResponse>> getMyRegistrations(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "false") boolean activeOnly,
            Authentication authentication) {
        
        Page<Registration> registrations;
        if (activeOnly) {
            registrations = registrationService.getUserActiveRegistrations(
                authentication.getName(), page, size
            );
        } else {
            registrations = registrationService.getUserRegistrations(
                authentication.getName(), page, size
            );
        }
        
        Page<RegistrationResponse> response = registrations.map(RegistrationResponse::new);
        return ResponseEntity.ok(response);
    }

    /**
     * Get single registration by ID
     * GET /api/registrations/{id}
     */
    @GetMapping("/registrations/{id}")
    public ResponseEntity<RegistrationResponse> getRegistration(
            @PathVariable Long id,
            Authentication authentication) {
        
        Registration registration = registrationService.getRegistrationById(id);
        
        // Check if user owns this registration
        if (!registration.getUser().getEmail().equals(authentication.getName())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        
        return ResponseEntity.ok(new RegistrationResponse(registration));
    }

    /**
     * Get registration by ticket code
     * GET /api/registrations/ticket/{ticketCode}
     */
    @GetMapping("/registrations/ticket/{ticketCode}")
    public ResponseEntity<RegistrationResponse> getRegistrationByTicketCode(
            @PathVariable String ticketCode) {
        
        Registration registration = registrationService.getRegistrationByTicketCode(ticketCode);
        return ResponseEntity.ok(new RegistrationResponse(registration));
    }

    /**
     * Check if current user is registered for an event
     * GET /api/events/{eventId}/registration-status
     */
    @GetMapping("/events/{eventId}/registration-status")
    public ResponseEntity<Map<String, Object>> checkRegistrationStatus(
            @PathVariable Long eventId,
            Authentication authentication) {
        
        boolean isRegistered = registrationService.isUserRegistered(
            eventId, 
            authentication.getName()
        );
        long totalRegistrations = registrationService.getEventRegistrationCount(eventId);
        
        Map<String, Object> response = new HashMap<>();
        response.put("isRegistered", isRegistered);
        response.put("totalRegistrations", totalRegistrations);
        
        return ResponseEntity.ok(response);
    }

    /**
     * Get registrations for an event (for organizers)
     * GET /api/events/{eventId}/registrations
     */
    @GetMapping("/events/{eventId}/registrations")
    public ResponseEntity<Page<RegistrationResponse>> getEventRegistrations(
            @PathVariable Long eventId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        // TO DO: Add authorization check - only event organizer or admin should access
        Page<Registration> registrations = registrationService.getEventRegistrations(
            eventId, page, size
        );
        
        Page<RegistrationResponse> response = registrations.map(RegistrationResponse::new);
        return ResponseEntity.ok(response);
    }
}