package handler

import (
	"encoding/json"
	"fmt"
	"log"

	"github.com/emconnect/notification-worker/email"
	"github.com/emconnect/notification-worker/model"
	"github.com/emconnect/notification-worker/templates"
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
	case "EVENT_REMINDER":
		return h.handleEventReminder(body)
	case "USER_REGISTERED":
		return h.handleUserRegistered(body)
	case "USER_LOGIN":
		return h.handleUserLogin(body)
	case "USER_PASSWORD_CHANGED":
		return h.handleUserPasswordChanged(body)
	case "CHECK_IN":
		return h.handleCheckIn(body)
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

	htmlBody, err := templates.Render("registration_confirmed", templates.TemplateData{
		Subject:       fmt.Sprintf("Registration Confirmed: %s", event.EventTitle),
		AccentColor:   "#16A34A",
		UserName:      event.UserName,
		EventTitle:    event.EventTitle,
		EventLocation: event.EventLocation,
		EventDate:     event.EventStartDate.Format("Monday, January 2, 2006 at 3:04 PM"),
		TicketCode:    event.TicketCode,
	})
	if err != nil {
		return fmt.Errorf("failed to render template: %w", err)
	}

	return h.emailService.SendWithRetry(email.Email{
		To:       event.UserEmail,
		Subject:  fmt.Sprintf("Registration Confirmed: %s", event.EventTitle),
		HTMLBody: htmlBody,
	})
}

func (h *MessageHandler) handleRegistrationCancelled(body []byte) error {
	var event model.RegistrationCancelledEvent
	if err := json.Unmarshal(body, &event); err != nil {
		return fmt.Errorf("failed to unmarshal RegistrationCancelledEvent: %w", err)
	}

	log.Printf("❌ REGISTRATION CANCELLED")
	log.Printf("   📧 To: %s (%s)", event.UserEmail, event.UserName)
	log.Printf("   🎫 Event: %s", event.EventTitle)

	htmlBody, err := templates.Render("registration_cancelled", templates.TemplateData{
		Subject:     fmt.Sprintf("Registration Cancelled: %s", event.EventTitle),
		AccentColor: "#D02020",
		UserName:    event.UserName,
		EventTitle:  event.EventTitle,
	})
	if err != nil {
		return fmt.Errorf("failed to render template: %w", err)
	}

	return h.emailService.SendWithRetry(email.Email{
		To:       event.UserEmail,
		Subject:  fmt.Sprintf("Registration Cancelled: %s", event.EventTitle),
		HTMLBody: htmlBody,
	})
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

	htmlBody, err := templates.Render("event_published", templates.TemplateData{
		Subject:          fmt.Sprintf("Your Event is Live: %s", event.EventTitle),
		AccentColor:      "#1040C0",
		EventTitle:       event.EventTitle,
		EventDescription: event.EventDescription,
		EventLocation:    event.EventLocation,
		EventDate:        event.StartDate.Format("Monday, January 2, 2006 at 3:04 PM"),
		Capacity:         event.Capacity,
	})
	if err != nil {
		return fmt.Errorf("failed to render template: %w", err)
	}

	return h.emailService.SendWithRetry(email.Email{
		To:       event.OrganizerEmail,
		Subject:  fmt.Sprintf("Your Event is Live: %s", event.EventTitle),
		HTMLBody: htmlBody,
	})
}

func (h *MessageHandler) handleEventCancelled(body []byte) error {
	var event model.EventCancelledEvent
	if err := json.Unmarshal(body, &event); err != nil {
		return fmt.Errorf("failed to unmarshal EventCancelledEvent: %w", err)
	}

	log.Printf("🚫 EVENT CANCELLED")
	log.Printf("   🎫 Event: %s", event.EventTitle)
	log.Printf("   👥 Affected Registrations: %d", event.AffectedRegistrations)

	htmlBody, err := templates.Render("event_cancelled", templates.TemplateData{
		Subject:               fmt.Sprintf("Event Cancelled: %s", event.EventTitle),
		AccentColor:           "#F0C020",
		EventTitle:            event.EventTitle,
		OriginalDate:          event.OriginalStartDate.Format("Monday, January 2, 2006 at 3:04 PM"),
		AffectedRegistrations: event.AffectedRegistrations,
	})
	if err != nil {
		return fmt.Errorf("failed to render template: %w", err)
	}

	return h.emailService.SendWithRetry(email.Email{
		To:       event.OrganizerEmail,
		Subject:  fmt.Sprintf("Event Cancelled: %s", event.EventTitle),
		HTMLBody: htmlBody,
	})
}

