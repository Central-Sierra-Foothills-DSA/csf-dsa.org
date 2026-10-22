// Fetches the chapter's event calendar from Solidarity Tech at build time.
//
// Solidarity Tech has no public events API or iCal feed, but the chapter's
// Solidarity Tech homepage embeds every event as JSON inside the calendar
// widget's `data-event-calendar-events-value` attribute. This script pulls
// that JSON out and writes it to src/data/events.json, which the site reads
// at build time.
//
// If the fetch fails (network down, markup changed), the previously committed
// events.json is left in place so the build still succeeds. A warning is
// printed so the failure is visible in CI logs.

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_PATH = path.resolve(__dirname, '../src/data/events.json');
const SOURCE_URL = process.env.EVENTS_SOURCE_URL ?? 'https://www.csf-dsa.org/';

function decodeHtmlEntities(str) {
  return str
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

function normalize(raw) {
  // Keep only the fields the site uses; drop Solidarity Tech internals.
  return raw
    .map((e) => ({
      id: e.id,
      seriesId: e.mobilize_event_id ?? null,
      // Text fields can carry a second layer of HTML entities from Solidarity
      // Tech's rich-text editor (e.g. "Coffee &amp; Tea"), so decode them again.
      title: decodeHtmlEntities(e.title ?? '').trim(),
      url: e.url ?? null,
      description: decodeHtmlEntities(e.description ?? '').trim(),
      start: e.start_time_iso,
      end: e.end_time_iso ?? null,
      location: e.hide_address ? null : decodeHtmlEntities(e.location ?? '').trim() || null,
      locations: e.hide_address ? [] : (e.locations ?? []).map((l) => decodeHtmlEntities(l).trim()).filter(Boolean),
    }))
    .filter((e) => e.title && e.start)
    .sort((a, b) => new Date(a.start) - new Date(b.start));
}

async function main() {
  let html;
  try {
    const res = await fetch(SOURCE_URL, {
      headers: { 'user-agent': 'csf-dsa.org site build (https://github.com/Central-Sierra-Foothills-DSA/csf-dsa.org)' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    html = await res.text();
  } catch (err) {
    console.warn(`[fetch-events] Could not fetch ${SOURCE_URL}: ${err.message}. Keeping existing events.json.`);
    return;
  }

  const match = html.match(/data-event-calendar-events-value="([^"]*)"/);
  if (!match) {
    console.warn('[fetch-events] Calendar data attribute not found in page. Keeping existing events.json.');
    return;
  }

  let raw;
  try {
    raw = JSON.parse(decodeHtmlEntities(match[1]));
  } catch (err) {
    console.warn(`[fetch-events] Could not parse calendar JSON: ${err.message}. Keeping existing events.json.`);
    return;
  }

  const events = normalize(raw);
  const payload = {
    source: SOURCE_URL,
    fetchedAt: new Date().toISOString(),
    events,
  };

  let previous = null;
  try {
    previous = JSON.parse(await readFile(OUT_PATH, 'utf8'));
  } catch {
    // first run
  }

  await writeFile(OUT_PATH, JSON.stringify(payload, null, 2) + '\n');
  const delta = previous ? events.length - previous.events.length : events.length;
  console.log(`[fetch-events] Wrote ${events.length} events to src/data/events.json (${delta >= 0 ? '+' : ''}${delta} vs previous).`);
}

main();
