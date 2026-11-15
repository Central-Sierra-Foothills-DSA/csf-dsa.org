// Calendar feed (iCalendar) of chapter events, so people can subscribe once in
// Google Calendar, Apple Calendar, or Outlook. Built with the site, which rebuilds
// daily, so subscribers pick up new events on their calendar app's next refresh.
import type { APIRoute } from 'astro';
import site from '../data/site.json';
import { allEvents, eventSummary, shortLocation } from '../lib/events';

// Upcoming events plus the last two months, so recent ones don't vanish from calendars.
const KEEP_PAST_DAYS = 60;

/** 2026-12-03T02:00:00Z -> 20261203T020000Z */
const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

/** Escape text per RFC 5545: backslash, semicolon, comma, and newlines. */
const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');

/** Fold lines longer than 75 characters (continuation lines start with a space). */
function fold(line: string): string {
  if (line.length <= 75) return line;
  const parts = [line.slice(0, 75)];
  for (let i = 75; i < line.length; i += 74) parts.push(' ' + line.slice(i, i + 74));
  return parts.join('\r\n');
}

export const GET: APIRoute = () => {
  const now = Date.now();
  const since = now - KEEP_PAST_DAYS * 24 * 60 * 60 * 1000;
  const events = allEvents
    .filter((e) => new Date(e.end ?? e.start).getTime() >= since)
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:-//${site.orgName}//Events//EN`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${esc(site.orgName)}`,
    'X-WR-TIMEZONE:America/Los_Angeles',
    'REFRESH-INTERVAL;VALUE=DURATION:PT12H',
    'X-PUBLISHED-TTL:PT12H',
  ];
  for (const e of events) {
    const start = new Date(e.start);
    const end = e.end ? new Date(e.end) : new Date(start.getTime() + 60 * 60 * 1000);
    const summary = eventSummary(e, 400);
    const description = [summary, e.url ? `Details and RSVP: ${e.url}` : null].filter(Boolean).join('\n\n');
    lines.push(
      'BEGIN:VEVENT',
      `UID:${e.id}-${start.getTime()}@csf-dsa.org`,
      `DTSTAMP:${stamp(new Date(now))}`,
      `DTSTART:${stamp(start)}`,
      `DTEND:${stamp(end)}`,
      `SUMMARY:${esc(e.title)}`,
    );
    const where = e.location && !/^\d+ locations$/.test(e.location) ? e.location : shortLocation(e);
    if (where) lines.push(`LOCATION:${esc(where)}`);
    if (description) lines.push(`DESCRIPTION:${esc(description)}`);
    if (e.url) lines.push(`URL:${e.url}`);
    lines.push('END:VEVENT');
  }
  lines.push('END:VCALENDAR');

  return new Response(lines.map(fold).join('\r\n') + '\r\n', {
    headers: { 'Content-Type': 'text/calendar; charset=utf-8' },
  });
};
