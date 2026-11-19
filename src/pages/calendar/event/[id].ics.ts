// One event as a calendar file, for the "Add to calendar → Apple / other" option.
// Opening it on a phone or computer offers to add the event to the calendar there.
import type { APIRoute, GetStaticPaths } from 'astro';
import site from '../../../data/site.json';
import { allEvents, type ChapterEvent } from '../../../lib/events';
import { icsCalendar } from '../../../lib/calendar';

export const getStaticPaths: GetStaticPaths = () => {
  // Event ids include the date, but keep only the first if two ever collide.
  const seen = new Set<string>();
  return allEvents
    .filter((e) => !seen.has(e.id) && seen.add(e.id))
    .map((event) => ({ params: { id: event.id }, props: { event } }));
};

export const GET: APIRoute = ({ props }) => icsCalendar([props.event as ChapterEvent], site.orgName, false);
