# Event State Machine

Events in EM-Connect follow a **state machine pattern** that controls their lifecycle. This ensures events move through predictable stages and prevents invalid operations.

## State Diagram

```
                              ┌──────────────┐
                              │              │
                              │    DRAFT     │
                              │  (initial)   │
                              │              │
                              └──────┬───────┘
                                     │
                    ┌────────────────┼────────────────┐
                    │                │                │
                    │ publish()      │                │ cancel()
                    ▼                │                ▼
           ┌──────────────┐         │        ┌──────────────┐
           │              │         │        │              │
           │  PUBLISHED   │         │        │  CANCELLED   │
           │              │         │        │   (final)    │
           │              │         │        │              │
           └───────┬──────┘         │        └──────────────┘
                   │                │
        ┌──────────┴──────────┐     │
        │                     │     │
        │ complete()          │ cancel()
        ▼                     ▼     │
┌──────────────┐      ┌──────────────┐
│              │      │              │
│  COMPLETED   │      │  CANCELLED   │
│   (final)    │      │   (final)    │
│              │      │              │
└──────────────┘      └──────────────┘
```

## States

| State | Description | Visibility | Editable |
|-------|-------------|------------|----------|
| **DRAFT** | Event is being created/edited | Only organizer | Yes |
| **PUBLISHED** | Event is live, visible to all | Everyone | Yes |
| **CANCELLED** | Event was cancelled | Everyone | No |
| **COMPLETED** | Event has ended | Everyone | No |

## Valid Transitions

| From State | To State | Action | API Endpoint |
|------------|----------|--------|--------------|
| DRAFT | PUBLISHED | Publish | `POST /api/events/{id}/publish` |
| DRAFT | CANCELLED | Cancel | `POST /api/events/{id}/cancel` |
| PUBLISHED | CANCELLED | Cancel | `POST /api/events/{id}/cancel` |
| PUBLISHED | COMPLETED | Complete | `POST /api/events/{id}/complete` |

### Invalid Transitions

These transitions are **not allowed** and will return a 400 error:

- CANCELLED → any state (final state)
- COMPLETED → any state (final state)
- DRAFT → COMPLETED (must publish first)
- PUBLISHED → DRAFT (cannot unpublish)

---

## State Rules

### DRAFT State
- **Created automatically** when a new event is created
- **Only visible** to the organizer
- **Can be edited** (title, description, dates, etc.)
- **Can be deleted** (only state where delete is allowed)
- **Transitions to:** PUBLISHED or CANCELLED

### PUBLISHED State
- Event is **live and visible** to all users
- **Can still be edited** (update details)
- **Cannot be deleted** (use cancel instead)
- Future: Users can register for published events
- **Transitions to:** CANCELLED or COMPLETED

### CANCELLED State
- **Final state** - no further transitions
- Event remains visible but marked as cancelled
- **Cannot be edited** or deleted
- Use case: Organizer needs to cancel due to circumstances

### COMPLETED State
- **Final state** - no further transitions
- Event has ended successfully
- **Cannot be edited** or deleted
- Historical record of past events

---

## Implementation Details

### EventStatus Enum

```java
public enum EventStatus {
    DRAFT,      // Event is being created, not visible to users
    PUBLISHED,  // Event is live and accepting registrations
    CANCELLED,  // Event has been cancelled
    COMPLETED;  // Event has ended

    // Define valid transitions for each state
    private static final Set<EventStatus> DRAFT_TRANSITIONS = 
        EnumSet.of(PUBLISHED);
    private static final Set<EventStatus> PUBLISHED_TRANSITIONS = 
        EnumSet.of(CANCELLED, COMPLETED);
    private static final Set<EventStatus> CANCELLED_TRANSITIONS = 
        EnumSet.noneOf(EventStatus.class);  // No transitions allowed
    private static final Set<EventStatus> COMPLETED_TRANSITIONS = 
        EnumSet.noneOf(EventStatus.class);  // No transitions allowed

    /**
     * Check if transition from this state to target state is allowed
     */
    public boolean canTransitionTo(EventStatus target) {
        return getAllowedTransitions().contains(target);
    }

    /**
     * Get all states this state can transition to
     */
    public Set<EventStatus> getAllowedTransitions() {
        return switch (this) {
            case DRAFT -> DRAFT_TRANSITIONS;
            case PUBLISHED -> PUBLISHED_TRANSITIONS;
            case CANCELLED -> CANCELLED_TRANSITIONS;
            case COMPLETED -> COMPLETED_TRANSITIONS;
        };
    }

    /**
     * Check if event can be edited in this state
     */
    public boolean isEditable() {
        return this == DRAFT || this == PUBLISHED;
    }
}
```

### EventService State Transition

```java
/**
 * Transition event to a new state with validation
 */
private void transitionState(Event event, EventStatus newStatus) {
    EventStatus currentStatus = event.getStatus();
    
    if (!currentStatus.canTransitionTo(newStatus)) {
        throw new InvalidStateTransitionException(
            currentStatus.name(), 
            newStatus.name()
        );
    }
    
    event.setStatus(newStatus);
}
```

