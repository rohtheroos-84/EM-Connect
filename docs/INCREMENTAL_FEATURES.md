# Incremental Features

This doc captures the selected improvements for phased implementation with minimal risk and clear, testable tasks.

## Delivery Order:

1. OTP Paste Intelligence - DONE
2. Resend Code + Cooldown - DONE
3. Security Badges - WAITLISTED for now, may revisit after core features are solidified
4. Registration UX Upgrade (dialogs + copy) - DONE
5. Login Activity Timeline - DONE
6. Notification Inbox Drawer
7. Auth/Onboarding: Guest Browse Entry (Limited Access)
8. Auth Flow: Return-to-Intent Redirect
9. Weekly Digest Email Export - WAITLISTED for now, may revisit after core features are solidified
10. Command Palette

- This order prioritizes quick UX wins first, then broader app-wide enhancements.

## 1) Profile: Login Activity Timeline

Show recent account sign-ins so users can quickly detect unusual access.

### Scope
- Display last 10 login entries.
- Include timestamp, login method (password/google), and rough source (IP or user-agent summary if available).
- Read-only view on Profile page.

### Checklist
- [x] Add backend endpoint for current user login history.
- [x] Store login audit entries on successful auth events.
- [x] Add Profile section UI card: Recent Login Activity.
- [x] Add empty-state text for users with no history.
- [x] Add loading and error states.
- [x] Add basic retention cap (for example, keep latest N records).

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
- [x] Add paste handler for verify step input.
- [x] Sanitize pasted text to digits only.
- [x] Auto-populate OTP value and trigger verify when complete.
- [x] Keep accessibility behavior (focus management and screen-reader labels).
- [x] Add guardrails for invalid/partial paste.

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

## 7) Auth/Onboarding: Guest Browse Entry (Limited Access)

Allow users to explore events first, then sign in only when they are ready to register.

### Scope
- Add a clear Continue as Guest action on Login and Register pages.
- Keep guest access read-only (browse/search/view event detail).
- Show clear sign-in prompts when guest tries protected actions.

### Checklist
- [ ] Add Continue as Guest CTA on login page and register page.
- [ ] Route guest entry to public events list (instead of forcing auth first).
- [ ] Keep all protected pages guarded (dashboard, profile, registrations, admin, analytics).
- [ ] Add a subtle guest-mode indicator with quick Sign In / Register actions.
- [ ] Ensure no token/user session is written for guest mode.

## 8) Auth Flow: Return-to-Intent Redirect

After login/signup, send users back to what they originally wanted to do.

### Scope
- Preserve intended destination when redirecting unauthenticated users to login.
- Reuse the same redirect logic for email login, Google login, and register flows.
- Fall back to a safe default when no prior destination exists.

### Checklist
- [x] Update protected-route redirect to pass intended path in navigation state.
- [x] After successful login, redirect to intended path (fallback: dashboard).
- [x] After successful Google login, redirect to intended path (fallback: dashboard).
- [x] After successful register, redirect to intended path (fallback: dashboard).
- [x] Keep admin-only guard behavior intact if redirected user lacks admin role.

## Frontend Tweaks

Small frontend-only polish items that are low-risk but improve day-to-day UX quality.

### 1) Form Autocomplete Attributes

Improve password-manager and browser autofill support across auth and profile forms.

#### Scope
- Add appropriate `autoComplete` attributes to login, register, forgot-password, and change-password fields.
- Use semantic values (`email`, `username`, `current-password`, `new-password`, `one-time-code`) based on form intent.

#### Checklist
- [ ] Add autocomplete attributes in Login form.
- [ ] Add autocomplete attributes in Register form.
- [ ] Add autocomplete attributes in Forgot Password flow.
- [ ] Add autocomplete attributes in Profile Change Password form.

### 2) Caps Lock Warning on Password Inputs

Prevent false login/reset failures caused by accidental Caps Lock.

#### Scope
- Detect Caps Lock state while typing in password fields.
- Show a subtle inline warning only when Caps Lock is active.

#### Checklist
- [ ] Add Caps Lock detection on Login password field.
- [ ] Add Caps Lock detection on Register password fields.
- [ ] Add Caps Lock detection on Forgot Password reset fields.
- [ ] Add Caps Lock detection on Profile Change Password fields.

### 3) Ticket QR Download Failure Feedback

Avoid silent failures when QR download is not ready or request fails.

#### Scope
- Show user-facing feedback when ticket QR download fails.
- Provide actionable hint (for example, retry after a few seconds).

#### Checklist
- [ ] Add visible error message/toast on QR download failure.
- [ ] Add retry-friendly copy for generation-in-progress cases.

### 4) Email Input Normalization

Reduce avoidable auth friction caused by whitespace/case inconsistencies.

#### Scope
- Normalize email input before submit (trim whitespace; lowercase for auth endpoints).
- Apply consistently to login/register/forgot-password flows.

#### Checklist
- [ ] Normalize email on Login submit.
- [ ] Normalize email on Register submit.
- [ ] Normalize email on Forgot Password submit.
- [ ] Normalize email on Resend/Verify reset code paths.

### 5) Unsaved Changes Guard for Event Form Modal

Prevent accidental data loss while creating or editing events.

#### Scope
- Track dirty form state in EventFormModal.
- Warn before closing modal if there are unsaved edits.

#### Checklist
- [ ] Detect dirty state for all editable fields (including banner selection).
- [ ] Confirm before close on backdrop/X/cancel when form is dirty.
- [ ] Skip warning when submit succeeds or no changes were made.

## maybe later:
<!--
## 9) Profile/Auth: Security Badges

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


## 10) Analytics: Weekly Digest Email Export

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
-->

