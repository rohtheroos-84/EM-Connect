package main

import (
    "log"
    "os"
    "os/signal"
    "syscall"
    "time"

    "github.com/emconnect/ticket-worker/config"
    "github.com/emconnect/ticket-worker/consumer"
    "github.com/emconnect/ticket-worker/handler"
    "github.com/emconnect/ticket-worker/qr"
    "github.com/emconnect/ticket-worker/ticket"
)

func main() {
    log.SetFlags(log.LstdFlags | log.Lshortfile)
    log.Printf("🚀 Starting Ticket Worker...")

    // Load configuration
    cfg := config.Load()
    log.Printf("📋 Configuration loaded:")
    log.Printf("   Service: %s", cfg.Service.Name)
    log.Printf("   Environment: %s", cfg.Service.Environment)
    log.Printf("   Queue: %s", cfg.RabbitMQ.Queue)
    log.Printf("   QR Output: %s", cfg.Ticket.QROutputDir)
    log.Printf("   Metadata: %s", cfg.Ticket.MetadataDir)

    // Create QR generator
    qrGen, err := qr.NewGenerator(cfg.Ticket.QROutputDir, cfg.Ticket.QRSize)
    if err != nil {
        log.Fatalf("❌ Failed to create QR generator: %v", err)
    }

    // Create ticket service
    ticketService, err := ticket.NewService(cfg.Ticket.SecretKey, qrGen, cfg.Ticket.MetadataDir)
    if err != nil {
        log.Fatalf("❌ Failed to create ticket service: %v", err)
    }

    // Create handler
    h := handler.NewMessageHandler(ticketService)

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
            backoff *= 2
        }
    }

    return lastErr
}