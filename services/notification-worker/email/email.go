package email

import (
	"crypto/tls"
	"fmt"
	"log"
	"net"
	"net/smtp"
	"strings"
	"time"
)

// Config holds email service configuration
type Config struct {
	SMTPHost     string
	SMTPPort     int
	SMTPUser     string
	SMTPPass     string
	SMTPAuth     bool
	SMTPTLS      bool
	FromAddress  string
	FromName     string
	MaxRetries   int
	RetryBackoff time.Duration
}

// Email represents an email to be sent
type Email struct {
	To       string
	Subject  string
	HTMLBody string
}

// Service handles sending emails
type Service struct {
	config Config
}

// NewService creates a new email service
func NewService(cfg Config) *Service {
	return &Service{config: cfg}
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

// send dispatches the email via SMTP.
// When SMTPAuth=true and SMTPTLS=true it performs STARTTLS + PLAIN auth
// (works with Gmail App Passwords, Outlook, SendGrid, etc.).
// When SMTPAuth=false it falls back to plain unauthenticated SMTP (MailHog / dev).
func (s *Service) send(email Email) error {
	addr := net.JoinHostPort(s.config.SMTPHost, fmt.Sprintf("%d", s.config.SMTPPort))
	msg := s.buildMessage(email)

	// ── Unauthenticated path (dev / MailHog) ──
	if !s.config.SMTPAuth {
		return smtp.SendMail(addr, nil, s.config.FromAddress, []string{email.To}, []byte(msg))
	}

	// ── Authenticated + TLS path ──
	// 1. Dial TCP
	conn, err := net.DialTimeout("tcp", addr, 15*time.Second)
	if err != nil {
		return fmt.Errorf("dial %s: %w", addr, err)
	}

	// 2. Create SMTP client
	client, err := smtp.NewClient(conn, s.config.SMTPHost)
	if err != nil {
		conn.Close()
		return fmt.Errorf("smtp client: %w", err)
	}
	defer client.Close()

	// 3. EHLO
	if err := client.Hello("localhost"); err != nil {
		return fmt.Errorf("ehlo: %w", err)
	}

	// 4. STARTTLS
	if s.config.SMTPTLS {
		tlsCfg := &tls.Config{ServerName: s.config.SMTPHost}
		if err := client.StartTLS(tlsCfg); err != nil {
			return fmt.Errorf("starttls: %w", err)
		}
	}

	// 5. Authenticate
	auth := smtp.PlainAuth("", s.config.SMTPUser, s.config.SMTPPass, s.config.SMTPHost)
	if err := client.Auth(auth); err != nil {
		return fmt.Errorf("auth: %w", err)
	}

	// 6. MAIL FROM
	if err := client.Mail(s.config.FromAddress); err != nil {
		return fmt.Errorf("mail from: %w", err)
	}

	// 7. RCPT TO
	if err := client.Rcpt(email.To); err != nil {
		return fmt.Errorf("rcpt to: %w", err)
	}

	// 8. DATA
	w, err := client.Data()
	if err != nil {
		return fmt.Errorf("data: %w", err)
	}
	if _, err := w.Write([]byte(msg)); err != nil {
		return fmt.Errorf("write body: %w", err)
	}
	if err := w.Close(); err != nil {
		return fmt.Errorf("close data: %w", err)
	}

	// 9. QUIT
	return client.Quit()
}

// buildMessage constructs the MIME email with headers
func (s *Service) buildMessage(email Email) string {
	var sb strings.Builder
	sb.WriteString(fmt.Sprintf("From: %s <%s>\r\n", s.config.FromName, s.config.FromAddress))
	sb.WriteString(fmt.Sprintf("To: %s\r\n", email.To))
	sb.WriteString(fmt.Sprintf("Subject: %s\r\n", email.Subject))
	sb.WriteString("MIME-Version: 1.0\r\n")
	sb.WriteString("Content-Type: text/html; charset=UTF-8\r\n")
	sb.WriteString("\r\n")
	sb.WriteString(email.HTMLBody)
	return sb.String()
}
