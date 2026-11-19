// List of every file in the flyer library, for scripts/build-printables.mjs.
import type { APIRoute } from 'astro';
import { getPrintables, getReadyMade, previewFile } from '../../../lib/printables';

export const GET: APIRoute = async () => {
  const flyers = (await getPrintables()).map((p) => ({
    slug: p.slug,
    file: p.file,
    preview: p.formatId === 'poster' ? previewFile(p.design.id) : undefined,
    fillable: Object.keys(p.fields).length > 0,
    ...(p.format.kind === 'pdf'
      ? { kind: 'pdf', widthIn: p.format.sheet.w, heightIn: p.format.sheet.h, fieldPt: p.format.fieldPt }
      : { kind: 'png', widthPx: p.format.px.w, heightPx: p.format.px.h }),
  }));
  const ready = getReadyMade().map((r) => ({
    slug: r.slug,
    file: r.file,
    preview: r.kind === 'pdf' ? r.preview : undefined,
    fillable: false,
    ...(r.kind === 'pdf'
      ? { kind: 'pdf', widthIn: r.sheet!.w, heightIn: r.sheet!.h }
      : { kind: 'png', widthPx: r.px!.w, heightPx: r.px!.h }),
  }));
  return new Response(JSON.stringify([...flyers, ...ready], null, 2), { headers: { 'Content-Type': 'application/json' } });
};
