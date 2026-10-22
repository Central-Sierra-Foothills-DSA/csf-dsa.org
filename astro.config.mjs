// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// SITE_URL and BASE_PATH can be overridden at build time, e.g. for a
// GitHub Pages project site without a custom domain:
//   BASE_PATH=/csf-dsa.org SITE_URL=https://central-sierra-foothills-dsa.github.io npm run build
export default defineConfig({
  site: process.env.SITE_URL ?? 'https://csf-dsa.org',
  base: process.env.BASE_PATH ?? '/',
  trailingSlash: 'ignore',
  vite: {
    plugins: [tailwindcss()],
  },
});
