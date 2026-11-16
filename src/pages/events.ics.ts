// Calendar feed (iCalendar) of all chapter events, so people can subscribe once in
// Google Calendar, Apple Calendar, or Outlook. Built with the site, which rebuilds
// daily, so subscribers pick up new events on their calendar app's next refresh.
// Smaller feeds (one branch, one kind of event) are in src/pages/calendar/.
import type { APIRoute } from 'astro';
import site from '../data/site.json';
import { feedWindow, icsCalendar } from '../lib/calendar';

export const GET: APIRoute = () => icsCalendar(feedWindow(), site.orgName);
