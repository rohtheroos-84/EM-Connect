# EM-Connect – Future Enhancements Roadmap

Organized by priority (P0 = Critical, P1 = High, P2 = Medium, P3 = Nice to Have)

---

## 🔴 P0 – Security & Stability (Highest Priority)

- [ ] Security Hardening  
  - [ ] Audit and fix all reported vulnerabilities  
  - [ ] Review authentication, JWT handling, and role enforcement  
  - [ ] Validate input sanitization across all endpoints  
  - [ ] Add security headers (CSP, HSTS, etc.)  

<!-- - [ ] Rate Limiting & Abuse Prevention  
  - [ ] Apply rate limiting on auth endpoints  
  - [ ] Apply rate limiting on registration endpoints  
  - [ ] Protect against brute force attacks   -->

<!-- - [ ] Prevent Double UI Loading / Duplicate Requests  
  - [ ] Disable buttons during API calls  
  - [ ] Add idempotency protection for critical actions  
  - [ ] Prevent duplicate registration submissions   -->

---

## 🟠 P1 – Production Readiness & Deployment

- [x] Production Email Integration  
  - [x] Replace MailHog with real SMTP provider  
  - [x] Configure production email credentials securely  
  - [x] Add retry and failure monitoring  

- [ ] Hosting & Deployment Strategy  
  - [ ] Decide hosting provider (VPS / cloud)  
  - [ ] Containerize frontend + backend properly  
  - [ ] Configure reverse proxy (Nginx or similar)  
  - [ ] Set up production environment variables  

- [ ] Background Service Orchestration  
  - [ ] Docker containers auto-start  
  - [ ] Spring Boot API auto-start  
  - [ ] Notification worker auto-start  
  - [ ] Ticket worker auto-start  
  - [ ] WebSocket hub auto-start  

- [x] OAuth Login  
  - [x] Google login    
  - [x] Role mapping for OAuth users  

---

## 🟡 P2 – Core Product Enhancements

- [x] Admin Dashboard & Event CRUD UI  
  - [x] Create/edit/publish/cancel/complete events via frontend  
  - [x] Admin-only management panel  

- [ ] Attendee Check-in System  
  - [ ] QR scanner page  
  - [ ] Mark attendance status  
  - [ ] Prevent duplicate check-ins  

<!-- - [ ] Waitlist System  
  - [ ] Allow waitlist when capacity full  
  - [ ] Auto-promote on cancellation  
  - [ ] Notify promoted users   -->

- [ ] Event Reminders  
  - [ ] 24h reminder  
  - [ ] 1h reminder  
  - [ ] Scheduled message handling  

- [x] Event Categories & Tags  
  - [x] Categorization  
  - [x] Filtering and search  
  - [x] Tag-based discovery  
 
- [x] Event Image / Banner Upload  
  - [x] File upload endpoint
  - [x] Display banner on event page  

- [x] User Profile Page  
  - [x] Edit name  
  - [x] Change password  
  - [x] Upload avatar  
  - [x] Registration history stats  

- [x] Email Templates  
  - [x] Rich HTML templates  
  - [x] Confirmation email  
  - [x] Reminder email  
  - [x] Cancellation email  

- [x] Export to Calendar  
  - [x] Generate .ics file  
  - [x] Google Calendar support  
  - [x] Outlook support  

- [ ] Forgot Password Flow and Implementation  
  - [ ] Password reset request page  
  - [ ] Email with reset link  
  - [ ] Reset password form  
  - [ ] Token expiration handling

---

## 🟢 P3 – Advanced & Experience Enhancements

- [x] Analytics Dashboard  
  - [x] Registration trends  
  - [x] Popular events  
  - [x] Peak registration hours  
  - [x] Charts integration  

<!-- - [ ] Event Comments / Discussion  
  - [ ] Real-time comment threads  
  - [ ] WebSocket-based updates  
  - [ ] Moderation controls   -->

- [x] Dark Mode  
  - [x] Bauhaus dark variant  
  - [x] Persist user preference  

- [ ] View Customizations  
  - [ ] User-selectable layout preferences  
  - [ ] Saved dashboard views  

- [ ] Professional UI Polish  
  - [ ] Refine spacing system  
  - [ ] Improve interaction states  
  - [ ] Ensure consistent component behavior  

---

## Long-Term Direction

- [ ] Full observability dashboard  
- [ ] Audit logging for admin actions  
- [ ] Multi-tenant event organizations  
- [ ] Scalable message retry infrastructure  
- [ ] Advanced permission management  

---

<!--
VERBATIM FEATURE LIST for reference (PRIORITY ORDERED)

P0 – Critical

1. verbatim: 'ASK SAME GITHUB COPILOT CHAT THE SAME VULNERABILITIES QUESTION AND FIX EM ALL' -> PRIORITY 19 "DO AT LAST"
2. Rate Limiting & Abuse Prevention — Spring Boot rate limiter (Bucket4j) on registration and auth endpoints
3. figuring out preventing double loading ui for updates

P1 – Production Readiness

4. actually sending mails to users instead of mailhog
5. figuring out how to host
6. figuring out how to run all these always in the background:
   - docker containers startup
   - springboot api startup
   - ticket, notification and websocket workers' startup
7. oauth login

P2 – Core Product Features

8. Admin Dashboard & Event CRUD UI — Admin panel to create/edit/publish/cancel/complete events from the frontend instead of API-only
9. Attendee Check-in System — QR scanner page (using device camera via html5-qrcode) for on-site ticket validation, marking ATTENDED status
10. Waitlist System — When capacity is full, allow users to join a waitlist; auto-promote on cancellation
11. Event Reminders — Scheduled notifications (24h/1h before) via a cron job or RabbitMQ delayed messages
12. Event Categories & Tags — Categorize events (tech, social, sports), filter/search by category
13. Event Image/Banner Upload — File upload endpoint + S3/MinIO storage for event cover images
14. User Profile Page — Edit name, change password, upload avatar, view registration history stats
15. Email Templates — Rich HTML email templates for confirmations, reminders, and cancellations instead of plain text
16. Export to Calendar — .ics file download for registered events (Google Calendar / Outlook integration)
17. Forgot Password Flow and Implementation — Password reset request page, email with reset link, reset form, token expiration handling

P3 – Experience & Enhancements

18. Analytics Dashboard — Registration trends over time, popular events, peak registration hours (charts via Recharts)
19. Event Comments/Discussion — Real-time comment thread per event via WebSocket
20. Dark Mode — Bauhaus dark variant with inverted palette
21. view customizations
22. professional ui
-->
