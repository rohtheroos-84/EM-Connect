package com.emconnect.api.entity;

import java.util.EnumSet;
import java.util.Set;

public enum EventStatus {
    DRAFT,      // Event is being created, not visible to users
    PUBLISHED,  // Event is live and accepting registrations
    CANCELLED,  // Event has been cancelled
    COMPLETED;  // Event has ended

    // Define valid transitions for each state
    private static final Set<EventStatus> DRAFT_TRANSITIONS = EnumSet.of(PUBLISHED);
    private static final Set<EventStatus> PUBLISHED_TRANSITIONS = EnumSet.of(CANCELLED, COMPLETED);
    private static final Set<EventStatus> CANCELLED_TRANSITIONS = EnumSet.noneOf(EventStatus.class);
    private static final Set<EventStatus> COMPLETED_TRANSITIONS = EnumSet.noneOf(EventStatus.class);

    /**
     * Check if transition from this state to target state is allowed
     */
    public boolean canTransitionTo(EventStatus target) {
        return getAllowedTransitions().contains(target);
    }

    /**
     * Get all states this state can transition to
     */
    public Set<EventStatus> getAllowedTransitions() {
        return switch (this) {
            case DRAFT -> DRAFT_TRANSITIONS;
            case PUBLISHED -> PUBLISHED_TRANSITIONS;
            case CANCELLED -> CANCELLED_TRANSITIONS;
            case COMPLETED -> COMPLETED_TRANSITIONS;
        };
    }

    /**
     * Check if this is a terminal state (no further transitions allowed)
     */
    public boolean isTerminal() {
        return this == CANCELLED || this == COMPLETED;
    }

    /**
     * Check if event in this state is visible to public
     */
    public boolean isPubliclyVisible() {
        return this == PUBLISHED;
    }

    /**
     * Check if event in this state can be edited
     */
    public boolean isEditable() {
        return this == DRAFT || this == PUBLISHED;
    }

    /**
     * Check if event in this state accepts registrations
     */
    public boolean acceptsRegistrations() {
        return this == PUBLISHED;
    }
}