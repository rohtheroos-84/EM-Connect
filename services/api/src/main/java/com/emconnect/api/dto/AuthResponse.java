package com.emconnect.api.dto;

public class AuthResponse {

    private String message;
    private UserResponse user;
    private String token;  // We'll use this in Step 2.3

    // Default constructor
    public AuthResponse() {
    }

    // Constructor without token (for now)
    public AuthResponse(String message, UserResponse user) {
        this.message = message;
        this.user = user;
        this.token = null;
    }

    // Constructor with token (for later)
    public AuthResponse(String message, UserResponse user, String token) {
        this.message = message;
        this.user = user;
        this.token = token;
    }

    // Getters and Setters
    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public UserResponse getUser() {
        return user;
    }

    public void setUser(UserResponse user) {
        this.user = user;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }
}