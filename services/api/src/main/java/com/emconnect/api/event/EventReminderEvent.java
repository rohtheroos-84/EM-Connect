package com.emconnect.api.event;

import java.time.LocalDateTime;

public class EventReminderEvent extends BaseEvent {

    public static final String TYPE = "EVENT_REMINDER";

    private Long userId;
    private String userEmail;
    private String userName;
    private Long eventId;
    private String eventTitle;
    private String eventLocation;
    private LocalDateTime eventStartDate;
    private String ticketCode;
    private String reminderType; // "24H" or "1H"

    public EventReminderEvent() {
        super(TYPE);
    }

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
    public String getReminderType() { return reminderType; }
    public void setReminderType(String reminderType) { this.reminderType = reminderType; }
}
