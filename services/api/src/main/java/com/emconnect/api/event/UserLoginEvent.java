package com.emconnect.api.event;

import com.emconnect.api.entity.User;

public class UserLoginEvent extends BaseEvent {

    public static final String TYPE = "USER_LOGIN";

    private Long userId;
    private String userEmail;
    private String userName;
    private String loginMethod; // "PASSWORD", "GOOGLE"

    public UserLoginEvent() {
        super(TYPE);
    }

    public static UserLoginEvent fromUser(User user, String loginMethod) {
        UserLoginEvent event = new UserLoginEvent();
        event.setUserId(user.getId());
        event.setUserEmail(user.getEmail());
        event.setUserName(user.getName());
        event.setLoginMethod(loginMethod);
        return event;
    }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public String getUserEmail() { return userEmail; }
    public void setUserEmail(String userEmail) { this.userEmail = userEmail; }
    public String getUserName() { return userName; }
    public void setUserName(String userName) { this.userName = userName; }
    public String getLoginMethod() { return loginMethod; }
    public void setLoginMethod(String loginMethod) { this.loginMethod = loginMethod; }
}
