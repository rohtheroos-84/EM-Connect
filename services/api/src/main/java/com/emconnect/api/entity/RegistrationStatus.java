package com.emconnect.api.entity;

public enum RegistrationStatus {
    CONFIRMED,   // Registration is active
    CANCELLED,   // User cancelled their registration
    ATTENDED,    // User attended the event (for check-in)
    NO_SHOW      // User didn't attend
}