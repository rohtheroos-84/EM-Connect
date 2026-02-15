package consumer

import (
    "fmt"
    "log"

    amqp "github.com/rabbitmq/amqp091-go"

    "github.com/emconnect/websocket-hub/config"
    "github.com/emconnect/websocket-hub/handler"
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

    err = c.channel.Qos(c.config.RabbitMQ.PrefetchCount, 0, false)
    if err != nil {
        return fmt.Errorf("failed to set QoS: %w", err)
    }

    // Setup queue topology
    if err := c.setupQueue(); err != nil {
        return fmt.Errorf("failed to setup queue: %w", err)
    }

    // Setup DLQ
    if err := c.setupDLQ(); err != nil {
        return fmt.Errorf("failed to setup DLQ: %w", err)
    }

    log.Printf("✅ Connected to RabbitMQ successfully!")
    return nil
}

func (c *Consumer) setupQueue() error {
    // Declare the main exchange
    err := c.channel.ExchangeDeclare(
        c.config.RabbitMQ.Exchange, "topic", true, false, false, false, nil,
    )
    if err != nil {
        return fmt.Errorf("failed to declare exchange: %w", err)
    }

    // Declare the queue with DLX argument
    args := amqp.Table{
        "x-dead-letter-exchange": c.config.RabbitMQ.DLQExchange,
    }

    _, err = c.channel.QueueDeclare(
        c.config.RabbitMQ.Queue, true, false, false, false, args,
    )
    if err != nil {
        return fmt.Errorf("failed to declare queue: %w", err)
    }

    // Bind queue to all routing keys
    for _, key := range c.config.RabbitMQ.RoutingKeys {
        err = c.channel.QueueBind(
            c.config.RabbitMQ.Queue, key, c.config.RabbitMQ.Exchange, false, nil,
        )
        if err != nil {
            return fmt.Errorf("failed to bind queue with key '%s': %w", key, err)
        }
        log.Printf("   🔗 Bound '%s' → '%s'", key, c.config.RabbitMQ.Queue)
    }

    log.Printf("📬 Queue '%s' declared with %d bindings", c.config.RabbitMQ.Queue, len(c.config.RabbitMQ.RoutingKeys))
    return nil
}

func (c *Consumer) setupDLQ() error {
    err := c.channel.ExchangeDeclare(
        c.config.RabbitMQ.DLQExchange, "topic", true, false, false, false, nil,
    )
    if err != nil {
        return fmt.Errorf("failed to declare DLQ exchange: %w", err)
    }

    _, err = c.channel.QueueDeclare(
        c.config.RabbitMQ.DLQQueue, true, false, false, false, nil,
    )
    if err != nil {
        return fmt.Errorf("failed to declare DLQ queue: %w", err)
    }

    err = c.channel.QueueBind(
        c.config.RabbitMQ.DLQQueue, "websocket.failed", c.config.RabbitMQ.DLQExchange, false, nil,
    )
    if err != nil {
        return fmt.Errorf("failed to bind DLQ queue: %w", err)
    }

    log.Printf("📭 Dead Letter Queue configured: %s", c.config.RabbitMQ.DLQQueue)
    return nil
}

// Start begins consuming messages
func (c *Consumer) Start() error {
    log.Printf("📥 Starting to consume from queue: %s", c.config.RabbitMQ.Queue)

    messages, err := c.channel.Consume(
        c.config.RabbitMQ.Queue, c.config.RabbitMQ.ConsumerTag,
        false, false, false, false, nil,
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

    err := c.handler.HandleMessage(msg.Body)

    if err != nil {
        log.Printf("❌ Error processing message: %v", err)
        c.sendToDLQ(msg, err.Error())
        if ackErr := msg.Ack(false); ackErr != nil {
            log.Printf("❌ Error ACKing failed message: %v", ackErr)
        }
        return
    }

    if ackErr := msg.Ack(false); ackErr != nil {
        log.Printf("❌ Error ACKing message: %v", ackErr)
    } else {
        log.Printf("✅ Message processed and acknowledged")
    }
}

func (c *Consumer) sendToDLQ(msg amqp.Delivery, errorMsg string) {
    headers := amqp.Table{
        "x-original-routing-key": msg.RoutingKey,
        "x-error-message":        errorMsg,
        "x-original-exchange":    msg.Exchange,
    }

    err := c.channel.Publish(
        c.config.RabbitMQ.DLQExchange, "websocket.failed", false, false,
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