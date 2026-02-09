package com.emconnect.api.repository;

import com.emconnect.api.entity.Registration;
import com.emconnect.api.entity.RegistrationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RegistrationRepository extends JpaRepository<Registration, Long> {

    // Check if user is registered for event
    boolean existsByUserIdAndEventId(Long userId, Long eventId);

    // Check if user has active registration for event
    boolean existsByUserIdAndEventIdAndStatus(Long userId, Long eventId, RegistrationStatus status);

    // Find registration by user and event
    Optional<Registration> findByUserIdAndEventId(Long userId, Long eventId);

    // Find by ticket code
    Optional<Registration> findByTicketCode(String ticketCode);

    // Get all registrations for a user (with pagination)
    Page<Registration> findByUserId(Long userId, Pageable pageable);

    // Get active registrations for a user
    Page<Registration> findByUserIdAndStatus(Long userId, RegistrationStatus status, Pageable pageable);

    // Get all registrations for an event
    Page<Registration> findByEventId(Long eventId, Pageable pageable);

    // Get active registrations for an event
    Page<Registration> findByEventIdAndStatus(Long eventId, RegistrationStatus status, Pageable pageable);

    // Count active registrations for an event (for capacity check)
    long countByEventIdAndStatus(Long eventId, RegistrationStatus status);

    // Count all registrations for an event
    long countByEventId(Long eventId);

    // Get user's upcoming event registrations
    @Query("SELECT r FROM Registration r " +
           "WHERE r.user.id = :userId " +
           "AND r.status = :status " +
           "AND r.event.startDate > CURRENT_TIMESTAMP " +
           "ORDER BY r.event.startDate ASC")
    List<Registration> findUpcomingRegistrations(
            @Param("userId") Long userId,
            @Param("status") RegistrationStatus status
    );
}