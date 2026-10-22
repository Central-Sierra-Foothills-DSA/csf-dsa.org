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

/** Events that have not ended yet, soonest first. */
export function upcomingEvents(now: Date = new Date(), limit?: number): ChapterEvent[] {
  const list = allEvents
    .filter((e) => new Date(e.end ?? e.start).getTime() >= now.getTime())
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  return typeof limit === 'number' ? list.slice(0, limit) : list;
}

export interface DayGroup {
  key: string;
  weekday: string;
  month: string;
  day: string;
  events: ChapterEvent[];
}

/** Group events by calendar day in the chapter's timezone. */
export function groupByDay(events: ChapterEvent[]): DayGroup[] {
  const groups = new Map<string, DayGroup>();
  for (const e of events) {
    const d = new Date(e.start);
    const key = new Intl.DateTimeFormat('en-CA', { timeZone: TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
    if (!groups.has(key)) {
      groups.set(key, {
        key,
        weekday: fmt(d, { weekday: 'short' }),
        month: fmt(d, { month: 'short' }),
        day: fmt(d, { day: 'numeric' }),
        events: [],
      });
    }
    groups.get(key)!.events.push(e);
  }
  return [...groups.values()];
}

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

/** "BriarPatch Food Co-op - 2505 Bell Rd, Auburn, CA 95603, USA" -> "BriarPatch Food Co-op, Auburn" */
export function shortLocation(e: ChapterEvent): string | null {
  const loc = e.location;
  if (!loc) return null;
  if (e.locations.length > 1 && /^\d+ locations$/.test(loc)) return `${e.locations.length} locations`;
  const [name, rest] = loc.split(' - ');
  const city = rest?.split(',').map((s) => s.trim()).find((part, i, arr) => i === arr.length - 3) ?? null;
  if (name && city && !name.includes(city)) return `${name}, ${city}`;
  return name ?? loc;
}

export function isVirtual(e: ChapterEvent): boolean {
  return /virtual|zoom|online/i.test(e.location ?? '');
}

function fmt(d: Date, opts: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat('en-US', { timeZone: TIMEZONE, ...opts }).format(d);
}
