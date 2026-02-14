package qr

import (
    "fmt"
    "log"
    "os"
    "path/filepath"

    qrcode "github.com/skip2/go-qrcode"
)

// Generator handles QR code image generation
type Generator struct {
    outputDir string
    size      int // QR image size in pixels
}

// NewGenerator creates a new QR code generator
func NewGenerator(outputDir string, size int) (*Generator, error) {
    // Ensure output directory exists
    if err := os.MkdirAll(outputDir, 0755); err != nil {
        return nil, fmt.Errorf("failed to create output directory: %w", err)
    }

    return &Generator{
        outputDir: outputDir,
        size:      size,
    }, nil
}

// GenerateQR creates a QR code PNG file from the given data
// Returns the file path of the generated image
func (g *Generator) GenerateQR(ticketCode string, data string) (string, error) {
    filename := fmt.Sprintf("%s.png", ticketCode)
    filePath := filepath.Join(g.outputDir, filename)

    log.Printf("🎨 Generating QR code for ticket: %s", ticketCode)
    log.Printf("   📦 Payload size: %d bytes", len(data))

    // Generate QR code with medium error correction
    // Medium = can recover if ~15% of code is damaged
    err := qrcode.WriteFile(data, qrcode.Medium, g.size, filePath)
    if err != nil {
        return "", fmt.Errorf("failed to generate QR code: %w", err)
    }

    // Get file size
    info, err := os.Stat(filePath)
    if err == nil {
        log.Printf("   💾 QR image saved: %s (%d bytes)", filePath, info.Size())
    }

    return filePath, nil
}

// GetQRPath returns the path to a QR code image
func (g *Generator) GetQRPath(ticketCode string) string {
    return filepath.Join(g.outputDir, fmt.Sprintf("%s.png", ticketCode))
}

// Exists checks if a QR code image exists for the given ticket
func (g *Generator) Exists(ticketCode string) bool {
    path := g.GetQRPath(ticketCode)
    _, err := os.Stat(path)
    return err == nil
}