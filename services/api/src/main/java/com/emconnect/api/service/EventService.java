package com.emconnect.api.service;

import com.emconnect.api.dto.CreateEventRequest;
import com.emconnect.api.dto.UpdateEventRequest;
import com.emconnect.api.entity.Event;
import com.emconnect.api.entity.EventStatus;
import com.emconnect.api.entity.RegistrationStatus;
import com.emconnect.api.entity.User;
import com.emconnect.api.event.EventCancelledEvent;
import com.emconnect.api.event.EventPublishedEvent;
import com.emconnect.api.exception.InvalidStateTransitionException;
import com.emconnect.api.exception.ResourceNotFoundException;
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
//import java.util.List;

@Service
public class EventService {

    private static final Logger logger = LoggerFactory.getLogger(EventService.class);

    private final EventRepository eventRepository;
    private final UserRepository userRepository;
    private final RegistrationRepository registrationRepository;
    private final EventPublisher eventPublisher;

    public EventService(EventRepository eventRepository, 
                        UserRepository userRepository,
                        RegistrationRepository registrationRepository,
                        EventPublisher eventPublisher) {
        this.eventRepository = eventRepository;
        this.userRepository = userRepository;
        this.registrationRepository = registrationRepository;
        this.eventPublisher = eventPublisher;
    }

    /**
     * Create a new event (draft status by default)
     */
    @Transactional
    public Event createEvent(CreateEventRequest request, String organizerEmail) {
        User organizer = userRepository.findByEmail(organizerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Event event = new Event();
        event.setTitle(request.getTitle());
        event.setDescription(request.getDescription());
        event.setLocation(request.getLocation());
        event.setStartDate(request.getStartDate());
        event.setEndDate(request.getEndDate());
        event.setCapacity(request.getCapacity());
        event.setOrganizer(organizer);
        event.setStatus(EventStatus.DRAFT);

        return eventRepository.save(event);
    }

    /**
     * Update an event
     */
    @Transactional
    public Event updateEvent(Long eventId, UpdateEventRequest request, String userEmail) {
        Event event = getEventForOrganizer(eventId, userEmail);

        // Only allow updates if event is in DRAFT status
        if (event.getStatus() != EventStatus.DRAFT) {
            throw new InvalidStateTransitionException(
                    "Cannot update event in " + event.getStatus() + " status. Only DRAFT events can be updated.");
        }

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

        return eventRepository.save(event);
    }

    /**
     * Publish an event (DRAFT → PUBLISHED)
     */
    @Transactional
    public Event publishEvent(Long eventId, String userEmail) {
        Event event = getEventForOrganizer(eventId, userEmail);

        if (!event.getStatus().canTransitionTo(EventStatus.PUBLISHED)) {
            throw new InvalidStateTransitionException(
                    "Cannot publish event from " + event.getStatus() + " status");
        }

        // Validate event is in the future
        if (event.getStartDate().isBefore(LocalDateTime.now())) {
            throw new InvalidStateTransitionException("Cannot publish an event that has already started");
        }

        event.setStatus(EventStatus.PUBLISHED);
        event = eventRepository.save(event);

        // Publish domain event
        try {
            EventPublishedEvent domainEvent = EventPublishedEvent.fromEvent(event);
            eventPublisher.publishEventPublished(domainEvent);
        } catch (Exception e) {
            logger.error("Failed to publish event published event: {}", e.getMessage());
        }

        return event;
    }

    /**
     * Cancel an event (any status → CANCELLED)
     */
    @Transactional
    public Event cancelEvent(Long eventId, String userEmail) {
        Event event = getEventForOrganizer(eventId, userEmail);

        if (!event.getStatus().canTransitionTo(EventStatus.CANCELLED)) {
            throw new InvalidStateTransitionException(
                    "Cannot cancel event from " + event.getStatus() + " status");
        }

        // Count affected registrations before cancelling
        int affectedRegistrations = (int) registrationRepository.countByEventIdAndStatus(
            eventId, RegistrationStatus.CONFIRMED
        );

        event.setStatus(EventStatus.CANCELLED);
        event = eventRepository.save(event);

        // Publish domain event
        try {
            EventCancelledEvent domainEvent = EventCancelledEvent.fromEvent(event, affectedRegistrations);
            eventPublisher.publishEventCancelled(domainEvent);
        } catch (Exception e) {
            logger.error("Failed to publish event cancelled event: {}", e.getMessage());
        }

        return event;
    }

    /**
     * Get a single event by ID (public access for published events)
     */
    public Event getEventById(Long eventId) {
        return eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found with id: " + eventId));
    }

    /**
     * Get published events (public listing)
     */
    public Page<Event> getPublishedEvents(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("startDate").ascending());
        return eventRepository.findByStatus(EventStatus.PUBLISHED, pageable);
    }

    /**
     * Get upcoming published events
     */
    public Page<Event> getUpcomingEvents(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("startDate").ascending());
        return eventRepository.findUpcomingPublishedEvents(LocalDateTime.now(), pageable);
    }

    /**
     * Get events organized by a specific user
     */
    public Page<Event> getEventsByOrganizer(String organizerEmail, int page, int size) {
        User organizer = userRepository.findByEmail(organizerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return eventRepository.findByOrganizerId(organizer.getId(), pageable);
    }

    /**
     * Search events by title
     */
    public Page<Event> searchEvents(String query, int page, int size) {
        if (query == null || query.trim().isEmpty()) {
            return getPublishedEvents(page, size);
        }

        Pageable pageable = PageRequest.of(page, size, Sort.by("startDate").ascending());
        return eventRepository.searchByTitle(EventStatus.PUBLISHED, query.trim(), pageable);
    }

    /**
     * Delete an event (only DRAFT or CANCELLED)
     */
    @Transactional
    public void deleteEvent(Long eventId, String userEmail) {
        Event event = getEventForOrganizer(eventId, userEmail);

        if (event.getStatus() == EventStatus.PUBLISHED) {
            throw new InvalidStateTransitionException(
                    "Cannot delete a published event. Cancel it first.");
        }

        eventRepository.delete(event);
    }

    @Transactional
    public Event completeEvent(Long eventId, String userEmail) {
        Event event = getEventForOrganizer(eventId, userEmail);

        if (!event.getStatus().canTransitionTo(EventStatus.COMPLETED)) {
            throw new InvalidStateTransitionException(
                    "Cannot complete event from " + event.getStatus() + " status");
        }

        event.setStatus(EventStatus.COMPLETED);
        return eventRepository.save(event);
    }

    // ==================== Private Helper Methods ====================

    private Event getEventForOrganizer(Long eventId, String userEmail) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found with id: " + eventId));

        if (!event.getOrganizer().getEmail().equals(userEmail)) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "You are not the organizer of this event");
        }

        return event;
    }
}