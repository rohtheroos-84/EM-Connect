package com.emconnect.api.event;

import com.emconnect.api.entity.User;

public class UserRegisteredEvent extends BaseEvent {

    public static final String TYPE = "USER_REGISTERED";

    private Long userId;
    private String userEmail;
    private String userName;
    private String oauthProvider;

    public UserRegisteredEvent() {
        super(TYPE);
    }

    public static UserRegisteredEvent fromUser(User user) {
        UserRegisteredEvent event = new UserRegisteredEvent();
        event.setUserId(user.getId());
        event.setUserEmail(user.getEmail());
        event.setUserName(user.getName());
        event.setOauthProvider(user.getOauthProvider());
        return event;
    }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public String getUserEmail() { return userEmail; }
    public void setUserEmail(String userEmail) { this.userEmail = userEmail; }
    public String getUserName() { return userName; }
    public void setUserName(String userName) { this.userName = userName; }
    public String getOauthProvider() { return oauthProvider; }
    public void setOauthProvider(String oauthProvider) { this.oauthProvider = oauthProvider; }
}
