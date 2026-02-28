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
	// Try as number (Java Instant: seconds.nanos)
	var num float64
	if err := json.Unmarshal(data, &num); err == nil {
		sec := int64(num)
		nsec := int64((num - float64(sec)) * 1e9)
		t.Time = time.Unix(sec, nsec)
		return nil
	}

	// Try as string (RFC3339)
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

// LocalDateTime handles Java LocalDateTime serialized as [year, month, day, hour, minute] or [year, month, day, hour, minute, second]
type LocalDateTime struct {
	time.Time
}

func (t *LocalDateTime) UnmarshalJSON(data []byte) error {
	// Try as array [year, month, day, hour, minute] or [year, month, day, hour, minute, second]
	var arr []int
	if err := json.Unmarshal(data, &arr); err == nil {
		if len(arr) >= 5 {
			year := arr[0]
			month := time.Month(arr[1])
			day := arr[2]
			hour := arr[3]
			minute := arr[4]
			second := 0
			if len(arr) >= 6 {
				second = arr[5]
			}
			t.Time = time.Date(year, month, day, hour, minute, second, 0, time.UTC)
			return nil
		}
	}

	// Try as string
	var str string
	if err := json.Unmarshal(data, &str); err == nil {
		// Try RFC3339
		parsed, err := time.Parse(time.RFC3339, str)
		if err == nil {
			t.Time = parsed
			return nil
		}
		// Try without timezone
		parsed, err = time.Parse("2006-01-02T15:04:05", str)
		if err == nil {
			t.Time = parsed
			return nil
		}
	}

	return fmt.Errorf("cannot parse LocalDateTime: %s", string(data))
}

// BaseEvent contains common fields for all events
type BaseEvent struct {
	EventID   int64     `json:"eventId"` // Changed from string to int64
	EventType string    `json:"eventType"`
	Timestamp Timestamp `json:"timestamp"`
}

// RegistrationConfirmedEvent is published when a user registers for an event
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

// RegistrationCancelledEvent is published when a user cancels registration
type RegistrationCancelledEvent struct {
	BaseEvent
	RegistrationID int64     `json:"registrationId"`
	UserID         int64     `json:"userId"`
	UserEmail      string    `json:"userEmail"`
	UserName       string    `json:"userName"`
	EventTitle     string    `json:"eventTitle"`
	CancelledAt    Timestamp `json:"cancelledAt"`
}

// EventPublishedEvent is published when an event is made public
type EventPublishedEvent struct {
	BaseEvent
	EventTitle        string        `json:"eventTitle"`
	EventDescription  string        `json:"eventDescription"`
	EventLocation     string        `json:"eventLocation"`
	StartDate         LocalDateTime `json:"startDate"`
	EndDate           LocalDateTime `json:"endDate"`
	Capacity          int           `json:"capacity"`
	OrganizerID       int64         `json:"organizerId"`
	OrganizerName     string        `json:"organizerName"`
	OrganizerEmail    string        `json:"organizerEmail"`
	RegisteredEventID string        `json:"registeredEventId"`
}

// EventCancelledEvent is published when an event is cancelled
type EventCancelledEvent struct {
	BaseEvent
	EventTitle            string        `json:"eventTitle"`
	OriginalStartDate     LocalDateTime `json:"originalStartDate"`
	OrganizerID           int64         `json:"organizerId"`
	OrganizerEmail        string        `json:"organizerEmail"`
	AffectedRegistrations int           `json:"affectedRegistrations"`
}

// EventReminderEvent is published by the scheduler before an event starts
type EventReminderEvent struct {
	BaseEvent
	UserID         int64         `json:"userId"`
	UserEmail      string        `json:"userEmail"`
	UserName       string        `json:"userName"`
	EventTitle     string        `json:"eventTitle"`
	EventLocation  string        `json:"eventLocation"`
	EventStartDate LocalDateTime `json:"eventStartDate"`
	TicketCode     string        `json:"ticketCode"`
}
