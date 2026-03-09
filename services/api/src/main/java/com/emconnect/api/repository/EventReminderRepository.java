package com.emconnect.api.repository;

import com.emconnect.api.entity.EventReminder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface EventReminderRepository extends JpaRepository<EventReminder, Long> {

    boolean existsByEventIdAndRegistrationIdAndReminderType(Long eventId, Long registrationId, String reminderType);
}
