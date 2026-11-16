// Print the new member packet (/member-resources/packet/) to
// public/files/csf-dsa-new-member-packet.pdf using headless Chrome or Edge.
//
// Usage: start the dev server (`npm run dev`), then in another terminal run
//   npm run packet
// Options (environment variables):
//   PACKET_URL   page to print (default http://localhost:4321/member-resources/packet/)
//   CHROME_PATH  browser to use, if it isn't found automatically
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { findBrowser, requireServer } from './lib/find-browser.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = resolve(root, 'public/files/csf-dsa-new-member-packet.pdf');
const url = process.env.PACKET_URL ?? 'http://localhost:4321/member-resources/packet/';

const browser = findBrowser();
await requireServer(url);

mkdirSync(dirname(out), { recursive: true });
const before = existsSync(out) ? statSync(out).mtimeMs : 0;
execFileSync(browser, [
  '--headless=new',
  '--disable-gpu',
  '--no-pdf-header-footer',
  '--run-all-compositor-stages-before-draw',
  '--virtual-time-budget=10000',
  `--print-to-pdf=${out}`,
  url,
], { stdio: 'ignore' });

if (!existsSync(out) || statSync(out).mtimeMs === before) {
  console.error('The browser ran but no PDF was written.');
  process.exit(1);
}
console.log(`Wrote ${out} (${Math.round(statSync(out).size / 1024)} KB)`);
