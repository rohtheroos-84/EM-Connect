package com.emconnect.api.repository;

import com.emconnect.api.entity.PasswordResetCode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface PasswordResetCodeRepository extends JpaRepository<PasswordResetCode, Long> {

    Optional<PasswordResetCode> findByUserIdAndCodeAndUsedFalse(Long userId, String code);

    @Modifying
    @Query("UPDATE PasswordResetCode p SET p.used = true WHERE p.user.id = :userId AND p.used = false")
    void invalidateAllForUser(Long userId);

    @Modifying
    @Query("DELETE FROM PasswordResetCode p WHERE p.expiresAt < :cutoff")
    void deleteExpired(LocalDateTime cutoff);
}
