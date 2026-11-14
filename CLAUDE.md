# CLAUDE.md

Guidance for AI coding agents (Claude Code, Cursor, Copilot, etc.) working in this repo.
Read `CONTRIBUTING.md` too; it describes the review process.

## What this is

The public website for Central Sierra Foothills DSA (csf-dsa.org), a chapter of the
Democratic Socialists of America covering Placer, Nevada, El Dorado, and Sierra counties.
A single-page static site built with Astro 5 and Tailwind CSS 4. No backend, no database.

## Where things live

| You want to change...            | Edit this                                          |
|----------------------------------|----------------------------------------------------|
| Org name, tagline, intro, links, social, email | `src/data/site.json`                   |
| Branches (name, area, meeting cadence, venue)  | `src/data/branches.json`               |
| Working groups                   | `src/data/working-groups.json`                     |
| Campaigns ("What we're doing")   | `src/content/campaigns/*.md` (one file per campaign) |
| Further-reading links            | `src/data/resources.json`                          |
| Section copy or layout           | `src/components/<Section>.astro`                   |
| Page order                       | `src/pages/index.astro`                            |
| Colors, fonts, global CSS        | `src/styles/global.css` (Tailwind `@theme` block)  |
| Photos                           | `src/assets/photos/` (imported with `astro:assets`)|
| Logos                            | `src/assets/logos/` (chapter badge, national logo) |
| Fonts                            | `src/assets/fonts/` (Manifold DSA, self-hosted)    |
| Favicon, share image             | `public/favicon.svg`, `public/images/og.png`       |

## Brand

The site follows the DSA Design Guide: https://design.dsausa.org

- Palette is DSA Red, DSA Black, and white. Tokens: `red` (#EC1F27) with tints
  `red-1` to `red-4`, `black` (#231F20) with tints `black-1` to `black-4`, `white`.
  Two additions that are not guide values: `red-dark` (hover states, small red text
  on white) and `mist` (light section background). Don't introduce other hues.
- Lean on red. Use `red-dark`, not `red`, for small red text on white; use `red-2`
  or `red-3` for red text on black. Check contrast.
- Font is Manifold DSA for all text, weights 400 to 900. No other typefaces.
  Manifold DSA is licensed for DSA business only: keep it out of non-DSA projects.
- Chapter badge: `csf-dsa-white.png` on dark or red, `csf-dsa-black.png` on light.
- National logo: use `dsa-national-circle.png` (main logo on a DSA Red circle), or
  the all-white or all-black version placed directly on the background. Never
  recolor, stretch, or crop it, and leave at least 20% clear space around it.

## Events are generated, don't hand-edit them

`src/data/events.json` is written by `scripts/fetch-events.mjs`, which scrapes the
chapter's Solidarity Tech calendar at build time (`npm run build` runs it via `prebuild`).
The file is committed so builds work offline and as a fallback if the scrape fails.
Events are managed in Solidarity Tech, not here. If the scrape breaks, fix the script.
`src/lib/events.ts` has the helpers (upcoming, grouping, Pacific-time formatting).

## Conventions

- Content is data. Prefer editing JSON or Markdown over touching `.astro` files.
- Keep the site static. No client-side frameworks, no runtime fetches. The only
  JavaScript is the mobile menu toggle in `Nav.astro`.
- Tailwind utilities inline in components; shared tokens in `global.css` `@theme`.
- Links off-site get `target="_blank" rel="noopener"`.
- Images go through `<Image>` from `astro:assets` with `widths` and `sizes` set.
- Keep accessibility: alt text on images, visible focus states, semantic headings.
- Respect `import.meta.env.BASE_URL` for any absolute path to `public/` files.

## Verify before opening a PR

```bash
npm install
npm run build      # fetches events, then builds to dist/
npm run preview    # serve dist/ at http://localhost:4321
```

A PR should build cleanly. CI runs `npm run build` on every PR.

## Don't

- Don't add a CMS, backend, or analytics without discussing in an issue first.
- Don't commit secrets. There are none needed.
- Don't invent chapter facts (meeting times, venues, endorsements). If something
  is unknown, say "check the calendar" and link to it.
