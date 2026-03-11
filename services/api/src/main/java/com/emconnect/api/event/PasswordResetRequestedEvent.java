package com.emconnect.api.event;

import com.emconnect.api.entity.User;

public class PasswordResetRequestedEvent extends BaseEvent {

    public static final String TYPE = "PASSWORD_RESET_REQUESTED";

    private Long userId;
    private String userEmail;
    private String userName;
    private String resetCode;

    public PasswordResetRequestedEvent() {
        super(TYPE);
    }

    public static PasswordResetRequestedEvent fromUser(User user, String code) {
        PasswordResetRequestedEvent event = new PasswordResetRequestedEvent();
        event.setUserId(user.getId());
        event.setUserEmail(user.getEmail());
        event.setUserName(user.getName());
        event.setResetCode(code);
        return event;
    }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public String getUserEmail() { return userEmail; }
    public void setUserEmail(String userEmail) { this.userEmail = userEmail; }
    public String getUserName() { return userName; }
    public void setUserName(String userName) { this.userName = userName; }
    public String getResetCode() { return resetCode; }
    public void setResetCode(String resetCode) { this.resetCode = resetCode; }
}
