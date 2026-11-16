import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Each collection is a folder of Markdown files under src/content/.
// Frontmatter is validated against these schemas at build time, so a typo in
// a field name fails the build with a readable error instead of shipping.

// Branches: one file per branch. The file name is the URL: auburn.md -> /branches/auburn/
const branches = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/branches' }),
  schema: z.object({
    name: z.string(),
    order: z.number().default(0),
    /** 'forming' = people are organizing it but it doesn't meet regularly yet. It is listed
     *  with a "Forming" label and a coming-soon page, and left out of branch counts,
     *  the steering committee math, and flyers. Change to 'active' once it meets. */
    status: z.enum(['active', 'forming']).default('active'),
    /** One line on who the branch is for. */
    area: z.string(),
    /** Counties this branch is the natural home for (used by the branch finder). */
    counties: z.array(z.string()).default([]),
    /** When the branch meets, in plain words. Say "check the calendar" if it varies. */
    meets: z.string(),
    /** Where the branch meets, in plain words. */
    venue: z.string(),
    address: z.string().optional(),
    /** How to join remotely, if that is possible. */
    remote: z.string().optional(),
    /** Access at the meeting place, in plain words: step-free entry, parking, restrooms,
     *  kids welcome, food. Leave it out until someone has checked; the page then
     *  invites people to ask. */
    access: z.string().optional(),
    /** Venue coordinates, for the closest-branch list. */
    lat: z.number(),
    lon: z.number(),
    /** Pin position on the chapter map image, in percent from the top-left corner. */
    mapPin: z.object({ x: z.number(), y: z.number() }),
    /** Words in an event title that mean "this is ours". */
    keywords: z.array(z.string()).default([]),
    /** Cities whose events belong on this branch's page. */
    cities: z.array(z.string()).default([]),
  }),
});

// Campaigns and endorsements: one file each. File name is the URL.
const campaigns = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/campaigns' }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    kind: z.enum(['campaign', 'endorsement']).default('campaign'),
    /** 'completed' moves it off the home page and into the archive. */
    status: z.enum(['active', 'completed']).default('active'),
    order: z.number().default(0),
    /** When the campaign started or the endorsement passed. */
    date: z.coerce.date().optional(),
    /** Branch file names (without .md) this campaign belongs to. Empty means chapter-wide. */
    branches: z.array(z.string()).default([]),
    /** Words in an event title that tie an event to this campaign. */
    eventKeywords: z.array(z.string()).default([]),
    links: z.array(z.object({ label: z.string(), href: z.string().url() })).default([]),
  }),
});

// Updates: short dated news items and wins. Shown on the home page, newest first.
const updates = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/updates' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    summary: z.string(),
    /** Where "read more" goes: a site path like /campaigns/deflock/ or a full URL. */
    link: z.string().optional(),
  }),
});

export const collections = { branches, campaigns, updates };
