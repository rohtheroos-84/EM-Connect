package config

import "os"

// Config holds all configuration
type Config struct {
    RabbitMQ RabbitMQConfig
    Server   ServerConfig
    Service  ServiceConfig
}

// RabbitMQConfig holds RabbitMQ connection settings
type RabbitMQConfig struct {
    URL           string
    Exchange      string
    Queue         string
    RoutingKeys   []string
    ConsumerTag   string
    PrefetchCount int
    DLQExchange   string
    DLQQueue      string
}

// ServerConfig holds HTTP/WebSocket server settings
type ServerConfig struct {
    Port string
}

// ServiceConfig holds service-level settings
type ServiceConfig struct {
    Name        string
    Environment string
}

// Load reads configuration from environment variables
func Load() *Config {
    return &Config{
        RabbitMQ: RabbitMQConfig{
            URL:      getEnv("RABBITMQ_URL", "amqp://emconnect:emconnect@localhost:5672/"),
            Exchange: getEnv("RABBITMQ_EXCHANGE", "em.events"),
            Queue:    getEnv("RABBITMQ_QUEUE", "websocket.queue"),
            RoutingKeys: []string{
                "event.published",
                "event.cancelled",
                "registration.confirmed",
                "registration.cancelled",
            },
            ConsumerTag:   getEnv("RABBITMQ_CONSUMER_TAG", "websocket-hub"),
            PrefetchCount: 10,
            DLQExchange:   getEnv("RABBITMQ_DLQ_EXCHANGE", "em.events.dlx"),
            DLQQueue:      getEnv("RABBITMQ_DLQ_QUEUE", "websocket.dlq"),
        },
        Server: ServerConfig{
            Port: getEnv("SERVER_PORT", "8081"),
        },
        Service: ServiceConfig{
            Name:        "websocket-hub",
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