package com.emconnect.api.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
@SuppressWarnings("null")
/**
 * RabbitMQ configuration for EM-Connect.
 * 
 * Topology:
 * - Exchange: em.events (topic)
 * - Queues: notification.queue, ticket.queue, websocket.queue
 * - Dead Letter: em.events.dlx → em.events.dlq
 */
@Configuration
public class RabbitMQConfig {

    // ==================== Exchange Names ====================
    public static final String EVENTS_EXCHANGE = "em.events";
    public static final String DEAD_LETTER_EXCHANGE = "em.events.dlx";

    // ==================== Queue Names ====================
    public static final String NOTIFICATION_QUEUE = "notification.queue";
    public static final String TICKET_QUEUE = "ticket.queue";
    public static final String WEBSOCKET_QUEUE = "websocket.queue";
    public static final String DEAD_LETTER_QUEUE = "em.events.dlq";

    // ==================== Routing Keys ====================
    public static final String ROUTING_REGISTRATION_CONFIRMED = "registration.confirmed";
    public static final String ROUTING_REGISTRATION_CANCELLED = "registration.cancelled";
    public static final String ROUTING_EVENT_PUBLISHED = "event.published";
    public static final String ROUTING_EVENT_CANCELLED = "event.cancelled";

    // Wildcard patterns for bindings
    public static final String ROUTING_REGISTRATION_ALL = "registration.*";
    public static final String ROUTING_EVENT_ALL = "event.*";

    // ==================== Exchanges ====================

    @Bean
    public TopicExchange eventsExchange() {
        return ExchangeBuilder
                .topicExchange(EVENTS_EXCHANGE)
                .durable(true)
                .build();
    }

    @Bean
    public TopicExchange deadLetterExchange() {
        return ExchangeBuilder
                .topicExchange(DEAD_LETTER_EXCHANGE)
                .durable(true)
                .build();
    }

    // ==================== Queues ====================

    @Bean
    public Queue notificationQueue() {
        return QueueBuilder
                .durable(NOTIFICATION_QUEUE)
                .withArgument("x-dead-letter-exchange", DEAD_LETTER_EXCHANGE)
                .build();
    }

    @Bean
    public Queue ticketQueue() {
        return QueueBuilder
                .durable(TICKET_QUEUE)
                .withArgument("x-dead-letter-exchange", DEAD_LETTER_EXCHANGE)
                .build();
    }

    @Bean
    public Queue websocketQueue() {
        return QueueBuilder
                .durable(WEBSOCKET_QUEUE)
                .withArgument("x-dead-letter-exchange", DEAD_LETTER_EXCHANGE)
                .build();
    }

    @Bean
    public Queue deadLetterQueue() {
        return QueueBuilder
                .durable(DEAD_LETTER_QUEUE)
                .build();
    }

    // ==================== Bindings ====================

    // Notification queue gets ALL registration and event messages
    @Bean
    public Binding notificationRegistrationBinding() {
        return BindingBuilder
                .bind(notificationQueue())
                .to(eventsExchange())
                .with(ROUTING_REGISTRATION_ALL);
    }

    @Bean
    public Binding notificationEventBinding() {
        return BindingBuilder
                .bind(notificationQueue())
                .to(eventsExchange())
                .with(ROUTING_EVENT_ALL);
    }

    // Ticket queue only gets registration.confirmed
    @Bean
    public Binding ticketBinding() {
        return BindingBuilder
                .bind(ticketQueue())
                .to(eventsExchange())
                .with(ROUTING_REGISTRATION_CONFIRMED);
    }

    // WebSocket queue gets ALL registration and event messages
    @Bean
    public Binding websocketRegistrationBinding() {
        return BindingBuilder
                .bind(websocketQueue())
                .to(eventsExchange())
                .with(ROUTING_REGISTRATION_ALL);
    }

    @Bean
    public Binding websocketEventBinding() {
        return BindingBuilder
                .bind(websocketQueue())
                .to(eventsExchange())
                .with(ROUTING_EVENT_ALL);
    }

    // Dead letter queue catches all failed messages
    @Bean
    public Binding deadLetterBinding() {
        return BindingBuilder
                .bind(deadLetterQueue())
                .to(deadLetterExchange())
                .with("#"); // Catch all
    }

    // ==================== Message Converter ====================

    /**
     * Use JSON for message serialization.
     * This allows any language (Go, Python, etc.) to consume our messages.
     */
    @Bean
    public MessageConverter jsonMessageConverter(
            com.fasterxml.jackson.databind.ObjectMapper objectMapper) {

        return new Jackson2JsonMessageConverter(objectMapper);
    }

    /**
     * Configure RabbitTemplate with JSON converter.
     */
    @Bean
    public RabbitTemplate rabbitTemplate(
            ConnectionFactory connectionFactory,
            MessageConverter messageConverter) {

        RabbitTemplate template = new RabbitTemplate(connectionFactory);
        template.setMessageConverter(messageConverter);

        template.setConfirmCallback((correlationData, ack, cause) -> {
            if (!ack) {
                System.err.println("Message delivery failed: " + cause);
            }
        });

        return template;
    }
}