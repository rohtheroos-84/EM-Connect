package com.emconnect.api.service;

import com.emconnect.api.entity.*;
import com.emconnect.api.event.EventReminderEvent;
import com.emconnect.api.repository.EventReminderRepository;
import com.emconnect.api.repository.EventRepository;
import com.emconnect.api.repository.RegistrationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class EventReminderScheduler {

    private static final Logger logger = LoggerFactory.getLogger(EventReminderScheduler.class);

    private final EventRepository eventRepository;
    private final RegistrationRepository registrationRepository;
    private final EventReminderRepository eventReminderRepository;
    private final EventPublisher eventPublisher;

    public EventReminderScheduler(EventRepository eventRepository,
                                  RegistrationRepository registrationRepository,
                                  EventReminderRepository eventReminderRepository,
                                  EventPublisher eventPublisher) {
        this.eventRepository = eventRepository;
        this.registrationRepository = registrationRepository;
        this.eventReminderRepository = eventReminderRepository;
        this.eventPublisher = eventPublisher;
    }

    /**
     * Runs every 15 minutes. Sends 24-hour reminders for events starting in ~24 hours
     * and 1-hour reminders for events starting in ~1 hour.
     */
    @Scheduled(fixedRate = 900000) // 15 minutes
    public void sendReminders() {
        LocalDateTime now = LocalDateTime.now();

        // 24-hour reminders: events starting between 23h45m and 24h15m from now
        sendRemindersForWindow(now.plusHours(23).plusMinutes(45), now.plusHours(24).plusMinutes(15), "24H");

        // 1-hour reminders: events starting between 45m and 1h15m from now
        sendRemindersForWindow(now.plusMinutes(45), now.plusHours(1).plusMinutes(15), "1H");
    }

    private void sendRemindersForWindow(LocalDateTime from, LocalDateTime to, String reminderType) {
        List<Event> events = eventRepository.findPublishedEventsBetween(from, to);

        for (Event event : events) {
            List<Registration> registrations = registrationRepository
                    .findByEventIdAndStatus(event.getId(), RegistrationStatus.CONFIRMED, Pageable.unpaged())
                    .getContent();

            int sent = 0;
            for (Registration reg : registrations) {
                // Skip if already sent
                if (eventReminderRepository.existsByEventIdAndRegistrationIdAndReminderType(
                        event.getId(), reg.getId(), reminderType)) {
                    continue;
                }

                EventReminderEvent reminderEvent = new EventReminderEvent();
                reminderEvent.setUserId(reg.getUser().getId());
                reminderEvent.setUserEmail(reg.getUser().getEmail());
                reminderEvent.setUserName(reg.getUser().getName());
                reminderEvent.setEventId(event.getId());
                reminderEvent.setEventTitle(event.getTitle());
                reminderEvent.setEventLocation(event.getLocation());
                reminderEvent.setEventStartDate(event.getStartDate());
                reminderEvent.setTicketCode(reg.getTicketCode());
                reminderEvent.setReminderType(reminderType);

                eventPublisher.publishEventReminder(reminderEvent);

                // Record that we sent this reminder
                eventReminderRepository.save(new EventReminder(event.getId(), reg.getId(), reminderType));
                sent++;
            }

            if (sent > 0) {
                logger.info("Sent {} {} reminders for event '{}' (id={})",
                        sent, reminderType, event.getTitle(), event.getId());
            }
        }
    }
}
