package email

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"time"
)

const sendGridEndpoint = "https://api.sendgrid.com/v3/mail/send"

// Config holds email service configuration
type Config struct {
	SendGridAPIKey string
	FromAddress    string
	FromName       string
	MaxRetries     int
	RetryBackoff   time.Duration
}

// Email represents an email to be sent
type Email struct {
	To       string
	Subject  string
	HTMLBody string
}

// Service handles sending emails via the SendGrid API
type Service struct {
	config Config
	client *http.Client
}

// NewService creates a new email service
func NewService(cfg Config) *Service {
	return &Service{
		config: cfg,
		client: &http.Client{Timeout: 15 * time.Second},
	}
}

// SendWithRetry sends an email with retry logic
func (s *Service) SendWithRetry(email Email) error {
	var lastErr error

	for attempt := 1; attempt <= s.config.MaxRetries; attempt++ {
		err := s.send(email)
		if err == nil {
			log.Printf("📧 Email sent successfully to %s (attempt %d)", email.To, attempt)
			return nil
		}

		lastErr = err
		log.Printf("⚠️ Email send failed (attempt %d/%d): %v", attempt, s.config.MaxRetries, err)

		if attempt < s.config.MaxRetries {
			backoff := s.config.RetryBackoff * time.Duration(attempt)
			log.Printf("⏳ Waiting %v before retry...", backoff)
			time.Sleep(backoff)
		}
	}

	return fmt.Errorf("failed to send email after %d attempts: %w", s.config.MaxRetries, lastErr)
}

// ── SendGrid v3 API payload types ──────────────────────────────────────

type sgMailBody struct {
	Personalizations []sgPersonalization `json:"personalizations"`
	From             sgAddress           `json:"from"`
	Subject          string              `json:"subject"`
	Content          []sgContent         `json:"content"`
}

type sgPersonalization struct {
	To []sgAddress `json:"to"`
}

type sgAddress struct {
	Email string `json:"email"`
	Name  string `json:"name,omitempty"`
}

type sgContent struct {
	Type  string `json:"type"`
	Value string `json:"value"`
}

// send dispatches the email via the SendGrid v3 HTTP API.
func (s *Service) send(email Email) error {
	payload := sgMailBody{
		Personalizations: []sgPersonalization{
			{To: []sgAddress{{Email: email.To}}},
		},
		From:    sgAddress{Email: s.config.FromAddress, Name: s.config.FromName},
		Subject: email.Subject,
		Content: []sgContent{
			{Type: "text/html", Value: email.HTMLBody},
		},
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("marshal payload: %w", err)
	}

	req, err := http.NewRequest(http.MethodPost, sendGridEndpoint, bytes.NewReader(body))
	if err != nil {
		return fmt.Errorf("create request: %w", err)
	}
	req.Header.Set("Authorization", "Bearer "+s.config.SendGridAPIKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := s.client.Do(req)
	if err != nil {
		return fmt.Errorf("http request: %w", err)
	}
	defer resp.Body.Close()

	// SendGrid returns 202 Accepted on success
	if resp.StatusCode == http.StatusAccepted {
		return nil
	}

	// Read error body for diagnostics
	errBody, _ := io.ReadAll(resp.Body)
	return fmt.Errorf("sendgrid API error (HTTP %d): %s", resp.StatusCode, string(errBody))
}
