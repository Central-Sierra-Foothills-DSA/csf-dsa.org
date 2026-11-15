// The flyer library: every design (the chapter flyer plus one per branch) in every
// format. Used by the library page, the print layouts, and the manifest that
// `npm run printables` reads. Text lives in src/data/printables.json.
import { getCollection } from 'astro:content';
import data from '../data/printables.json';
import quotes from '../data/quotes.json';
import { resolveLink, displayUrl, type GuideLink } from './member-guide';

export { data as printablesText };

/** Where the generated files live, under public/. */
export const printablesDir = '/files/printables';

type PrintFormat = {
  kind: 'pdf';
  label: string;
  size: string;
  /** Paper size in inches. */
  sheet: { w: number; h: number };
  /** Copies per sheet, and their grid. */
  cols: number;
  rows: number;
  /** Which fill-in boxes this size has, with each box's character limit (the note has two lines, each this long). */
  fields: Partial<Record<'when' | 'where' | 'note', number>>;
  /** Type size in the fill-in boxes, in points. */
  fieldPt: number;
};
type ImageFormat = {
  kind: 'png';
  label: string;
  size: string;
  px: { w: number; h: number };
};
export type Format = PrintFormat | ImageFormat;

export const formats = {
  poster: {
    kind: 'pdf', label: 'Letter poster', size: '8.5 × 11 in, 1 per sheet',
    sheet: { w: 8.5, h: 11 }, cols: 1, rows: 1,
    fields: { when: 34, where: 34, note: 34 }, fieldPt: 13,
  },
  half: {
    kind: 'pdf', label: 'Half-page flyer', size: '5.5 × 8.5 in, 2 per sheet',
    sheet: { w: 11, h: 8.5 }, cols: 2, rows: 1,
    fields: { when: 32, where: 32, note: 32 }, fieldPt: 9,
  },
  quarter: {
    kind: 'pdf', label: 'Quarter-page handbill', size: '4.25 × 5.5 in, 4 per sheet',
    sheet: { w: 8.5, h: 11 }, cols: 2, rows: 2,
    fields: { when: 28, where: 28 }, fieldPt: 7.5,
  },
  square: { kind: 'png', label: 'Instagram post', size: '1080 × 1080 px', px: { w: 1080, h: 1080 } },
  portrait: { kind: 'png', label: 'Instagram portrait', size: '1080 × 1350 px', px: { w: 1080, h: 1350 } },
  story: { kind: 'png', label: 'Story', size: '1080 × 1920 px', px: { w: 1080, h: 1920 } },
} satisfies Record<string, Format>;

export type FormatId = keyof typeof formats;
export const formatIds = Object.keys(formats) as FormatId[];

export type Design = {
  id: string;
  title: string;
  eyebrow: string;
  headline: string;
  body: string;
  meets?: { label: string; text: string };
  cta: string;
  /** Shorter call to action for social images, which can't be scanned. */
  socialCta: string;
  /** Where the QR code goes. */
  qrUrl: string;
  /** The address printed next to the QR code, for people who type it in. */
  qrLabel: string;
};

export type Printable = {
  slug: string;
  design: Design;
  formatId: FormatId;
  format: Format;
  /** Path of the generated file, relative to the site root (wrap in href()). */
  file: string;
};

const fill = (s: string, vars: Record<string, string>) =>
  s.replace(/\{(\w+)\}/g, (_, k) => {
    if (!(k in vars)) throw new Error(`printables.json: unknown placeholder {${k}}`);
    return vars[k];
  });

function linkFor(l: GuideLink, vars: Record<string, string> = {}): string {
  const filled = Object.fromEntries(Object.entries(l).map(([k, v]) => [k, fill(v as string, vars)]));
  return resolveLink(filled).absolute;
}

