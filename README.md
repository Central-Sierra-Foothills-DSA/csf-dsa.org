# csf-dsa.org

Website for Central Sierra Foothills DSA, the Democratic Socialists of America chapter
serving Placer, Nevada, El Dorado, and Sierra counties in California.

Built with [Astro](https://astro.build/) and [Tailwind CSS](https://tailwindcss.com/).
Outputs plain static HTML.

## Develop

```bash
npm install
npm run dev
```

Dev server runs at http://localhost:4321 with hot reload.

| Command                | What it does                                                  |
|------------------------|---------------------------------------------------------------|
| `npm run dev`          | Local dev server                                              |
| `npm run build`        | Fetch events from Solidarity Tech, then build to `dist/`      |
| `npm run preview`      | Serve the built site locally                                  |
| `npm run fetch-events` | Only refresh `src/data/events.json`                           |

## Editing content

See [CONTRIBUTING.md](CONTRIBUTING.md). Most content is JSON in `src/data/` or
Markdown in `src/content/campaigns/`. AI agents should read [CLAUDE.md](CLAUDE.md).

## How the calendar works

The chapter manages events in [Solidarity Tech](https://solidarity.tech), which has no
public events API. `scripts/fetch-events.mjs` scrapes the events JSON embedded in the
chapter's Solidarity Tech homepage and writes `src/data/events.json`. The build runs
this script first. A daily GitHub Actions schedule rebuilds the site so the list stays
current. If the fetch fails, the committed `events.json` is used as a fallback.

## Deploy

`.github/workflows/deploy.yml` builds on push to `main`, daily at 7 AM Pacific, and on
demand, then deploys to GitHub Pages. One-time setup: repo Settings → Pages → Source:
"GitHub Actions", and add the custom domain.

To host on S3 or CloudFront instead:

```bash
npm run build
aws s3 sync dist/ s3://YOUR-BUCKET --delete
```
