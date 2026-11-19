// Shared flyers: files members upload to src/flyers/ through GitHub. Vite collects
// them at build time (import.meta.glob), so the site stays static and this works no
// matter which folder the build runs from. See src/flyers/README.md for the naming
// rules people follow.
//
//   2026-06-14-Pride-picnic.pdf   the flyer (title "Pride picnic", dated June 14, 2026)
//   2026-06-14-Pride-picnic.png   optional preview image for the PDF
//   2026-06-14-Pride-picnic.txt   optional one- or two-sentence description
//
// An image with no PDF of the same name is a flyer in its own right.

/** Where uploads live in the repository (for the GitHub link). */
export const uploadsFolder = 'src/flyers';

// URLs of the built files, keyed by source path like "/src/flyers/name.pdf".
const files = import.meta.glob('/src/flyers/*.{pdf,PDF,png,PNG,jpg,JPG,jpeg,JPEG,webp,WEBP}', {
  query: '?url',
  import: 'default',
  eager: true,
}) as Record<string, string>;
const notes = import.meta.glob('/src/flyers/*.{txt,TXT}', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

const imageExts = ['png', 'jpg', 'jpeg', 'webp'];

export type Upload = {
  title: string;
  date?: Date;
  description?: string;
  kind: 'pdf' | 'image';
  /** URL of the file to download (already includes the base path). */
  file: string;
  /** Original file name, used as the download name. */
  fileName: string;
  /** URL of a preview image, if there is one. */
  preview?: string;
};

function split(path: string) {
  const name = path.split('/').pop()!;
  const dot = name.lastIndexOf('.');
  return { name, base: name.slice(0, dot), ext: name.slice(dot + 1).toLowerCase() };
}

function titleFrom(base: string): { title: string; date?: Date } {
  const m = base.match(/^(\d{4})-(\d{2})-(\d{2})[-_ ]+(.*)$/);
  const rest = m ? m[4] : base;
  const words = rest.replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim();
  const title = words.charAt(0).toUpperCase() + words.slice(1);
  // Noon UTC so the date reads the same in any time zone.
  const date = m ? new Date(`${m[1]}-${m[2]}-${m[3]}T12:00:00Z`) : undefined;
  return { title: title || base, date: date && !isNaN(date.getTime()) ? date : undefined };
}

export function getUploads(): Upload[] {
  type Group = { pdf?: { url: string; name: string }; image?: { url: string; name: string }; note?: string };
  const groups = new Map<string, Group>();
  const group = (base: string) => groups.get(base) ?? groups.set(base, {}).get(base)!;

  for (const [path, url] of Object.entries(files)) {
    const { name, base, ext } = split(path);
    if (ext === 'pdf') group(base).pdf = { url, name };
    else if (imageExts.includes(ext)) group(base).image ??= { url, name };
  }
  for (const [path, text] of Object.entries(notes)) {
    const g = groups.get(split(path).base);
    if (g) g.note = text.trim().slice(0, 300) || undefined;
  }

  const uploads: Upload[] = [];
  for (const [base, g] of groups) {
    const main = g.pdf ?? g.image!;
    uploads.push({
      ...titleFrom(base),
      description: g.note,
      kind: g.pdf ? 'pdf' : 'image',
      file: main.url,
      fileName: main.name,
      preview: g.image?.url,
    });
  }
  // Dated files newest first, then undated ones by title.
  return uploads.sort((a, b) =>
    (b.date?.getTime() ?? -Infinity) - (a.date?.getTime() ?? -Infinity) || a.title.localeCompare(b.title));
}
