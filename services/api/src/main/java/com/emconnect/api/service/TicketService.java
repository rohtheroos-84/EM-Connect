package com.emconnect.api.service;

import com.emconnect.api.dto.TicketResponse;
import com.emconnect.api.dto.TicketValidationResponse;
import com.emconnect.api.entity.Event;
import com.emconnect.api.entity.Registration;
import com.emconnect.api.entity.RegistrationStatus;
import com.emconnect.api.entity.User;
import com.emconnect.api.repository.RegistrationRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;
@SuppressWarnings("null")
@Service
public class TicketService {

    private final RegistrationRepository registrationRepository;
    private final Path qrStoragePath;

    public TicketService(RegistrationRepository registrationRepository,
                         @Value("${ticket.qr.storage-path:../ticket-worker/tickets/qr}") String qrStoragePath) {
        this.registrationRepository = registrationRepository;
        this.qrStoragePath = Paths.get(qrStoragePath).toAbsolutePath().normalize();
    }

    /**
     * Get all tickets for the current user
     */
    public List<TicketResponse> getMyTickets(User userid) {
        List<Registration> registrations = registrationRepository
                .findByUserId(userid.getId(), Pageable.unpaged()).getContent();
        return registrations.stream()
                .map(this::toTicketResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get a single ticket by code (user must own it or be ADMIN/ORGANIZER)
     */
    public TicketResponse getTicketByCode(String ticketCode, User user) {
        Registration registration = registrationRepository.findByTicketCode(ticketCode)
                .orElseThrow(() -> new IllegalArgumentException("Ticket not found: " + ticketCode));

        // Check ownership: user must own the ticket OR be ADMIN
        boolean isOwner = registration.getUser().getId().equals(user.getId());
        boolean isAdmin = user.getRole().name().equals("ADMIN");
        boolean isOrganizer = registration.getEvent().getOrganizer().getId().equals(user.getId());

        if (!isOwner && !isAdmin && !isOrganizer) {
            throw new SecurityException("You don't have permission to view this ticket");
        }

        return toTicketResponse(registration);
    }

    /**
     * Get QR code image for a ticket
     */
    public Resource getQRCodeImage(String ticketCode, User user) {
        // First verify the ticket exists and user has access
        Registration registration = registrationRepository.findByTicketCode(ticketCode)
                .orElseThrow(() -> new IllegalArgumentException("Ticket not found: " + ticketCode));

        boolean isOwner = registration.getUser().getId().equals(user.getId());
        boolean isAdmin = user.getRole().name().equals("ADMIN");

        if (!isOwner && !isAdmin) {
            throw new SecurityException("You don't have permission to view this QR code");
        }

        // Check if registration is still valid
        if (registration.getStatus() == RegistrationStatus.CANCELLED) {
            throw new IllegalStateException("Cannot get QR code for cancelled registration");
        }

        // Load the QR image file
        try {
            Path filePath = qrStoragePath.resolve(ticketCode + ".png").normalize();

            if (!Files.exists(filePath)) {
                throw new IllegalStateException("QR code not yet generated. Please try again in a moment.");
            }

            Resource resource = new UrlResource(filePath.toUri());
            if (resource.exists() && resource.isReadable()) {
                return resource;
            } else {
                throw new IllegalStateException("QR code file exists but is not readable");
            }
        } catch (MalformedURLException e) {
            throw new RuntimeException("Error reading QR code file", e);
        }
    }

    /**
     * Validate a ticket (scan at event entrance)
     * This is idempotent for already-used tickets (returns alreadyUsed instead of error)
     */
    @Transactional
    public TicketValidationResponse validateTicket(String ticketCode) {
        // Step 1: Find the registration
        Registration registration = registrationRepository.findByTicketCode(ticketCode)
                .orElse(null);

        if (registration == null) {
            return TicketValidationResponse.invalid(ticketCode, "Ticket not found. Invalid ticket code.");
        }

        // Step 2: Check if registration is cancelled
        if (registration.getStatus() == RegistrationStatus.CANCELLED) {
            return TicketValidationResponse.invalid(ticketCode,
                    "This registration has been cancelled.");
        }

        // Step 3: Check if ticket is already used (idempotent!)
        if (registration.getCheckedInAt() != null) {
            return TicketValidationResponse.alreadyUsed(
                    ticketCode,
                    registration.getUser().getName(),
                    registration.getCheckedInAt()
            );
        }

        // Step 4: Check if the event is still valid
        Event event = registration.getEvent();
        if (event.getStatus().name().equals("CANCELLED")) {
            return TicketValidationResponse.invalid(ticketCode,
                    "This event has been cancelled.");
        }

        // Step 5: All checks passed! Mark as used
        registration.setCheckedInAt(LocalDateTime.now());
        registrationRepository.save(registration);

        return TicketValidationResponse.success(
                ticketCode,
                registration.getUser().getName(),
                registration.getUser().getEmail(),
                event.getTitle(),
                registration.getCheckedInAt()
        );
    }

    // --- Helper: Convert Registration to TicketResponse ---

    private TicketResponse toTicketResponse(Registration reg) {
        TicketResponse ticket = new TicketResponse();
        ticket.setId(reg.getId());
        ticket.setTicketCode(reg.getTicketCode());
        ticket.setStatus(reg.getStatus().name());
        ticket.setRegisteredAt(reg.getRegisteredAt());
        ticket.setCheckedInAt(reg.getCheckedInAt());

        // Check if QR code image exists on disk
        Path qrFile = qrStoragePath.resolve(reg.getTicketCode() + ".png");
        ticket.setQrReady(Files.exists(qrFile));

        // Event summary
        Event event = reg.getEvent();
        TicketResponse.EventSummary eventSummary = new TicketResponse.EventSummary();
        eventSummary.setId(event.getId());
        eventSummary.setTitle(event.getTitle());
        eventSummary.setLocation(event.getLocation());
        eventSummary.setStartDate(event.getStartDate());
        eventSummary.setEndDate(event.getEndDate());
        eventSummary.setStatus(event.getStatus().name());
        ticket.setEvent(eventSummary);

        // User summary
        User user = reg.getUser();
        TicketResponse.UserSummary userSummary = new TicketResponse.UserSummary();
        userSummary.setId(user.getId());
        userSummary.setName(user.getName());
        userSummary.setEmail(user.getEmail());
        ticket.setUser(userSummary);

        return ticket;
    }
}