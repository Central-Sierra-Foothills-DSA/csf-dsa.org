# CLAUDE.md

Guidance for AI coding agents (Claude Code, Cursor, Copilot, etc.) working in this repo.
Read `CONTRIBUTING.md` too; it describes the review process.

## What this is

The public website for Central Sierra Foothills DSA (csf-dsa.org), a chapter of the
Democratic Socialists of America covering Placer, Nevada, El Dorado, and Sierra counties.
A static site built with Astro 5 and Tailwind CSS 4. No backend, no database.

## Pages

| URL                      | File                                   | What it is                                  |
|--------------------------|----------------------------------------|---------------------------------------------|
| `/`                      | `src/pages/index.astro`                | Home: starting points, next events, wins, news, branches, campaigns |
| `/new-members/`          | `src/pages/new-members.astro`          | New member guide and FAQ                    |
| `/member-resources/`     | `src/pages/member-resources/index.astro` | Orientation for new members, conduct, link to the printable packet |
| `/member-resources/packet/` | `src/pages/member-resources/packet.astro` | Print layout of the new member packet (source of the PDF; not linked, `noindex`) |
| `/about/`                | `src/pages/about/index.astro`          | Who we are, structure, roles, how we decide |
| `/about/bylaws/`         | `src/pages/about/bylaws.md`            | Full text of the chapter bylaws             |
| `/branches/`             | `src/pages/branches/index.astro`       | Branch map, cards, closest-branch lookup    |
| `/branches/<name>/`      | `src/pages/branches/[slug].astro`      | One page per file in `src/content/branches/`|
| `/events/`               | `src/pages/events.astro`               | All upcoming events with a type filter      |
| `/campaigns/`            | `src/pages/campaigns/index.astro`      | Active campaigns and endorsements           |
| `/campaigns/<name>/`     | `src/pages/campaigns/[slug].astro`     | One page per file in `src/content/campaigns/`|
| `/learn/`                | `src/pages/learn.astro`                | What democratic socialism is, glossary, quotes |
| `/local-government/`     | `src/pages/local-government.astro`     | Official council and board meeting pages    |
| `/archive/`              | `src/pages/archive.astro`              | Past events, news, finished campaigns       |

Do not add a page at `/join`. That path belongs to the Solidarity Tech sign-up form.

## Where things live

| You want to change...            | Edit this                                          |
|----------------------------------|----------------------------------------------------|
| Org name, tagline, links, social, email | `src/data/site.json`                        |
| A branch's schedule, venue, or description | `src/content/branches/<name>.md`         |
| Add a branch                     | New file in `src/content/branches/` (copy an existing one) |
| A campaign or endorsement        | `src/content/campaigns/<name>.md`                  |
| Retire a campaign                | Set `status: completed` in its file. It moves to the archive. |
| Post news or a win               | New file in `src/content/updates/` named `YYYY-MM-DD-short-title.md` |
| Headline numbers on the home page | `src/data/wins.json`                              |
| Working groups                   | `src/data/working-groups.json`                     |
| Allied organizations             | `src/data/partners.json` (`name`, optional `url` and `blurb`). The section on `/about/` appears once this has entries. |
| New member guide and packet text | `src/data/member-guide.json`, then `npm run packet` (see below) |
| Glossary terms, quotes           | `src/data/glossary.json`, `src/data/quotes.json`   |
| Further-reading links            | `src/data/resources.json`                          |
| Towns in the closest-branch list | `src/data/towns.json`                              |
| Council and board links          | `src/data/local-government.json`                   |
| Bylaws text                      | `src/pages/about/bylaws.md`                        |
| Page copy or layout              | The page file, or a component in `src/components/` |
| Nav and footer links             | `src/components/Nav.astro`, `src/components/Footer.astro` |
| Colors, fonts, global CSS        | `src/styles/global.css` (Tailwind `@theme` block)  |
| Photos                           | `src/assets/photos/` (imported with `astro:assets`)|
| Logos                            | `src/assets/logos/` (chapter badge, national logo) |
| Fonts                            | `src/assets/fonts/` (Manifold DSA, self-hosted)    |
| Favicon, share image             | `public/favicon.svg`, `public/images/og.png`       |

The fields each content file accepts are defined, with comments, in `src/content.config.ts`.
A typo in a field name fails the build with a readable error.

### How branches, campaigns, and events connect

- A campaign lists the branches it belongs to in `branches:` (file names without `.md`).
  It then shows up on those branch pages. Leave it empty for chapter-wide campaigns.
- Events are matched to a branch by the branch's `keywords` (looked for in the event
  title) and `cities` (looked for in the event location).
- Events are matched to a campaign by the campaign's `eventKeywords`.
- Event types (meeting, social, action, and so on) are guessed from the title in
  `typeOf()` in `src/lib/events.ts`. Add a keyword there if one lands in the wrong bucket.
- Map pins use each branch's `mapPin` (percent from the top-left of the map image).

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

## The new member packet PDF

`public/files/csf-dsa-new-member-packet.pdf` is generated, not hand-made. Its text comes
from `src/data/member-guide.json`, the same file the `/member-resources/` page uses, and
its layout is `src/pages/member-resources/packet.astro` (US Letter, `src/layouts/Print.astro`).
To update it: edit the JSON or the layout, start `npm run dev`, then run `npm run packet`
in a second terminal. The script prints the page to PDF with headless Chrome or Edge
(set `CHROME_PATH` if it can't find one). Open `/member-resources/packet/` in a browser
to preview the layout. Commit the regenerated PDF with the change. CI does not rebuild it.

## Events are generated, don't hand-edit them

`src/data/events.json` is written by `scripts/fetch-events.mjs`, which scrapes the
chapter's Solidarity Tech calendar at build time (`npm run build` runs it via `prebuild`).
The file is committed so builds work offline and as a fallback if the scrape fails.
Events are managed in Solidarity Tech, not here. If the scrape breaks, fix the script.

Past events are never dropped from the file, even after Solidarity Tech stops listing
them. The archive page is built from that history, so don't delete old entries.

`src/lib/events.ts` has the helpers: upcoming and past lists, event types, matching,
grouping, and Pacific-time formatting.

## Conventions

- Content is data. Prefer editing JSON or Markdown over touching `.astro` files.
- Keep the site static. No client-side frameworks, no runtime fetches. The only
  JavaScript is the mobile menu toggle in `Nav.astro`. The events filter is CSS only.
- Build internal links with `href()` from `src/lib/paths.ts` so they respect the base path.
- Inner pages start with `<PageHeader>` (the red title band) inside `<Base title="...">`.
- Tailwind utilities inline in components; shared tokens in `global.css` `@theme`.
- Links off-site get `target="_blank" rel="noopener"`.
- Images go through `<Image>` from `astro:assets` with `widths` and `sizes` set.
- Keep accessibility: alt text on images, visible focus states, semantic headings.
- Respect `import.meta.env.BASE_URL` for any absolute path to `public/` files.
- Write for someone new: plain words, short sentences, no jargon without a definition.

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
- Don't publish members' names, photos, or contact details without their say-so.
  Refer to roles ("the branch chair", "the chapter's liaison") and the chapter email.
- Don't copy internal material (minutes, budgets, Slack threads) onto the site.
