package com.emconnect.api.repository;

import com.emconnect.api.entity.Event;
import com.emconnect.api.entity.EventCategory;
import com.emconnect.api.entity.EventStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.Lock;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface EventRepository extends JpaRepository<Event, Long> {

    // Find events by status with pagination
    Page<Event> findByStatus(EventStatus status, Pageable pageable);

    // Find events by organizer
    Page<Event> findByOrganizerId(Long organizerId, Pageable pageable);

    // Find published events starting after a date
    Page<Event> findByStatusAndStartDateAfter(
            EventStatus status, 
            LocalDateTime date, 
            Pageable pageable
    );

    // Search events by title (case-insensitive)
    @Query("SELECT e FROM Event e WHERE e.status = :status AND LOWER(e.title) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    Page<Event> searchByTitle(
            @Param("status") EventStatus status,
            @Param("keyword") String keyword,
            Pageable pageable
    );

    // Search events by title with optional category filter
    @Query("SELECT e FROM Event e WHERE e.status = :status " +
           "AND LOWER(e.title) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "AND (:category IS NULL OR e.category = :category)")
    Page<Event> searchByTitleAndCategory(
            @Param("status") EventStatus status,
            @Param("keyword") String keyword,
            @Param("category") EventCategory category,
            Pageable pageable
    );

    // Find published events by category
    @Query("SELECT e FROM Event e WHERE e.status = :status AND e.category = :category")
    Page<Event> findByStatusAndCategory(
            @Param("status") EventStatus status,
            @Param("category") EventCategory category,
            Pageable pageable
    );

    // Search events by tag (case-insensitive LIKE on comma-separated tags column)
    @Query(value = "SELECT * FROM events e WHERE e.status = :status " +
                   "AND LOWER(e.tags) LIKE LOWER(CONCAT('%', :tag, '%'))",
           nativeQuery = true)
    Page<Event> findByStatusAndTag(
            @Param("status") String status,
            @Param("tag") String tag,
            Pageable pageable
    );

    // Search events by title, category, and tag
    @Query(value = "SELECT * FROM events e WHERE e.status = :status " +
                   "AND (:keyword = '' OR LOWER(e.title) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
                   "AND (:category = '' OR e.category = :category) " +
                   "AND (:tag = '' OR LOWER(e.tags) LIKE LOWER(CONCAT('%', :tag, '%')))",
           countQuery = "SELECT COUNT(*) FROM events e WHERE e.status = :status " +
                        "AND (:keyword = '' OR LOWER(e.title) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
                        "AND (:category = '' OR e.category = :category) " +
                        "AND (:tag = '' OR LOWER(e.tags) LIKE LOWER(CONCAT('%', :tag, '%')))",
           nativeQuery = true)
    Page<Event> searchEvents(
            @Param("status") String status,
            @Param("keyword") String keyword,
            @Param("category") String category,
            @Param("tag") String tag,
            Pageable pageable
    );

    // Get all distinct categories for published events
    @Query("SELECT DISTINCT e.category FROM Event e WHERE e.status = 'PUBLISHED' AND e.category IS NOT NULL")
    List<EventCategory> findDistinctCategories();

    // Count events by organizer
    long countByOrganizerId(Long organizerId);

    // Pessimistic lock - locks the event row for registration
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT e FROM Event e WHERE e.id = :id")
    Optional<Event> findByIdWithLock(@Param("id") Long id);

    // Find upcoming published events
    @Query("SELECT e FROM Event e WHERE e.status = 'PUBLISHED' AND e.startDate > :now ORDER BY e.startDate ASC")
    Page<Event> findUpcomingPublishedEvents(@Param("now") LocalDateTime now, Pageable pageable);

    // ── Analytics queries ──

    @Query(value = "SELECT e.title, COUNT(r.id) as reg_count, e.capacity " +
                   "FROM events e LEFT JOIN registrations r ON e.id = r.event_id AND r.status = 'CONFIRMED' " +
                   "WHERE e.status IN ('PUBLISHED', 'COMPLETED') " +
                   "GROUP BY e.id, e.title, e.capacity " +
                   "ORDER BY reg_count DESC LIMIT :lim", nativeQuery = true)
    List<Object[]> findPopularEvents(@Param("lim") int lim);

    @Query(value = "SELECT e.location, COUNT(*) as cnt FROM events e " +
                   "WHERE e.location IS NOT NULL AND e.location != '' " +
                   "AND e.status IN ('PUBLISHED', 'COMPLETED') " +
                   "GROUP BY e.location ORDER BY cnt DESC LIMIT :lim", nativeQuery = true)
    List<Object[]> findTopLocations(@Param("lim") int lim);

    long countByStatus(EventStatus status);

    // Find published events starting in a time window (for reminders)
    @Query("SELECT e FROM Event e WHERE e.status = 'PUBLISHED' AND e.startDate BETWEEN :from AND :to")
    List<Event> findPublishedEventsBetween(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);
}