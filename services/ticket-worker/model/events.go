package model

import (
    "encoding/json"
    "fmt"
    "time"
)

// Timestamp handles numeric timestamps (Java Instant as epoch seconds)
type Timestamp struct {
    time.Time
}

func (t *Timestamp) UnmarshalJSON(data []byte) error {
    var num float64
    if err := json.Unmarshal(data, &num); err == nil {
        sec := int64(num)
        nsec := int64((num - float64(sec)) * 1e9)
        t.Time = time.Unix(sec, nsec)
        return nil
    }

    var str string
    if err := json.Unmarshal(data, &str); err == nil {
        parsed, err := time.Parse(time.RFC3339, str)
        if err == nil {
            t.Time = parsed
            return nil
        }
    }

    return fmt.Errorf("cannot parse timestamp: %s", string(data))
}

// LocalDateTime handles Java LocalDateTime serialized as array [year, month, day, hour, minute]
type LocalDateTime struct {
    time.Time
}

func (t *LocalDateTime) UnmarshalJSON(data []byte) error {
    var arr []int
    if err := json.Unmarshal(data, &arr); err == nil {
        if len(arr) >= 5 {
            second := 0
            if len(arr) >= 6 {
                second = arr[5]
            }
            t.Time = time.Date(arr[0], time.Month(arr[1]), arr[2], arr[3], arr[4], second, 0, time.UTC)
            return nil
        }
    }

    var str string
    if err := json.Unmarshal(data, &str); err == nil {
        parsed, err := time.Parse("2006-01-02T15:04:05", str)
        if err == nil {
            t.Time = parsed
            return nil
        }
        parsed, err = time.Parse(time.RFC3339, str)
        if err == nil {
            t.Time = parsed
            return nil
        }
    }

    return fmt.Errorf("cannot parse LocalDateTime: %s", string(data))
}

// BaseEvent contains common fields for all events
type BaseEvent struct {
    EventID   int64     `json:"eventId"`
    EventType string    `json:"eventType"`
    Timestamp Timestamp `json:"timestamp"`
}

// RegistrationConfirmedEvent is the event we care about for ticket generation
type RegistrationConfirmedEvent struct {
    BaseEvent
    RegistrationID    int64         `json:"registrationId"`
    UserID            int64         `json:"userId"`
    UserEmail         string        `json:"userEmail"`
    UserName          string        `json:"userName"`
    EventTitle        string        `json:"eventTitle"`
    EventLocation     string        `json:"eventLocation"`
    EventStartDate    LocalDateTime `json:"eventStartDate"`
    EventEndDate      LocalDateTime `json:"eventEndDate"`
    TicketCode        string        `json:"ticketCode"`
    RegisteredEventID string        `json:"registeredEventId"`
}

// TicketPayload is what gets encoded into the QR code
type TicketPayload struct {
    TicketCode string `json:"ticketCode"`
    EventID    int64  `json:"eventId"`
    UserID     int64  `json:"userId"`
    EventTitle string `json:"eventTitle"`
    UserName   string `json:"userName"`
    EventDate  string `json:"eventDate"`
    Location   string `json:"location"`
    Signature  string `json:"signature"`
}

// TicketMetadata is stored alongside the QR image
type TicketMetadata struct {
    TicketCode     string    `json:"ticketCode"`
    EventID        int64     `json:"eventId"`
    UserID         int64     `json:"userId"`
    UserName       string    `json:"userName"`
    UserEmail      string    `json:"userEmail"`
    EventTitle     string    `json:"eventTitle"`
    EventLocation  string    `json:"eventLocation"`
    EventStartDate string    `json:"eventStartDate"`
    QRImagePath    string    `json:"qrImagePath"`
    GeneratedAt    time.Time `json:"generatedAt"`
    Status         string    `json:"status"` // VALID, USED, CANCELLED
}