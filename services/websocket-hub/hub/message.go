package hub

import "encoding/json"

// --- Messages FROM client TO server ---

// ClientMessage represents any message sent by a WebSocket client
type ClientMessage struct {
    Type    string          `json:"type"`    // "subscribe", "unsubscribe", "ping"
    Payload json.RawMessage `json:"payload"` // varies by type
}

// SubscribePayload is sent when a client wants updates for a specific event
type SubscribePayload struct {
    EventID int64 `json:"eventId"`
}

// --- Messages FROM server TO client ---

// ServerMessage represents any message sent by the server to WebSocket clients
type ServerMessage struct {
    Type    string      `json:"type"`    // "event.published", "participant.count", "pong", etc.
    Payload interface{} `json:"payload"` // varies by type
}

// ParticipantCountPayload is sent when registration count changes
type ParticipantCountPayload struct {
    EventID    int64  `json:"eventId"`
    EventTitle string `json:"eventTitle"`
    Count      int64  `json:"count"`
    Action     string `json:"action"` // "registered" or "cancelled"
    UserName   string `json:"userName"`
}

// EventUpdatePayload is sent when an event is published or cancelled
type EventUpdatePayload struct {
    EventID     int64  `json:"eventId"`
    EventTitle  string `json:"eventTitle"`
    EventType   string `json:"eventType"` // "EVENT_PUBLISHED" or "EVENT_CANCELLED"
    Location    string `json:"location,omitempty"`
    StartDate   string `json:"startDate,omitempty"`
    OrganizerName string `json:"organizerName,omitempty"`
}

// BroadcastMessage is used internally to route messages to the right clients
type BroadcastMessage struct {
    // If Topic is empty, broadcast to ALL clients
    // If Topic is "event:5", broadcast only to clients subscribed to event 5
    Topic   string
    Message ServerMessage
}