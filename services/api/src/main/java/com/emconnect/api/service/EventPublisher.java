package com.emconnect.api.service;

import com.emconnect.api.config.RabbitMQConfig;
import com.emconnect.api.event.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;

/**
 * Service responsible for publishing domain events to RabbitMQ.
 * 
 * This is the single point of contact for all event publishing.
 * It encapsulates the routing logic and provides a clean API.
 */
@Service
public class EventPublisher {

    private static final Logger logger = LoggerFactory.getLogger(EventPublisher.class);

    private final RabbitTemplate rabbitTemplate;

    public EventPublisher(RabbitTemplate rabbitTemplate) {
        this.rabbitTemplate = rabbitTemplate;
    }

    /**
     * Publish a registration confirmed event.
     */
    public void publishRegistrationConfirmed(RegistrationConfirmedEvent event) {
        publish(RabbitMQConfig.ROUTING_REGISTRATION_CONFIRMED, event);
        logger.info("Published RegistrationConfirmedEvent: registrationId={}, userEmail={}, eventTitle={}",
                event.getRegistrationId(), event.getUserEmail(), event.getEventTitle());
    }

    /**
     * Publish a registration cancelled event.
     */
    public void publishRegistrationCancelled(RegistrationCancelledEvent event) {
        publish(RabbitMQConfig.ROUTING_REGISTRATION_CANCELLED, event);
        logger.info("Published RegistrationCancelledEvent: registrationId={}, userEmail={}",
                event.getRegistrationId(), event.getUserEmail());
    }

    /**
     * Publish an event published event.
     */
    public void publishEventPublished(EventPublishedEvent event) {
        publish(RabbitMQConfig.ROUTING_EVENT_PUBLISHED, event);
        logger.info("Published EventPublishedEvent: eventId={}, eventTitle={}",
                event.getEventId(), event.getEventTitle());
    }

    /**
     * Publish an event cancelled event.
     */
    public void publishEventCancelled(EventCancelledEvent event) {
        publish(RabbitMQConfig.ROUTING_EVENT_CANCELLED, event);
        logger.info("Published EventCancelledEvent: eventId={}, affectedRegistrations={}",
                event.getEventId(), event.getAffectedRegistrations());
    }

    /**
     * Internal method to send message to RabbitMQ.
     */
    private void publish(String routingKey, Object event) {
        try {
            rabbitTemplate.convertAndSend(
                    RabbitMQConfig.EVENTS_EXCHANGE,
                    routingKey,
                    event
            );
        } catch (Exception e) {
            // Log but don't fail the main operation
            // In production, you might use a transactional outbox pattern
            logger.error("Failed to publish event with routing key {}: {}",
                    routingKey, e.getMessage(), e);
        }
    }
}