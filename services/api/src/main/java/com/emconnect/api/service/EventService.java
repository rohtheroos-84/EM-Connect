package com.emconnect.api.service;

import com.emconnect.api.dto.CreateEventRequest;
import com.emconnect.api.dto.UpdateEventRequest;
import com.emconnect.api.entity.Event;
import com.emconnect.api.entity.EventCategory;
import com.emconnect.api.entity.EventStatus;
import com.emconnect.api.entity.RegistrationStatus;
import com.emconnect.api.entity.User;
import com.emconnect.api.event.EventCancelledEvent;
import com.emconnect.api.event.EventPublishedEvent;
import com.emconnect.api.event.EventUpdatedEvent;
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
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.UUID;
@SuppressWarnings("null")
@Service
public class EventService {

    private static final Logger logger = LoggerFactory.getLogger(EventService.class);

    private final EventRepository eventRepository;
    private final UserRepository userRepository;
    private final RegistrationRepository registrationRepository;
    private final EventPublisher eventPublisher;

    private static final String BANNER_DIR = "banners";
    private static final Set<String> ALLOWED_IMAGE_TYPES = Set.of(
        "image/jpeg", "image/png", "image/gif", "image/webp"
    );
    private static final long MAX_BANNER_SIZE = 5 * 1024 * 1024; // 5 MB

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

        // Set category if provided
        if (request.getCategory() != null && !request.getCategory().isBlank()) {
            try {
                event.setCategory(EventCategory.valueOf(request.getCategory().toUpperCase()));
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException("Invalid category: " + request.getCategory());
            }
        }

        // Set tags if provided
        if (request.getTags() != null) {
            event.setTagList(request.getTags());
        }

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
        if (request.getCategory() != null) {
            if (request.getCategory().isBlank()) {
                event.setCategory(null);
            } else {
                try {
                    event.setCategory(EventCategory.valueOf(request.getCategory().toUpperCase()));
                } catch (IllegalArgumentException e) {
                    throw new IllegalArgumentException("Invalid category: " + request.getCategory());
                }
            }
        }
        if (request.getTags() != null) {
            event.setTagList(request.getTags());
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
     * Search events by title with optional category and tag filters
     */
    public Page<Event> searchEvents(String query, String category, String tag, int page, int size) {
        String keyword = (query != null) ? query.trim() : "";
        String cat = (category != null) ? category.trim() : "";
        String t = (tag != null) ? tag.trim() : "";

        // If no filters at all, return published events (JPQL — uses Java property names)
        if (keyword.isEmpty() && cat.isEmpty() && t.isEmpty()) {
            Pageable pageable = PageRequest.of(page, size, Sort.by("startDate").ascending());
            return eventRepository.findByStatus(EventStatus.PUBLISHED, pageable);
        }

        // Native SQL query — must use actual column names for sort
        Pageable pageable = PageRequest.of(page, size, Sort.by("start_date").ascending());
        return eventRepository.searchEvents(
                EventStatus.PUBLISHED.name(), keyword, cat, t, pageable);
    }

    /**
     * Search events by title (backwards-compatible)
     */
    public Page<Event> searchEvents(String query, int page, int size) {
        return searchEvents(query, null, null, page, size);
    }

    /**
     * Get available categories for published events
     */
    public List<EventCategory> getAvailableCategories() {
        return eventRepository.findDistinctCategories();
    }

    /**
     * Upload a banner image for an event
     */
    @Transactional
    public Event uploadBanner(Long eventId, String userEmail, MultipartFile file) throws IOException {
        Event event = getEventForOrganizer(eventId, userEmail);

        if (file.isEmpty()) {
            throw new IllegalArgumentException("File is empty");
        }
        if (file.getSize() > MAX_BANNER_SIZE) {
            throw new IllegalArgumentException("File size exceeds 5 MB limit");
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_IMAGE_TYPES.contains(contentType)) {
            throw new IllegalArgumentException("Only JPEG, PNG, GIF, and WebP images are allowed");
        }

        // Create banner directory if it doesn't exist
        Path bannerDir = Paths.get(BANNER_DIR);
        if (!Files.exists(bannerDir)) {
            Files.createDirectories(bannerDir);
        }

        // Delete old banner if exists
        if (event.getBannerUrl() != null) {
            Path oldFile = Paths.get(event.getBannerUrl());
            Files.deleteIfExists(oldFile);
        }

        // Generate unique filename
        String ext = getExtension(file.getOriginalFilename());
        String filename = "banner-" + eventId + "-" + UUID.randomUUID().toString().substring(0, 8) + ext;
        Path target = bannerDir.resolve(filename);

        // Save file
        Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);

        // Update event
        event.setBannerUrl(BANNER_DIR + "/" + filename);
        return eventRepository.save(event);
    }

    /**
     * Get path for serving banner images
     */
    public Path getBannerPath(String filename) {
        Path path = Paths.get(BANNER_DIR).resolve(filename).normalize();
        if (!path.startsWith(Paths.get(BANNER_DIR))) {
            throw new IllegalArgumentException("Invalid path");
        }
        return path;
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

    /**
     * Get confirmed participant count for an event
     */
    public long getParticipantCount(Long eventId) {
        // Verify event exists
        getEventById(eventId);
        return registrationRepository.countByEventIdAndStatus(eventId, RegistrationStatus.CONFIRMED);
    }

    private Event getEventForOrganizer(Long eventId, String userEmail) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found with id: " + eventId));

        if (!event.getOrganizer().getEmail().equals(userEmail)) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "You are not the organizer of this event");
        }

        return event;
    }

    private String getExtension(String filename) {
        if (filename == null) return ".jpg";
        int dot = filename.lastIndexOf('.');
        return dot >= 0 ? filename.substring(dot) : ".jpg";
    }
}