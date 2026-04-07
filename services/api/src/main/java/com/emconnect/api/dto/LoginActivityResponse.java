package com.emconnect.api.dto;

import com.emconnect.api.entity.LoginActivity;

import java.time.LocalDateTime;

public class LoginActivityResponse {

    private LocalDateTime timestamp;
    private String loginMethod;
    private String source;

    public LoginActivityResponse() {
    }

    public LoginActivityResponse(LoginActivity activity) {
        this.timestamp = activity.getCreatedAt();
        this.loginMethod = activity.getLoginMethod();
        this.source = buildSource(activity.getSourceIp(), activity.getUserAgent());
    }

    private String buildSource(String ip, String userAgent) {
        String uaSummary = summarizeUserAgent(userAgent);

        if (ip != null && !ip.isBlank() && uaSummary != null && !uaSummary.isBlank()) {
            return ip + " • " + uaSummary;
        }
        if (ip != null && !ip.isBlank()) {
            return ip;
        }
        if (uaSummary != null && !uaSummary.isBlank()) {
            return uaSummary;
        }
        return "Unknown source";
    }

    private String summarizeUserAgent(String userAgent) {
        if (userAgent == null || userAgent.isBlank()) return "";

        String ua = userAgent.toLowerCase();

        String browser = "Unknown browser";
        if (ua.contains("edg/")) {
            browser = "Edge";
        } else if (ua.contains("opr/") || ua.contains("opera")) {
            browser = "Opera";
        } else if (ua.contains("chrome/")) {
            browser = "Chrome";
        } else if (ua.contains("firefox/")) {
            browser = "Firefox";
        } else if (ua.contains("safari/") && !ua.contains("chrome/")) {
            browser = "Safari";
        }

        String os = "";
        if (ua.contains("windows")) {
            os = "Windows";
        } else if (ua.contains("android")) {
            os = "Android";
        } else if (ua.contains("iphone") || ua.contains("ipad") || ua.contains("ios")) {
            os = "iOS";
        } else if (ua.contains("mac os") || ua.contains("macintosh")) {
            os = "macOS";
        } else if (ua.contains("linux")) {
            os = "Linux";
        }

        if (!os.isBlank()) {
            return browser + " on " + os;
        }
        return browser;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }

    public String getLoginMethod() {
        return loginMethod;
    }

    public void setLoginMethod(String loginMethod) {
        this.loginMethod = loginMethod;
    }

    public String getSource() {
        return source;
    }

    public void setSource(String source) {
        this.source = source;
    }
}
