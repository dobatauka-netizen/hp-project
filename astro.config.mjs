// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://example.com', // デプロイ後に実際のドメインに変更
  output: 'static',
  vite: {
    plugins: [tailwindcss()]
  },
  integrations: [sitemap()],
});