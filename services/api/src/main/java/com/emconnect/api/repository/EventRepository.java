package com.emconnect.api.repository;

import com.emconnect.api.entity.Event;
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
//import java.util.List;
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

    // Count events by organizer
    long countByOrganizerId(Long organizerId);

    // Pessimistic lock - locks the event row for registration
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT e FROM Event e WHERE e.id = :id")
    Optional<Event> findByIdWithLock(@Param("id") Long id);

    // Find upcoming published events
    @Query("SELECT e FROM Event e WHERE e.status = 'PUBLISHED' AND e.startDate > :now ORDER BY e.startDate ASC")
    Page<Event> findUpcomingPublishedEvents(@Param("now") LocalDateTime now, Pageable pageable);
}