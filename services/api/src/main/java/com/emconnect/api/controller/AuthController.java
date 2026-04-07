package com.emconnect.api.controller;

import com.emconnect.api.dto.*;
import com.emconnect.api.service.AuthService;
import com.emconnect.api.service.PasswordResetService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final PasswordResetService passwordResetService;

    public AuthController(AuthService authService, PasswordResetService passwordResetService) {
        this.authService = authService;
        this.passwordResetService = passwordResetService;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(
            @Valid @RequestBody RegisterRequest request) {
        
        AuthResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest) {
        
        AuthResponse response = authService.login(
                request,
                resolveClientIp(httpRequest),
                sanitizeUserAgent(httpRequest.getHeader("User-Agent"))
        );
        return ResponseEntity.ok(response);
    }

    @PostMapping("/google")
    public ResponseEntity<AuthResponse> googleLogin(
            @Valid @RequestBody GoogleTokenRequest request,
            HttpServletRequest httpRequest) {

        AuthResponse response = authService.googleLogin(
                request.getCredential(),
                resolveClientIp(httpRequest),
                sanitizeUserAgent(httpRequest.getHeader("User-Agent"))
        );
        return ResponseEntity.ok(response);
    }

    private String resolveClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return truncate(forwarded.split(",")[0].trim(), 64);
        }

        String realIp = request.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isBlank()) {
            return truncate(realIp.trim(), 64);
        }

        return truncate(request.getRemoteAddr(), 64);
    }

    private String sanitizeUserAgent(String userAgent) {
        if (userAgent == null || userAgent.isBlank()) return null;
        return truncate(userAgent.trim(), 500);
    }

    private String truncate(String value, int maxLength) {
        if (value == null) return null;
        return value.length() <= maxLength ? value : value.substring(0, maxLength);
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, String>> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request) {

        passwordResetService.requestReset(request.getEmail());
        // Always return success to prevent email enumeration
        return ResponseEntity.ok(Map.of("message",
                "If an account with that email exists, a reset code has been sent."));
    }

    @PostMapping("/resend-reset-code")
    public ResponseEntity<Map<String, Object>> resendResetCode(
            @Valid @RequestBody ForgotPasswordRequest request) {

        passwordResetService.resendReset(request.getEmail());
        // Always return success to prevent email enumeration
        return ResponseEntity.ok(Map.of(
                "message", "If an account with that email exists, a reset code has been sent.",
                "cooldownSeconds", 30
        ));
    }

    @PostMapping("/verify-reset-code")
    public ResponseEntity<Map<String, Object>> verifyResetCode(
            @Valid @RequestBody VerifyResetCodeRequest request) {

        boolean valid = passwordResetService.verifyCode(request.getEmail(), request.getCode());
        if (!valid) {
            return ResponseEntity.badRequest().body(Map.of(
                    "valid", false,
                    "message", "Invalid or expired code"
            ));
        }
        return ResponseEntity.ok(Map.of(
                "valid", true,
                "message", "Code verified"
        ));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, String>> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request) {

        try {
            passwordResetService.resetPassword(
                    request.getEmail(), request.getCode(), request.getNewPassword());
            return ResponseEntity.ok(Map.of("message", "Password has been reset successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}