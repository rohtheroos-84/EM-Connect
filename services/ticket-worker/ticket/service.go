package ticket

import (
    "crypto/hmac"
    "crypto/sha256"
    "encoding/hex"
    "encoding/json"
    "fmt"
    "log"
    "os"
    "path/filepath"
    "time"

    "github.com/emconnect/ticket-worker/model"
    "github.com/emconnect/ticket-worker/qr"
)

// Service handles ticket generation and signing
type Service struct {
    secretKey   string
    qrGenerator *qr.Generator
    metadataDir string
}

// NewService creates a new ticket service
func NewService(secretKey string, qrGenerator *qr.Generator, metadataDir string) (*Service, error) {
    // Ensure metadata directory exists
    if err := os.MkdirAll(metadataDir, 0755); err != nil {
        return nil, fmt.Errorf("failed to create metadata directory: %w", err)
    }

    return &Service{
        secretKey:   secretKey,
        qrGenerator: qrGenerator,
        metadataDir: metadataDir,
    }, nil
}

// GenerateTicket creates a QR code and metadata for a registration
func (s *Service) GenerateTicket(event model.RegistrationConfirmedEvent) error {
    log.Printf("🎫 Generating ticket for: %s", event.TicketCode)

    // Step 1: Create the payload to encode in QR
    payload := s.createPayload(event)

    // Step 2: Sign the payload
    payload.Signature = s.sign(payload)
    log.Printf("   🔏 Payload signed")

    // Step 3: Marshal payload to JSON
    payloadJSON, err := json.Marshal(payload)
    if err != nil {
        return fmt.Errorf("failed to marshal payload: %w", err)
    }

    // Step 4: Generate QR code image
    qrPath, err := s.qrGenerator.GenerateQR(event.TicketCode, string(payloadJSON))
    if err != nil {
        return fmt.Errorf("failed to generate QR code: %w", err)
    }

    // Step 5: Save ticket metadata
    metadata := model.TicketMetadata{
        TicketCode:     event.TicketCode,
        EventID:        event.BaseEvent.EventID,
        UserID:         event.UserID,
        UserName:       event.UserName,
        UserEmail:      event.UserEmail,
        EventTitle:     event.EventTitle,
        EventLocation:  event.EventLocation,
        EventStartDate: event.EventStartDate.Format("2006-01-02T15:04:05"),
        QRImagePath:    qrPath,
        GeneratedAt:    time.Now(),
        Status:         "VALID",
    }

    if err := s.saveMetadata(metadata); err != nil {
        return fmt.Errorf("failed to save metadata: %w", err)
    }

    log.Printf("   ✅ Ticket generated successfully!")
    log.Printf("   📁 QR Image: %s", qrPath)
    log.Printf("   📋 Metadata saved for: %s", event.TicketCode)

    return nil
}

// createPayload builds the data that goes into the QR code
func (s *Service) createPayload(event model.RegistrationConfirmedEvent) model.TicketPayload {
    return model.TicketPayload{
        TicketCode: event.TicketCode,
        EventID:    event.BaseEvent.EventID,
        UserID:     event.UserID,
        EventTitle: event.EventTitle,
        UserName:   event.UserName,
        EventDate:  event.EventStartDate.Format("2006-01-02T15:04:05"),
        Location:   event.EventLocation,
    }
}

// sign creates an HMAC-SHA256 signature for the payload
func (s *Service) sign(payload model.TicketPayload) string {
    // Create the data to sign (deterministic order)
    data := fmt.Sprintf("%s:%d:%d:%s",
        payload.TicketCode,
        payload.EventID,
        payload.UserID,
        payload.EventDate,
    )

    // Create HMAC-SHA256
    mac := hmac.New(sha256.New, []byte(s.secretKey))
    mac.Write([]byte(data))
    signature := hex.EncodeToString(mac.Sum(nil))

    return signature
}

// VerifySignature checks if a ticket payload has a valid signature
func (s *Service) VerifySignature(payload model.TicketPayload) bool {
    expectedSig := s.sign(payload)
    return hmac.Equal([]byte(payload.Signature), []byte(expectedSig))
}

// saveMetadata writes ticket metadata to a JSON file
func (s *Service) saveMetadata(metadata model.TicketMetadata) error {
    filename := fmt.Sprintf("%s.json", metadata.TicketCode)
    filePath := filepath.Join(s.metadataDir, filename)

    data, err := json.MarshalIndent(metadata, "", "  ")
    if err != nil {
        return fmt.Errorf("failed to marshal metadata: %w", err)
    }

    if err := os.WriteFile(filePath, data, 0644); err != nil {
        return fmt.Errorf("failed to write metadata file: %w", err)
    }

    return nil
}

// LoadMetadata reads ticket metadata from file
func (s *Service) LoadMetadata(ticketCode string) (*model.TicketMetadata, error) {
    filename := fmt.Sprintf("%s.json", ticketCode)
    filePath := filepath.Join(s.metadataDir, filename)

    data, err := os.ReadFile(filePath)
    if err != nil {
        return nil, fmt.Errorf("failed to read metadata file: %w", err)
    }

    var metadata model.TicketMetadata
    if err := json.Unmarshal(data, &metadata); err != nil {
        return nil, fmt.Errorf("failed to unmarshal metadata: %w", err)
    }

    return &metadata, nil
}