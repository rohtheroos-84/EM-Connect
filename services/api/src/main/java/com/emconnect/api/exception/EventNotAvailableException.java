package com.emconnect.api.exception;

public class EventNotAvailableException extends RuntimeException {
    
    private final String reason;
    
    public EventNotAvailableException(String message, String reason) {
        super(message);
        this.reason = reason;
    }
    
    public EventNotAvailableException(String message) {
        super(message);
        this.reason = null;
    }
    
    public String getReason() {
        return reason;
    }
}