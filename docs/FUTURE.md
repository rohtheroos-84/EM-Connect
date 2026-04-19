# EM-Connect - Future Roadmap

Last updated: 2026-04-19

This roadmap keeps only the still-relevant forward work. Completed historical build phases live better in the archived planning docs and in the active repo docs.

Priority scale:

- `P0`: security or correctness work
- `P1`: production hardening
- `P2`: major product capabilities
- `P3`: quality-of-life and polish

## P0 - Security And Correctness

- [ ] Add rate limiting for auth and registration endpoints
- [ ] Remove or hard-disable `/api/test/**` outside development
- [ ] Stop committing live-like secrets in config and move all production credentials to platform env vars
- [ ] Tighten authorization on `GET /api/events/{eventId}/registrations`
- [ ] Reconcile ticket validation authorization with the actual role model (`USER` / `ADMIN`)
- [ ] Add stronger audit logging for sensitive admin and account actions

## P1 - Production Hardening

- [ ] Move avatar, banner, and ticket QR storage to durable shared object storage
- [ ] Improve worker observability, retry visibility, and failure dashboards
- [ ] Add safer environment separation for local, staging, and production config
- [ ] Add automated smoke tests for deploy verification
- [ ] Reduce duplicated event timestamp parsing logic across Go services

## P2 - Product Features

- [ ] Attendee scanner UI for on-site check-in
- [ ] Waitlist support for full events
- [ ] Persistent in-app notification inbox drawer
- [ ] Command palette for power-user navigation and actions
- [ ] Guest browse mode with clearer upgrade-to-sign-in prompts
- [ ] Weekly admin digest or export workflow for analytics

## P3 - UX And Developer Experience

- [ ] Unsaved-changes guard in the event form modal
- [ ] Better user-facing feedback for ticket QR generation/download failures
- [ ] More end-to-end test coverage for auth, registration, and admin flows
- [ ] Optional dashboard/view personalization
- [ ] Longer-term observability and audit tooling

## Already Shipped

These items were future work in older docs and are now live:

- [x] Google OAuth login
- [x] Forgot-password flow with verification codes
- [x] Event categories, tags, and banner upload
- [x] Admin dashboard and analytics UI
- [x] Profile editing, avatar upload, and password change
- [x] Calendar export support
- [x] Rich HTML email templates and reminder delivery
- [x] Login activity timeline
- [x] Resend reset code cooldown
- [x] Return-to-intent auth redirect
- [x] Dedicated Not Found page

## Related Docs

- [SECURITY_AUDIT.md](SECURITY_AUDIT.md)
- [INCREMENTAL_FEATURES.md](INCREMENTAL_FEATURES.md)
- [DEPLOY.md](DEPLOY.md)
