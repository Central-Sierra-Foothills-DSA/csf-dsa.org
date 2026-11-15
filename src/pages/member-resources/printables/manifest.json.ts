// List of every file in the flyer library, for scripts/build-printables.mjs.
import type { APIRoute } from 'astro';
import { getPrintables, previewFile } from '../../../lib/printables';

export const GET: APIRoute = async () => {
  const items = await getPrintables();
  const list = items.map((p) => ({
    slug: p.slug,
    designId: p.design.id,
    formatId: p.formatId,
    file: p.file,
    preview: p.formatId === 'poster' ? previewFile(p.design.id) : undefined,
    ...(p.format.kind === 'pdf'
      ? { kind: 'pdf', widthIn: p.format.sheet.w, heightIn: p.format.sheet.h, fieldPt: p.format.fieldPt }
      : { kind: 'png', widthPx: p.format.px.w, heightPx: p.format.px.h }),
  }));
  return new Response(JSON.stringify(list, null, 2), { headers: { 'Content-Type': 'application/json' } });
};
