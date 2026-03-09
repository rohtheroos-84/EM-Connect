package com.emconnect.api.event;

import com.emconnect.api.entity.User;

public class UserPasswordChangedEvent extends BaseEvent {

    public static final String TYPE = "USER_PASSWORD_CHANGED";

    private Long userId;
    private String userEmail;
    private String userName;

    public UserPasswordChangedEvent() {
        super(TYPE);
    }

    public static UserPasswordChangedEvent fromUser(User user) {
        UserPasswordChangedEvent event = new UserPasswordChangedEvent();
        event.setUserId(user.getId());
        event.setUserEmail(user.getEmail());
        event.setUserName(user.getName());
        return event;
    }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public String getUserEmail() { return userEmail; }
    public void setUserEmail(String userEmail) { this.userEmail = userEmail; }
    public String getUserName() { return userName; }
    public void setUserName(String userName) { this.userName = userName; }
}
