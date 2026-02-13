package main

import (
    "log"
    "os"
    "os/signal"
    "syscall"

    "github.com/emconnect/notification-worker/config"
    "github.com/emconnect/notification-worker/consumer"
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

    // Create handler
    h := handler.NewMessageHandler()

    // Create consumer
    c := consumer.NewConsumer(cfg, h)

    // Connect to RabbitMQ
    if err := c.Connect(); err != nil {
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