// Calendar files and "add to calendar" links, all made at build time.
//
// - icsCalendar() writes an iCalendar file (used by /events.ics, the smaller feeds
//   in /calendar/<feed>.ics, and the one-event files in /calendar/event/<id>.ics).
// - googleUrl() and outlookUrl() are plain links that open the person's own
//   calendar with the event filled in. Nothing is tracked or sent anywhere else.
// - getFeeds() lists the smaller feeds: one per active branch, and one per kind
//   of event. Add or rename feeds here.
import { getCollection } from 'astro:content';
import site from '../data/site.json';
import { type ChapterEvent, allEvents, eventSummary, shortLocation, matches, typeOf, isGoodFirst } from './events';

// Feeds keep the last two months of past events, so recent ones don't vanish from calendars.
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

const endDate = (e: ChapterEvent) => (e.end ? new Date(e.end) : new Date(new Date(e.start).getTime() + 60 * 60 * 1000));

/** The fullest location we have: the street address when there is one. */
export function fullLocation(e: ChapterEvent): string | null {
  return e.location && !/^\d+ locations$/.test(e.location) ? e.location : shortLocation(e);
}

/** Summary plus the RSVP link, for calendar descriptions. */
function details(e: ChapterEvent, max = 400): string {
  return [eventSummary(e, max), e.url ? `Details and RSVP: ${e.url}` : null].filter(Boolean).join('\n\n');
}

/** Events a feed should carry: upcoming, plus the last couple of months. */
export function feedWindow(events: ChapterEvent[] = allEvents, now = Date.now()): ChapterEvent[] {
  const since = now - KEEP_PAST_DAYS * 24 * 60 * 60 * 1000;
  return events
    .filter((e) => endDate(e).getTime() >= since)
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
}

/** An iCalendar file. `feed` adds the refresh hints calendar apps use for subscriptions. */
export function icsCalendar(events: ChapterEvent[], name: string, feed = true): Response {
  const now = new Date();
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:-//${site.orgName}//Events//EN`,
    'CALSCALE:GREGORIAN',
    feed ? 'METHOD:PUBLISH' : null,
    feed ? `X-WR-CALNAME:${esc(name)}` : null,
    feed ? 'X-WR-TIMEZONE:America/Los_Angeles' : null,
    feed ? 'REFRESH-INTERVAL;VALUE=DURATION:PT12H' : null,
    feed ? 'X-PUBLISHED-TTL:PT12H' : null,
  ].filter(Boolean) as string[];
  for (const e of events) {
    const start = new Date(e.start);
    const description = details(e);
    const where = fullLocation(e);
    lines.push(
      'BEGIN:VEVENT',
      `UID:${e.id}-${start.getTime()}@csf-dsa.org`,
      `DTSTAMP:${stamp(now)}`,
      `DTSTART:${stamp(start)}`,
      `DTEND:${stamp(endDate(e))}`,
      `SUMMARY:${esc(e.title)}`,
    );
    if (where) lines.push(`LOCATION:${esc(where)}`);
    if (description) lines.push(`DESCRIPTION:${esc(description)}`);
    if (e.url) lines.push(`URL:${e.url}`);
    lines.push('END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  return new Response(lines.map(fold).join('\r\n') + '\r\n', {
    headers: { 'Content-Type': 'text/calendar; charset=utf-8' },
  });
}

/** Path of the one-event calendar file (Apple Calendar, Outlook desktop, anything else). */
export const eventIcsPath = (e: ChapterEvent) => `/calendar/event/${e.id}.ics`;

/** Opens Google Calendar with the event filled in, ready to save. */
export function googleUrl(e: ChapterEvent): string {
  const p = new URLSearchParams({
    action: 'TEMPLATE',
    text: e.title,
    dates: `${stamp(new Date(e.start))}/${stamp(endDate(e))}`,
    details: details(e, 300),
    location: fullLocation(e) ?? '',
    ctz: 'America/Los_Angeles',
  });
  return `https://calendar.google.com/calendar/render?${p}`;
}

/** Opens Outlook on the web with the event filled in. */
export function outlookUrl(e: ChapterEvent): string {
  const p = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: e.title,
    startdt: new Date(e.start).toISOString(),
    enddt: endDate(e).toISOString(),
    body: details(e, 300),
    location: fullLocation(e) ?? '',
  });
  return `https://outlook.live.com/calendar/0/action/compose?${p}`;
}

/** Subscribe links for a feed path like /events.ics or /calendar/auburn.ics. */
export function subscribeLinks(feedPath: string, siteUrl: URL | undefined) {
  const feed = new URL(feedPath, siteUrl ?? 'https://csf-dsa.org');
  const webcal = feed.href.replace(/^https?:/, 'webcal:');
  return { webcal, google: `https://calendar.google.com/calendar/render?cid=${encodeURIComponent(webcal)}`, https: feed.href };
}

export interface Feed {
  slug: string;
  kind: 'branch' | 'type';
  name: string;
  nameEs: string;
  match: (e: ChapterEvent) => boolean;
}

/** The smaller feeds. Branch feeds use the same matching as the branch pages. */
export async function getFeeds(): Promise<Feed[]> {
  const branches = (await getCollection('branches'))
    .filter((b) => b.data.status !== 'forming')
    .sort((a, b) => a.data.order - b.data.order);
  return [
    ...branches.map((b) => ({
      slug: b.id,
      kind: 'branch' as const,
      name: b.data.name,
      nameEs: b.data.name,
      match: (e: ChapterEvent) => matches(e, { keywords: b.data.keywords, cities: b.data.cities }),
    })),
    { slug: 'meetings', kind: 'type', name: 'Meetings', nameEs: 'Reuniones', match: (e) => typeOf(e) === 'meeting' },
    { slug: 'socials', kind: 'type', name: 'Socials', nameEs: 'Eventos sociales', match: (e) => typeOf(e) === 'social' },
    { slug: 'actions', kind: 'type', name: 'Actions', nameEs: 'Acciones', match: (e) => typeOf(e) === 'action' },
    { slug: 'city-and-county', kind: 'type', name: 'City & county meetings', nameEs: 'Ciudad y condado', match: (e) => typeOf(e) === 'civic' },
    { slug: 'good-first-events', kind: 'type', name: 'Good first events', nameEs: 'Buenos primeros eventos', match: isGoodFirst },
  ];
}

/** Months that get a printable calendar page (/events/print/YYYY-MM/): this month and next. */
export function printMonths(now = new Date()): { key: string; label: string }[] {
  const [y, m] = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit' }).format(now).split('-').map(Number);
  return [0, 1].map((i) => {
    const d = new Date(Date.UTC(y, m - 1 + i, 15));
    return {
      key: `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`,
      label: new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(d),
    };
  });
}
