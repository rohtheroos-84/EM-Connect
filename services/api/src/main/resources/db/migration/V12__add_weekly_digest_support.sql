-- Weekly digest support

ALTER TABLE users
    ADD COLUMN weekly_digest_opt_in BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE weekly_digest_deliveries (
    id            BIGSERIAL PRIMARY KEY,
    user_id       BIGINT      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    period_start  DATE        NOT NULL,
    period_end    DATE        NOT NULL,
    status        VARCHAR(20) NOT NULL,
    attempt_count INTEGER     NOT NULL DEFAULT 0,
    last_error    TEXT,
    last_attempt_at TIMESTAMP,
    dispatched_at TIMESTAMP,
    created_at    TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_weekly_digest_delivery_user_period UNIQUE (user_id, period_start, period_end)
);

CREATE INDEX idx_weekly_digest_delivery_status_period
    ON weekly_digest_deliveries(status, period_start, period_end);

CREATE INDEX idx_weekly_digest_delivery_user
    ON weekly_digest_deliveries(user_id);
