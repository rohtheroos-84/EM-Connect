package com.emconnect.api.service;

import com.emconnect.api.entity.*;
import com.emconnect.api.exception.*;
import com.emconnect.api.repository.EventRepository;
import com.emconnect.api.repository.RegistrationRepository;
import com.emconnect.api.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class RegistrationService {

    private final RegistrationRepository registrationRepository;
    private final EventRepository eventRepository;
    private final UserRepository userRepository;

    public RegistrationService(RegistrationRepository registrationRepository,
                               EventRepository eventRepository,
                               UserRepository userRepository) {
        this.registrationRepository = registrationRepository;
        this.eventRepository = eventRepository;
        this.userRepository = userRepository;
    }

    /**
     * Register a user for an event
     */
    @Transactional
    public Registration registerForEvent(Long eventId, String userEmail) {
        // Find the user
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Find the event
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found with id: " + eventId));

        // Validate registration is allowed
        validateRegistration(event, user);

        // Check if user has a cancelled registration for this event (re-registration)
        var existingRegistration = registrationRepository.findByUserIdAndEventId(user.getId(), eventId);
        
        if (existingRegistration.isPresent()) {
            // Reactivate cancelled registration
            Registration registration = existingRegistration.get();
            registration.setStatus(RegistrationStatus.CONFIRMED);
            registration.setRegisteredAt(LocalDateTime.now());
            registration.setCancelledAt(null);
            // Generate new ticket code for reactivated registration
            registration.setTicketCode("TKT-" + java.util.UUID.randomUUID().toString().substring(0, 8).toUpperCase());
            return registrationRepository.save(registration);
        }

        // Create new registration
        Registration registration = new Registration(user, event);
        
        return registrationRepository.save(registration);
    }

    /**
     * Cancel a registration
     */
    @Transactional
    public Registration cancelRegistration(Long registrationId, String userEmail) {
        Registration registration = registrationRepository.findById(registrationId)
                .orElseThrow(() -> new ResourceNotFoundException("Registration not found"));

        // Verify the user owns this registration
        if (!registration.getUser().getEmail().equals(userEmail)) {
            throw new org.springframework.security.access.AccessDeniedException(
                "You can only cancel your own registrations"
            );
        }

        // Check if already cancelled
        if (registration.getStatus() == RegistrationStatus.CANCELLED) {
            throw new InvalidStateTransitionException("Registration is already cancelled");
        }

        // Check if event has already started
        if (registration.getEvent().getStartDate().isBefore(LocalDateTime.now())) {
            throw new InvalidStateTransitionException("Cannot cancel registration for an event that has already started");
        }

        // Cancel the registration
        registration.cancel();
        
        return registrationRepository.save(registration);
    }

    /**
     * Get registration by ID
     */
    public Registration getRegistrationById(Long id) {
        return registrationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Registration not found with id: " + id));
    }

    /**
     * Get registration by ticket code
     */
    public Registration getRegistrationByTicketCode(String ticketCode) {
        return registrationRepository.findByTicketCode(ticketCode)
                .orElseThrow(() -> new ResourceNotFoundException("Registration not found with ticket code: " + ticketCode));
    }

    /**
     * Get user's registrations
     */
    public Page<Registration> getUserRegistrations(String userEmail, int page, int size) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Pageable pageable = PageRequest.of(page, size, Sort.by("registeredAt").descending());
        return registrationRepository.findByUserId(user.getId(), pageable);
    }

    /**
     * Get user's active registrations only
     */
    public Page<Registration> getUserActiveRegistrations(String userEmail, int page, int size) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Pageable pageable = PageRequest.of(page, size, Sort.by("registeredAt").descending());
        return registrationRepository.findByUserIdAndStatus(
            user.getId(), 
            RegistrationStatus.CONFIRMED, 
            pageable
        );
    }

    /**
     * Get registrations for an event (organizer only would check in controller)
     */
    public Page<Registration> getEventRegistrations(Long eventId, int page, int size) {
        // Verify event exists
        if (!eventRepository.existsById(eventId)) {
            throw new ResourceNotFoundException("Event not found with id: " + eventId);
        }

        Pageable pageable = PageRequest.of(page, size, Sort.by("registeredAt").ascending());
        return registrationRepository.findByEventId(eventId, pageable);
    }

    /**
     * Check if user is registered for an event
     */
    public boolean isUserRegistered(Long eventId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        return registrationRepository.existsByUserIdAndEventIdAndStatus(
            user.getId(), 
            eventId, 
            RegistrationStatus.CONFIRMED
        );
    }

    /**
     * Get registration count for an event
     */
    public long getEventRegistrationCount(Long eventId) {
        return registrationRepository.countByEventIdAndStatus(eventId, RegistrationStatus.CONFIRMED);
    }

    // ==================== Private Helper Methods ====================

    /**
     * Validate that registration is allowed
     */
    private void validateRegistration(Event event, User user) {
        // Rule 1: Event must be published
        if (event.getStatus() != EventStatus.PUBLISHED) {
            throw new EventNotAvailableException(
                "Cannot register for this event",
                "Event is not published"
            );
        }

        // Rule 2: Event must not have started
        if (event.getStartDate().isBefore(LocalDateTime.now())) {
            throw new EventNotAvailableException(
                "Cannot register for this event",
                "Event has already started"
            );
        }

        // Rule 3: Check capacity
        long currentRegistrations = registrationRepository.countByEventIdAndStatus(
            event.getId(), 
            RegistrationStatus.CONFIRMED
        );
        if (currentRegistrations >= event.getCapacity()) {
            throw new EventNotAvailableException(
                "Cannot register for this event",
                "Event is at full capacity"
            );
        }

        // Rule 4: User must not already be registered
        if (registrationRepository.existsByUserIdAndEventIdAndStatus(
                user.getId(), 
                event.getId(), 
                RegistrationStatus.CONFIRMED)) {
            throw new DuplicateRegistrationException(
                "You are already registered for this event"
            );
        }
    }
}