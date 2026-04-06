# Incremental Features

This doc captures the selected improvements for phased implementation with minimal risk and clear, testable tasks.

## Delivery Order:

1. OTP Paste Intelligence - DONE
2. Resend Code + Cooldown - DONE
3. Security Badges
4. Registration UX Upgrade (dialogs + copy) - DONE
5. Login Activity Timeline
6. Notification Inbox Drawer
7. Weekly Digest Email Export
8. Command Palette

- This order prioritizes quick UX wins first, then broader app-wide enhancements.

## 1) Profile: Login Activity Timeline

Show recent account sign-ins so users can quickly detect unusual access.

### Scope
- Display last 10 login entries.
- Include timestamp, login method (password/google), and rough source (IP or user-agent summary if available).
- Read-only view on Profile page.

### Checklist
- [ ] Add backend endpoint for current user login history.
- [ ] Store login audit entries on successful auth events.
- [ ] Add Profile section UI card: Recent Login Activity.
- [ ] Add empty-state text for users with no history.
- [ ] Add loading and error states.
- [ ] Add basic retention cap (for example, keep latest N records).

## 2) Forgot Password: Resend Code with Cooldown

Reduce friction and support requests when users do not receive OTP quickly.

### Scope
- Add Resend Code action on verify step.
- Enforce cooldown (example: 30s) with visible countdown.
- Disable resend button while cooldown is active.

### Checklist
- [x] Add resend API route or reuse existing OTP issue flow safely.
- [x] Add server-side resend guard/rate-limit by email and time window.
- [x] Add frontend cooldown timer and button disabled state.
- [x] Show clear success and error toasts/messages.
- [x] Add telemetry/logging for resend attempts.

## 3) Forgot Password: OTP Paste Intelligence

Allow users to paste a full 6-digit OTP and complete verification faster.

### Scope
- Accept pasted 6-digit code in one action.
- Auto-fill OTP fields (or single input) and auto-submit verification.
- Keep manual entry behavior unchanged.

### Checklist
- [ ] Add paste handler for verify step input.
- [ ] Sanitize pasted text to digits only.
- [ ] Auto-populate OTP value and trigger verify when complete.
- [ ] Keep accessibility behavior (focus management and screen-reader labels).
- [ ] Add guardrails for invalid/partial paste.

## 4) Registration UX Upgrade (Adjusted)

Current behavior shows inline registration confirmation in the event view. Upgrade to a clearer flow with dialog confirmations and quick ticket-code copy in both dialog and event view.

### Scope
- On register action, show confirmation dialog before final submit.
- On cancel registration, show confirmation dialog before final submit.
- After successful registration, include Copy Ticket Code action:
  - In success dialog.
  - In event page inline section beside ticket code.

### Sub-features
- Register confirmation modal: summary + confirm/cancel actions.
- Cancel confirmation modal: warning + confirm/cancel actions.
- Ticket code quick copy with success feedback text.

### Checklist
- [x] Add register confirmation modal component/state.
- [x] Add cancellation confirmation modal component/state.
- [x] Ensure modal actions call existing APIs without behavior regressions.
- [x] Add quick copy button near ticket code in Event tab view.
- [x] Add same copy action in post-success dialog.
- [x] Add consistent toast text for copy success/failure.
- [x] Verify keyboard/escape/focus behavior for dialogs.

## 5) Global: Notification Inbox Drawer

Persist toast-worthy updates in a retrievable inbox so users can revisit missed messages.

### Scope
- Add bell icon entry point in app layout.
- Drawer shows recent notifications (published, cancelled, reminders, system updates).
- Mark-as-read and clear-all actions.
- Keep existing real-time toasts; inbox is additional persistence layer.

### Checklist
- [ ] Define notification item model (id, type, title, message, time, read).
- [ ] Create notification store/context with persistence strategy.
- [ ] Hook existing toast/live event sources into inbox writes.
- [ ] Build drawer UI with unread count badge.
- [ ] Add mark-read / clear actions.
- [ ] Add pagination or cap (example: latest 100 items).

## 6) Global: Command Palette (Expanded)

A keyboard-first quick action launcher for navigation and frequent actions.

### What It Is
A modal search box (similar to VS Code or Linear) opened with keyboard shortcut (example: Ctrl+K / Cmd+K). Users type to jump pages or run quick actions.

### Why It Helps
- Faster navigation than clicking through menus.
- Improves power-user workflow.
- Reduces UI clutter by moving secondary actions into searchable commands.

### Scope
- Open/close palette with shortcut and header icon.
- Search commands by name and keyword.
- Initial command set:
  - Go to Dashboard, Events, My Registrations, Profile.
  - For admins: Go to Admin / Analytics.
  - Log out.
- Role-aware command visibility.

### Checklist
- [ ] Build command registry (label, keywords, action, role access).
- [ ] Add command palette modal + keyboard bindings.
- [ ] Implement fuzzy search for commands.
- [ ] Add recent commands section (optional small enhancement).
- [ ] Add safe action confirmations where needed (example: logout).
- [ ] Add basic analytics for command usage.

<!--
## 7) Profile/Auth: Security Badges

Show lightweight security context on Profile so users can quickly verify account status.

### Scope
- Display Last Password Change timestamp.
- Display Last Login Method (password/google).
- Show both in Security section with clear labels and fallback values.

### Checklist
- [ ] Expose `lastPasswordChangedAt` in current-user profile response.
- [ ] Expose `lastLoginMethod` from latest successful auth event.
- [ ] Add Security Badges UI card in Profile page.
- [ ] Add fallback text when values are unavailable (for legacy users).
- [ ] Add timezone-consistent formatting for timestamps.
-->

## 8) Analytics: Weekly Digest Email Export

Send admins a concise weekly analytics summary via email.

### Scope
- Generate a weekly digest summary (core KPIs and trend deltas).
- Send to admin users only.
- Include quick links back to Analytics/Admin pages.

### Checklist
- [ ] Define digest schema (period, KPIs, top events, deltas).
- [ ] Add weekly job/scheduler trigger for digest generation.
- [ ] Create digest email template in notification worker.
- [ ] Add admin-only opt-in toggle for weekly digest.
- [ ] Add delivery logging and retry behavior.
- [ ] Add basic rate-limit/guard to avoid duplicate sends.

---


