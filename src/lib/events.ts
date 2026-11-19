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

/** Site languages. English is the default everywhere. */
export type Lang = 'en' | 'es';
const LOCALE: Record<Lang, string> = { en: 'en-US', es: 'es-US' };

// The scraped history can hold the same event twice with different time zone
// offsets (e.g. 12:00+11:00 and 21:00-04:00 are the same moment), so keep one
// entry per event page and actual start time. The first one seen wins.
function dedupe(events: ChapterEvent[]): ChapterEvent[] {
  const seen = new Set<string>();
  return events.filter((e) => {
    const key = `${e.url ?? e.title}|${new Date(e.start).getTime()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export const allEvents: ChapterEvent[] = dedupe(data.events as ChapterEvent[]);
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

/**
 * "Good first event": low-pressure ways in for someone new. Socials always count
 * (New here calls them the easiest way in), plus anything whose title says it's
 * for newcomers. Add words here to tag more events.
 */
export function isGoodFirst(e: ChapterEvent): boolean {
  return typeOf(e) === 'social' || /new member|newcomer|orientation|welcome|\b101\b|open house|meet and greet|meet & greet/i.test(e.title);
}

/** Spanish names for the event types, same keys as EVENT_TYPES. */
export const EVENT_TYPES_ES: Record<EventType, { label: string; plural: string }> = {
  meeting: { label: 'Reunión', plural: 'Reuniones' },
  social: { label: 'Social', plural: 'Eventos sociales' },
  action: { label: 'Acción', plural: 'Acciones' },
  civic: { label: 'Ciudad y condado', plural: 'Ciudad y condado' },
  training: { label: 'Capacitación', plural: 'Capacitaciones' },
  other: { label: 'Evento', plural: 'Otros' },
};

export function typeLabel(e: ChapterEvent, lang: Lang = 'en'): string {
  if (lang === 'es') return EVENT_TYPES_ES[typeOf(e)].label;
  return EVENT_TYPES.find((t) => t.key === typeOf(e))!.label;
}

// ---- Matching events to branches and campaigns ----------------------------

export interface EventMatcher {
  /** Words to look for in the event title. */
  keywords?: string[];
  /** City names to look for in the event location. */
  cities?: string[];
}

// A city name as a whole word, but not as part of a street name:
// "156 S Auburn St, Grass Valley" is not in Auburn.
const STREET = '(?:st|street|rd|road|ave|avenue|blvd|boulevard|way|dr|drive|ln|lane|ct|court|hwy|highway|pkwy|parkway)';
const cityPatterns = new Map<string, RegExp>();
function cityPattern(city: string): RegExp {
  let re = cityPatterns.get(city);
  if (!re) {
    const escaped = city.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    re = new RegExp(`\\b${escaped}\\b(?!\\s+${STREET}\\b)`);
    cityPatterns.set(city, re);
  }
  return re;
}

export function matches(e: ChapterEvent, m: EventMatcher): boolean {
  const title = e.title.toLowerCase();
  const where = [e.location ?? '', ...e.locations].join(' ').toLowerCase();
  return (
    (m.keywords ?? []).some((k) => title.includes(k.toLowerCase())) ||
    (m.cities ?? []).some((c) => cityPattern(c).test(where))
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
export function groupByDay(events: ChapterEvent[], lang: Lang = 'en'): DayGroup[] {
  const groups = new Map<string, DayGroup>();
  for (const e of events) {
    const d = new Date(e.start);
    const key = new Intl.DateTimeFormat('en-CA', { timeZone: TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
    if (!groups.has(key)) {
      groups.set(key, { key, weekday: fmt(d, { weekday: 'short' }, lang), month: fmt(d, { month: 'short' }, lang), day: fmt(d, { day: 'numeric' }, lang), events: [] });
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
export function groupByMonth(events: ChapterEvent[], lang: Lang = 'en'): MonthGroup[] {
  const groups = new Map<string, MonthGroup>();
  for (const e of events) {
    const d = new Date(e.start);
    const key = new Intl.DateTimeFormat('en-CA', { timeZone: TIMEZONE, year: 'numeric', month: '2-digit' }).format(d);
    if (!groups.has(key)) groups.set(key, { key, label: cap(fmt(d, { month: 'long', year: 'numeric' }, lang)), events: [] });
    groups.get(key)!.events.push(e);
  }
  return [...groups.values()];
}

// ---- Formatting -----------------------------------------------------------

export function formatTime(iso: string, lang: Lang = 'en'): string {
  return fmt(new Date(iso), { hour: 'numeric', minute: '2-digit' }, lang).replace(':00', '');
}

// The AM/PM marker at the end of a formatted time: "PM" in English, "p.m." in Spanish.
const MERIDIEM = /\s*[ap]\.?\s?m\.?$/i;

export function formatTimeRange(e: ChapterEvent, lang: Lang = 'en'): string {
  const start = formatTime(e.start, lang);
  if (!e.end) return start;
  const end = formatTime(e.end, lang);
  // Drop a duplicated AM/PM marker: "6 PM – 8 PM" becomes "6–8 PM".
  const sfx = start.match(MERIDIEM)?.[0];
  const endSfx = end.match(MERIDIEM)?.[0];
  if (sfx && endSfx && sfx.trim() === endSfx.trim()) return `${start.slice(0, -sfx.length)}–${end}`;
  return `${start}–${end}`;
}

export function formatLongDate(iso: string, lang: Lang = 'en'): string {
  return cap(fmt(new Date(iso), { weekday: 'long', month: 'long', day: 'numeric' }, lang));
}

export function formatShortDate(iso: string | Date, lang: Lang = 'en'): string {
  return fmt(new Date(iso), { month: 'short', day: 'numeric' }, lang);
}

export function formatFullDate(iso: string | Date, lang: Lang = 'en'): string {
  return fmt(new Date(iso), { month: 'long', day: 'numeric', year: 'numeric' }, lang);
}

/** "BriarPatch Food Co-op - 2505 Bell Rd, Auburn, CA 95603, USA" -> "BriarPatch Food Co-op, Auburn" */
export function shortLocation(e: ChapterEvent, lang: Lang = 'en'): string | null {
  const loc = e.location;
  if (!loc) return null;
  if (/^\d+ locations$/.test(loc)) return lang === 'es' ? 'En persona y en línea' : 'In person and online';
  const [name, rest] = loc.split(' - ');
  const city = rest?.split(',').map((s) => s.trim()).find((_part, i, arr) => i === arr.length - 3) ?? null;
  if (name && city && !name.includes(city)) return `${name}, ${city}`;
  return name ?? loc;
}

/**
 * A short plain-text summary from the event's description, or null when there
 * isn't one. Skips a greeting line ("Hi Comrades!") and a first line that just
 * repeats the title, then trims to about `max` characters at a word boundary.
 * Descriptions are written in Solidarity Tech, so they stay in their own language.
 */
export function eventSummary(e: ChapterEvent, max = 170): string | null {
  const words = (s: string) => s.toLowerCase().match(/[a-z0-9]+/g) ?? [];
  const titleWords = new Set(words(e.title));
  // A short first line whose words are all in the title is just the title again.
  const repeatsTitle = (l: string) => l.length < 80 && words(l).length > 0 && words(l).every((w) => titleWords.has(w));
  const greeting = (l: string) => /^(hi|hello|hey|hola)\b[^.]{0,40}[!.]?$/i.test(l);
  const lines = (e.description ?? '').split('\n').map((l) => l.trim()).filter(Boolean);
  while (lines.length && (greeting(lines[0]) || repeatsTitle(lines[0]))) lines.shift();
  const text = lines.join(' ').replace(/\s+/g, ' ').trim();
  if (!text) return null;
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  return `${cut.slice(0, cut.lastIndexOf(' ')).replace(/[,;:.\-–—]+$/, '')}…`;
}

export function isVirtual(e: ChapterEvent): boolean {
  return /virtual|zoom|online/i.test(e.location ?? '');
}

/** A date-only value from frontmatter, moved to midday so it formats as the day that was written. */
export function dateOnly(d: Date): Date {
  return new Date(d.getTime() + 12 * 60 * 60 * 1000);
}

function fmt(d: Date, opts: Intl.DateTimeFormatOptions, lang: Lang = 'en'): string {
  return new Intl.DateTimeFormat(LOCALE[lang], { timeZone: TIMEZONE, ...opts }).format(d);
}

/** Capitalize the first letter (Spanish month and day names are lowercase). */
function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
