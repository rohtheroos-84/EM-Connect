package com.emconnect.api.dto;

import com.emconnect.api.entity.Event;
import java.time.LocalDateTime;

public class EventResponse {

    private Long id;
    private String title;
    private String description;
    private String location;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private Integer capacity;
    private String status;
    private OrganizerInfo organizer;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Default constructor
    public EventResponse() {
    }

    // Constructor from Event entity
    public EventResponse(Event event) {
        this.id = event.getId();
        this.title = event.getTitle();
        this.description = event.getDescription();
        this.location = event.getLocation();
        this.startDate = event.getStartDate();
        this.endDate = event.getEndDate();
        this.capacity = event.getCapacity();
        this.status = event.getStatus().name();
        this.organizer = new OrganizerInfo(
            event.getOrganizer().getId(),
            event.getOrganizer().getName(),
            event.getOrganizer().getEmail()
        );
        this.createdAt = event.getCreatedAt();
        this.updatedAt = event.getUpdatedAt();
    }

    // Nested class for organizer info (avoids exposing full User)
    public static class OrganizerInfo {
        private Long id;
        private String name;
        private String email;

        public OrganizerInfo(Long id, String name, String email) {
            this.id = id;
            this.name = name;
            this.email = email;
        }

        public Long getId() {
            return id;
        }

        public String getName() {
            return name;
        }

        public String getEmail() {
            return email;
        }
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
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

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public OrganizerInfo getOrganizer() {
        return organizer;
    }

    public void setOrganizer(OrganizerInfo organizer) {
        this.organizer = organizer;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}