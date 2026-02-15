package handler

import (
    "encoding/json"
    "fmt"
    "log"

    "github.com/emconnect/websocket-hub/hub"
    "github.com/emconnect/websocket-hub/model"
)

// MessageHandler routes RabbitMQ messages to the WebSocket hub
type MessageHandler struct {
    wsHub *hub.Hub
}

// NewMessageHandler creates a new handler
func NewMessageHandler(wsHub *hub.Hub) *MessageHandler {
    return &MessageHandler{wsHub: wsHub}
}

// HandleMessage processes a RabbitMQ message and broadcasts to WebSocket clients
func (h *MessageHandler) HandleMessage(body []byte) error {
    var base model.BaseEvent
    if err := json.Unmarshal(body, &base); err != nil {
        return fmt.Errorf("failed to unmarshal base event: %w", err)
    }

    log.Printf("📨 Received event: %s (eventId: %d)", base.EventType, base.EventID)

    switch base.EventType {
    case "EVENT_PUBLISHED":
        return h.handleEventPublished(body)
    case "EVENT_CANCELLED":
        return h.handleEventCancelled(body)
    case "REGISTRATION_CONFIRMED":
        return h.handleRegistrationConfirmed(body)
    case "REGISTRATION_CANCELLED":
        return h.handleRegistrationCancelled(body)
    default:
        log.Printf("⚠️  Ignoring event type: %s", base.EventType)
        return nil
    }
}

func (h *MessageHandler) handleEventPublished(body []byte) error {
    var event model.EventPublishedEvent
    if err := json.Unmarshal(body, &event); err != nil {
        return fmt.Errorf("failed to unmarshal EventPublishedEvent: %w", err)
    }

    log.Printf("📢 EVENT PUBLISHED → Broadcasting to all clients")
    log.Printf("   🎫 %s at %s", event.EventTitle, event.EventLocation)

    // Broadcast to ALL connected clients (new event announcement)
    h.wsHub.Broadcast(hub.BroadcastMessage{
        Topic: "", // empty = all clients
        Message: hub.ServerMessage{
            Type: "event.published",
            Payload: hub.EventUpdatePayload{
                EventID:       event.BaseEvent.EventID,
                EventTitle:    event.EventTitle,
                EventType:     "EVENT_PUBLISHED",
                Location:      event.EventLocation,
                StartDate:     event.StartDate.Format("2006-01-02T15:04:05"),
                OrganizerName: event.OrganizerName,
            },
        },
    })

    return nil
}

func (h *MessageHandler) handleEventCancelled(body []byte) error {
    var event model.EventCancelledEvent
    if err := json.Unmarshal(body, &event); err != nil {
        return fmt.Errorf("failed to unmarshal EventCancelledEvent: %w", err)
    }

    log.Printf("🚫 EVENT CANCELLED → Broadcasting to all + topic subscribers")
    log.Printf("   🎫 %s", event.EventTitle)

    topic := fmt.Sprintf("event:%d", event.BaseEvent.EventID)

    // Broadcast to ALL clients (general announcement)
    h.wsHub.Broadcast(hub.BroadcastMessage{
        Topic: "",
        Message: hub.ServerMessage{
            Type: "event.cancelled",
            Payload: hub.EventUpdatePayload{
                EventID:    event.BaseEvent.EventID,
                EventTitle: event.EventTitle,
                EventType:  "EVENT_CANCELLED",
            },
        },
    })

    // Also broadcast to topic subscribers (they're specifically watching this event)
    h.wsHub.Broadcast(hub.BroadcastMessage{
        Topic: topic,
        Message: hub.ServerMessage{
            Type: "event.cancelled",
            Payload: hub.EventUpdatePayload{
                EventID:    event.BaseEvent.EventID,
                EventTitle: event.EventTitle,
                EventType:  "EVENT_CANCELLED",
            },
        },
    })

    return nil
}

func (h *MessageHandler) handleRegistrationConfirmed(body []byte) error {
    var event model.RegistrationConfirmedEvent
    if err := json.Unmarshal(body, &event); err != nil {
        return fmt.Errorf("failed to unmarshal RegistrationConfirmedEvent: %w", err)
    }

    topic := fmt.Sprintf("event:%d", event.BaseEvent.EventID)
    log.Printf("✅ REGISTRATION CONFIRMED → Broadcasting to topic '%s'", topic)
    log.Printf("   👤 %s registered for %s", event.UserName, event.EventTitle)

    // Send to clients watching this specific event
    h.wsHub.Broadcast(hub.BroadcastMessage{
        Topic: topic,
        Message: hub.ServerMessage{
            Type: "participant.count",
            Payload: hub.ParticipantCountPayload{
                EventID:    event.BaseEvent.EventID,
                EventTitle: event.EventTitle,
                Action:     "registered",
                UserName:   event.UserName,
            },
        },
    })

    return nil
}

func (h *MessageHandler) handleRegistrationCancelled(body []byte) error {
    var event model.RegistrationCancelledEvent
    if err := json.Unmarshal(body, &event); err != nil {
        return fmt.Errorf("failed to unmarshal RegistrationCancelledEvent: %w", err)
    }

    topic := fmt.Sprintf("event:%d", event.BaseEvent.EventID)
    log.Printf("❌ REGISTRATION CANCELLED → Broadcasting to topic '%s'", topic)
    log.Printf("   👤 %s cancelled from %s", event.UserName, event.EventTitle)

    h.wsHub.Broadcast(hub.BroadcastMessage{
        Topic: topic,
        Message: hub.ServerMessage{
            Type: "participant.count",
            Payload: hub.ParticipantCountPayload{
                EventID:    event.BaseEvent.EventID,
                EventTitle: event.EventTitle,
                Action:     "cancelled",
                UserName:   event.UserName,
            },
        },
    })

    return nil
}