export async function getDesigns(): Promise<Design[]> {
  const c = data.chapter;
  const chapterQr = linkFor(c.qr);
  const designs: Design[] = [
    { id: c.id, title: c.title, eyebrow: c.eyebrow, headline: c.headline, body: c.body, cta: c.cta, socialCta: c.socialCta, qrUrl: chapterQr, qrLabel: displayUrl(chapterQr) },
  ];
  const branches = (await getCollection('branches')).sort((a, b) => a.data.order - b.data.order);
  const t = data.branch;
  for (const b of branches) {
    const vars = { name: b.data.name, area: b.data.area, meets: b.data.meets, slug: b.id };
    designs.push({
      id: `${b.id}-branch`,
      title: fill(t.title, vars),
      eyebrow: fill(t.eyebrow, vars),
      headline: fill(t.headline, vars),
      body: fill(t.body, vars),
      meets: { label: t.meetsLabel, text: b.data.meets },
      cta: t.cta,
      socialCta: t.socialCta,
      qrUrl: linkFor(t.qr, vars),
      qrLabel: fill(t.qrLabel, vars),
    });
  }
  return designs;
}

export async function getPrintables(): Promise<Printable[]> {
  const designs = await getDesigns();
  return designs.flatMap((design) =>
    formatIds.map((formatId) => {
      const format: Format = formats[formatId];
      const slug = `${design.id}-${formatId}`;
      return { slug, design, formatId, format, file: `${printablesDir}/csf-dsa-${slug}.${format.kind}` };
    }),
  );
}

/** Preview image for a design's card on the library page. */
export const previewFile = (designId: string) => `${printablesDir}/previews/${designId}.jpg`;

// ---------------------------------------------------------------------------
// Ready-made printables: nothing to fill in. Each one is a layout in
// src/components/printables/ready/.

export type ReadyLayout = 'table-sign' | 'handout' | 'sign-in' | 'standards' | 'ds-social' | 'quote';

export type ReadyItem = {
  slug: string;
  layout: ReadyLayout;
  title: string;
  blurb: string;
  group: 'print' | 'social';
  kind: 'pdf' | 'png';
  /** Paper size in inches (PDF) or image size in pixels (PNG). */
  sheet?: { w: number; h: number };
  px?: { w: number; h: number };
  /** Copies per sheet (PDF only). */
  cols: number;
  rows: number;
  size: string;
  file: string;
  /** Image shown on the library page. */
  preview: string;
  /** Extra data for the layout, e.g. which quote. */
  index?: number;
};

export function getReadyMade(): ReadyItem[] {
  const r = data.ready;
  const pdf = (slug: string, layout: ReadyLayout, t: { title: string; blurb: string }, sheet: { w: number; h: number }, size: string, cols = 1, rows = 1): ReadyItem => ({
    slug, layout, title: t.title, blurb: t.blurb, group: 'print', kind: 'pdf', sheet, cols, rows, size,
    file: `${printablesDir}/csf-dsa-${slug}.pdf`, preview: `${printablesDir}/previews/${slug}.jpg`,
  });
  const png = (slug: string, layout: ReadyLayout, title: string, blurb: string, px: { w: number; h: number }, index?: number): ReadyItem => {
    const file = `${printablesDir}/csf-dsa-${slug}.png`;
    return { slug, layout, title, blurb, group: 'social', kind: 'png', px, cols: 1, rows: 1, size: `${px.w} × ${px.h} px`, file, preview: file, index };
  };
  return [
    pdf('table-sign', 'table-sign', r.tableSign, { w: 11, h: 8.5 }, '11 × 8.5 in (landscape)'),
    pdf('what-is-democratic-socialism', 'handout', r.handout, { w: 11, h: 8.5 }, '5.5 × 8.5 in, 2 per sheet', 2, 1),
    pdf('sign-in-sheet', 'sign-in', r.signIn, { w: 8.5, h: 11 }, '8.5 × 11 in'),
    pdf('community-standards', 'standards', r.standards, { w: 8.5, h: 11 }, '8.5 × 11 in'),
    png('what-is-democratic-socialism-post', 'ds-social', r.dsSocial.title, r.dsSocial.blurb, { w: 1080, h: 1350 }),
    ...quotes.map((q, i) =>
      png(`quote-${slugify(q.who)}`, 'quote', `${r.quotes.title}: ${q.who}`, r.quotes.blurb, { w: 1080, h: 1080 }, i)),
  ];
}

const slugify = (s: string) => s.toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
