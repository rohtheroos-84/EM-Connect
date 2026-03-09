package com.emconnect.api.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "event_reminders", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"event_id", "registration_id", "reminder_type"})
})
public class EventReminder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "event_id", nullable = false)
    private Long eventId;

    @Column(name = "registration_id", nullable = false)
    private Long registrationId;

    @Column(name = "reminder_type", nullable = false, length = 10)
    private String reminderType;

    @Column(name = "sent_at", nullable = false)
    private LocalDateTime sentAt = LocalDateTime.now();

    public EventReminder() {}

    public EventReminder(Long eventId, Long registrationId, String reminderType) {
        this.eventId = eventId;
        this.registrationId = registrationId;
        this.reminderType = reminderType;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getEventId() { return eventId; }
    public void setEventId(Long eventId) { this.eventId = eventId; }
    public Long getRegistrationId() { return registrationId; }
    public void setRegistrationId(Long registrationId) { this.registrationId = registrationId; }
    public String getReminderType() { return reminderType; }
    public void setReminderType(String reminderType) { this.reminderType = reminderType; }
    public LocalDateTime getSentAt() { return sentAt; }
    public void setSentAt(LocalDateTime sentAt) { this.sentAt = sentAt; }
}
