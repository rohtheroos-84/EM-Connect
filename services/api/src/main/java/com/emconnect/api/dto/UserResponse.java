// filepath: c:\Users\rohit\Downloads\EM-Connect\services\api\src\main\java\com\emconnect\api\dto\UserResponse.java
package com.emconnect.api.dto;

import com.emconnect.api.entity.User;
import java.time.LocalDateTime;

public class UserResponse {

    private Long id;
    private String email;
    private String name;
    private String role;
    private LocalDateTime createdAt;

    // Default constructor
    public UserResponse() {
    }

    // Constructor from User entity
    public UserResponse(User user) {
        this.id = user.getId();
        this.email = user.getEmail();
        this.name = user.getName();
        this.role = user.getRole().name();  // Convert enum to string
        this.createdAt = user.getCreatedAt();
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}