func (h *MessageHandler) handleEventReminder(body []byte) error {
	var event model.EventReminderEvent
	if err := json.Unmarshal(body, &event); err != nil {
		return fmt.Errorf("failed to unmarshal EventReminderEvent: %w", err)
	}

	log.Printf("⏰ EVENT REMINDER")
	log.Printf("   📧 To: %s (%s)", event.UserEmail, event.UserName)
	log.Printf("   🎫 Event: %s", event.EventTitle)
	log.Printf("   🎟️  Ticket: %s", event.TicketCode)

	htmlBody, err := templates.Render("event_reminder", templates.TemplateData{
		Subject:       fmt.Sprintf("Reminder: %s is coming up!", event.EventTitle),
		AccentColor:   "#F0C020",
		UserName:      event.UserName,
		EventTitle:    event.EventTitle,
		EventLocation: event.EventLocation,
		EventDate:     event.EventStartDate.Format("Monday, January 2, 2006 at 3:04 PM"),
		TicketCode:    event.TicketCode,
	})
	if err != nil {
		return fmt.Errorf("failed to render template: %w", err)
	}

	return h.emailService.SendWithRetry(email.Email{
		To:       event.UserEmail,
		Subject:  fmt.Sprintf("Reminder: %s is coming up!", event.EventTitle),
		HTMLBody: htmlBody,
	})
}

func (h *MessageHandler) handleUserRegistered(body []byte) error {
	var event model.UserRegisteredEvent
	if err := json.Unmarshal(body, &event); err != nil {
		return fmt.Errorf("failed to unmarshal UserRegisteredEvent: %w", err)
	}

	log.Printf("🎉 USER REGISTERED")
	log.Printf("   📧 To: %s (%s)", event.UserEmail, event.UserName)

	htmlBody, err := templates.Render("welcome", templates.TemplateData{
		Subject:     "Welcome to EM-Connect!",
		AccentColor: "#1040C0",
		UserName:    event.UserName,
	})
	if err != nil {
		return fmt.Errorf("failed to render template: %w", err)
	}

	return h.emailService.SendWithRetry(email.Email{
		To:       event.UserEmail,
		Subject:  "Welcome to EM-Connect!",
		HTMLBody: htmlBody,
	})
}

func (h *MessageHandler) handleUserLogin(body []byte) error {
	var event model.UserLoginEvent
	if err := json.Unmarshal(body, &event); err != nil {
		return fmt.Errorf("failed to unmarshal UserLoginEvent: %w", err)
	}

	log.Printf("🔐 USER LOGIN")
	log.Printf("   📧 To: %s (%s)", event.UserEmail, event.UserName)
	log.Printf("   🔑 Method: %s", event.LoginMethod)

	method := "Email & Password"
	if event.LoginMethod == "GOOGLE" {
		method = "Google Sign-In"
	}

	htmlBody, err := templates.Render("login_alert", templates.TemplateData{
		Subject:     "New sign-in to your account",
		AccentColor: "#1040C0",
		UserName:    event.UserName,
		LoginMethod: method,
		LoginTime:   event.Timestamp.Format("Monday, January 2, 2006 at 3:04 PM"),
	})
	if err != nil {
		return fmt.Errorf("failed to render template: %w", err)
	}

	return h.emailService.SendWithRetry(email.Email{
		To:       event.UserEmail,
		Subject:  "New sign-in to your EM-Connect account",
		HTMLBody: htmlBody,
	})
}

func (h *MessageHandler) handleUserPasswordChanged(body []byte) error {
	var event model.UserPasswordChangedEvent
	if err := json.Unmarshal(body, &event); err != nil {
		return fmt.Errorf("failed to unmarshal UserPasswordChangedEvent: %w", err)
	}

	log.Printf("🔒 PASSWORD CHANGED")
	log.Printf("   📧 To: %s (%s)", event.UserEmail, event.UserName)

	htmlBody, err := templates.Render("password_changed", templates.TemplateData{
		Subject:     "Your password has been changed",
		AccentColor: "#F0C020",
		UserName:    event.UserName,
	})
	if err != nil {
		return fmt.Errorf("failed to render template: %w", err)
	}

	return h.emailService.SendWithRetry(email.Email{
		To:       event.UserEmail,
		Subject:  "Your EM-Connect password has been changed",
		HTMLBody: htmlBody,
	})
}

func (h *MessageHandler) handleCheckIn(body []byte) error {
	var event model.CheckInEvent
	if err := json.Unmarshal(body, &event); err != nil {
		return fmt.Errorf("failed to unmarshal CheckInEvent: %w", err)
	}

	log.Printf("✅ CHECK-IN")
	log.Printf("   📧 To: %s (%s)", event.UserEmail, event.UserName)
	log.Printf("   🎫 Event: %s", event.EventTitle)
	log.Printf("   🎟️  Ticket: %s", event.TicketCode)

	htmlBody, err := templates.Render("check_in", templates.TemplateData{
		Subject:       fmt.Sprintf("Checked In: %s", event.EventTitle),
		AccentColor:   "#16A34A",
		UserName:      event.UserName,
		EventTitle:    event.EventTitle,
		EventLocation: event.EventLocation,
		TicketCode:    event.TicketCode,
	})
	if err != nil {
		return fmt.Errorf("failed to render template: %w", err)
	}

	return h.emailService.SendWithRetry(email.Email{
		To:       event.UserEmail,
		Subject:  fmt.Sprintf("Checked In: %s", event.EventTitle),
		HTMLBody: htmlBody,
	})
}
