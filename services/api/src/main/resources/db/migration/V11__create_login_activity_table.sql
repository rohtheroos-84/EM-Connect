-- Login activity timeline for profile security visibility
CREATE TABLE login_activity (
    id           BIGSERIAL PRIMARY KEY,
    user_id      BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    login_method VARCHAR(20)  NOT NULL,
    source_ip    VARCHAR(64),
    user_agent   VARCHAR(500),
    created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_login_activity_user_created
    ON login_activity(user_id, created_at DESC);
