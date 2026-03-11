package templates

import (
	"bytes"
	"fmt"
	"html/template"
)

// ── Shared Bauhaus layout ──────────────────────────────────────────────
// Every email wraps its body inside this shell.
const layoutHead = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{{.Subject}}</title>
<style>
  /* Reset */
  body,table,td,p,a,li{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}
  body{margin:0;padding:0;width:100%!important;-webkit-font-smoothing:antialiased}
  table{border-collapse:collapse!important}
  img{border:0;outline:none;text-decoration:none}

  /* Dark mode overrides for clients that support it */
  @media (prefers-color-scheme: dark) {
    .email-bg{background-color:#0a0f1e!important}
    .card{background-color:#111827!important;border-color:#1f2937!important}
    .text-primary{color:#e5e7eb!important}
    .text-secondary{color:#9ca3af!important}
    .divider{border-color:#1f2937!important}
  }
</style>
</head>
<body style="margin:0;padding:0;background-color:#f0f0f0;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f0f0;" class="email-bg">
<tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

<!-- BRAND BAR: red / yellow / blue -->
<tr>
  <td style="font-size:0;line-height:0;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
      <td width="33.33%" style="height:4px;background-color:#D02020;"></td>
      <td width="33.34%" style="height:4px;background-color:#F0C020;"></td>
      <td width="33.33%" style="height:4px;background-color:#1040C0;"></td>
    </tr></table>
  </td>
</tr>

<!-- HEADER -->
<tr>
  <td style="background-color:#121212;padding:28px 32px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
      <td>
        <table role="presentation" cellpadding="0" cellspacing="0"><tr>
          <td style="width:10px;height:10px;background-color:#D02020;"></td>
          <td style="width:4px;"></td>
          <td style="width:10px;height:10px;background-color:#F0C020;"></td>
          <td style="width:4px;"></td>
          <td style="width:10px;height:10px;background-color:#1040C0;"></td>
          <td style="width:10px;"></td>
          <td style="font-size:16px;font-weight:900;color:#ffffff;letter-spacing:1px;text-transform:uppercase;">EM-CONNECT</td>
        </tr></table>
      </td>
    </tr></table>
  </td>
</tr>

<!-- ACCENT BAR (dynamic per template) -->
<tr><td style="height:4px;background-color:{{.AccentColor}};"></td></tr>
`

const layoutFoot = `
<!-- FOOTER -->
<tr>
  <td style="background-color:#121212;padding:24px 32px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding-bottom:16px;">
          <table role="presentation" cellpadding="0" cellspacing="0"><tr>
            <td style="width:8px;height:8px;background-color:#D02020;"></td>
            <td style="width:3px;"></td>
            <td style="width:8px;height:8px;background-color:#F0C020;"></td>
            <td style="width:3px;"></td>
            <td style="width:8px;height:8px;background-color:#1040C0;"></td>
          </tr></table>
        </td>
      </tr>
      <tr>
        <td style="font-size:11px;color:rgba(255,255,255,0.35);font-weight:600;letter-spacing:0.5px;text-transform:uppercase;">
          EM-Connect &copy; 2026 &mdash; Event Management Platform
        </td>
      </tr>
      <tr>
        <td style="font-size:11px;color:rgba(255,255,255,0.2);padding-top:6px;">
          This is an automated message. Please do not reply.
        </td>
      </tr>
    </table>
  </td>
</tr>

<!-- BOTTOM BRAND BAR -->
<tr>
  <td style="font-size:0;line-height:0;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
      <td width="33.33%" style="height:4px;background-color:#D02020;"></td>
      <td width="33.34%" style="height:4px;background-color:#F0C020;"></td>
      <td width="33.33%" style="height:4px;background-color:#1040C0;"></td>
    </tr></table>
  </td>
</tr>

</table>
</td></tr></table>
</body>
</html>
`

// ── Template bodies ────────────────────────────────────────────────────

const confirmationBody = `
<!-- MAIN CARD -->
<tr>
  <td style="background-color:#ffffff;padding:36px 32px;" class="card">
    <!-- Badge -->
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:24px;"><tr>
      <td style="background-color:#16A34A;padding:4px 12px;">
        <span style="font-size:10px;font-weight:800;color:#ffffff;text-transform:uppercase;letter-spacing:1.5px;">Registration Confirmed</span>
      </td>
    </tr></table>

    <p style="font-size:16px;color:#121212;margin:0 0 8px;" class="text-primary">
      Hello <strong>{{.UserName}}</strong>,
    </p>
    <p style="font-size:14px;color:#6b7280;margin:0 0 28px;line-height:1.6;" class="text-secondary">
      Your registration has been confirmed. Here are your event details:
    </p>

    <!-- Event details card -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9fafb;border:1px solid #e5e7eb;margin-bottom:24px;">
      <tr><td style="height:3px;background-color:#1040C0;"></td></tr>
      <tr><td style="padding:20px 24px;">
        <p style="font-size:11px;font-weight:700;color:rgba(18,18,18,0.35);text-transform:uppercase;letter-spacing:1.5px;margin:0 0 8px;">Event</p>
        <p style="font-size:18px;font-weight:900;color:#121212;text-transform:uppercase;letter-spacing:0.5px;margin:0 0 16px;">{{.EventTitle}}</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          {{if .EventLocation}}
          <tr>
            <td style="padding:6px 0;font-size:12px;font-weight:700;color:rgba(18,18,18,0.4);text-transform:uppercase;letter-spacing:1px;width:90px;vertical-align:top;">Location</td>
            <td style="padding:6px 0;font-size:14px;color:#121212;">{{.EventLocation}}</td>
          </tr>
          {{end}}
          <tr>
            <td style="padding:6px 0;font-size:12px;font-weight:700;color:rgba(18,18,18,0.4);text-transform:uppercase;letter-spacing:1px;width:90px;vertical-align:top;">Date</td>
            <td style="padding:6px 0;font-size:14px;color:#121212;">{{.EventDate}}</td>
          </tr>
        </table>
      </td></tr>
    </table>

    <!-- Ticket Code -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      <tr><td align="center" style="padding:24px;border:2px dashed #D02020;background-color:#fef2f2;">
        <p style="font-size:11px;font-weight:700;color:rgba(18,18,18,0.4);text-transform:uppercase;letter-spacing:1.5px;margin:0 0 8px;">Your Ticket Code</p>
        <p style="font-size:28px;font-weight:900;color:#D02020;letter-spacing:4px;margin:0 0 8px;font-family:'Courier New',monospace;">{{.TicketCode}}</p>
        <p style="font-size:11px;color:#9ca3af;margin:0;">Present this code at the event entrance</p>
      </td></tr>
    </table>

    <p style="font-size:14px;color:#6b7280;margin:0;line-height:1.6;" class="text-secondary">
      We look forward to seeing you there!
    </p>
  </td>
</tr>
`

const cancellationBody = `
<!-- MAIN CARD -->
<tr>
  <td style="background-color:#ffffff;padding:36px 32px;" class="card">
    <!-- Badge -->
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:24px;"><tr>
      <td style="background-color:#D02020;padding:4px 12px;">
        <span style="font-size:10px;font-weight:800;color:#ffffff;text-transform:uppercase;letter-spacing:1.5px;">Registration Cancelled</span>
      </td>
    </tr></table>

    <p style="font-size:16px;color:#121212;margin:0 0 8px;" class="text-primary">
      Hello <strong>{{.UserName}}</strong>,
    </p>
    <p style="font-size:14px;color:#6b7280;margin:0 0 28px;line-height:1.6;" class="text-secondary">
      Your registration for the following event has been cancelled:
    </p>

    <!-- Event card -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9fafb;border:1px solid #e5e7eb;margin-bottom:24px;">
      <tr><td style="height:3px;background-color:#D02020;"></td></tr>
      <tr><td style="padding:20px 24px;">
        <p style="font-size:18px;font-weight:900;color:#121212;text-transform:uppercase;letter-spacing:0.5px;margin:0;">{{.EventTitle}}</p>
      </td></tr>
    </table>

    <p style="font-size:14px;color:#6b7280;margin:0 0 8px;line-height:1.6;" class="text-secondary">
      If you did not request this cancellation, please contact us immediately.
    </p>
    <p style="font-size:14px;color:#6b7280;margin:0;line-height:1.6;" class="text-secondary">
      You can always browse and register for other upcoming events on the platform.
    </p>
  </td>
</tr>
`

const eventPublishedBody = `
<!-- MAIN CARD -->
<tr>
  <td style="background-color:#ffffff;padding:36px 32px;" class="card">
    <!-- Badge -->
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:24px;"><tr>
      <td style="background-color:#1040C0;padding:4px 12px;">
        <span style="font-size:10px;font-weight:800;color:#ffffff;text-transform:uppercase;letter-spacing:1.5px;">Event Now Live</span>
      </td>
    </tr></table>

    <p style="font-size:16px;color:#121212;margin:0 0 8px;" class="text-primary">
      Your event is now <strong>published</strong> and visible to all users.
    </p>
    <p style="font-size:14px;color:#6b7280;margin:0 0 28px;line-height:1.6;" class="text-secondary">
      Attendees can now discover and register for your event.
    </p>

    <!-- Event details card -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9fafb;border:1px solid #e5e7eb;margin-bottom:24px;">
      <tr><td style="height:3px;background-color:#1040C0;"></td></tr>
      <tr><td style="padding:20px 24px;">
        <p style="font-size:11px;font-weight:700;color:rgba(18,18,18,0.35);text-transform:uppercase;letter-spacing:1.5px;margin:0 0 8px;">Event Details</p>
        <p style="font-size:18px;font-weight:900;color:#121212;text-transform:uppercase;letter-spacing:0.5px;margin:0 0 16px;">{{.EventTitle}}</p>
        {{if .EventDescription}}
        <p style="font-size:14px;color:#6b7280;margin:0 0 16px;line-height:1.6;">{{.EventDescription}}</p>
        {{end}}
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          {{if .EventLocation}}
          <tr>
            <td style="padding:6px 0;font-size:12px;font-weight:700;color:rgba(18,18,18,0.4);text-transform:uppercase;letter-spacing:1px;width:90px;vertical-align:top;">Location</td>
            <td style="padding:6px 0;font-size:14px;color:#121212;">{{.EventLocation}}</td>
          </tr>
          {{end}}
          <tr>
            <td style="padding:6px 0;font-size:12px;font-weight:700;color:rgba(18,18,18,0.4);text-transform:uppercase;letter-spacing:1px;width:90px;vertical-align:top;">Date</td>
            <td style="padding:6px 0;font-size:14px;color:#121212;">{{.EventDate}}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;font-size:12px;font-weight:700;color:rgba(18,18,18,0.4);text-transform:uppercase;letter-spacing:1px;width:90px;vertical-align:top;">Capacity</td>
            <td style="padding:6px 0;font-size:14px;color:#121212;">{{.Capacity}} spots</td>
          </tr>
        </table>
      </td></tr>
    </table>

    <p style="font-size:14px;color:#6b7280;margin:0;line-height:1.6;" class="text-secondary">
      Share the event link with your audience to start getting registrations!
    </p>
  </td>
</tr>
`

const eventCancelledBody = `
<!-- MAIN CARD -->
<tr>
  <td style="background-color:#ffffff;padding:36px 32px;" class="card">
    <!-- Badge -->
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:24px;"><tr>
      <td style="background-color:#F0C020;padding:4px 12px;">
        <span style="font-size:10px;font-weight:800;color:#121212;text-transform:uppercase;letter-spacing:1.5px;">Event Cancelled</span>
      </td>
    </tr></table>

    <p style="font-size:16px;color:#121212;margin:0 0 8px;" class="text-primary">
      We regret to inform you that the following event has been <strong>cancelled</strong>:
    </p>

    <!-- Event card -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9fafb;border:1px solid #e5e7eb;margin-bottom:24px;">
      <tr><td style="height:3px;background-color:#D02020;"></td></tr>
      <tr><td style="padding:20px 24px;">
        <p style="font-size:18px;font-weight:900;color:#121212;text-transform:uppercase;letter-spacing:0.5px;margin:0 0 12px;">{{.EventTitle}}</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:6px 0;font-size:12px;font-weight:700;color:rgba(18,18,18,0.4);text-transform:uppercase;letter-spacing:1px;width:120px;vertical-align:top;">Originally On</td>
            <td style="padding:6px 0;font-size:14px;color:#121212;">{{.OriginalDate}}</td>
          </tr>
          {{if .AffectedRegistrations}}
          <tr>
            <td style="padding:6px 0;font-size:12px;font-weight:700;color:rgba(18,18,18,0.4);text-transform:uppercase;letter-spacing:1px;width:120px;vertical-align:top;">Affected</td>
            <td style="padding:6px 0;font-size:14px;color:#D02020;font-weight:700;">{{.AffectedRegistrations}} registration(s)</td>
          </tr>
          {{end}}
        </table>
      </td></tr>
    </table>

    <p style="font-size:14px;color:#6b7280;margin:0;line-height:1.6;" class="text-secondary">
      We apologize for any inconvenience. All registered attendees have been notified.
    </p>
  </td>
</tr>
`

const eventReminderBody = `
<!-- MAIN CARD -->
<tr>
  <td style="background-color:#ffffff;padding:36px 32px;" class="card">
    <!-- Badge -->
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:24px;"><tr>
      <td style="background-color:#F0C020;padding:4px 12px;">
        <span style="font-size:10px;font-weight:800;color:#121212;text-transform:uppercase;letter-spacing:1.5px;">Event Reminder</span>
      </td>
    </tr></table>

    <p style="font-size:16px;color:#121212;margin:0 0 8px;" class="text-primary">
      Hello <strong>{{.UserName}}</strong>,
    </p>
    <p style="font-size:14px;color:#6b7280;margin:0 0 28px;line-height:1.6;" class="text-secondary">
      This is a friendly reminder that an event you registered for is coming up soon!
    </p>

    <!-- Event details card -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9fafb;border:1px solid #e5e7eb;margin-bottom:24px;">
      <tr><td style="height:3px;background-color:#F0C020;"></td></tr>
      <tr><td style="padding:20px 24px;">
        <p style="font-size:11px;font-weight:700;color:rgba(18,18,18,0.35);text-transform:uppercase;letter-spacing:1.5px;margin:0 0 8px;">Upcoming Event</p>
        <p style="font-size:18px;font-weight:900;color:#121212;text-transform:uppercase;letter-spacing:0.5px;margin:0 0 16px;">{{.EventTitle}}</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          {{if .EventLocation}}
          <tr>
            <td style="padding:6px 0;font-size:12px;font-weight:700;color:rgba(18,18,18,0.4);text-transform:uppercase;letter-spacing:1px;width:90px;vertical-align:top;">Location</td>
            <td style="padding:6px 0;font-size:14px;color:#121212;">{{.EventLocation}}</td>
          </tr>
          {{end}}
          <tr>
            <td style="padding:6px 0;font-size:12px;font-weight:700;color:rgba(18,18,18,0.4);text-transform:uppercase;letter-spacing:1px;width:90px;vertical-align:top;">Date</td>
            <td style="padding:6px 0;font-size:14px;color:#121212;">{{.EventDate}}</td>
          </tr>
        </table>
      </td></tr>
    </table>

    <!-- Ticket reminder -->
    {{if .TicketCode}}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr><td align="center" style="padding:20px;border:2px dashed #1040C0;background-color:#eff6ff;">
        <p style="font-size:11px;font-weight:700;color:rgba(18,18,18,0.4);text-transform:uppercase;letter-spacing:1.5px;margin:0 0 6px;">Your Ticket Code</p>
        <p style="font-size:24px;font-weight:900;color:#1040C0;letter-spacing:4px;margin:0;font-family:'Courier New',monospace;">{{.TicketCode}}</p>
      </td></tr>
    </table>
    {{end}}

    <p style="font-size:14px;color:#6b7280;margin:0;line-height:1.6;" class="text-secondary">
      Don't forget to bring your ticket code. See you there!
    </p>
  </td>
</tr>
`

// ── Welcome email for new user registration ────────────────────────────

const welcomeBody = `
<!-- MAIN CARD -->
<tr>
  <td style="background-color:#ffffff;padding:36px 32px;" class="card">
    <!-- Badge -->
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:24px;"><tr>
      <td style="background-color:#1040C0;padding:4px 12px;">
        <span style="font-size:10px;font-weight:800;color:#ffffff;text-transform:uppercase;letter-spacing:1.5px;">Welcome</span>
      </td>
    </tr></table>

    <p style="font-size:16px;color:#121212;margin:0 0 8px;" class="text-primary">
      Hello <strong>{{.UserName}}</strong>,
    </p>
    <p style="font-size:14px;color:#6b7280;margin:0 0 28px;line-height:1.6;" class="text-secondary">
      Welcome to <strong>EM-Connect</strong>! Your account has been created successfully.
    </p>

    <!-- Features card -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9fafb;border:1px solid #e5e7eb;margin-bottom:24px;">
      <tr><td style="height:3px;background-color:#1040C0;"></td></tr>
      <tr><td style="padding:20px 24px;">
        <p style="font-size:11px;font-weight:700;color:rgba(18,18,18,0.35);text-transform:uppercase;letter-spacing:1.5px;margin:0 0 12px;">What You Can Do</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:8px 0;font-size:14px;color:#121212;line-height:1.5;">
              <span style="color:#D02020;font-weight:900;margin-right:8px;">&#9632;</span> Browse and register for events
            </td>
          </tr>
          <tr>
            <td style="padding:8px 0;font-size:14px;color:#121212;line-height:1.5;">
              <span style="color:#F0C020;font-weight:900;margin-right:8px;">&#9632;</span> Get QR-code tickets for instant check-in
            </td>
          </tr>
          <tr>
            <td style="padding:8px 0;font-size:14px;color:#121212;line-height:1.5;">
              <span style="color:#1040C0;font-weight:900;margin-right:8px;">&#9632;</span> Receive reminders before events start
            </td>
          </tr>
          <tr>
            <td style="padding:8px 0;font-size:14px;color:#121212;line-height:1.5;">
              <span style="color:#D02020;font-weight:900;margin-right:8px;">&#9632;</span> Create and manage your own events
            </td>
          </tr>
        </table>
      </td></tr>
    </table>

    <p style="font-size:14px;color:#6b7280;margin:0;line-height:1.6;" class="text-secondary">
      Start exploring events now and never miss out on what matters to you!
    </p>
  </td>
</tr>
`

// ── Login alert email ──────────────────────────────────────────────────

const loginAlertBody = `
<!-- MAIN CARD -->
<tr>
  <td style="background-color:#ffffff;padding:36px 32px;" class="card">
    <!-- Badge -->
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:24px;"><tr>
      <td style="background-color:#1040C0;padding:4px 12px;">
        <span style="font-size:10px;font-weight:800;color:#ffffff;text-transform:uppercase;letter-spacing:1.5px;">Security Notice</span>
      </td>
    </tr></table>

    <p style="font-size:16px;color:#121212;margin:0 0 8px;" class="text-primary">
      Hello <strong>{{.UserName}}</strong>,
    </p>
    <p style="font-size:14px;color:#6b7280;margin:0 0 28px;line-height:1.6;" class="text-secondary">
      We detected a new sign-in to your EM-Connect account.
    </p>

    <!-- Login details card -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9fafb;border:1px solid #e5e7eb;margin-bottom:24px;">
      <tr><td style="height:3px;background-color:#1040C0;"></td></tr>
      <tr><td style="padding:20px 24px;">
        <p style="font-size:11px;font-weight:700;color:rgba(18,18,18,0.35);text-transform:uppercase;letter-spacing:1.5px;margin:0 0 8px;">Sign-In Details</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:6px 0;font-size:12px;font-weight:700;color:rgba(18,18,18,0.4);text-transform:uppercase;letter-spacing:1px;width:90px;vertical-align:top;">Method</td>
            <td style="padding:6px 0;font-size:14px;color:#121212;">{{.LoginMethod}}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;font-size:12px;font-weight:700;color:rgba(18,18,18,0.4);text-transform:uppercase;letter-spacing:1px;width:90px;vertical-align:top;">Time</td>
            <td style="padding:6px 0;font-size:14px;color:#121212;">{{.LoginTime}}</td>
          </tr>
        </table>
      </td></tr>
    </table>

    <p style="font-size:14px;color:#6b7280;margin:0;line-height:1.6;" class="text-secondary">
      If this was you, no action is needed. If you didn't sign in, please change your password immediately.
    </p>
  </td>
</tr>
`

// ── Password changed email ─────────────────────────────────────────────

const passwordChangedBody = `
<!-- MAIN CARD -->
<tr>
  <td style="background-color:#ffffff;padding:36px 32px;" class="card">
    <!-- Badge -->
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:24px;"><tr>
      <td style="background-color:#F0C020;padding:4px 12px;">
        <span style="font-size:10px;font-weight:800;color:#121212;text-transform:uppercase;letter-spacing:1.5px;">Password Updated</span>
      </td>
    </tr></table>

    <p style="font-size:16px;color:#121212;margin:0 0 8px;" class="text-primary">
      Hello <strong>{{.UserName}}</strong>,
    </p>
    <p style="font-size:14px;color:#6b7280;margin:0 0 28px;line-height:1.6;" class="text-secondary">
      Your password has been changed successfully.
    </p>

    <!-- Security notice -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#fef2f2;border:1px solid #fecaca;margin-bottom:24px;">
      <tr><td style="height:3px;background-color:#D02020;"></td></tr>
      <tr><td style="padding:20px 24px;">
        <p style="font-size:14px;color:#121212;margin:0;line-height:1.6;">
          <strong>Didn&rsquo;t make this change?</strong><br/>
          If you didn&rsquo;t change your password, your account may be compromised. Please secure your account immediately.
        </p>
      </td></tr>
    </table>

    <p style="font-size:14px;color:#6b7280;margin:0;line-height:1.6;" class="text-secondary">
      For your security, you may be asked to sign in again on your devices.
    </p>
  </td>
</tr>
`

// ── Check-in confirmation email ────────────────────────────────────────

const checkInBody = `
<!-- MAIN CARD -->
<tr>
  <td style="background-color:#ffffff;padding:36px 32px;" class="card">
    <!-- Badge -->
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:24px;"><tr>
      <td style="background-color:#16A34A;padding:4px 12px;">
        <span style="font-size:10px;font-weight:800;color:#ffffff;text-transform:uppercase;letter-spacing:1.5px;">Checked In</span>
      </td>
    </tr></table>

    <p style="font-size:16px;color:#121212;margin:0 0 8px;" class="text-primary">
      Hello <strong>{{.UserName}}</strong>,
    </p>
    <p style="font-size:14px;color:#6b7280;margin:0 0 28px;line-height:1.6;" class="text-secondary">
      You have been successfully checked in! Enjoy the event.
    </p>

    <!-- Event details card -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9fafb;border:1px solid #e5e7eb;margin-bottom:24px;">
      <tr><td style="height:3px;background-color:#16A34A;"></td></tr>
      <tr><td style="padding:20px 24px;">
        <p style="font-size:11px;font-weight:700;color:rgba(18,18,18,0.35);text-transform:uppercase;letter-spacing:1.5px;margin:0 0 8px;">Event</p>
        <p style="font-size:18px;font-weight:900;color:#121212;text-transform:uppercase;letter-spacing:0.5px;margin:0 0 16px;">{{.EventTitle}}</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          {{if .EventLocation}}
          <tr>
            <td style="padding:6px 0;font-size:12px;font-weight:700;color:rgba(18,18,18,0.4);text-transform:uppercase;letter-spacing:1px;width:90px;vertical-align:top;">Location</td>
            <td style="padding:6px 0;font-size:14px;color:#121212;">{{.EventLocation}}</td>
          </tr>
          {{end}}
          <tr>
            <td style="padding:6px 0;font-size:12px;font-weight:700;color:rgba(18,18,18,0.4);text-transform:uppercase;letter-spacing:1px;width:90px;vertical-align:top;">Ticket</td>
            <td style="padding:6px 0;font-size:14px;color:#121212;font-family:'Courier New',monospace;font-weight:700;">{{.TicketCode}}</td>
          </tr>
        </table>
      </td></tr>
    </table>

    <p style="font-size:14px;color:#6b7280;margin:0;line-height:1.6;" class="text-secondary">
      Thank you for attending. We hope you have a great experience!
    </p>
  </td>
</tr>
`

// ── Template registry ──────────────────────────────────────────────────

// ── Password reset code email ──────────────────────────────────────────

const passwordResetCodeBody = `
<!-- MAIN CARD -->
<tr>
  <td style="background-color:#ffffff;padding:36px 32px;" class="card">
    <!-- Badge -->
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:24px;"><tr>
      <td style="background-color:#D02020;padding:4px 12px;">
        <span style="font-size:10px;font-weight:800;color:#ffffff;text-transform:uppercase;letter-spacing:1.5px;">Password Reset</span>
      </td>
    </tr></table>

    <p style="font-size:16px;color:#121212;margin:0 0 8px;" class="text-primary">
      Hello <strong>{{.UserName}}</strong>,
    </p>
    <p style="font-size:14px;color:#6b7280;margin:0 0 28px;line-height:1.6;" class="text-secondary">
      We received a request to reset your password. Use the code below to proceed:
    </p>

    <!-- Reset Code -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      <tr><td align="center" style="padding:28px;border:2px dashed #D02020;background-color:#fef2f2;">
        <p style="font-size:11px;font-weight:700;color:rgba(18,18,18,0.4);text-transform:uppercase;letter-spacing:1.5px;margin:0 0 10px;">Your Reset Code</p>
        <p style="font-size:36px;font-weight:900;color:#D02020;letter-spacing:8px;margin:0 0 10px;font-family:'Courier New',monospace;">{{.ResetCode}}</p>
        <p style="font-size:11px;color:#9ca3af;margin:0;">This code expires in 15 minutes</p>
      </td></tr>
    </table>

    <!-- Security notice -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9fafb;border:1px solid #e5e7eb;margin-bottom:24px;">
      <tr><td style="height:3px;background-color:#F0C020;"></td></tr>
      <tr><td style="padding:20px 24px;">
        <p style="font-size:14px;color:#121212;margin:0;line-height:1.6;">
          <strong>Didn&rsquo;t request this?</strong><br/>
          If you didn&rsquo;t request a password reset, you can safely ignore this email. Your password will not be changed.
        </p>
      </td></tr>
    </table>

    <p style="font-size:14px;color:#6b7280;margin:0;line-height:1.6;" class="text-secondary">
      For security, never share this code with anyone.
    </p>
  </td>
</tr>
`

// TemplateData holds the data passed to every template.
type TemplateData struct {
	Subject       string
	AccentColor   string
	UserName      string
	EventTitle    string
	EventLocation string
	EventDate     string
	TicketCode    string
	// event_published extras
	EventDescription string
	Capacity         int
	// event_cancelled extras
	OriginalDate          string
	AffectedRegistrations int
	// login alert extras
	LoginMethod string
	LoginTime   string
	// password reset extras
	ResetCode string
}

var registry map[string]*template.Template

func init() {
	registry = make(map[string]*template.Template)

	templates := map[string]string{
		"registration_confirmed": confirmationBody,
		"registration_cancelled": cancellationBody,
		"event_published":        eventPublishedBody,
		"event_cancelled":        eventCancelledBody,
		"event_reminder":         eventReminderBody,
		"welcome":                welcomeBody,
		"login_alert":            loginAlertBody,
		"password_changed":       passwordChangedBody,
		"check_in":               checkInBody,
		"password_reset_code":    passwordResetCodeBody,
	}

	for name, body := range templates {
		src := layoutHead + body + layoutFoot
		registry[name] = template.Must(template.New(name).Parse(src))
	}
}

// Render renders a named template with the given data and returns the HTML string.
func Render(name string, data TemplateData) (string, error) {
	tmpl, ok := registry[name]
	if !ok {
		return "", fmt.Errorf("template not found: %s", name)
	}

	var buf bytes.Buffer
	if err := tmpl.Execute(&buf, data); err != nil {
		return "", fmt.Errorf("template execution failed: %w", err)
	}
	return buf.String(), nil
}
