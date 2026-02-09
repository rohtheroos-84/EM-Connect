package com.emconnect.api.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "registrations", 
       uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "event_id"}))
public class Registration {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private RegistrationStatus status = RegistrationStatus.CONFIRMED;

    @Column(name = "ticket_code", unique = true, length = 50)
    private String ticketCode;

    @Column(name = "registered_at", nullable = false)
    private LocalDateTime registeredAt;

    @Column(name = "cancelled_at")
    private LocalDateTime cancelledAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    // Default constructor (required by JPA)
    public Registration() {
    }

    // Constructor for creating new registration
    public Registration(User user, Event event) {
        this.user = user;
        this.event = event;
        this.status = RegistrationStatus.CONFIRMED;
        this.registeredAt = LocalDateTime.now();
        this.ticketCode = generateTicketCode();
    }

    // Generate unique ticket code
    private String generateTicketCode() {
        // Format: EVT-{eventId}-{random UUID short}
        return "TKT-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }

    // Automatically set timestamps
    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        if (this.registeredAt == null) {
            this.registeredAt = LocalDateTime.now();
        }
        if (this.ticketCode == null) {
            this.ticketCode = generateTicketCode();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    // Cancel registration
    public void cancel() {
        this.status = RegistrationStatus.CANCELLED;
        this.cancelledAt = LocalDateTime.now();
    }

    // Check if registration is active
    public boolean isActive() {
        return this.status == RegistrationStatus.CONFIRMED;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public Event getEvent() {
        return event;
    }

    public void setEvent(Event event) {
        this.event = event;
    }

    public RegistrationStatus getStatus() {
        return status;
    }

    public void setStatus(RegistrationStatus status) {
        this.status = status;
    }

    public String getTicketCode() {
        return ticketCode;
    }

    public void setTicketCode(String ticketCode) {
        this.ticketCode = ticketCode;
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

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}