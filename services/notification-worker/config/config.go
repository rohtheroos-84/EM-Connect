package config

import (
	"os"
	"strconv"
	"time"
)

// Config holds all configuration for the service
type Config struct {
	RabbitMQ RabbitMQConfig
	Email    EmailConfig
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
	// Dead Letter Queue settings
	DLQExchange string
	DLQQueue    string
}

// EmailConfig holds email service settings
type EmailConfig struct {
	SendGridAPIKey string
	FromAddress    string
	FromName       string
	MaxRetries     int
	RetryBackoff   time.Duration
}

// ServiceConfig holds service-level settings
type ServiceConfig struct {
	Name        string
	Environment string
}

// Load reads configuration from environment variables with defaults
func Load() *Config {
	return &Config{
		RabbitMQ: RabbitMQConfig{
			URL:           getEnv("RABBITMQ_URL", "amqp://emconnect:emconnect@localhost:5672/"),
			Exchange:      getEnv("RABBITMQ_EXCHANGE", "em.events"),
			Queue:         getEnv("RABBITMQ_QUEUE", "notification.queue"),
			RoutingKeys:   []string{"registration.*", "event.*"},
			ConsumerTag:   getEnv("RABBITMQ_CONSUMER_TAG", "notification-worker"),
			PrefetchCount: 10,
			DLQExchange:   getEnv("RABBITMQ_DLQ_EXCHANGE", "em.events.dlx"),
			DLQQueue:      getEnv("RABBITMQ_DLQ_QUEUE", "notification.dlq"),
		},
		Email: EmailConfig{
			SendGridAPIKey: getEnv("SENDGRID_API_KEY", ""),
			FromAddress:    getEnv("EMAIL_FROM_ADDRESS", "rohit84.official@gmail.com"),
			FromName:       getEnv("EMAIL_FROM_NAME", "EM-Connect"),
			MaxRetries:     getEnvInt("EMAIL_MAX_RETRIES", 3),
			RetryBackoff:   time.Duration(getEnvInt("EMAIL_RETRY_BACKOFF_MS", 1000)) * time.Millisecond,
		},
		Service: ServiceConfig{
			Name:        "notification-worker",
			Environment: getEnv("ENVIRONMENT", "development"),
		},
	}
}

// getEnv reads an environment variable or returns a default value
func getEnv(key, defaultValue string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return defaultValue
}

// getEnvInt reads an integer environment variable or returns a default
func getEnvInt(key string, defaultValue int) int {
	if value, exists := os.LookupEnv(key); exists {
		if intVal, err := strconv.Atoi(value); err == nil {
			return intVal
		}
	}
	return defaultValue
}
