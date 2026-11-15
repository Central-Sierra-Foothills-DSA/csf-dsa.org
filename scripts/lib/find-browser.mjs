// Find an installed Chrome or Edge for printing pages to PDF or images.
// Set CHROME_PATH to override.
import { existsSync } from 'node:fs';

export function findBrowser() {
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
  return browser;
}

/** Exit with a helpful message if the dev server isn't answering. */
export async function requireServer(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res;
  } catch (err) {
    console.error(`Could not load ${url} (${err.message}).\nStart the dev server first with \`npm run dev\`.`);
    process.exit(1);
  }
}
