package com.emconnect.api.service;

import com.emconnect.api.dto.ChangePasswordRequest;
import com.emconnect.api.dto.UpdateProfileRequest;
import com.emconnect.api.dto.UserResponse;
import com.emconnect.api.entity.User;
import com.emconnect.api.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Set;
import java.util.UUID;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    private static final String AVATAR_DIR = "avatars";
    private static final Set<String> ALLOWED_TYPES = Set.of(
        "image/jpeg", "image/png", "image/gif", "image/webp"
    );
    private static final long MAX_SIZE = 2 * 1024 * 1024; // 2 MB

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public UserResponse getProfile(String email) {
        User user = findByEmail(email);
        return new UserResponse(user);
    }

    public UserResponse updateProfile(String email, UpdateProfileRequest request) {
        User user = findByEmail(email);
        user.setName(request.getName().trim());
        User saved = userRepository.save(user);
        return new UserResponse(saved);
    }

    public void changePassword(String email, ChangePasswordRequest request) {
        User user = findByEmail(email);

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Current password is incorrect");
        }

        if (request.getCurrentPassword().equals(request.getNewPassword())) {
            throw new IllegalArgumentException("New password must be different from current password");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    public UserResponse uploadAvatar(String email, MultipartFile file) throws IOException {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("File is empty");
        }

        if (file.getSize() > MAX_SIZE) {
            throw new IllegalArgumentException("File size exceeds 2 MB limit");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_TYPES.contains(contentType)) {
            throw new IllegalArgumentException("Only JPEG, PNG, GIF, and WebP images are allowed");
        }

        User user = findByEmail(email);

        // Create avatar directory if it doesn't exist
        Path avatarDir = Paths.get(AVATAR_DIR);
        if (!Files.exists(avatarDir)) {
            Files.createDirectories(avatarDir);
        }

        // Delete old avatar if exists
        if (user.getAvatarUrl() != null) {
            Path oldFile = Paths.get(user.getAvatarUrl());
            Files.deleteIfExists(oldFile);
        }

        // Generate unique filename
        String ext = getExtension(file.getOriginalFilename());
        String filename = "avatar-" + user.getId() + "-" + UUID.randomUUID().toString().substring(0, 8) + ext;
        Path target = avatarDir.resolve(filename);

        // Save file
        Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);

        // Update user
        user.setAvatarUrl(AVATAR_DIR + "/" + filename);
        User saved = userRepository.save(user);

        return new UserResponse(saved);
    }

    public Path getAvatarPath(String filename) {
        Path path = Paths.get(AVATAR_DIR).resolve(filename).normalize();
        // Security: ensure path stays within avatar directory
        if (!path.startsWith(Paths.get(AVATAR_DIR))) {
            throw new IllegalArgumentException("Invalid path");
        }
        return path;
    }

    private User findByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    private String getExtension(String filename) {
        if (filename == null) return ".jpg";
        int dot = filename.lastIndexOf('.');
        return dot >= 0 ? filename.substring(dot) : ".jpg";
    }
}
