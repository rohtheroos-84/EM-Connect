package com.emconnect.api.repository;

import com.emconnect.api.entity.Event;
import com.emconnect.api.entity.EventStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
//import java.util.List;

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
}