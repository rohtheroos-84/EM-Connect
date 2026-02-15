package hub

import (
    "encoding/json"
    "fmt"
    "log"
    "net/http"
    "sync"

    "github.com/gorilla/websocket"
)

// Hub maintains the set of active clients and broadcasts messages to them
type Hub struct {
    // Registered clients
    clients map[*Client]bool

    // Topic subscriptions: topic -> set of clients
    topics map[string]map[*Client]bool

    // Channels for thread-safe operations
    register   chan *Client
    unregister chan *Client
    broadcast  chan BroadcastMessage

    // Mutex for topic operations (since Subscribe/Unsubscribe
    // are called from client goroutines, not just the Run loop)
    topicMu sync.RWMutex

    // WebSocket upgrader
    upgrader websocket.Upgrader
}

// NewHub creates a new Hub
func NewHub() *Hub {
    return &Hub{
        clients:    make(map[*Client]bool),
        topics:     make(map[string]map[*Client]bool),
        register:   make(chan *Client),
        unregister: make(chan *Client),
        broadcast:  make(chan BroadcastMessage, 256),
        upgrader: websocket.Upgrader{
            ReadBufferSize:  1024,
            WriteBufferSize: 1024,
            // Allow all origins for development
            CheckOrigin: func(r *http.Request) bool {
                return true
            },
        },
    }
}

// Run starts the hub's main loop. Must be called in a goroutine.
func (h *Hub) Run() {
    log.Printf("🔄 Hub is running...")
    for {
        select {
        case client := <-h.register:
            h.clients[client] = true
            log.Printf("✅ Client connected (total: %d)", len(h.clients))

            // Send welcome message
            welcome := ServerMessage{
                Type: "connected",
                Payload: map[string]interface{}{
                    "message":      "Connected to EM-Connect WebSocket Hub",
                    "totalClients": len(h.clients),
                },
            }
            data, _ := json.Marshal(welcome)
            client.send <- data

        case client := <-h.unregister:
            if _, ok := h.clients[client]; ok {
                // Remove from all topics
                h.removeClientFromAllTopics(client)
                delete(h.clients, client)
                close(client.send)
                log.Printf("❌ Client disconnected (total: %d)", len(h.clients))
            }

        case msg := <-h.broadcast:
            h.handleBroadcast(msg)
        }
    }
}

// handleBroadcast sends a message to the appropriate clients
func (h *Hub) handleBroadcast(msg BroadcastMessage) {
    data, err := json.Marshal(msg.Message)
    if err != nil {
        log.Printf("❌ Failed to marshal broadcast message: %v", err)
        return
    }

    if msg.Topic == "" {
        // Broadcast to ALL clients
        log.Printf("📢 Broadcasting to ALL clients (%d)", len(h.clients))
        for client := range h.clients {
            select {
            case client.send <- data:
            default:
                // Client's send buffer is full, disconnect them
                h.removeClientFromAllTopics(client)
                close(client.send)
                delete(h.clients, client)
            }
        }
    } else {
        // Send to clients subscribed to this topic
        h.topicMu.RLock()
        subscribers := h.topics[msg.Topic]
        h.topicMu.RUnlock()

        if len(subscribers) > 0 {
            log.Printf("📢 Broadcasting to topic '%s' (%d subscribers)", msg.Topic, len(subscribers))
            for client := range subscribers {
                select {
                case client.send <- data:
                default:
                    h.removeClientFromAllTopics(client)
                    close(client.send)
                    delete(h.clients, client)
                }
            }
        } else {
            log.Printf("📢 No subscribers for topic '%s', message dropped", msg.Topic)
        }
    }
}

// Subscribe adds a client to a topic
func (h *Hub) Subscribe(client *Client, eventID int64) {
    topic := fmt.Sprintf("event:%d", eventID)

    h.topicMu.Lock()
    defer h.topicMu.Unlock()

    if h.topics[topic] == nil {
        h.topics[topic] = make(map[*Client]bool)
    }
    h.topics[topic][client] = true
    client.subscriptions[topic] = true

    log.Printf("📌 Client subscribed to '%s' (topic subscribers: %d)", topic, len(h.topics[topic]))

    // Confirm subscription to client
    confirm := ServerMessage{
        Type: "subscribed",
        Payload: map[string]interface{}{
            "eventId": eventID,
            "topic":   topic,
        },
    }
    data, _ := json.Marshal(confirm)
    client.send <- data
}

// Unsubscribe removes a client from a topic
func (h *Hub) Unsubscribe(client *Client, eventID int64) {
    topic := fmt.Sprintf("event:%d", eventID)

    h.topicMu.Lock()
    defer h.topicMu.Unlock()

    if subscribers, ok := h.topics[topic]; ok {
        delete(subscribers, client)
        if len(subscribers) == 0 {
            delete(h.topics, topic)
        }
    }
    delete(client.subscriptions, topic)

    log.Printf("📌 Client unsubscribed from '%s'", topic)
}

// removeClientFromAllTopics cleans up when a client disconnects
func (h *Hub) removeClientFromAllTopics(client *Client) {
    h.topicMu.Lock()
    defer h.topicMu.Unlock()

    for topic := range client.subscriptions {
        if subscribers, ok := h.topics[topic]; ok {
            delete(subscribers, client)
            if len(subscribers) == 0 {
                delete(h.topics, topic)
            }
        }
    }
    client.subscriptions = nil
}

// Broadcast sends a message to be distributed by the hub
func (h *Hub) Broadcast(msg BroadcastMessage) {
    h.broadcast <- msg
}

// HandleWebSocket handles the HTTP upgrade to WebSocket
func (h *Hub) HandleWebSocket(w http.ResponseWriter, r *http.Request) {
    conn, err := h.upgrader.Upgrade(w, r, nil)
    if err != nil {
        log.Printf("❌ WebSocket upgrade failed: %v", err)
        return
    }

    client := NewClient(h, conn)
    h.register <- client

    // Start read and write pumps in separate goroutines
    go client.WritePump()
    go client.ReadPump()
}

// Stats returns current hub statistics
func (h *Hub) Stats() map[string]interface{} {
    h.topicMu.RLock()
    defer h.topicMu.RUnlock()

    topicStats := make(map[string]int)
    for topic, subs := range h.topics {
        topicStats[topic] = len(subs)
    }

    return map[string]interface{}{
        "totalClients": len(h.clients),
        "topics":       topicStats,
    }
}