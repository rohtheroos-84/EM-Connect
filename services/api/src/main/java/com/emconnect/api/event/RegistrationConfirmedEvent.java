package com.emconnect.api.event;

import com.emconnect.api.entity.Registration;
import java.time.LocalDateTime;

/**
 * Event published when a user successfully registers for an event.
 */
public class RegistrationConfirmedEvent extends BaseEvent {

    public static final String TYPE = "REGISTRATION_CONFIRMED";

    private Long registrationId;
    private Long userId;
    private String userEmail;
    private String userName;
    private Long eventId;
    private String eventTitle;
    private String eventLocation;
    private LocalDateTime eventStartDate;
    private LocalDateTime eventEndDate;
    private String ticketCode;
    private long currentParticipants;

    // Default constructor for Jackson
    public RegistrationConfirmedEvent() {
        super(TYPE);
    }

    // Factory method to create from Registration entity
    public static RegistrationConfirmedEvent fromRegistration(Registration registration) {
        return fromRegistration(registration, 0);
    }

    // Factory method with participant count
    public static RegistrationConfirmedEvent fromRegistration(Registration registration, long currentParticipants) {
        RegistrationConfirmedEvent event = new RegistrationConfirmedEvent();
        event.setRegistrationId(registration.getId());
        event.setUserId(registration.getUser().getId());
        event.setUserEmail(registration.getUser().getEmail());
        event.setUserName(registration.getUser().getName());
        event.setEventId(registration.getEvent().getId());
        event.setEventTitle(registration.getEvent().getTitle());
        event.setEventLocation(registration.getEvent().getLocation());
        event.setEventStartDate(registration.getEvent().getStartDate());
        event.setEventEndDate(registration.getEvent().getEndDate());
        event.setTicketCode(registration.getTicketCode());
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

    public String getEventLocation() {
        return eventLocation;
    }

    public void setEventLocation(String eventLocation) {
        this.eventLocation = eventLocation;
    }

    public LocalDateTime getEventStartDate() {
        return eventStartDate;
    }

    public void setEventStartDate(LocalDateTime eventStartDate) {
        this.eventStartDate = eventStartDate;
    }

    public LocalDateTime getEventEndDate() {
        return eventEndDate;
    }

    public void setEventEndDate(LocalDateTime eventEndDate) {
        this.eventEndDate = eventEndDate;
    }

    public String getTicketCode() {
        return ticketCode;
    }

    public void setTicketCode(String ticketCode) {
        this.ticketCode = ticketCode;
    }

    public long getCurrentParticipants() {
        return currentParticipants;
    }

    public void setCurrentParticipants(long currentParticipants) {
        this.currentParticipants = currentParticipants;
    }

    @Override
    public String toString() {
        return "RegistrationConfirmedEvent{" +
                "registrationId=" + registrationId +
                ", userEmail='" + userEmail + '\'' +
                ", eventTitle='" + eventTitle + '\'' +
                ", ticketCode='" + ticketCode + '\'' +
                '}';
    }
}