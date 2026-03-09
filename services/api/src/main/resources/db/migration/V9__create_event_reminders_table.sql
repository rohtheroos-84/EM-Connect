-- Create table to track sent reminders and prevent duplicates
CREATE TABLE event_reminders (
    id BIGSERIAL PRIMARY KEY,
    event_id BIGINT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    registration_id BIGINT NOT NULL REFERENCES registrations(id) ON DELETE CASCADE,
    reminder_type VARCHAR(10) NOT NULL, -- '24H' or '1H'
    sent_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(event_id, registration_id, reminder_type)
);

CREATE INDEX idx_event_reminders_event_id ON event_reminders(event_id);
