// Smaller calendar feeds: one per branch (/calendar/auburn.ics) and one per kind
// of event (/calendar/socials.ics). The list is getFeeds() in src/lib/calendar.ts.
import type { APIRoute, GetStaticPaths } from 'astro';
import site from '../../data/site.json';
import { feedWindow, getFeeds, icsCalendar, type Feed } from '../../lib/calendar';

export const getStaticPaths: GetStaticPaths = async () =>
  (await getFeeds()).map((feed) => ({ params: { feed: feed.slug }, props: { feed } }));

export const GET: APIRoute = ({ props }) => {
  const feed = props.feed as Feed;
  return icsCalendar(feedWindow().filter(feed.match), `${site.orgNameShort}: ${feed.name}`);
};
