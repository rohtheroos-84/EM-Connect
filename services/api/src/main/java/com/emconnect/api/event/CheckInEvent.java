package com.emconnect.api.event;

import com.emconnect.api.entity.Registration;
import java.time.LocalDateTime;

public class CheckInEvent extends BaseEvent {

    public static final String TYPE = "CHECK_IN";

    private Long registrationId;
    private Long userId;
    private String userEmail;
    private String userName;
    private Long eventId;
    private String eventTitle;
    private String eventLocation;
    private LocalDateTime eventStartDate;
    private String ticketCode;

    public CheckInEvent() {
        super(TYPE);
    }

    public static CheckInEvent fromRegistration(Registration registration) {
        CheckInEvent event = new CheckInEvent();
        event.setRegistrationId(registration.getId());
        event.setUserId(registration.getUser().getId());
        event.setUserEmail(registration.getUser().getEmail());
        event.setUserName(registration.getUser().getName());
        event.setEventId(registration.getEvent().getId());
        event.setEventTitle(registration.getEvent().getTitle());
        event.setEventLocation(registration.getEvent().getLocation());
        event.setEventStartDate(registration.getEvent().getStartDate());
        event.setTicketCode(registration.getTicketCode());
        return event;
    }

    public Long getRegistrationId() { return registrationId; }
    public void setRegistrationId(Long registrationId) { this.registrationId = registrationId; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public String getUserEmail() { return userEmail; }
    public void setUserEmail(String userEmail) { this.userEmail = userEmail; }
    public String getUserName() { return userName; }
    public void setUserName(String userName) { this.userName = userName; }
    public Long getEventId() { return eventId; }
    public void setEventId(Long eventId) { this.eventId = eventId; }
    public String getEventTitle() { return eventTitle; }
    public void setEventTitle(String eventTitle) { this.eventTitle = eventTitle; }
    public String getEventLocation() { return eventLocation; }
    public void setEventLocation(String eventLocation) { this.eventLocation = eventLocation; }
    public LocalDateTime getEventStartDate() { return eventStartDate; }
    public void setEventStartDate(LocalDateTime eventStartDate) { this.eventStartDate = eventStartDate; }
    public String getTicketCode() { return ticketCode; }
    public void setTicketCode(String ticketCode) { this.ticketCode = ticketCode; }
}
