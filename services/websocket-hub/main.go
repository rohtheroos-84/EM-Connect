package main

import (
    "encoding/json"
    "log"
    "net/http"
    "os"
    "os/signal"
    "syscall"
    "time"

    "github.com/emconnect/websocket-hub/config"
    "github.com/emconnect/websocket-hub/consumer"
    "github.com/emconnect/websocket-hub/handler"
    "github.com/emconnect/websocket-hub/hub"
)

func main() {
    log.SetFlags(log.LstdFlags | log.Lshortfile)
    log.Printf("🚀 Starting WebSocket Hub...")

    // Load configuration
    cfg := config.Load()
    log.Printf("📋 Configuration loaded:")
    log.Printf("   Service: %s", cfg.Service.Name)
    log.Printf("   Environment: %s", cfg.Service.Environment)
    log.Printf("   WebSocket Port: %s", cfg.Server.Port)
    log.Printf("   Queue: %s", cfg.RabbitMQ.Queue)

    // Create the hub
    wsHub := hub.NewHub()
    go wsHub.Run()

    // Create handler and consumer
    h := handler.NewMessageHandler(wsHub)
    c := consumer.NewConsumer(cfg, h)

    // Connect to RabbitMQ with retry
    if err := connectWithRetry(c, 5, 3*time.Second); err != nil {
        log.Fatalf("❌ Failed to connect to RabbitMQ: %v", err)
    }
    defer c.Close()

    // Start RabbitMQ consumer in background
    go func() {
        if err := c.Start(); err != nil {
            log.Printf("❌ Consumer error: %v", err)
        }
    }()

    // Setup HTTP routes
    mux := http.NewServeMux()

    // WebSocket endpoint
    mux.HandleFunc("/ws", wsHub.HandleWebSocket)

    // Health check
    mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
        w.Header().Set("Content-Type", "application/json")
        json.NewEncoder(w).Encode(map[string]interface{}{
            "status":  "UP",
            "service": cfg.Service.Name,
            "time":    time.Now().Format(time.RFC3339),
        })
    })

    // Stats endpoint
    mux.HandleFunc("/stats", func(w http.ResponseWriter, r *http.Request) {
        w.Header().Set("Content-Type", "application/json")
        json.NewEncoder(w).Encode(wsHub.Stats())
    })

    // Handle graceful shutdown
    go func() {
        sigChan := make(chan os.Signal, 1)
        signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)
        <-sigChan
        log.Printf("\n⚠️  Shutdown signal received...")
        c.Close()
        os.Exit(0)
    }()

    // Start HTTP server
    addr := ":" + cfg.Server.Port
    log.Printf("🌐 WebSocket server listening on ws://localhost%s/ws", addr)
    log.Printf("📊 Stats available at http://localhost%s/stats", addr)
    log.Printf("❤️  Health check at http://localhost%s/health", addr)

    if err := http.ListenAndServe(addr, mux); err != nil {
        log.Fatalf("❌ HTTP server error: %v", err)
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
        log.Printf("⚠️  Connection attempt %d/%d failed: %v", attempt, maxRetries, err)

        if attempt < maxRetries {
            log.Printf("⏳ Retrying in %v...", backoff)
            time.Sleep(backoff)
            backoff *= 2
        }
    }

    return lastErr
}