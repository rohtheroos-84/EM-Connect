package com.emconnect.api.exception;

public class InvalidStateTransitionException extends RuntimeException {
    
    private final String currentState;
    private final String attemptedState;
    
    public InvalidStateTransitionException(String currentState, String attemptedState) {
        super(String.format("Cannot transition from %s to %s", currentState, attemptedState));
        this.currentState = currentState;
        this.attemptedState = attemptedState;
    }
    
    public InvalidStateTransitionException(String message) {
        super(message);
        this.currentState = null;
        this.attemptedState = null;
    }
    
    public String getCurrentState() {
        return currentState;
    }
    
    public String getAttemptedState() {
        return attemptedState;
    }
}