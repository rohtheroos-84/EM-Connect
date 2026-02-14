package com.emconnect.api.dto;

import java.time.LocalDateTime;

public class TicketResponse {
    private Long id;
    private String ticketCode;
    private String status;
    private LocalDateTime registeredAt;
    private LocalDateTime checkedInAt;
    private boolean qrReady;
    private EventSummary event;
    private UserSummary user;

    // --- Nested DTOs ---

    public static class EventSummary {
        private Long id;
        private String title;
        private String location;
        private LocalDateTime startDate;
        private LocalDateTime endDate;
        private String status;

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }
        public String getLocation() { return location; }
        public void setLocation(String location) { this.location = location; }
        public LocalDateTime getStartDate() { return startDate; }
        public void setStartDate(LocalDateTime startDate) { this.startDate = startDate; }
        public LocalDateTime getEndDate() { return endDate; }
        public void setEndDate(LocalDateTime endDate) { this.endDate = endDate; }
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
    }

    public static class UserSummary {
        private Long id;
        private String name;
        private String email;

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
    }

    // --- Getters & Setters ---

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTicketCode() { return ticketCode; }
    public void setTicketCode(String ticketCode) { this.ticketCode = ticketCode; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getRegisteredAt() { return registeredAt; }
    public void setRegisteredAt(LocalDateTime registeredAt) { this.registeredAt = registeredAt; }

    public LocalDateTime getCheckedInAt() { return checkedInAt; }
    public void setCheckedInAt(LocalDateTime checkedInAt) { this.checkedInAt = checkedInAt; }

    public boolean isQrReady() { return qrReady; }
    public void setQrReady(boolean qrReady) { this.qrReady = qrReady; }

    public EventSummary getEvent() { return event; }
    public void setEvent(EventSummary event) { this.event = event; }

    public UserSummary getUser() { return user; }
    public void setUser(UserSummary user) { this.user = user; }
}