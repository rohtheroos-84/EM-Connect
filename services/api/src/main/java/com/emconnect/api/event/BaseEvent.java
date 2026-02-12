package com.emconnect.api.event;

import java.time.Instant;
import java.util.UUID;

/**
 * Base class for all domain events.
 * Contains common fields every event should have.
 */
public abstract class BaseEvent {

    private String eventId;          // Unique ID for this event instance
    private String eventType;        // Type of event (for routing/filtering)
    private Instant timestamp;       // When the event occurred

    protected BaseEvent() {
        this.eventId = UUID.randomUUID().toString();
        this.timestamp = Instant.now();
    }

    protected BaseEvent(String eventType) {
        this();
        this.eventType = eventType;
    }

    // Getters and setters
    public String getRegisteredEventId() {
        return eventId;
    }

    public void setEventId(String eventId) {
        this.eventId = eventId;
    }

    public String getEventType() {
        return eventType;
    }

    public void setEventType(String eventType) {
        this.eventType = eventType;
    }

    public Instant getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(Instant timestamp) {
        this.timestamp = timestamp;
    }
}