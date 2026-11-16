// Helpers for src/data/member-guide.json, shared by the member resources page
// and the printable packet.
import guide from '../data/member-guide.json';
import site from '../data/site.json';
import { href } from './paths';

export { guide };

export type GuideLink = { siteLink?: string; path?: string; url?: string };

/** Where the packet PDF is published. `npm run packet` writes it to public/files/. */
export const packetPath = '/files/csf-dsa-new-member-packet.pdf';

/** Resolve a link from the guide: a key of site.json `links`, a site path, or a full URL. */
export function resolveLink(l: GuideLink): { href: string; absolute: string; external: boolean } {
  if (l.siteLink) {
    const url = (site.links as Record<string, string>)[l.siteLink];
    if (!url) throw new Error(`member-guide.json: unknown siteLink "${l.siteLink}"`);
    return { href: url, absolute: url, external: true };
  }
  if (l.path) {
    // Printed copies need the full address, not a relative path.
    return { href: href(l.path), absolute: new URL(l.path, 'https://csf-dsa.org').href, external: false };
  }
  if (l.url) return { href: l.url, absolute: l.url, external: true };
  throw new Error('member-guide.json: link needs siteLink, path, or url');
}

/** A URL without the protocol or trailing slash, for printing next to a QR code. */
export function displayUrl(url: string): string {
  return url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
}
