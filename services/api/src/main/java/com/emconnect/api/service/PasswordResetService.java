package com.emconnect.api.service;

import com.emconnect.api.entity.PasswordResetCode;
import com.emconnect.api.entity.User;
import com.emconnect.api.event.PasswordResetRequestedEvent;
import com.emconnect.api.event.UserPasswordChangedEvent;
import com.emconnect.api.repository.PasswordResetCodeRepository;
import com.emconnect.api.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class PasswordResetService {

    private static final Logger logger = LoggerFactory.getLogger(PasswordResetService.class);
    // private static final int CODE_LENGTH = 6;
    private static final int CODE_EXPIRY_MINUTES = 15;

    private final UserRepository userRepository;
    private final PasswordResetCodeRepository resetCodeRepository;
    private final PasswordEncoder passwordEncoder;
    private final EventPublisher eventPublisher;
    private final SecureRandom secureRandom = new SecureRandom();

    public PasswordResetService(UserRepository userRepository,
                                PasswordResetCodeRepository resetCodeRepository,
                                PasswordEncoder passwordEncoder,
                                EventPublisher eventPublisher) {
        this.userRepository = userRepository;
        this.resetCodeRepository = resetCodeRepository;
        this.passwordEncoder = passwordEncoder;
        this.eventPublisher = eventPublisher;
    }

    /**
     * Request a password reset. Generates a 6-digit code and sends it via email.
     * Always returns success to prevent email enumeration.
     */
    @Transactional
    public void requestReset(String email) {
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            // Don't reveal whether the email exists
            logger.info("Password reset requested for non-existent email: {}", email);
            return;
        }

        User user = userOpt.get();

        // OAuth-only users can't reset passwords
        if (user.getPassword() == null) {
            logger.info("Password reset requested for OAuth-only user: {}", email);
            return;
        }

        // Invalidate any previous unused codes for this user
        resetCodeRepository.invalidateAllForUser(user.getId());

        // Generate 6-digit code
        String code = generateCode();

        // Store the code
        PasswordResetCode resetCode = new PasswordResetCode(
                user,
                code,
                LocalDateTime.now().plusMinutes(CODE_EXPIRY_MINUTES)
        );
        resetCodeRepository.save(resetCode);

        // Publish event to send email via RabbitMQ
        eventPublisher.publishPasswordResetRequested(
                PasswordResetRequestedEvent.fromUser(user, code)
        );

        logger.info("Password reset code generated for user: {}", user.getId());
    }

    /**
     * Verify a reset code without consuming it.
     */
    @Transactional(readOnly = true)
    public boolean verifyCode(String email, String code) {
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            return false;
        }

        Optional<PasswordResetCode> resetCode = resetCodeRepository
                .findByUserIdAndCodeAndUsedFalse(userOpt.get().getId(), code);

        return resetCode.isPresent() && resetCode.get().getExpiresAt().isAfter(LocalDateTime.now());
    }

    /**
     * Reset the password using a valid code.
     */
    @Transactional
    public void resetPassword(String email, String code, String newPassword) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Invalid reset request"));

        PasswordResetCode resetCode = resetCodeRepository
                .findByUserIdAndCodeAndUsedFalse(user.getId(), code)
                .orElseThrow(() -> new IllegalArgumentException("Invalid or expired code"));

        if (resetCode.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Reset code has expired");
        }

        // Mark code as used
        resetCode.setUsed(true);
        resetCodeRepository.save(resetCode);

        // Update password
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        // Invalidate any other unused codes
        resetCodeRepository.invalidateAllForUser(user.getId());

        // Notify user about successful password reset
        eventPublisher.publishUserPasswordChanged(UserPasswordChangedEvent.fromUser(user));

        logger.info("Password reset successful for user: {}", user.getId());
    }

    private String generateCode() {
        int code = secureRandom.nextInt(900000) + 100000; // 100000-999999
        return String.valueOf(code);
    }
}
