package config

import (
    "os"
)

// Config holds all configuration
type Config struct {
    RabbitMQ RabbitMQConfig
    Ticket   TicketConfig
    Service  ServiceConfig
}

// RabbitMQConfig holds RabbitMQ connection settings
type RabbitMQConfig struct {
    URL           string
    Queue         string
    ConsumerTag   string
    PrefetchCount int
    DLQExchange   string
    DLQQueue      string
}

// TicketConfig holds ticket generation settings
type TicketConfig struct {
    SecretKey   string // HMAC signing key
    QROutputDir string // Where QR images are saved
    MetadataDir string // Where ticket metadata JSON files go
    QRSize      int    // QR image size in pixels
}

// ServiceConfig holds service-level settings
type ServiceConfig struct {
    Name        string
    Environment string
}

// Load reads configuration
func Load() *Config {
    return &Config{
        RabbitMQ: RabbitMQConfig{
            URL:           getEnv("RABBITMQ_URL", "amqp://emconnect:emconnect@localhost:5672/"),
            Queue:         getEnv("RABBITMQ_QUEUE", "ticket.queue"),
            ConsumerTag:   getEnv("RABBITMQ_CONSUMER_TAG", "ticket-worker"),
            PrefetchCount: 10,
            DLQExchange:   getEnv("RABBITMQ_DLQ_EXCHANGE", "em.events.dlq"),
            DLQQueue:      getEnv("RABBITMQ_DLQ_QUEUE", "ticket.dlq"),
        },
        Ticket: TicketConfig{
            SecretKey:   getEnv("TICKET_SECRET_KEY", "em-connect-ticket-secret-2026"),
            QROutputDir: getEnv("TICKET_QR_OUTPUT_DIR", "./tickets/qr"),
            MetadataDir: getEnv("TICKET_METADATA_DIR", "./tickets/metadata"),
            QRSize:      512,
        },
        Service: ServiceConfig{
            Name:        "ticket-worker",
            Environment: getEnv("ENVIRONMENT", "development"),
        },
    }
}

func getEnv(key, defaultValue string) string {
    if value, exists := os.LookupEnv(key); exists {
        return value
    }
    return defaultValue
}