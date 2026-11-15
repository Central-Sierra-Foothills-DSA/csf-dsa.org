// Build the flyer library: every sheet under /member-resources/printables/sheet/
// is saved to public/files/printables/ as a PDF (with fill-in boxes) or a PNG.
//
// Usage: start the dev server (`npm run dev`), then in another terminal run
//   npm run printables            # everything
//   npm run printables -- auburn  # only files whose name contains "auburn"
// Options (environment variables):
//   SITE_ORIGIN  dev server address (default http://localhost:4321)
//   CHROME_PATH  browser to use, if it isn't found automatically
//
// How the fill-in boxes work: each flyer marks its blank lines with data-field.
// This script measures where those lines land on the printed page, then uses
// pdf-lib to put a PDF text field on each one. Copies on the same sheet share a
// field name, so typing in one fills them all.
import { mkdirSync, writeFileSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { findBrowser, requireServer } from './lib/find-browser.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const origin = (process.env.SITE_ORIGIN ?? 'http://localhost:4321').replace(/\/$/, '');
const only = process.argv[2];

const manifest = await (await requireServer(`${origin}/member-resources/printables/manifest.json`)).json();
const items = only ? manifest.filter((m) => m.slug.includes(only)) : manifest;
if (items.length === 0) {
  console.error(`Nothing matches "${only}".`);
  process.exit(1);
}

const out = (file) => {
  const path = resolve(root, 'public', file.replace(/^\//, ''));
  mkdirSync(dirname(path), { recursive: true });
  return path;
};
const kb = (path) => `${Math.round(statSync(path).size / 1024)} KB`;

// Text that doesn't fit gets clipped silently, so check for it.
const overflowing = (page) =>
  page.$$eval('.sheet article', (els) =>
    els.some((el) => [...el.querySelectorAll('*')].some((c) => {
      const r = c.getBoundingClientRect(), box = el.getBoundingClientRect();
      return r.height > 0 && r.bottom > box.bottom + 0.5;
    })));
const warnings = [];

const browser = await puppeteer.launch({ executablePath: findBrowser(), headless: true });
try {
  const page = await browser.newPage();
  for (const item of items) {
    const url = `${origin}/member-resources/printables/sheet/${item.slug}/`;

    if (item.kind === 'png') {
      await page.setViewport({ width: item.widthPx + 200, height: item.heightPx + 200, deviceScaleFactor: 1 });
      await page.emulateMediaType('screen');
      await page.goto(url, { waitUntil: 'networkidle0' });
      await page.evaluate(() => document.fonts.ready);
      if (await overflowing(page)) warnings.push(item.slug);
      const path = out(item.file);
      await (await page.$('.sheet')).screenshot({ path, type: 'png' });
      console.log(`${item.file} (${kb(path)})`);
      continue;
    }

    // Lay the page out exactly as it will print: print styles, sheet-sized viewport.
    const pxW = Math.round(item.widthIn * 96);
    const pxH = Math.round(item.heightIn * 96);
    await page.setViewport({ width: pxW, height: pxH, deviceScaleFactor: 1 });
    await page.emulateMediaType('print');
    await page.goto(url, { waitUntil: 'networkidle0' });
    await page.evaluate(() => document.fonts.ready);
    if (await overflowing(page)) warnings.push(item.slug);

    const fields = await page.$$eval('.sheet [data-field]', (els) => {
      const sheet = document.querySelector('.sheet').getBoundingClientRect();
      return els.map((el) => {
        const r = el.getBoundingClientRect();
        return {
          name: el.dataset.field,
          max: Number(el.dataset.max) || undefined,
          multiline: el.hasAttribute('data-multiline'),
          x: r.left - sheet.left, y: r.top - sheet.top, w: r.width, h: r.height,
        };
      });
    });
    if (item.fillable && fields.length === 0) throw new Error(`${item.slug}: no fill-in boxes found`);

    const printed = await page.pdf({ preferCSSPageSize: true, printBackground: true });
    const pdf = await PDFDocument.load(printed);
    const [sheetPage] = pdf.getPages();
    const { height: pageH } = sheetPage.getSize();
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const form = pdf.getForm();
    const pt = 0.75; // CSS px to PDF points
    const made = new Map();
    for (const f of fields) {
      let field = made.get(f.name);
      if (!field) {
        field = form.createTextField(f.name);
        if (f.max) field.setMaxLength(f.max);
        if (f.multiline) field.enableMultiline();
        made.set(f.name, field);
      }
      // Single-line boxes: a strip just above the ruled line, so typed text sits on it.
      const h = f.multiline ? f.h * pt - 1 : Math.min(f.h * pt - 1, item.fieldPt * 1.7);
      field.addToPage(sheetPage, {
        x: f.x * pt,
        y: pageH - (f.y + f.h) * pt + 1,
        width: f.w * pt,
        height: h,
        font,
        textColor: rgb(0.137, 0.122, 0.125),
        backgroundColor: undefined,
        borderColor: undefined,
        borderWidth: 0,
      });
    }
    for (const field of made.values()) field.setFontSize(item.fieldPt);
    if (made.size) form.updateFieldAppearances(font);
    pdf.setTitle(`Central Sierra Foothills DSA`);
    pdf.setAuthor('Central Sierra Foothills DSA');

    const path = out(item.file);
    writeFileSync(path, await pdf.save());
    console.log(`${item.file} (${kb(path)}${made.size ? `, ${made.size} fill-in boxes` : ''})`);

    if (item.preview) {
      await page.emulateMediaType('screen');
      await page.setViewport({ width: pxW + 200, height: pxH + 200, deviceScaleFactor: 0.6 });
      const previewPath = out(item.preview);
      await (await page.$('.sheet')).screenshot({ path: previewPath, type: 'jpeg', quality: 80 });
      console.log(`${item.preview} (${kb(previewPath)})`);
    }
  }
} finally {
  await browser.close();
}

if (warnings.length) {
  console.error(`\nText runs off the edge in: ${warnings.join(', ')}\nShorten the text in src/data/printables.json or adjust the layout, then run this again.`);
  process.exit(1);
}
