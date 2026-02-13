package email

import (
    "bytes"
    "fmt"
    "html/template"
    "log"
    "net/smtp"
    "time"
)

// Config holds email service configuration
type Config struct {
    SMTPHost     string
    SMTPPort     int
    FromAddress  string
    FromName     string
    MaxRetries   int
    RetryBackoff time.Duration
}

// Service handles sending emails
type Service struct {
    config    Config
    templates map[string]*template.Template
}

// NewService creates a new email service
func NewService(cfg Config) *Service {
    s := &Service{
        config:    cfg,
        templates: make(map[string]*template.Template),
    }
    s.loadTemplates()
    return s
}

// loadTemplates loads email templates
func (s *Service) loadTemplates() {
    // Registration confirmation template
    s.templates["registration_confirmed"] = template.Must(template.New("registration_confirmed").Parse(`
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .ticket { background: white; border: 2px dashed #4CAF50; padding: 15px; margin: 20px 0; text-align: center; }
        .ticket-code { font-size: 24px; font-weight: bold; color: #4CAF50; letter-spacing: 2px; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        .details { margin: 15px 0; }
        .details dt { font-weight: bold; color: #555; }
        .details dd { margin: 5px 0 15px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 Registration Confirmed!</h1>
        </div>
        <div class="content">
            <p>Hello <strong>{{.UserName}}</strong>,</p>
            <p>Your registration for the following event has been confirmed:</p>
            
            <dl class="details">
                <dt>📅 Event</dt>
                <dd>{{.EventTitle}}</dd>
                
                <dt>📍 Location</dt>
                <dd>{{.EventLocation}}</dd>
                
                <dt>🕐 Date & Time</dt>
                <dd>{{.EventDate}}</dd>
            </dl>
            
            <div class="ticket">
                <p>Your Ticket Code:</p>
                <p class="ticket-code">{{.TicketCode}}</p>
                <p><small>Please present this code at the event</small></p>
            </div>
            
            <p>We look forward to seeing you there!</p>
        </div>
        <div class="footer">
            <p>EM-Connect - Event Management Platform</p>
            <p>This is an automated message, please do not reply.</p>
        </div>
    </div>
</body>
</html>
`))

    // Registration cancelled template
    s.templates["registration_cancelled"] = template.Must(template.New("registration_cancelled").Parse(`
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #f44336; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Registration Cancelled</h1>
        </div>
        <div class="content">
            <p>Hello <strong>{{.UserName}}</strong>,</p>
            <p>Your registration for <strong>{{.EventTitle}}</strong> has been cancelled.</p>
            <p>If you did not request this cancellation, please contact us immediately.</p>
        </div>
        <div class="footer">
            <p>EM-Connect - Event Management Platform</p>
        </div>
    </div>
</body>
</html>
`))

    // Event published template
    s.templates["event_published"] = template.Must(template.New("event_published").Parse(`
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2196F3; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .details { margin: 15px 0; }
        .details dt { font-weight: bold; color: #555; }
        .details dd { margin: 5px 0 15px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📢 New Event Published!</h1>
        </div>
        <div class="content">
            <p>A new event is now available:</p>
            
            <dl class="details">
                <dt>📅 Event</dt>
                <dd>{{.EventTitle}}</dd>
                
                <dt>📝 Description</dt>
                <dd>{{.EventDescription}}</dd>
                
                <dt>📍 Location</dt>
                <dd>{{.EventLocation}}</dd>
                
                <dt>🕐 Date & Time</dt>
                <dd>{{.EventDate}}</dd>
                
                <dt>👥 Capacity</dt>
                <dd>{{.Capacity}} spots available</dd>
            </dl>
            
            <p>Register now before spots fill up!</p>
        </div>
        <div class="footer">
            <p>EM-Connect - Event Management Platform</p>
        </div>
    </div>
</body>
</html>
`))

    // Event cancelled template
    s.templates["event_cancelled"] = template.Must(template.New("event_cancelled").Parse(`
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #ff9800; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>⚠️ Event Cancelled</h1>
        </div>
        <div class="content">
            <p>We regret to inform you that the following event has been cancelled:</p>
            <p><strong>{{.EventTitle}}</strong></p>
            <p>Originally scheduled for: {{.OriginalDate}}</p>
            <p>We apologize for any inconvenience caused.</p>
        </div>
        <div class="footer">
            <p>EM-Connect - Event Management Platform</p>
        </div>
    </div>
</body>
</html>
`))
}

// Email represents an email to be sent
type Email struct {
    To       string
    Subject  string
    HTMLBody string
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

// send actually sends the email
func (s *Service) send(email Email) error {
    addr := fmt.Sprintf("%s:%d", s.config.SMTPHost, s.config.SMTPPort)
    
    // Build email headers and body
    headers := make(map[string]string)
    headers["From"] = fmt.Sprintf("%s <%s>", s.config.FromName, s.config.FromAddress)
    headers["To"] = email.To
    headers["Subject"] = email.Subject
    headers["MIME-Version"] = "1.0"
    headers["Content-Type"] = "text/html; charset=UTF-8"
    
    var msg bytes.Buffer
    for k, v := range headers {
        msg.WriteString(fmt.Sprintf("%s: %s\r\n", k, v))
    }
    msg.WriteString("\r\n")
    msg.WriteString(email.HTMLBody)
    
    // Send via SMTP (no auth for MailHog)
    err := smtp.SendMail(addr, nil, s.config.FromAddress, []string{email.To}, msg.Bytes())
    if err != nil {
        return fmt.Errorf("SMTP error: %w", err)
    }
    
    return nil
}

// RenderTemplate renders an email template with data
func (s *Service) RenderTemplate(templateName string, data interface{}) (string, error) {
    tmpl, ok := s.templates[templateName]
    if !ok {
        return "", fmt.Errorf("template not found: %s", templateName)
    }
    
    var buf bytes.Buffer
    if err := tmpl.Execute(&buf, data); err != nil {
        return "", fmt.Errorf("template execution failed: %w", err)
    }
    
    return buf.String(), nil
}