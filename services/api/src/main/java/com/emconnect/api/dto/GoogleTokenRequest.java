package com.emconnect.api.dto;

import jakarta.validation.constraints.NotBlank;

public class GoogleTokenRequest {

    @NotBlank(message = "Google credential is required")
    private String credential;

    public GoogleTokenRequest() {
    }

    public GoogleTokenRequest(String credential) {
        this.credential = credential;
    }

    public String getCredential() {
        return credential;
    }

    public void setCredential(String credential) {
        this.credential = credential;
    }
}
