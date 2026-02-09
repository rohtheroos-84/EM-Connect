package com.emconnect.api.controller;

import com.emconnect.api.service.RegistrationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Test-only controller to simulate concurrent registrations.
 * DO NOT include in production!
 */
@RestController
@RequestMapping("/api/test")
public class TestConcurrencyController {

    private final RegistrationService registrationService;

    public TestConcurrencyController(RegistrationService registrationService) {
        this.registrationService = registrationService;
    }

    /**
     * Simulate N concurrent registration attempts for the same event.
     * 
     * Example: POST /api/test/concurrent-register?eventId=3&userEmails=user1@test.com,user2@test.com,...
     */
    @PostMapping("/concurrent-register")
    public ResponseEntity<Map<String, Object>> testConcurrentRegistration(
            @RequestParam Long eventId,
            @RequestParam List<String> userEmails) throws InterruptedException {

        int threadCount = userEmails.size();
        ExecutorService executor = Executors.newFixedThreadPool(threadCount);
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch doneLatch = new CountDownLatch(threadCount);

        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger failCount = new AtomicInteger(0);
        CopyOnWriteArrayList<String> successes = new CopyOnWriteArrayList<>();
        CopyOnWriteArrayList<String> failures = new CopyOnWriteArrayList<>();

        for (String email : userEmails) {
            executor.submit(() -> {
                try {
                    startLatch.await();
                    registrationService.registerForEvent(eventId, email);
                    successCount.incrementAndGet();
                    successes.add(email);
                } catch (Exception e) {
                    failCount.incrementAndGet();
                    failures.add(email + ": " + e.getMessage());
                } finally {
                    doneLatch.countDown();
                }
            });
        }

        // Fire all at once
        startLatch.countDown();
        doneLatch.await(30, TimeUnit.SECONDS);
        executor.shutdown();

        long confirmedCount = registrationService.getEventRegistrationCount(eventId);

        Map<String, Object> result = new HashMap<>();
        result.put("eventId", eventId);
        result.put("totalAttempts", threadCount);
        result.put("successCount", successCount.get());
        result.put("failCount", failCount.get());
        result.put("confirmedInDb", confirmedCount);
        result.put("successes", successes);
        result.put("failures", failures);

        return ResponseEntity.ok(result);
    }
}