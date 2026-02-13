package consumer

import (
    "fmt"
    "log"

    amqp "github.com/rabbitmq/amqp091-go"

    "github.com/emconnect/notification-worker/config"
    "github.com/emconnect/notification-worker/handler"
)

// Consumer handles RabbitMQ message consumption
type Consumer struct {
    config     *config.Config
    connection *amqp.Connection
    channel    *amqp.Channel
    handler    *handler.MessageHandler
}

// NewConsumer creates a new RabbitMQ consumer
func NewConsumer(cfg *config.Config, h *handler.MessageHandler) *Consumer {
    return &Consumer{
        config:  cfg,
        handler: h,
    }
}

// Connect establishes connection to RabbitMQ
func (c *Consumer) Connect() error {
    log.Printf("🔌 Connecting to RabbitMQ at %s...", c.config.RabbitMQ.URL)

    var err error
    c.connection, err = amqp.Dial(c.config.RabbitMQ.URL)
    if err != nil {
        return fmt.Errorf("failed to connect to RabbitMQ: %w", err)
    }

    c.channel, err = c.connection.Channel()
    if err != nil {
        return fmt.Errorf("failed to open channel: %w", err)
    }

    // Set QoS (prefetch count) - how many messages to fetch at once
    err = c.channel.Qos(
        c.config.RabbitMQ.PrefetchCount, // prefetch count
        0,                                // prefetch size
        false,                            // global
    )
    if err != nil {
        return fmt.Errorf("failed to set QoS: %w", err)
    }

    log.Printf("✅ Connected to RabbitMQ successfully!")
    return nil
}

// Start begins consuming messages from the queue
func (c *Consumer) Start() error {
    log.Printf("📥 Starting to consume from queue: %s", c.config.RabbitMQ.Queue)

    // Start consuming
    messages, err := c.channel.Consume(
        c.config.RabbitMQ.Queue,      // queue
        c.config.RabbitMQ.ConsumerTag, // consumer tag
        false,                         // auto-ack (false = manual ack)
        false,                         // exclusive
        false,                         // no-local
        false,                         // no-wait
        nil,                           // args
    )
    if err != nil {
        return fmt.Errorf("failed to start consuming: %w", err)
    }

    log.Printf("👂 Waiting for messages. To exit press CTRL+C")

    // Process messages in a loop
    for msg := range messages {
        c.processMessage(msg)
    }

    return nil
}

func (c *Consumer) processMessage(msg amqp.Delivery) {
    log.Printf("─────────────────────────────────────────")
    log.Printf("📬 Message received (routing key: %s)", msg.RoutingKey)

	// DEBUG: Print the raw message body
    log.Printf("📄 Raw message: %s", string(msg.Body))
	
    // Process the message
    err := c.handler.HandleMessage(msg.Body)

    if err != nil {
        log.Printf("❌ Error processing message: %v", err)
        // Negative acknowledge - requeue the message
        // In production, you might want to limit retries or send to DLQ
        if nackErr := msg.Nack(false, true); nackErr != nil {
            log.Printf("❌ Error NACKing message: %v", nackErr)
        }
        return
    }

    // Acknowledge successful processing
    if ackErr := msg.Ack(false); ackErr != nil {
        log.Printf("❌ Error ACKing message: %v", ackErr)
    } else {
        log.Printf("✅ Message processed and acknowledged")
    }
}

// Close cleanly shuts down the consumer
func (c *Consumer) Close() {
    if c.channel != nil {
        c.channel.Close()
    }
    if c.connection != nil {
        c.connection.Close()
    }
    log.Printf("👋 Consumer closed")
}