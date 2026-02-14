package handler

import (
    "encoding/json"
    "fmt"
    "log"

    "github.com/emconnect/ticket-worker/model"
    "github.com/emconnect/ticket-worker/ticket"
)

// MessageHandler processes incoming ticket messages
type MessageHandler struct {
    ticketService *ticket.Service
}

// NewMessageHandler creates a new handler
func NewMessageHandler(ticketService *ticket.Service) *MessageHandler {
    return &MessageHandler{
        ticketService: ticketService,
    }
}

// HandleMessage processes a message based on its type
func (h *MessageHandler) HandleMessage(body []byte) error {
    var base model.BaseEvent
    if err := json.Unmarshal(body, &base); err != nil {
        return fmt.Errorf("failed to unmarshal base event: %w", err)
    }

    log.Printf("📨 Received event: %s (eventId: %d)", base.EventType, base.EventID)

    switch base.EventType {
    case "REGISTRATION_CONFIRMED":
        return h.handleRegistrationConfirmed(body)
    default:
        log.Printf("⚠️  Ignoring event type: %s (not relevant for tickets)", base.EventType)
        return nil
    }
}

func (h *MessageHandler) handleRegistrationConfirmed(body []byte) error {
    var event model.RegistrationConfirmedEvent
    if err := json.Unmarshal(body, &event); err != nil {
        return fmt.Errorf("failed to unmarshal RegistrationConfirmedEvent: %w", err)
    }

    log.Printf("🎫 Processing ticket for registration:")
    log.Printf("   👤 User: %s (%s)", event.UserName, event.UserEmail)
    log.Printf("   📅 Event: %s", event.EventTitle)
    log.Printf("   🎟️  Ticket Code: %s", event.TicketCode)

    // Generate the ticket (QR code + metadata)
    if err := h.ticketService.GenerateTicket(event); err != nil {
        return fmt.Errorf("failed to generate ticket: %w", err)
    }

    return nil
}