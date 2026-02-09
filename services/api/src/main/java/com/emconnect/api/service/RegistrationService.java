package com.emconnect.api.service;

import com.emconnect.api.entity.*;
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

@Service
public class RegistrationService {

    private static final Logger logger = LoggerFactory.getLogger(RegistrationService.class);

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
     * Register a user for an event (with pessimistic locking for capacity safety).
     * 
     * The flow:
     * 1. Find the user
     * 2. Lock the event row (SELECT ... FOR UPDATE)
     * 3. Validate all business rules
     * 4. Create or reactivate registration
     * 5. Commit → lock released
     * 
     * If two users try to register at the same time for the last seat:
     * - User A locks the event row
     * - User B waits (blocked by the lock)
     * - User A completes registration, commits, lock released
     * - User B now reads the updated count and sees event is full
     */
    @Transactional
    public Registration registerForEvent(Long eventId, String userEmail) {
        // Step 1: Find the user (no lock needed, user row isn't contended)
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Step 2: Lock the event row — this is the critical section
        // Other transactions trying to register for the SAME event will WAIT here
        Event event = eventRepository.findByIdWithLock(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found with id: " + eventId));

        logger.info("Locked event {} for registration by user {}", eventId, userEmail);

        // Step 3: Validate business rules (while we hold the lock)
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

        // Step 5: Save — on commit, the lock is released
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
            throw new InvalidStateTransitionException(
                "Cannot cancel registration for an event that has already started"
            );
        }

        // Cancel the registration
        registration.cancel();
        logger.info("Cancelled registration {} for user {}", registrationId, userEmail);

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

    /**
     * Validate that registration is allowed.
     * This is called WHILE holding the pessimistic lock on the event row.
     */
    private void validateRegistration(Event event, User user) {
        // Rule 1: Event must be published
        if (!event.getStatus().acceptsRegistrations()) {
            throw new EventNotAvailableException(
                "Cannot register for this event",
                "Event is not accepting registrations (status: " + event.getStatus() + ")"
            );
        }

        // Rule 2: Event must not have started
        if (event.getStartDate().isBefore(LocalDateTime.now())) {
            throw new EventNotAvailableException(
                "Cannot register for this event",
                "Event has already started"
            );
        }

        // Rule 3: Check capacity (this count is accurate because we hold the lock)
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

        // Rule 4: User must not already be actively registered
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