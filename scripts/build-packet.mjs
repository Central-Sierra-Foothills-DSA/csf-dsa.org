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

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = resolve(root, 'public/files/csf-dsa-new-member-packet.pdf');
const url = process.env.PACKET_URL ?? 'http://localhost:4321/member-resources/packet/';

const candidates = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
].filter(Boolean);
const browser = candidates.find((p) => existsSync(p));
if (!browser) {
  console.error('Could not find Chrome or Edge. Set CHROME_PATH to your browser executable.');
  process.exit(1);
}

try {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
} catch (err) {
  console.error(`Could not load ${url} (${err.message}).\nStart the dev server first with \`npm run dev\`.`);
  process.exit(1);
}

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
