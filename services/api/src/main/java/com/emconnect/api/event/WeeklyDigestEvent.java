package com.emconnect.api.event;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

public class WeeklyDigestEvent extends BaseEvent {

    public static final String TYPE = "WEEKLY_DIGEST";

    private Long deliveryId;
    private Long userId;
    private String userEmail;
    private String userName;

    private LocalDate periodStart;
    private LocalDate periodEnd;

    private long totalUsers;
    private long totalEvents;
    private long totalRegistrations;
    private long confirmedRegistrations;

    private long usersDelta;
    private long eventsDelta;
    private long registrationsDelta;
    private long confirmedRegistrationsDelta;

    private double usersDeltaPct;
    private double eventsDeltaPct;
    private double registrationsDeltaPct;
    private double confirmedRegistrationsDeltaPct;

    private List<TopEventSummary> topEvents = new ArrayList<>();

    private String analyticsUrl;
    private String adminUrl;

    public WeeklyDigestEvent() {
        super(TYPE);
    }

    public Long getDeliveryId() {
        return deliveryId;
    }

    public void setDeliveryId(Long deliveryId) {
        this.deliveryId = deliveryId;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getUserEmail() {
        return userEmail;
    }

    public void setUserEmail(String userEmail) {
        this.userEmail = userEmail;
    }

    public String getUserName() {
        return userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
    }

    public LocalDate getPeriodStart() {
        return periodStart;
    }

    public void setPeriodStart(LocalDate periodStart) {
        this.periodStart = periodStart;
    }

    public LocalDate getPeriodEnd() {
        return periodEnd;
    }

    public void setPeriodEnd(LocalDate periodEnd) {
        this.periodEnd = periodEnd;
    }

    public long getTotalUsers() {
        return totalUsers;
    }

    public void setTotalUsers(long totalUsers) {
        this.totalUsers = totalUsers;
    }

    public long getTotalEvents() {
        return totalEvents;
    }

    public void setTotalEvents(long totalEvents) {
        this.totalEvents = totalEvents;
    }

    public long getTotalRegistrations() {
        return totalRegistrations;
    }

    public void setTotalRegistrations(long totalRegistrations) {
        this.totalRegistrations = totalRegistrations;
    }

    public long getConfirmedRegistrations() {
        return confirmedRegistrations;
    }

    public void setConfirmedRegistrations(long confirmedRegistrations) {
        this.confirmedRegistrations = confirmedRegistrations;
    }

    public long getUsersDelta() {
        return usersDelta;
    }

    public void setUsersDelta(long usersDelta) {
        this.usersDelta = usersDelta;
    }

    public long getEventsDelta() {
        return eventsDelta;
    }

    public void setEventsDelta(long eventsDelta) {
        this.eventsDelta = eventsDelta;
    }

    public long getRegistrationsDelta() {
        return registrationsDelta;
    }

    public void setRegistrationsDelta(long registrationsDelta) {
        this.registrationsDelta = registrationsDelta;
    }

    public long getConfirmedRegistrationsDelta() {
        return confirmedRegistrationsDelta;
    }

    public void setConfirmedRegistrationsDelta(long confirmedRegistrationsDelta) {
        this.confirmedRegistrationsDelta = confirmedRegistrationsDelta;
    }

    public double getUsersDeltaPct() {
        return usersDeltaPct;
    }

    public void setUsersDeltaPct(double usersDeltaPct) {
        this.usersDeltaPct = usersDeltaPct;
    }

    public double getEventsDeltaPct() {
        return eventsDeltaPct;
    }

    public void setEventsDeltaPct(double eventsDeltaPct) {
        this.eventsDeltaPct = eventsDeltaPct;
    }

    public double getRegistrationsDeltaPct() {
        return registrationsDeltaPct;
    }

    public void setRegistrationsDeltaPct(double registrationsDeltaPct) {
        this.registrationsDeltaPct = registrationsDeltaPct;
    }

    public double getConfirmedRegistrationsDeltaPct() {
        return confirmedRegistrationsDeltaPct;
    }

    public void setConfirmedRegistrationsDeltaPct(double confirmedRegistrationsDeltaPct) {
        this.confirmedRegistrationsDeltaPct = confirmedRegistrationsDeltaPct;
    }

    public List<TopEventSummary> getTopEvents() {
        return topEvents;
    }

    public void setTopEvents(List<TopEventSummary> topEvents) {
        this.topEvents = topEvents;
    }

    public String getAnalyticsUrl() {
        return analyticsUrl;
    }

    public void setAnalyticsUrl(String analyticsUrl) {
        this.analyticsUrl = analyticsUrl;
    }

    public String getAdminUrl() {
        return adminUrl;
    }

    public void setAdminUrl(String adminUrl) {
        this.adminUrl = adminUrl;
    }

    public static class TopEventSummary {
        private String title;
        private long registrations;

        public TopEventSummary() {
        }

        public TopEventSummary(String title, long registrations) {
            this.title = title;
            this.registrations = registrations;
        }

        public String getTitle() {
            return title;
        }

        public void setTitle(String title) {
            this.title = title;
        }

        public long getRegistrations() {
            return registrations;
        }

        public void setRegistrations(long registrations) {
            this.registrations = registrations;
        }
    }
}
