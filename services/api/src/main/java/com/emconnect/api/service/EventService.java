package com.emconnect.api.service;

import com.emconnect.api.dto.CreateEventRequest;
import com.emconnect.api.dto.UpdateEventRequest;
import com.emconnect.api.entity.Event;
import com.emconnect.api.entity.EventStatus;
import com.emconnect.api.entity.User;
import com.emconnect.api.exception.InvalidStateTransitionException;
import com.emconnect.api.exception.ResourceNotFoundException;
import com.emconnect.api.repository.EventRepository;
import com.emconnect.api.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class EventService {

    private final EventRepository eventRepository;
    private final UserRepository userRepository;

    public EventService(EventRepository eventRepository, UserRepository userRepository) {
        this.eventRepository = eventRepository;
        this.userRepository = userRepository;
    }

    // Create a new event
    @Transactional
    public Event createEvent(CreateEventRequest request, String organizerEmail) {
        // Business rule: end date must be after start date
        validateEventDates(request.getStartDate(), request.getEndDate());

        // Find the organizer
        User organizer = userRepository.findByEmail(organizerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Create the event (always starts as DRAFT)
        Event event = new Event();
        event.setTitle(request.getTitle());
        event.setDescription(request.getDescription());
        event.setLocation(request.getLocation());
        event.setStartDate(request.getStartDate());
        event.setEndDate(request.getEndDate());
        event.setCapacity(request.getCapacity());
        event.setStatus(EventStatus.DRAFT);
        event.setOrganizer(organizer);

        return eventRepository.save(event);
    }

    // Get event by ID
    public Event getEventById(Long id) {
        return eventRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found with id: " + id));
    }

    // Get all published events with pagination (public)
    public Page<Event> getPublishedEvents(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("startDate").ascending());
        return eventRepository.findByStatus(EventStatus.PUBLISHED, pageable);
    }

    // Get events by organizer (includes all statuses for the owner)
    public Page<Event> getEventsByOrganizer(String organizerEmail, int page, int size) {
        User organizer = userRepository.findByEmail(organizerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return eventRepository.findByOrganizerId(organizer.getId(), pageable);
    }

    // Search events by keyword (only published)
    public Page<Event> searchEvents(String keyword, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("startDate").ascending());
        return eventRepository.searchByTitle(EventStatus.PUBLISHED, keyword, pageable);
    }

    // Update event
    @Transactional
    public Event updateEvent(Long id, UpdateEventRequest request, String userEmail) {
        Event event = getEventById(id);

        // Authorization: only organizer can edit
        verifyOrganizer(event, userEmail);

        // State rule: can only edit events in editable states
        if (!event.getStatus().isEditable()) {
            throw new InvalidStateTransitionException(
                "Cannot edit event in " + event.getStatus() + " state"
            );
        }

        // Update fields if provided (partial update)
        if (request.getTitle() != null) {
            event.setTitle(request.getTitle());
        }
        if (request.getDescription() != null) {
            event.setDescription(request.getDescription());
        }
        if (request.getLocation() != null) {
            event.setLocation(request.getLocation());
        }
        if (request.getStartDate() != null) {
            event.setStartDate(request.getStartDate());
        }
        if (request.getEndDate() != null) {
            event.setEndDate(request.getEndDate());
        }
        if (request.getCapacity() != null) {
            event.setCapacity(request.getCapacity());
        }

        // Business rule: validate dates after update
        validateEventDates(event.getStartDate(), event.getEndDate());

        return eventRepository.save(event);
    }

    // Delete event (only DRAFT events can be deleted)
    @Transactional
    public void deleteEvent(Long id, String userEmail) {
        Event event = getEventById(id);

        // Authorization: only organizer can delete
        verifyOrganizer(event, userEmail);

        // State rule: only DRAFT events can be deleted
        if (event.getStatus() != EventStatus.DRAFT) {
            throw new InvalidStateTransitionException(
                "Can only delete draft events. Use cancel for published events."
            );
        }

        eventRepository.delete(event);
    }

    // Publish event (DRAFT → PUBLISHED)
    @Transactional
    public Event publishEvent(Long id, String userEmail) {
        Event event = getEventById(id);

        // Authorization: only organizer can publish
        verifyOrganizer(event, userEmail);

        // State transition validation
        transitionState(event, EventStatus.PUBLISHED);

        return eventRepository.save(event);
    }

    // Cancel event (DRAFT/PUBLISHED → CANCELLED)
    @Transactional
    public Event cancelEvent(Long id, String userEmail) {
        Event event = getEventById(id);

        // Authorization: only organizer can cancel
        verifyOrganizer(event, userEmail);

        // DRAFT events can be cancelled too (they skip to CANCELLED)
        if (event.getStatus() == EventStatus.DRAFT) {
            event.setStatus(EventStatus.CANCELLED);
        } else {
            // State transition validation for non-draft
            transitionState(event, EventStatus.CANCELLED);
        }

        return eventRepository.save(event);
    }

    // Complete event (PUBLISHED → COMPLETED)
    @Transactional
    public Event completeEvent(Long id, String userEmail) {
        Event event = getEventById(id);

        // Authorization: only organizer can complete
        verifyOrganizer(event, userEmail);

        // State transition validation
        transitionState(event, EventStatus.COMPLETED);

        return eventRepository.save(event);
    }

    // ==================== Helper Methods ====================

    /**
     * Verify that the user is the organizer of the event
     */
    private void verifyOrganizer(Event event, String userEmail) {
        if (!event.getOrganizer().getEmail().equals(userEmail)) {
            throw new AccessDeniedException("You can only manage your own events");
        }
    }

    /**
     * Validate event dates
     */
    private void validateEventDates(java.time.LocalDateTime startDate, java.time.LocalDateTime endDate) {
        if (endDate.isBefore(startDate)) {
            throw new IllegalArgumentException("End date must be after start date");
        }
        if (endDate.equals(startDate)) {
            throw new IllegalArgumentException("End date must be different from start date");
        }
    }

    /**
     * Transition event to a new state with validation
     */
    private void transitionState(Event event, EventStatus newStatus) {
        EventStatus currentStatus = event.getStatus();
        
        if (!currentStatus.canTransitionTo(newStatus)) {
            throw new InvalidStateTransitionException(
                currentStatus.name(), 
                newStatus.name()
            );
        }
        
        event.setStatus(newStatus);
    }
}