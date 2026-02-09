package com.emconnect.api.service;

import com.emconnect.api.entity.*;
import com.emconnect.api.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Concurrency test for event registration.
 * 
 * This test creates an event with limited capacity, then fires
 * multiple registration requests simultaneously to verify that
 * pessimistic locking prevents overbooking.
 * 
 * To run: ./mvnw test -Dtest=RegistrationConcurrencyTest
 * Requires: PostgreSQL running (uses real DB for lock testing)
 */
@SpringBootTest
@ActiveProfiles("test")
public class RegistrationConcurrencyTest {

    @Autowired
    private RegistrationService registrationService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EventRepository eventRepository;

    @Autowired
    private RegistrationRepository registrationRepository;

    private Event testEvent;
    private List<User> testUsers;

    // Event capacity — we'll create more users than this
    private static final int EVENT_CAPACITY = 5;
    private static final int TOTAL_USERS = 15;

    @BeforeEach
    void setUp() {
        // Clean up from previous test runs
        registrationRepository.deleteAll();
        eventRepository.deleteAll();

        // Create organizer
        User organizer = userRepository.findByEmail("organizer-concurrency@test.com")
                .orElseGet(() -> {
                    User u = new User();
                    u.setEmail("organizer-concurrency@test.com");
                    u.setPassword("$2a$10$dummyhashfortest");
                    u.setName("Test Organizer");
                    u.setRole(Role.USER);
                    return userRepository.save(u);
                });

        // Create test event with limited capacity
        testEvent = new Event();
        testEvent.setTitle("Concurrency Test Event");
        testEvent.setDescription("Testing concurrent registrations");
        testEvent.setLocation("Test Venue");
        testEvent.setStartDate(LocalDateTime.now().plusDays(30));
        testEvent.setEndDate(LocalDateTime.now().plusDays(30).plusHours(8));
        testEvent.setCapacity(EVENT_CAPACITY);
        testEvent.setStatus(EventStatus.PUBLISHED);
        testEvent.setOrganizer(organizer);
        testEvent = eventRepository.save(testEvent);

        // Create test users
        testUsers = new ArrayList<>();
        for (int i = 0; i < TOTAL_USERS; i++) {
            final int index = i;
            User user = userRepository.findByEmail("concurrent-user-" + index + "@test.com")
                    .orElseGet(() -> {
                        User u = new User();
                        u.setEmail("concurrent-user-" + index + "@test.com");
                        u.setPassword("$2a$10$dummyhashfortest");
                        u.setName("Concurrent User " + index);
                        u.setRole(Role.USER);
                        return userRepository.save(u);
                    });
            testUsers.add(user);
        }
    }

    @Test
    void shouldNotOverbookWhenMultipleUsersRegisterSimultaneously() throws InterruptedException {
        // Arrange
        int threadCount = TOTAL_USERS;
        ExecutorService executor = Executors.newFixedThreadPool(threadCount);
        CountDownLatch startLatch = new CountDownLatch(1); // Ensures all threads start at once
        CountDownLatch doneLatch = new CountDownLatch(threadCount);

        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger failCount = new AtomicInteger(0);
        List<String> errors = new CopyOnWriteArrayList<>();

        // Act — fire all registration requests simultaneously
        for (int i = 0; i < threadCount; i++) {
            final String userEmail = testUsers.get(i).getEmail();

            executor.submit(() -> {
                try {
                    // Wait until all threads are ready
                    startLatch.await();

                    // Try to register
                    registrationService.registerForEvent(testEvent.getId(), userEmail);
                    successCount.incrementAndGet();
                } catch (Exception e) {
                    failCount.incrementAndGet();
                    errors.add(userEmail + ": " + e.getMessage());
                } finally {
                    doneLatch.countDown();
                }
            });
        }

        // Release all threads at once (simulates concurrent requests)
        startLatch.countDown();

        // Wait for all to complete (with timeout)
        boolean completed = doneLatch.await(30, TimeUnit.SECONDS);
        executor.shutdown();

        // Assert
        assertTrue(completed, "Test timed out — possible deadlock!");

        // The critical assertion: successful registrations must NOT exceed capacity
        long confirmedCount = registrationRepository.countByEventIdAndStatus(
            testEvent.getId(), RegistrationStatus.CONFIRMED
        );

        System.out.println("════════════════════════════════════════════");
        System.out.println("  CONCURRENCY TEST RESULTS");
        System.out.println("════════════════════════════════════════════");
        System.out.println("  Event capacity:          " + EVENT_CAPACITY);
        System.out.println("  Total attempts:          " + threadCount);
        System.out.println("  Successful registrations:" + successCount.get());
        System.out.println("  Rejected registrations:  " + failCount.get());
        System.out.println("  DB confirmed count:      " + confirmedCount);
        System.out.println("════════════════════════════════════════════");

        // THE MOST IMPORTANT ASSERTION
        assertTrue(
            confirmedCount <= EVENT_CAPACITY,
            "OVERBOOKING DETECTED! Confirmed: " + confirmedCount + 
            ", Capacity: " + EVENT_CAPACITY
        );

        // Exactly EVENT_CAPACITY should have succeeded
        assertEquals(EVENT_CAPACITY, successCount.get(),
            "Expected exactly " + EVENT_CAPACITY + " successful registrations");

        // The rest should have been rejected
        assertEquals(TOTAL_USERS - EVENT_CAPACITY, failCount.get(),
            "Expected " + (TOTAL_USERS - EVENT_CAPACITY) + " rejected registrations");

        // Verify all rejected users got capacity error
        for (String error : errors) {
            assertTrue(
                error.contains("capacity") || error.contains("full"),
                "Unexpected error message: " + error
            );
        }
    }

    @Test
    void shouldHandleCancelAndReRegisterConcurrently() throws InterruptedException {
        // First, register a user normally
        String userEmail = testUsers.get(0).getEmail();
        Registration reg = registrationService.registerForEvent(testEvent.getId(), userEmail);

        // Cancel it
        registrationService.cancelRegistration(reg.getId(), userEmail);

        // Now try to re-register concurrently (2 threads with same user)
        ExecutorService executor = Executors.newFixedThreadPool(2);
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch doneLatch = new CountDownLatch(2);
        AtomicInteger successCount = new AtomicInteger(0);

        for (int i = 0; i < 2; i++) {
            executor.submit(() -> {
                try {
                    startLatch.await();
                    registrationService.registerForEvent(testEvent.getId(), userEmail);
                    successCount.incrementAndGet();
                } catch (Exception e) {
                    // Expected for one of the two threads
                } finally {
                    doneLatch.countDown();
                }
            });
        }

        startLatch.countDown();
        doneLatch.await(10, TimeUnit.SECONDS);
        executor.shutdown();

        // Only one should succeed
        assertEquals(1, successCount.get(), 
            "Only one re-registration should succeed");

        long confirmedCount = registrationRepository.countByEventIdAndStatus(
            testEvent.getId(), RegistrationStatus.CONFIRMED
        );
        assertEquals(1, confirmedCount, 
            "Should have exactly 1 confirmed registration");
    }
}