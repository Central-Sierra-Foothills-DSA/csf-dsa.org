# Central Sierra Foothills DSA Website

Static website for the Central Sierra Foothills CA Local Chapter of Democratic Socialists of America, serving Placer, El Dorado, Nevada, and Sierra counties.

Built with [Astro](https://astro.build/) and [Tailwind CSS](https://tailwindcss.com/). Outputs pure static HTML for hosting on S3 or any static host.

## Prerequisites

- [Node.js](https://nodejs.org/) 18 or later
- npm (comes with Node.js)

## Getting Started

```bash
npm install
npm run dev
```

The dev server starts at **http://localhost:4321** with hot reload.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start local dev server with hot reload |
| `npm run build` | Build static site to `dist/` |
| `npm run preview` | Preview the built site locally |

## Editing Content

Most content that changes regularly lives in **`src/data/`**:

- **`site-config.json`** — Social media links, contact info, calendar embed URL, external form links. Update these when accounts or URLs change.
- **`working-groups.json`** — List of working groups displayed on the site. Add/remove entries to update the grid.

To edit section copy (hero tagline, about text, etc.), modify the corresponding component in **`src/components/`**.

## Adding a New Page

Create a new `.astro` file in `src/pages/`. For example, `src/pages/about.astro` becomes `/about` on the site. Use the Base layout:

```astro
---
import Base from '../layouts/Base.astro';
---
<Base title="About — CSF DSA">
  <main>
    <!-- page content -->
  </main>
</Base>
```

## Logo

Place your chapter logo at **`public/images/logo.svg`** (or `.png`). The Nav component will pick it up automatically. Until a logo file is added, the site displays a text-based logo.

## Deploy to S3

```bash
npm run build
aws s3 sync dist/ s3://YOUR-BUCKET-NAME --delete
```

For HTTPS, put a CloudFront distribution in front of the S3 bucket and point your domain at it.