### State Transition Methods

```java
// Publish: DRAFT → PUBLISHED
public Event publishEvent(Long id, String userEmail) {
    Event event = getEventById(id);
    verifyOrganizer(event, userEmail);
    transitionState(event, EventStatus.PUBLISHED);
    return eventRepository.save(event);
}

// Cancel: DRAFT/PUBLISHED → CANCELLED
public Event cancelEvent(Long id, String userEmail) {
    Event event = getEventById(id);
    verifyOrganizer(event, userEmail);
    
    // DRAFT can skip directly to CANCELLED
    if (event.getStatus() == EventStatus.DRAFT) {
        event.setStatus(EventStatus.CANCELLED);
    } else {
        transitionState(event, EventStatus.CANCELLED);
    }
    
    return eventRepository.save(event);
}

// Complete: PUBLISHED → COMPLETED
public Event completeEvent(Long id, String userEmail) {
    Event event = getEventById(id);
    verifyOrganizer(event, userEmail);
    transitionState(event, EventStatus.COMPLETED);
    return eventRepository.save(event);
}
```

---

## Error Handling

### InvalidStateTransitionException

When an invalid state transition is attempted:

```java
public class InvalidStateTransitionException extends RuntimeException {
    public InvalidStateTransitionException(String from, String to) {
        super("Cannot transition from " + from + " to " + to);
    }
    
    public InvalidStateTransitionException(String message) {
        super(message);
    }
}
```

### API Error Response

```json
{
  "status": 400,
  "error": "Bad Request",
  "message": "Cannot transition from COMPLETED to PUBLISHED",
  "path": "/api/events/5/publish",
  "timestamp": "2024-01-15T10:30:00"
}
```

---

## State-Based Permissions

### Editability Rules

| Operation | DRAFT | PUBLISHED | CANCELLED | COMPLETED |
|-----------|-------|-----------|-----------|-----------|
| View | Organizer only | Everyone | Everyone | Everyone |
| Edit | ✅ | ✅ | ❌ | ❌ |
| Delete | ✅ | ❌ | ❌ | ❌ |
| Publish | ✅ | ❌ | ❌ | ❌ |
| Cancel | ✅ | ✅ | ❌ | ❌ |
| Complete | ❌ | ✅ | ❌ | ❌ |

### Code Check

```java
// In EventService.updateEvent()
if (!event.getStatus().isEditable()) {
    throw new InvalidStateTransitionException(
        "Cannot edit event in " + event.getStatus() + " state"
    );
}

// In EventService.deleteEvent()
if (event.getStatus() != EventStatus.DRAFT) {
    throw new InvalidStateTransitionException(
        "Can only delete draft events. Use cancel for published events."
    );
}
```

---

## API Examples

### Create Event (starts as DRAFT)

```bash
curl -X POST http://localhost:8080/api/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "Tech Meetup",
    "startDate": "2024-06-15T18:00:00",
    "endDate": "2024-06-15T21:00:00"
  }'

# Response: status = "DRAFT"
```

### Publish Event

```bash
curl -X POST http://localhost:8080/api/events/1/publish \
  -H "Authorization: Bearer $TOKEN"

# Response: status = "PUBLISHED"
```

### Cancel Event

```bash
curl -X POST http://localhost:8080/api/events/1/cancel \
  -H "Authorization: Bearer $TOKEN"

# Response: status = "CANCELLED"
```

### Complete Event

```bash
curl -X POST http://localhost:8080/api/events/1/complete \
  -H "Authorization: Bearer $TOKEN"

# Response: status = "COMPLETED"
```

### Invalid Transition (Error)

```bash
# Try to publish an already completed event
curl -X POST http://localhost:8080/api/events/1/publish \
  -H "Authorization: Bearer $TOKEN"

# Response (400):
{
  "status": 400,
  "error": "Bad Request", 
  "message": "Cannot transition from COMPLETED to PUBLISHED"
}
```

---

## Why Use a State Machine?

1. **Predictability** - Clear rules about what can happen when
2. **Data Integrity** - Prevents invalid states
3. **Business Logic** - Encapsulates lifecycle rules
4. **Auditability** - Clear state history
5. **Future Features** - Easy to add new states or transitions

### Future Enhancements

Possible additions to the state machine:

```
           ┌─────────────┐
           │             │
           │   DRAFT     │──────┐
           │             │      │
           └──────┬──────┘      │
                  │             │
                  ▼             │
           ┌─────────────┐      │
           │             │      │
           │ PENDING     │◀─────┘ (new: review queue)
           │  REVIEW     │
           │             │
           └──────┬──────┘
                  │
                  ▼
           ┌─────────────┐
           │  PUBLISHED  │───... (continues as before)
```

Features to consider:
- **PENDING_REVIEW** - Events await admin approval
- **SOLD_OUT** - Capacity reached
- **ARCHIVED** - Old events moved to archive
- State change timestamps
- State change audit log
