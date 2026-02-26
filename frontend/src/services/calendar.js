/**
 * Calendar export utilities — .ics file download and Google Calendar link generation.
 * No API keys required.
 */

/**
 * Format a JS Date to iCalendar YYYYMMDDTHHMMSSZ format (UTC).
 */
function toICSDate(iso) {
  const d = new Date(iso);
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

/**
 * Escape special characters for iCalendar text values.
 */
function escICS(str) {
  if (!str) return '';
  return str
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

/**
 * Generate a .ics (iCalendar) file content string for an event.
 *
 * @param {{ title: string, description?: string, location?: string, startDate: string, endDate: string, id?: number|string }} event
 * @returns {string} iCalendar content
 */
export function generateICS(event) {
  const uid = `emconnect-event-${event.id || Date.now()}@emconnect.local`;
  const now = toICSDate(new Date().toISOString());

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//EM-Connect//Event//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${toICSDate(event.startDate)}`,
    `DTEND:${toICSDate(event.endDate)}`,
    `SUMMARY:${escICS(event.title)}`,
  ];

  if (event.description) {
    lines.push(`DESCRIPTION:${escICS(event.description)}`);
  }
  if (event.location) {
    lines.push(`LOCATION:${escICS(event.location)}`);
  }

  lines.push(
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  );

  return lines.join('\r\n');
}

/**
 * Trigger a browser download of a .ics file for the given event.
 *
 * @param {{ title: string, description?: string, location?: string, startDate: string, endDate: string, id?: number|string }} event
 */
export function downloadICS(event) {
  const ics = generateICS(event);
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `${(event.title || 'event').replace(/[^a-zA-Z0-9_-]/g, '_')}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Format a JS Date to Google Calendar's required format: YYYYMMDDTHHMMSSZ
 */
function toGCalDate(iso) {
  const d = new Date(iso);
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

/**
 * Generate a Google Calendar "Add Event" URL.
 * No API key needed — this opens Google's own calendar UI.
 *
 * @param {{ title: string, description?: string, location?: string, startDate: string, endDate: string }} event
 * @returns {string} URL to open in new tab
 */
export function getGoogleCalendarUrl(event) {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title || 'Event',
    dates: `${toGCalDate(event.startDate)}/${toGCalDate(event.endDate)}`,
  });

  if (event.description) {
    params.set('details', event.description);
  }
  if (event.location) {
    params.set('location', event.location);
  }

  return `https://www.google.com/calendar/render?${params.toString()}`;
}
