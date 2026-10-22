import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Campaigns: one Markdown file per campaign in src/content/campaigns/.
// Frontmatter is validated against this schema at build time.
const campaigns = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/campaigns' }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    status: z.enum(['active', 'completed']).default('active'),
    order: z.number().default(0),
    links: z
      .array(z.object({ label: z.string(), href: z.string().url() }))
      .default([]),
  }),
});

export const collections = { campaigns };
