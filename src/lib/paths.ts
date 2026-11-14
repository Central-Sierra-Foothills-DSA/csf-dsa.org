// Build internal links that respect the site's base path (see astro.config.mjs).
const base = import.meta.env.BASE_URL.replace(/\/$/, '');

/** href('/events/') -> '/events/' or '/csf-dsa.org/events/' depending on BASE_PATH. */
export function href(path: string): string {
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

/** The current path with the base stripped, for marking the active nav link. */
export function currentPath(url: URL): string {
  const p = url.pathname;
  return base && p.startsWith(base) ? p.slice(base.length) || '/' : p;
}
