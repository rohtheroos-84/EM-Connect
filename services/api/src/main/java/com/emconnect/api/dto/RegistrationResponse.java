package com.emconnect.api.dto;

import com.emconnect.api.entity.Registration;
import java.time.LocalDateTime;

public class RegistrationResponse {

    private Long id;
    private String ticketCode;
    private String status;
    private LocalDateTime registeredAt;
    private LocalDateTime cancelledAt;
    private EventSummary event;
    private UserSummary user;

    // Default constructor
    public RegistrationResponse() {
    }

    // Constructor from Registration entity
    public RegistrationResponse(Registration registration) {
        this.id = registration.getId();
        this.ticketCode = registration.getTicketCode();
        this.status = registration.getStatus().name();
        this.registeredAt = registration.getRegisteredAt();
        this.cancelledAt = registration.getCancelledAt();
        this.event = new EventSummary(registration.getEvent());
        this.user = new UserSummary(registration.getUser());
    }

    // Nested class for event summary (avoid circular reference)
    public static class EventSummary {
        private Long id;
        private String title;
        private String location;
        private LocalDateTime startDate;
        private LocalDateTime endDate;
        private String status;

        public EventSummary(com.emconnect.api.entity.Event event) {
            this.id = event.getId();
            this.title = event.getTitle();
            this.location = event.getLocation();
            this.startDate = event.getStartDate();
            this.endDate = event.getEndDate();
            this.status = event.getStatus().name();
        }

        // Getters
        public Long getId() { return id; }
        public String getTitle() { return title; }
        public String getLocation() { return location; }
        public LocalDateTime getStartDate() { return startDate; }
        public LocalDateTime getEndDate() { return endDate; }
        public String getStatus() { return status; }
    }

    // Nested class for user summary
    public static class UserSummary {
        private Long id;
        private String name;
        private String email;

        public UserSummary(com.emconnect.api.entity.User user) {
            this.id = user.getId();
            this.name = user.getName();
            this.email = user.getEmail();
        }

        // Getters
        public Long getId() { return id; }
        public String getName() { return name; }
        public String getEmail() { return email; }
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTicketCode() {
        return ticketCode;
    }

    public void setTicketCode(String ticketCode) {
        this.ticketCode = ticketCode;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getRegisteredAt() {
        return registeredAt;
    }

    public void setRegisteredAt(LocalDateTime registeredAt) {
        this.registeredAt = registeredAt;
    }

    public LocalDateTime getCancelledAt() {
        return cancelledAt;
    }

    public void setCancelledAt(LocalDateTime cancelledAt) {
        this.cancelledAt = cancelledAt;
    }

    public EventSummary getEvent() {
        return event;
    }

    public void setEvent(EventSummary event) {
        this.event = event;
    }

    public UserSummary getUser() {
        return user;
    }

    public void setUser(UserSummary user) {
        this.user = user;
    }
}