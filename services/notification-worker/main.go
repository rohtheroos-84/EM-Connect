package main

import (
    "log"
    "os"
    "os/signal"
    "syscall"
    "time"

    "github.com/emconnect/notification-worker/config"
    "github.com/emconnect/notification-worker/consumer"
    "github.com/emconnect/notification-worker/email"
    "github.com/emconnect/notification-worker/handler"
)

func main() {
    log.SetFlags(log.LstdFlags | log.Lshortfile)
    log.Printf("🚀 Starting Notification Worker...")

    // Load configuration
    cfg := config.Load()
    log.Printf("📋 Configuration loaded:")
    log.Printf("   Service: %s", cfg.Service.Name)
    log.Printf("   Environment: %s", cfg.Service.Environment)
    log.Printf("   Queue: %s", cfg.RabbitMQ.Queue)
    log.Printf("   SMTP: %s:%d", cfg.Email.SMTPHost, cfg.Email.SMTPPort)

    // Create email service
    emailService := email.NewService(email.Config{
        SMTPHost:     cfg.Email.SMTPHost,
        SMTPPort:     cfg.Email.SMTPPort,
        FromAddress:  cfg.Email.FromAddress,
        FromName:     cfg.Email.FromName,
        MaxRetries:   cfg.Email.MaxRetries,
        RetryBackoff: cfg.Email.RetryBackoff,
    })

    // Create handler with email service
    h := handler.NewMessageHandler(emailService)

    // Create consumer
    c := consumer.NewConsumer(cfg, h)

    // Connect to RabbitMQ with retry
    if err := connectWithRetry(c, 5, 3*time.Second); err != nil {
        log.Fatalf("❌ Failed to connect: %v", err)
    }
    defer c.Close()

    // Handle graceful shutdown
    go func() {
        sigChan := make(chan os.Signal, 1)
        signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)
        <-sigChan
        log.Printf("\n⚠️  Shutdown signal received, closing consumer...")
        c.Close()
        os.Exit(0)
    }()

    // Start consuming (this blocks)
    if err := c.Start(); err != nil {
        log.Fatalf("❌ Consumer error: %v", err)
    }
}

// connectWithRetry attempts to connect with exponential backoff
func connectWithRetry(c *consumer.Consumer, maxRetries int, initialBackoff time.Duration) error {
    var lastErr error
    backoff := initialBackoff

    for attempt := 1; attempt <= maxRetries; attempt++ {
        err := c.Connect()
        if err == nil {
            return nil
        }

        lastErr = err
        log.Printf("⚠️ Connection attempt %d/%d failed: %v", attempt, maxRetries, err)

        if attempt < maxRetries {
            log.Printf("⏳ Retrying in %v...", backoff)
            time.Sleep(backoff)
            backoff *= 2 // Exponential backoff
        }
    }

    return lastErr
}