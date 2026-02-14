package com.emconnect.api.dto;

import java.time.LocalDateTime;

public class TicketValidationResponse {
    private boolean valid;
    private String message;
    private String ticketCode;
    private String userName;
    private String userEmail;
    private String eventTitle;
    private LocalDateTime checkedInAt;

    // Static factory methods for common responses
    public static TicketValidationResponse success(String ticketCode, String userName,
                                                    String userEmail, String eventTitle,
                                                    LocalDateTime checkedInAt) {
        TicketValidationResponse r = new TicketValidationResponse();
        r.valid = true;
        r.message = "Ticket validated successfully. Welcome!";
        r.ticketCode = ticketCode;
        r.userName = userName;
        r.userEmail = userEmail;
        r.eventTitle = eventTitle;
        r.checkedInAt = checkedInAt;
        return r;
    }

    public static TicketValidationResponse alreadyUsed(String ticketCode, String userName,
                                                        LocalDateTime checkedInAt) {
        TicketValidationResponse r = new TicketValidationResponse();
        r.valid = false;
        r.message = "Ticket already used. Checked in at: " + checkedInAt;
        r.ticketCode = ticketCode;
        r.userName = userName;
        r.checkedInAt = checkedInAt;
        return r;
    }

    public static TicketValidationResponse invalid(String ticketCode, String message) {
        TicketValidationResponse r = new TicketValidationResponse();
        r.valid = false;
        r.message = message;
        r.ticketCode = ticketCode;
        return r;
    }

    // Getters & Setters
    public boolean isValid() { return valid; }
    public void setValid(boolean valid) { this.valid = valid; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public String getTicketCode() { return ticketCode; }
    public void setTicketCode(String ticketCode) { this.ticketCode = ticketCode; }

    public String getUserName() { return userName; }
    public void setUserName(String userName) { this.userName = userName; }

    public String getUserEmail() { return userEmail; }
    public void setUserEmail(String userEmail) { this.userEmail = userEmail; }

    public String getEventTitle() { return eventTitle; }
    public void setEventTitle(String eventTitle) { this.eventTitle = eventTitle; }

    public LocalDateTime getCheckedInAt() { return checkedInAt; }
    public void setCheckedInAt(LocalDateTime checkedInAt) { this.checkedInAt = checkedInAt; }
}