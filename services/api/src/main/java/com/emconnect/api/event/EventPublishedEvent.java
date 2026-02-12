package com.emconnect.api.event;

import com.emconnect.api.entity.Event;
import java.time.LocalDateTime;

/**
 * Event published when an event is made public.
 */
public class EventPublishedEvent extends BaseEvent {

    public static final String TYPE = "EVENT_PUBLISHED";

    private Long eventId;
    private String eventTitle;
    private String eventDescription;
    private String eventLocation;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private Integer capacity;
    private Long organizerId;
    private String organizerName;
    private String organizerEmail;

    public EventPublishedEvent() {
        super(TYPE);
    }

    public static EventPublishedEvent fromEvent(Event event) {
        EventPublishedEvent e = new EventPublishedEvent();
        e.setEventId(event.getId());
        e.setEventTitle(event.getTitle());
        e.setEventDescription(event.getDescription());
        e.setEventLocation(event.getLocation());
        e.setStartDate(event.getStartDate());
        e.setEndDate(event.getEndDate());
        e.setCapacity(event.getCapacity());
        e.setOrganizerId(event.getOrganizer().getId());
        e.setOrganizerName(event.getOrganizer().getName());
        e.setOrganizerEmail(event.getOrganizer().getEmail());
        return e;
    }

    // Getters and setters
    public Long getEventId() {
        return eventId;
    }

    public void setEventId(Long eventId) {
        this.eventId = eventId;
    }

    public String getEventTitle() {
        return eventTitle;
    }

    public void setEventTitle(String eventTitle) {
        this.eventTitle = eventTitle;
    }

    public String getEventDescription() {
        return eventDescription;
    }

    public void setEventDescription(String eventDescription) {
        this.eventDescription = eventDescription;
    }

    public String getEventLocation() {
        return eventLocation;
    }

    public void setEventLocation(String eventLocation) {
        this.eventLocation = eventLocation;
    }

    public LocalDateTime getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDateTime startDate) {
        this.startDate = startDate;
    }

    public LocalDateTime getEndDate() {
        return endDate;
    }

    public void setEndDate(LocalDateTime endDate) {
        this.endDate = endDate;
    }

    public Integer getCapacity() {
        return capacity;
    }

    public void setCapacity(Integer capacity) {
        this.capacity = capacity;
    }

    public Long getOrganizerId() {
        return organizerId;
    }

    public void setOrganizerId(Long organizerId) {
        this.organizerId = organizerId;
    }

    public String getOrganizerName() {
        return organizerName;
    }

    public void setOrganizerName(String organizerName) {
        this.organizerName = organizerName;
    }

    public String getOrganizerEmail() {
        return organizerEmail;
    }

    public void setOrganizerEmail(String organizerEmail) {
        this.organizerEmail = organizerEmail;
    }
}