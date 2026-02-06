package com.emconnect.api.entity;

public enum EventStatus {
    DRAFT,      // Event is being created, not visible to users
    PUBLISHED,  // Event is live and accepting registrations
    CANCELLED,  // Event has been cancelled
    COMPLETED   // Event has ended
}