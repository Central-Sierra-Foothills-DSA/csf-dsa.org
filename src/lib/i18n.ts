// Languages on the site. English is the default; Spanish covers the pages a
// newcomer needs (see `pairs`). Member-only pages stay in English.
import type { Lang } from './events';
import es from '../data/es/common.json';

export type { Lang };

/** English path -> Spanish path, for the pages that exist in both languages. */
const pairs: [en: string, es: string][] = [
  ['/', '/es/'],
  ['/new-members/', '/es/bienvenida/'],
  ['/about/', '/es/nosotros/'],
  ['/branches/', '/es/ramas/'],
  ['/learn/', '/es/aprender/'],
  ['/events/', '/es/eventos/'],
];

/**
 * The same page in the other language, or that language's home page when there
 * isn't one. Branch pages map one to one: /branches/auburn/ <-> /es/ramas/auburn/.
 */
export function otherLanguagePath(path: string, from: Lang): string {
  if (from === 'en') {
    const branch = path.match(/^\/branches\/([^/]+)\/$/);
    if (branch) return `/es/ramas/${branch[1]}/`;
    return pairs.find(([en]) => en === path)?.[1] ?? '/es/';
  }
  const rama = path.match(/^\/es\/ramas\/([^/]+)\/$/);
  if (rama) return `/branches/${rama[1]}/`;
  return pairs.find(([, s]) => s === path)?.[0] ?? '/';
}

/** Interface wording shared by the layout, menu, footer, and event lists. */
export const ui = {
  en: {
    skip: 'Skip to content',
    switchLabel: 'Español',
    switchLang: 'es',
    nav: [
      { path: '/about/', label: 'About' },
      { path: '/events/', label: 'Events' },
      { path: '/branches/', label: 'Branches' },
      { path: '/campaigns/', label: 'Campaigns' },
      { path: '/learn/', label: 'Learn' },
      { path: '/member-resources/', label: 'Members' },
    ],
    join: { path: '/new-members/', label: 'Join us', mobile: 'New here? Join us' },
    menuOpen: 'Open menu',
    menuClose: 'Close menu',
  },
  es: {
    skip: es.ui.skip,
    switchLabel: 'English',
    switchLang: 'en',
    nav: es.ui.nav,
    join: es.ui.join,
    menuOpen: es.ui.menuOpen,
    menuClose: es.ui.menuClose,
  },
} as const;

/** Spanish pages carry a "translation under review" note until a fluent member signs off. */
export const spanishReviewed: boolean = es.reviewed;
export const esText = es;
