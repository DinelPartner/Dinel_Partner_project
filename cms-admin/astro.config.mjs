import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import vercel from '@astrojs/vercel';

// https://astro.build/config
// This is a separate, small Astro app (sibling to the main `src/` site) whose
// only job is to serve the blog admin panel + its public/admin JSON API.
// It needs a real server runtime (signed-cookie auth, GitHub API calls), so
// unlike the main dinelpartner.se site it stays on `output: 'server'` with
// the Vercel adapter. Deployed as its own Vercel project with
// "Root Directory" = cms-admin (see cms-admin/README.md).
export default defineConfig({
  output: 'server',
  adapter: vercel(),
  integrations: [react()],
});
