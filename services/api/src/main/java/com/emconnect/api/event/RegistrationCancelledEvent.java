package com.emconnect.api.event;

import com.emconnect.api.entity.Registration;
import java.time.LocalDateTime;

/**
 * Event published when a user cancels their registration.
 */
public class RegistrationCancelledEvent extends BaseEvent {

    public static final String TYPE = "REGISTRATION_CANCELLED";

    private Long registrationId;
    private Long userId;
    private String userEmail;
    private String userName;
    private Long eventId;
    private String eventTitle;
    private LocalDateTime cancelledAt;
    private long currentParticipants;

    public RegistrationCancelledEvent() {
        super(TYPE);
    }

    public static RegistrationCancelledEvent fromRegistration(Registration registration) {
        return fromRegistration(registration, 0);
    }

    public static RegistrationCancelledEvent fromRegistration(Registration registration, long currentParticipants) {
        RegistrationCancelledEvent event = new RegistrationCancelledEvent();
        event.setRegistrationId(registration.getId());
        event.setUserId(registration.getUser().getId());
        event.setUserEmail(registration.getUser().getEmail());
        event.setUserName(registration.getUser().getName());
        event.setEventId(registration.getEvent().getId());
        event.setEventTitle(registration.getEvent().getTitle());
        event.setCancelledAt(registration.getCancelledAt());
        event.setCurrentParticipants(currentParticipants);
        return event;
    }

    // Getters and setters
    public Long getRegistrationId() {
        return registrationId;
    }

    public void setRegistrationId(Long registrationId) {
        this.registrationId = registrationId;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getUserEmail() {
        return userEmail;
    }

    public void setUserEmail(String userEmail) {
        this.userEmail = userEmail;
    }

    public String getUserName() {
        return userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
    }

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

    public LocalDateTime getCancelledAt() {
        return cancelledAt;
    }

    public void setCancelledAt(LocalDateTime cancelledAt) {
        this.cancelledAt = cancelledAt;
    }

    public long getCurrentParticipants() {
        return currentParticipants;
    }

    public void setCurrentParticipants(long currentParticipants) {
        this.currentParticipants = currentParticipants;
    }
}