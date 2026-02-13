package handler

import (
    "encoding/json"
    "fmt"
    "log"

    "github.com/emconnect/notification-worker/model"
)

// MessageHandler processes incoming messages
type MessageHandler struct {
    // In the future, we'll add email service here
}

// NewMessageHandler creates a new handler
func NewMessageHandler() *MessageHandler {
    return &MessageHandler{}
}

// HandleMessage processes a message based on its type
func (h *MessageHandler) HandleMessage(body []byte) error {
    // First, extract just the event type
    var base model.BaseEvent
    if err := json.Unmarshal(body, &base); err != nil {
        return fmt.Errorf("failed to unmarshal base event: %w", err)
    }

    log.Printf("📨 Received event: %s (eventId: %d)", base.EventType, base.EventID)

    // Route to appropriate handler based on event type
    switch base.EventType {
    case "REGISTRATION_CONFIRMED":
        return h.handleRegistrationConfirmed(body)
    case "REGISTRATION_CANCELLED":
        return h.handleRegistrationCancelled(body)
    case "EVENT_PUBLISHED":
        return h.handleEventPublished(body)
    case "EVENT_CANCELLED":
        return h.handleEventCancelled(body)
    default:
        log.Printf("⚠️  Unknown event type: %s", base.EventType)
        return nil // Don't error on unknown events
    }
}

func (h *MessageHandler) handleRegistrationConfirmed(body []byte) error {
    var event model.RegistrationConfirmedEvent
    if err := json.Unmarshal(body, &event); err != nil {
        return fmt.Errorf("failed to unmarshal RegistrationConfirmedEvent: %w", err)
    }

    log.Printf("✅ REGISTRATION CONFIRMED")
    log.Printf("   📧 To: %s (%s)", event.UserEmail, event.UserName)
    log.Printf("   🎫 Event: %s", event.EventTitle)
    log.Printf("   📍 Location: %s", event.EventLocation)
    log.Printf("   🎟️  Ticket: %s", event.TicketCode)
    log.Printf("   📅 Date: %s", event.EventStartDate.Format("Jan 2, 2006 at 3:04 PM"))

    // TODO: In Step 5.4, we'll actually send an email here
    log.Printf("   📮 [SIMULATION] Would send confirmation email to %s", event.UserEmail)

    return nil
}

func (h *MessageHandler) handleRegistrationCancelled(body []byte) error {
    var event model.RegistrationCancelledEvent
    if err := json.Unmarshal(body, &event); err != nil {
        return fmt.Errorf("failed to unmarshal RegistrationCancelledEvent: %w", err)
    }

    log.Printf("❌ REGISTRATION CANCELLED")
    log.Printf("   📧 To: %s (%s)", event.UserEmail, event.UserName)
    log.Printf("   🎫 Event: %s", event.EventTitle)
    log.Printf("   📮 [SIMULATION] Would send cancellation email to %s", event.UserEmail)

    return nil
}

func (h *MessageHandler) handleEventPublished(body []byte) error {
    var event model.EventPublishedEvent
    if err := json.Unmarshal(body, &event); err != nil {
        return fmt.Errorf("failed to unmarshal EventPublishedEvent: %w", err)
    }

    log.Printf("📢 EVENT PUBLISHED")
    log.Printf("   🎫 Event: %s", event.EventTitle)
    log.Printf("   📍 Location: %s", event.EventLocation)
    log.Printf("   📅 Date: %s", event.StartDate.Format("Jan 2, 2006 at 3:04 PM"))
    log.Printf("   👤 Organizer: %s (%s)", event.OrganizerName, event.OrganizerEmail)
    log.Printf("   📮 [SIMULATION] Would notify subscribers about new event")

    return nil
}

func (h *MessageHandler) handleEventCancelled(body []byte) error {
    var event model.EventCancelledEvent
    if err := json.Unmarshal(body, &event); err != nil {
        return fmt.Errorf("failed to unmarshal EventCancelledEvent: %w", err)
    }

    log.Printf("🚫 EVENT CANCELLED")
    log.Printf("   🎫 Event: %s", event.EventTitle)
    log.Printf("   👥 Affected Registrations: %d", event.AffectedRegistrations)
    log.Printf("   📮 [SIMULATION] Would notify %d registered users", event.AffectedRegistrations)

    return nil
}