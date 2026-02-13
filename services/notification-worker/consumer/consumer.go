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

    // Set QoS (prefetch count)
    err = c.channel.Qos(
        c.config.RabbitMQ.PrefetchCount,
        0,
        false,
    )
    if err != nil {
        return fmt.Errorf("failed to set QoS: %w", err)
    }

    // Setup Dead Letter Queue
    if err := c.setupDLQ(); err != nil {
        return fmt.Errorf("failed to setup DLQ: %w", err)
    }

    log.Printf("✅ Connected to RabbitMQ successfully!")
    return nil
}

// setupDLQ creates the Dead Letter Queue infrastructure
func (c *Consumer) setupDLQ() error {
    // Declare DLQ exchange
    err := c.channel.ExchangeDeclare(
        c.config.RabbitMQ.DLQExchange,
        "direct",
        true,  // durable
        false, // auto-delete
        false, // internal
        false, // no-wait
        nil,
    )
    if err != nil {
        return fmt.Errorf("failed to declare DLQ exchange: %w", err)
    }

    // Declare DLQ queue
    _, err = c.channel.QueueDeclare(
        c.config.RabbitMQ.DLQQueue,
        true,  // durable
        false, // auto-delete
        false, // exclusive
        false, // no-wait
        nil,
    )
    if err != nil {
        return fmt.Errorf("failed to declare DLQ queue: %w", err)
    }

    // Bind DLQ queue to DLQ exchange
    err = c.channel.QueueBind(
        c.config.RabbitMQ.DLQQueue,
        "notification.failed", // routing key
        c.config.RabbitMQ.DLQExchange,
        false,
        nil,
    )
    if err != nil {
        return fmt.Errorf("failed to bind DLQ queue: %w", err)
    }

    log.Printf("📭 Dead Letter Queue configured: %s", c.config.RabbitMQ.DLQQueue)
    return nil
}

// Start begins consuming messages from the queue
func (c *Consumer) Start() error {
    log.Printf("📥 Starting to consume from queue: %s", c.config.RabbitMQ.Queue)

    messages, err := c.channel.Consume(
        c.config.RabbitMQ.Queue,
        c.config.RabbitMQ.ConsumerTag,
        false, // auto-ack (false = manual ack)
        false, // exclusive
        false, // no-local
        false, // no-wait
        nil,
    )
    if err != nil {
        return fmt.Errorf("failed to start consuming: %w", err)
    }

    log.Printf("👂 Waiting for messages. To exit press CTRL+C")

    for msg := range messages {
        c.processMessage(msg)
    }

    return nil
}

func (c *Consumer) processMessage(msg amqp.Delivery) {
    log.Printf("─────────────────────────────────────────")
    log.Printf("📬 Message received (routing key: %s)", msg.RoutingKey)

    // Process the message
    err := c.handler.HandleMessage(msg.Body)

    if err != nil {
        log.Printf("❌ Error processing message: %v", err)
        
        // Send to Dead Letter Queue
        c.sendToDLQ(msg, err.Error())
        
        // Acknowledge the original message (don't requeue)
        if ackErr := msg.Ack(false); ackErr != nil {
            log.Printf("❌ Error ACKing failed message: %v", ackErr)
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

// sendToDLQ publishes failed message to Dead Letter Queue
func (c *Consumer) sendToDLQ(msg amqp.Delivery, errorMsg string) {
    headers := amqp.Table{
        "x-original-routing-key": msg.RoutingKey,
        "x-error-message":        errorMsg,
        "x-original-exchange":    msg.Exchange,
    }

    err := c.channel.Publish(
        c.config.RabbitMQ.DLQExchange,
        "notification.failed",
        false,
        false,
        amqp.Publishing{
            ContentType: msg.ContentType,
            Body:        msg.Body,
            Headers:     headers,
        },
    )
    if err != nil {
        log.Printf("❌ Failed to send to DLQ: %v", err)
    } else {
        log.Printf("📭 Message sent to Dead Letter Queue")
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