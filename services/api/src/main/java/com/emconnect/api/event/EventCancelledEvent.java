//main/java/com/emconnect/api/event/EventCancelledEvent.java
package com.emconnect.api.event;

import com.emconnect.api.entity.Event;
import java.time.LocalDateTime;

/**
 * Event published when an event is cancelled.
 */
public class EventCancelledEvent extends BaseEvent {

    public static final String TYPE = "EVENT_CANCELLED";

    private Long eventId;
    private String eventTitle;
    private LocalDateTime originalStartDate;
    private Long organizerId;
    private String organizerEmail;
    private int affectedRegistrations;

    public EventCancelledEvent() {
        super(TYPE);
    }

    public static EventCancelledEvent fromEvent(Event event, int affectedRegistrations) {
        EventCancelledEvent e = new EventCancelledEvent();
        e.setEventId(event.getId());
        e.setEventTitle(event.getTitle());
        e.setOriginalStartDate(event.getStartDate());
        e.setOrganizerId(event.getOrganizer().getId());
        e.setOrganizerEmail(event.getOrganizer().getEmail());
        e.setAffectedRegistrations(affectedRegistrations);
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

    public LocalDateTime getOriginalStartDate() {
        return originalStartDate;
    }

    public void setOriginalStartDate(LocalDateTime originalStartDate) {
        this.originalStartDate = originalStartDate;
    }

    public Long getOrganizerId() {
        return organizerId;
    }

    public void setOrganizerId(Long organizerId) {
        this.organizerId = organizerId;
    }

    public String getOrganizerEmail() {
        return organizerEmail;
    }

    public void setOrganizerEmail(String organizerEmail) {
        this.organizerEmail = organizerEmail;
    }

    public int getAffectedRegistrations() {
        return affectedRegistrations;
    }

    public void setAffectedRegistrations(int affectedRegistrations) {
        this.affectedRegistrations = affectedRegistrations;
    }
}