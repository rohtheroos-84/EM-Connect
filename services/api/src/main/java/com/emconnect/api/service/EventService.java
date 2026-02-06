package com.emconnect.api.service;

import com.emconnect.api.dto.CreateEventRequest;
import com.emconnect.api.dto.UpdateEventRequest;
import com.emconnect.api.entity.Event;
import com.emconnect.api.entity.EventStatus;
import com.emconnect.api.entity.User;
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
        // Validate end date is after start date
        if (request.getEndDate().isBefore(request.getStartDate())) {
            throw new IllegalArgumentException("End date must be after start date");
        }

        // Find the organizer
        User organizer = userRepository.findByEmail(organizerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Create the event
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

    // Get all published events with pagination
    public Page<Event> getPublishedEvents(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("startDate").ascending());
        return eventRepository.findByStatus(EventStatus.PUBLISHED, pageable);
    }

    // Get events by organizer
    public Page<Event> getEventsByOrganizer(String organizerEmail, int page, int size) {
        User organizer = userRepository.findByEmail(organizerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return eventRepository.findByOrganizerId(organizer.getId(), pageable);
    }

    // Search events by keyword
    public Page<Event> searchEvents(String keyword, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("startDate").ascending());
        return eventRepository.searchByTitle(EventStatus.PUBLISHED, keyword, pageable);
    }

    // Update event
    @Transactional
    public Event updateEvent(Long id, UpdateEventRequest request, String userEmail) {
        Event event = getEventById(id);

        // Check if user is the organizer
        if (!event.getOrganizer().getEmail().equals(userEmail)) {
            throw new AccessDeniedException("You can only edit your own events");
        }

        // Check if event can be edited (not completed or cancelled)
        if (event.getStatus() == EventStatus.COMPLETED || event.getStatus() == EventStatus.CANCELLED) {
            throw new IllegalStateException("Cannot edit a " + event.getStatus().name().toLowerCase() + " event");
        }

        // Update fields if provided
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

        // Validate dates if both are present
        if (event.getEndDate().isBefore(event.getStartDate())) {
            throw new IllegalArgumentException("End date must be after start date");
        }

        return eventRepository.save(event);
    }

    // Delete event
    @Transactional
    public void deleteEvent(Long id, String userEmail) {
        Event event = getEventById(id);

        // Check if user is the organizer
        if (!event.getOrganizer().getEmail().equals(userEmail)) {
            throw new AccessDeniedException("You can only delete your own events");
        }

        // Only allow deleting DRAFT events (or add soft delete later)
        if (event.getStatus() != EventStatus.DRAFT) {
            throw new IllegalStateException("Can only delete draft events. Cancel published events instead.");
        }

        eventRepository.delete(event);
    }

    // Publish event (DRAFT → PUBLISHED)
    @Transactional
    public Event publishEvent(Long id, String userEmail) {
        Event event = getEventById(id);

        // Check if user is the organizer
        if (!event.getOrganizer().getEmail().equals(userEmail)) {
            throw new AccessDeniedException("You can only publish your own events");
        }

        // Check current status
        if (event.getStatus() != EventStatus.DRAFT) {
            throw new IllegalStateException("Only draft events can be published");
        }

        event.setStatus(EventStatus.PUBLISHED);
        return eventRepository.save(event);
    }

    // Cancel event
    @Transactional
    public Event cancelEvent(Long id, String userEmail) {
        Event event = getEventById(id);

        // Check if user is the organizer
        if (!event.getOrganizer().getEmail().equals(userEmail)) {
            throw new AccessDeniedException("You can only cancel your own events");
        }

        // Check if event can be cancelled
        if (event.getStatus() == EventStatus.COMPLETED || event.getStatus() == EventStatus.CANCELLED) {
            throw new IllegalStateException("Cannot cancel a " + event.getStatus().name().toLowerCase() + " event");
        }

        event.setStatus(EventStatus.CANCELLED);
        return eventRepository.save(event);
    }
}