package model

import (
	"encoding/json"
	"fmt"
	"time"
)

// Timestamp handles numeric timestamps from Java
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

// LocalDateTime handles Java LocalDateTime serialized as array
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

// BaseEvent contains common fields
type BaseEvent struct {
	EventID   int64     `json:"eventId"`
	EventType string    `json:"eventType"`
	Timestamp Timestamp `json:"timestamp"`
}

// EventPublishedEvent from Spring Boot
type EventPublishedEvent struct {
	BaseEvent
	EventTitle       string        `json:"eventTitle"`
	EventDescription string        `json:"eventDescription"`
	EventLocation    string        `json:"eventLocation"`
	StartDate        LocalDateTime `json:"startDate"`
	EndDate          LocalDateTime `json:"endDate"`
	Capacity         int           `json:"capacity"`
	OrganizerID      int64         `json:"organizerId"`
	OrganizerName    string        `json:"organizerName"`
	OrganizerEmail   string        `json:"organizerEmail"`
}

// EventCancelledEvent from Spring Boot
type EventCancelledEvent struct {
	BaseEvent
	EventTitle            string        `json:"eventTitle"`
	OriginalStartDate     LocalDateTime `json:"originalStartDate"`
	OrganizerEmail        string        `json:"organizerEmail"`
	AffectedRegistrations int           `json:"affectedRegistrations"`
}

// RegistrationConfirmedEvent from Spring Boot
type RegistrationConfirmedEvent struct {
	BaseEvent
	RegistrationID      int64         `json:"registrationId"`
	UserID              int64         `json:"userId"`
	UserEmail           string        `json:"userEmail"`
	UserName            string        `json:"userName"`
	EventTitle          string        `json:"eventTitle"`
	EventLocation       string        `json:"eventLocation"`
	EventStartDate      LocalDateTime `json:"eventStartDate"`
	EventEndDate        LocalDateTime `json:"eventEndDate"`
	TicketCode          string        `json:"ticketCode"`
	CurrentParticipants int64         `json:"currentParticipants"`
}

// RegistrationCancelledEvent from Spring Boot
type RegistrationCancelledEvent struct {
	BaseEvent
	RegistrationID      int64         `json:"registrationId"`
	UserID              int64         `json:"userId"`
	UserEmail           string        `json:"userEmail"`
	UserName            string        `json:"userName"`
	EventTitle          string        `json:"eventTitle"`
	CancelledAt         LocalDateTime `json:"cancelledAt"`
	CurrentParticipants int64         `json:"currentParticipants"`
}
