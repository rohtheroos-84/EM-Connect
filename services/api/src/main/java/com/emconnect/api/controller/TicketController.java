package com.emconnect.api.controller;

import com.emconnect.api.dto.TicketResponse;
import com.emconnect.api.dto.TicketValidationResponse;
import com.emconnect.api.entity.User;
import com.emconnect.api.repository.UserRepository;
import com.emconnect.api.service.TicketService;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tickets")
public class TicketController {

    private final TicketService ticketService;
    private final UserRepository userRepository;

    public TicketController(TicketService ticketService, UserRepository userRepository) {
        this.ticketService = ticketService;
        this.userRepository = userRepository;
    }

    /**
     * GET /api/tickets/my
     * Get all tickets for the currently authenticated user
     */
    @GetMapping("/my")
    public ResponseEntity<List<TicketResponse>> getMyTickets(Authentication authentication) {
        User user = getUser(authentication);
        List<TicketResponse> tickets = ticketService.getMyTickets(user);
        return ResponseEntity.ok(tickets);
    }

    /**
     * GET /api/tickets/{code}
     * Get a single ticket by its code
     */
    @GetMapping("/{code}")
    public ResponseEntity<TicketResponse> getTicket(@PathVariable String code,
                                                     Authentication authentication) {
        User user = getUser(authentication);
        TicketResponse ticket = ticketService.getTicketByCode(code, user);
        return ResponseEntity.ok(ticket);
    }

    /**
     * GET /api/tickets/{code}/qr
     * Download the QR code image for a ticket
     */
    @GetMapping("/{code}/qr")
    public ResponseEntity<Resource> getQRCode(@PathVariable String code,
                                               Authentication authentication) {
        User user = getUser(authentication);
        Resource qrImage = ticketService.getQRCodeImage(code, user);

        return ResponseEntity.ok()
                .contentType(MediaType.IMAGE_PNG)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "inline; filename=\"" + code + ".png\"")
                .body(qrImage);
    }

    /**
     * POST /api/tickets/{code}/validate
     * Validate a ticket (scan at event entrance)
     * Only ADMIN or ORGANIZER can validate tickets
     */
    @PostMapping("/{code}/validate")
    @PreAuthorize("hasAnyRole('ADMIN', 'ORGANIZER')")
    public ResponseEntity<TicketValidationResponse> validateTicket(@PathVariable String code) {
        TicketValidationResponse result = ticketService.validateTicket(code);
        return ResponseEntity.ok(result);
    }

    // --- Helper ---
    private User getUser(Authentication authentication) {
        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
}