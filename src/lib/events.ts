import data from '../data/events.json';

export interface ChapterEvent {
  id: string;
  seriesId: number | null;
  title: string;
  url: string | null;
  description: string;
  start: string;
  end: string | null;
  location: string | null;
  locations: string[];
}

export const TIMEZONE = 'America/Los_Angeles';

export const allEvents: ChapterEvent[] = data.events as ChapterEvent[];
export const eventsFetchedAt: string = data.fetchedAt;

// ---- Upcoming and past ----------------------------------------------------

const endOf = (e: ChapterEvent) => new Date(e.end ?? e.start).getTime();
const startOf = (e: ChapterEvent) => new Date(e.start).getTime();

/** Events that have not ended yet, soonest first. */
export function upcomingEvents(now: Date = new Date(), limit?: number): ChapterEvent[] {
  const list = allEvents.filter((e) => endOf(e) >= now.getTime()).sort((a, b) => startOf(a) - startOf(b));
  return typeof limit === 'number' ? list.slice(0, limit) : list;
}

/** Events that have ended, most recent first. */
export function pastEvents(now: Date = new Date(), limit?: number): ChapterEvent[] {
  const list = allEvents.filter((e) => endOf(e) < now.getTime()).sort((a, b) => startOf(b) - startOf(a));
  return typeof limit === 'number' ? list.slice(0, limit) : list;
}

// ---- Event types ----------------------------------------------------------
// Solidarity Tech has no event categories we can read, so the type is guessed
// from the title. Add keywords here if an event lands in the wrong bucket.

export type EventType = 'meeting' | 'social' | 'action' | 'civic' | 'training' | 'other';

export const EVENT_TYPES: { key: EventType; label: string; plural: string }[] = [
  { key: 'meeting', label: 'Meeting', plural: 'Meetings' },
  { key: 'social', label: 'Social', plural: 'Socials' },
  { key: 'action', label: 'Action', plural: 'Actions' },
  { key: 'civic', label: 'City & county', plural: 'City & county' },
  { key: 'training', label: 'Training', plural: 'Trainings' },
  { key: 'other', label: 'Event', plural: 'Other' },
];

export function typeOf(e: ChapterEvent): EventType {
  const t = e.title.toLowerCase();
  if (/city council|supervisors|town hall|planning commission|school board/.test(t)) return 'civic';
  if (/protest|rally|march|picket|canvass|phone ?bank|outreach|tabling|no kings|strike/.test(t)) return 'action';
  if (/social|potluck|picnic|party|happy hour|hike|movie|game night|bbq|gathering|meet our/.test(t)) return 'social';
  if (/training|workshop|reading|study|book club|political education|101|building session|onboarding/.test(t)) return 'training';
  if (/meeting|branch|chapter/.test(t)) return 'meeting';
  return 'other';
}

export function typeLabel(e: ChapterEvent): string {
  return EVENT_TYPES.find((t) => t.key === typeOf(e))!.label;
}

// ---- Matching events to branches and campaigns ----------------------------

export interface EventMatcher {
  /** Words to look for in the event title. */
  keywords?: string[];
  /** City names to look for in the event location. */
  cities?: string[];
}

export function matches(e: ChapterEvent, m: EventMatcher): boolean {
  const title = e.title.toLowerCase();
  const where = [e.location ?? '', ...e.locations].join(' ').toLowerCase();
  return (
    (m.keywords ?? []).some((k) => title.includes(k.toLowerCase())) ||
    (m.cities ?? []).some((c) => where.includes(c.toLowerCase()))
  );
}

// ---- Grouping -------------------------------------------------------------

export interface DayGroup {
  key: string;
  weekday: string;
  month: string;
  day: string;
  events: ChapterEvent[];
}

/** Group events by calendar day in the chapter's timezone. Keeps input order. */
export function groupByDay(events: ChapterEvent[]): DayGroup[] {
  const groups = new Map<string, DayGroup>();
  for (const e of events) {
    const d = new Date(e.start);
    const key = new Intl.DateTimeFormat('en-CA', { timeZone: TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
    if (!groups.has(key)) {
      groups.set(key, { key, weekday: fmt(d, { weekday: 'short' }), month: fmt(d, { month: 'short' }), day: fmt(d, { day: 'numeric' }), events: [] });
    }
    groups.get(key)!.events.push(e);
  }
  return [...groups.values()];
}

export interface MonthGroup {
  key: string;
  label: string;
  events: ChapterEvent[];
}

/** Group events by month in the chapter's timezone. Keeps input order. */
export function groupByMonth(events: ChapterEvent[]): MonthGroup[] {
  const groups = new Map<string, MonthGroup>();
  for (const e of events) {
    const d = new Date(e.start);
    const key = new Intl.DateTimeFormat('en-CA', { timeZone: TIMEZONE, year: 'numeric', month: '2-digit' }).format(d);
    if (!groups.has(key)) groups.set(key, { key, label: fmt(d, { month: 'long', year: 'numeric' }), events: [] });
    groups.get(key)!.events.push(e);
  }
  return [...groups.values()];
}

// ---- Formatting -----------------------------------------------------------

export function formatTime(iso: string): string {
  return fmt(new Date(iso), { hour: 'numeric', minute: '2-digit' }).replace(':00', '');
}

export function formatTimeRange(e: ChapterEvent): string {
  const start = formatTime(e.start);
  if (!e.end) return start;
  const end = formatTime(e.end);
  // Drop a duplicated AM/PM marker: "6 PM – 8 PM" becomes "6–8 PM".
  const sfx = start.slice(-2);
  if (end.endsWith(sfx)) return `${start.slice(0, -3)}–${end}`;
  return `${start}–${end}`;
}

export function formatLongDate(iso: string): string {
  return fmt(new Date(iso), { weekday: 'long', month: 'long', day: 'numeric' });
}

export function formatShortDate(iso: string | Date): string {
  return fmt(new Date(iso), { month: 'short', day: 'numeric' });
}

export function formatFullDate(iso: string | Date): string {
  return fmt(new Date(iso), { month: 'long', day: 'numeric', year: 'numeric' });
}

/** "BriarPatch Food Co-op - 2505 Bell Rd, Auburn, CA 95603, USA" -> "BriarPatch Food Co-op, Auburn" */
export function shortLocation(e: ChapterEvent): string | null {
  const loc = e.location;
  if (!loc) return null;
  if (/^\d+ locations$/.test(loc)) return 'In person and online';
  const [name, rest] = loc.split(' - ');
  const city = rest?.split(',').map((s) => s.trim()).find((_part, i, arr) => i === arr.length - 3) ?? null;
  if (name && city && !name.includes(city)) return `${name}, ${city}`;
  return name ?? loc;
}

export function isVirtual(e: ChapterEvent): boolean {
  return /virtual|zoom|online/i.test(e.location ?? '');
}

/** A date-only value from frontmatter, moved to midday so it formats as the day that was written. */
export function dateOnly(d: Date): Date {
  return new Date(d.getTime() + 12 * 60 * 60 * 1000);
}

function fmt(d: Date, opts: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat('en-US', { timeZone: TIMEZONE, ...opts }).format(d);
}
