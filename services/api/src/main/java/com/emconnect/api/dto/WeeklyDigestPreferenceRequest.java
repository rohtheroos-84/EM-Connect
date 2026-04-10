package com.emconnect.api.dto;

public class WeeklyDigestPreferenceRequest {

    private boolean optIn;

    public WeeklyDigestPreferenceRequest() {
    }

    public boolean isOptIn() {
        return optIn;
    }

    public void setOptIn(boolean optIn) {
        this.optIn = optIn;
    }
}
