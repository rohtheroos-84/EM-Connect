package com.emconnect.api.repository;

import com.emconnect.api.entity.Registration;
import com.emconnect.api.entity.RegistrationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
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

    // Count registrations by status (admin stats)
    long countByStatus(RegistrationStatus status);

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

    // ── Analytics queries ──

    @Query(value = "SELECT CAST(registered_at AS DATE) as reg_date, COUNT(*) as cnt " +
                   "FROM registrations WHERE registered_at >= :since " +
                   "GROUP BY CAST(registered_at AS DATE) ORDER BY reg_date", nativeQuery = true)
    List<Object[]> countDailyRegistrations(@Param("since") LocalDateTime since);

    @Query(value = "SELECT CAST(EXTRACT(HOUR FROM registered_at) AS INTEGER) as hr, COUNT(*) as cnt " +
                   "FROM registrations GROUP BY hr ORDER BY hr", nativeQuery = true)
    List<Object[]> countRegistrationsByHour();

    @Query(value = "SELECT CAST(EXTRACT(DOW FROM registered_at) AS INTEGER) as dow, COUNT(*) as cnt " +
                   "FROM registrations GROUP BY dow ORDER BY dow", nativeQuery = true)
    List<Object[]> countRegistrationsByDayOfWeek();

    @Query(value = "SELECT u.name as user_name, e.title as event_title, r.status, r.registered_at " +
                   "FROM registrations r JOIN users u ON r.user_id = u.id " +
                   "JOIN events e ON r.event_id = e.id " +
                   "ORDER BY r.registered_at DESC LIMIT 10", nativeQuery = true)
    List<Object[]> findRecentActivity();
}