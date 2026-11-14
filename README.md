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

`.github/workflows/deploy.yml` builds the site and publishes it to GitHub Pages on
every push to `main`, once a day, and on demand. It also publishes a preview page for
each open pull request at `/pr-preview/pr-<number>/` and comments on the pull request
with the link. See [CONTRIBUTING.md](CONTRIBUTING.md) for who gets a preview.

`.github/workflows/ci.yml` builds every pull request so a broken change is caught
before it merges.

One-time setup: repo Settings → Pages → Source: **GitHub Actions**. Do not use
"Deploy from a branch". That makes GitHub build the repo as a Jekyll site, which fails.
The repo also needs a label named `preview`.

The site is currently served from a project path
(`https://central-sierra-foothills-dsa.github.io/csf-dsa.org/`). When the custom domain
moves to GitHub Pages, set `SITE_URL` to `https://csf-dsa.org` and `SITE_BASE` to an
empty string at the top of the workflow.

To build and host the output anywhere else:

```bash
npm run build
# upload dist/ to your host, e.g.
aws s3 sync dist/ s3://YOUR-BUCKET --delete
```
