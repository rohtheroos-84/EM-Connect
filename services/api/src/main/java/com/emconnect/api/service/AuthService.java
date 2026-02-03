package com.emconnect.api.service;

import com.emconnect.api.dto.AuthResponse;
import com.emconnect.api.dto.LoginRequest;
import com.emconnect.api.dto.RegisterRequest;
import com.emconnect.api.dto.UserResponse;
import com.emconnect.api.entity.User;
import com.emconnect.api.exception.EmailAlreadyExistsException;
import com.emconnect.api.exception.InvalidCredentialsException;
import com.emconnect.api.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public AuthResponse register(RegisterRequest request) {
        // Check if email already exists
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new EmailAlreadyExistsException(
                "An account with this email already exists"
            );
        }

        // Create new user
        User user = new User(
            request.getEmail(),
            passwordEncoder.encode(request.getPassword()),  // Hash password!
            request.getName()
        );

        // Save to database
        User savedUser = userRepository.save(user);

        // Return response
        return new AuthResponse(
            "Registration successful",
            new UserResponse(savedUser)
        );
    }

    public AuthResponse login(LoginRequest request) {
        // Find user by email
        User user = userRepository.findByEmail(request.getEmail())
            .orElseThrow(() -> new InvalidCredentialsException(
                "Invalid email or password"
            ));

        // Check password
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new InvalidCredentialsException("Invalid email or password");
        }

        // Return response (token will be added in Step 2.3)
        return new AuthResponse(
            "Login successful",
            new UserResponse(user)
        );
    }
}