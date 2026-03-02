package com.emconnect.api.repository;

import com.emconnect.api.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    // Find user by email (for login)
    Optional<User> findByEmail(String email);

    // Check if email already exists (for registration)
    boolean existsByEmail(String email);

    // ── Analytics ──

    @Query(value = "SELECT CAST(created_at AS DATE) as reg_date, COUNT(*) as cnt " +
                   "FROM users WHERE created_at >= :since " +
                   "GROUP BY CAST(created_at AS DATE) ORDER BY reg_date", nativeQuery = true)
    List<Object[]> countDailyNewUsers(@Param("since") LocalDateTime since);
}