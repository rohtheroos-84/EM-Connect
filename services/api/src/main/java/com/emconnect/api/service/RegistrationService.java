package com.emconnect.api.service;

import com.emconnect.api.entity.*;
import com.emconnect.api.event.RegistrationCancelledEvent;
import com.emconnect.api.event.RegistrationConfirmedEvent;
import com.emconnect.api.exception.*;
import com.emconnect.api.repository.EventRepository;
import com.emconnect.api.repository.RegistrationRepository;
import com.emconnect.api.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
@SuppressWarnings("null")
@Service
public class RegistrationService {

    private static final Logger logger = LoggerFactory.getLogger(RegistrationService.class);

    private final RegistrationRepository registrationRepository;
    private final EventRepository eventRepository;
    private final UserRepository userRepository;
    private final EventPublisher eventPublisher;

    public RegistrationService(RegistrationRepository registrationRepository,
                               EventRepository eventRepository,
                               UserRepository userRepository,
                               EventPublisher eventPublisher) {
        this.registrationRepository = registrationRepository;
        this.eventRepository = eventRepository;
        this.userRepository = userRepository;
        this.eventPublisher = eventPublisher;
    }

    /**
     * Register a user for an event (with pessimistic locking for capacity safety).
     */
    @Transactional
    public Registration registerForEvent(Long eventId, String userEmail) {
        // Step 1: Find the user
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Step 2: Lock the event row
        Event event = eventRepository.findByIdWithLock(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found with id: " + eventId));

        logger.info("Locked event {} for registration by user {}", eventId, userEmail);

        // Step 3: Validate business rules
        validateRegistration(event, user);

        // Step 4: Check if user has a cancelled registration (reactivate it)
        var existingRegistration = registrationRepository.findByUserIdAndEventId(
            user.getId(), event.getId()
        );

        Registration registration;
        if (existingRegistration.isPresent() && 
            existingRegistration.get().getStatus() == RegistrationStatus.CANCELLED) {
            // Reactivate the cancelled registration
            registration = existingRegistration.get();
            registration.setStatus(RegistrationStatus.CONFIRMED);
            registration.setRegisteredAt(LocalDateTime.now());
            registration.setCancelledAt(null);
            logger.info("Reactivated registration {} for user {} on event {}", 
                registration.getId(), userEmail, eventId);
        } else {
            // Create new registration
            registration = new Registration(user, event);
            logger.info("Created new registration for user {} on event {}", userEmail, eventId);
        }

        // Step 5: Save
        registration = registrationRepository.save(registration);

        // Step 6: Get updated participant count (after this registration)
        long currentParticipants = registrationRepository.countByEventIdAndStatus(
                event.getId(), RegistrationStatus.CONFIRMED);

        // Step 7: Publish domain event (after successful save)
        try {
            RegistrationConfirmedEvent domainEvent = RegistrationConfirmedEvent.fromRegistration(
                    registration, currentParticipants);
            eventPublisher.publishRegistrationConfirmed(domainEvent);
        } catch (Exception e) {
            // Log but don't fail — the registration was successful
            logger.error("Failed to publish registration confirmed event: {}", e.getMessage());
        }

        return registration;
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
            throw new InvalidStateTransitionException(
                "Cannot cancel registration for an event that has already started"
            );
        }

        // Cancel the registration
        registration.cancel();
        logger.info("Cancelled registration {} for user {}", registrationId, userEmail);

        registration = registrationRepository.save(registration);

        // Get updated participant count (after cancellation)
        long currentParticipants = registrationRepository.countByEventIdAndStatus(
                registration.getEvent().getId(), RegistrationStatus.CONFIRMED);

        // Publish domain event
        try {
            RegistrationCancelledEvent domainEvent = RegistrationCancelledEvent.fromRegistration(
                    registration, currentParticipants);
            eventPublisher.publishRegistrationCancelled(domainEvent);
        } catch (Exception e) {
            logger.error("Failed to publish registration cancelled event: {}", e.getMessage());
        }

        return registration;
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
                .orElseThrow(() -> new ResourceNotFoundException(
                    "Registration not found with ticket code: " + ticketCode));
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
     * Get registrations for an event
     */
    public Page<Registration> getEventRegistrations(Long eventId, int page, int size) {
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
     * Get registration count for an event (only confirmed)
     */
    public long getEventRegistrationCount(Long eventId) {
        return registrationRepository.countByEventIdAndStatus(eventId, RegistrationStatus.CONFIRMED);
    }

    // ==================== Private Helper Methods ====================

    private void validateRegistration(Event event, User user) {
        if (!event.getStatus().acceptsRegistrations()) {
            throw new EventNotAvailableException(
                "Cannot register for this event",
                "Event is not accepting registrations (status: " + event.getStatus() + ")"
            );
        }

        if (event.getStartDate().isBefore(LocalDateTime.now())) {
            throw new EventNotAvailableException(
                "Cannot register for this event",
                "Event has already started"
            );
        }

        long currentRegistrations = registrationRepository.countByEventIdAndStatus(
            event.getId(), 
            RegistrationStatus.CONFIRMED
        );
        
        if (currentRegistrations >= event.getCapacity()) {
            logger.warn("Event {} is full ({}/{}). Rejecting registration for user {}", 
                event.getId(), currentRegistrations, event.getCapacity(), user.getEmail());
            throw new EventNotAvailableException(
                "Cannot register for this event",
                "Event is at full capacity (" + currentRegistrations + "/" + event.getCapacity() + ")"
            );
        }

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