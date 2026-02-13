package handler

import (
    "encoding/json"
    "fmt"
    "log"

    "github.com/emconnect/notification-worker/email"
    "github.com/emconnect/notification-worker/model"
)

// MessageHandler processes incoming messages
type MessageHandler struct {
    emailService *email.Service
}

// NewMessageHandler creates a new handler
func NewMessageHandler(emailService *email.Service) *MessageHandler {
    return &MessageHandler{
        emailService: emailService,
    }
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

    // Prepare template data
    data := map[string]interface{}{
        "UserName":      event.UserName,
        "EventTitle":    event.EventTitle,
        "EventLocation": event.EventLocation,
        "EventDate":     event.EventStartDate.Format("Monday, January 2, 2006 at 3:04 PM"),
        "TicketCode":    event.TicketCode,
    }

    // Render email template
    htmlBody, err := h.emailService.RenderTemplate("registration_confirmed", data)
    if err != nil {
        return fmt.Errorf("failed to render template: %w", err)
    }

    // Send email
    err = h.emailService.SendWithRetry(email.Email{
        To:       event.UserEmail,
        Subject:  fmt.Sprintf("🎉 Registration Confirmed: %s", event.EventTitle),
        HTMLBody: htmlBody,
    })
    if err != nil {
        return fmt.Errorf("failed to send email: %w", err)
    }

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

    // Prepare template data
    data := map[string]interface{}{
        "UserName":   event.UserName,
        "EventTitle": event.EventTitle,
    }

    // Render email template
    htmlBody, err := h.emailService.RenderTemplate("registration_cancelled", data)
    if err != nil {
        return fmt.Errorf("failed to render template: %w", err)
    }

    // Send email
    err = h.emailService.SendWithRetry(email.Email{
        To:       event.UserEmail,
        Subject:  fmt.Sprintf("Registration Cancelled: %s", event.EventTitle),
        HTMLBody: htmlBody,
    })
    if err != nil {
        return fmt.Errorf("failed to send email: %w", err)
    }

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
    log.Printf("   👤 Organizer: %s (%s)", event.OrganizerName, event.OrganizerEmail)

    // Prepare template data
    data := map[string]interface{}{
        "EventTitle":       event.EventTitle,
        "EventDescription": event.EventDescription,
        "EventLocation":    event.EventLocation,
        "EventDate":        event.StartDate.Format("Monday, January 2, 2006 at 3:04 PM"),
        "Capacity":         event.Capacity,
    }

    // Render email template
    htmlBody, err := h.emailService.RenderTemplate("event_published", data)
    if err != nil {
        return fmt.Errorf("failed to render template: %w", err)
    }

    // Send notification to organizer (in production, you'd notify subscribers)
    err = h.emailService.SendWithRetry(email.Email{
        To:       event.OrganizerEmail,
        Subject:  fmt.Sprintf("📢 Your Event is Live: %s", event.EventTitle),
        HTMLBody: htmlBody,
    })
    if err != nil {
        return fmt.Errorf("failed to send email: %w", err)
    }

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

    // Prepare template data
    data := map[string]interface{}{
        "EventTitle":   event.EventTitle,
        "OriginalDate": event.OriginalStartDate.Format("Monday, January 2, 2006 at 3:04 PM"),
    }

    // Render email template
    htmlBody, err := h.emailService.RenderTemplate("event_cancelled", data)
    if err != nil {
        return fmt.Errorf("failed to render template: %w", err)
    }

    // Send notification to organizer
    err = h.emailService.SendWithRetry(email.Email{
        To:       event.OrganizerEmail,
        Subject:  fmt.Sprintf("⚠️ Event Cancelled: %s", event.EventTitle),
        HTMLBody: htmlBody,
    })
    if err != nil {
        return fmt.Errorf("failed to send email: %w", err)
    }

    return nil
}