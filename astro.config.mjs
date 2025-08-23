import { defineConfig, passthroughImageService } from 'astro/config';
import mdx from '@astrojs/mdx';

// https://astro.build/config
export default defineConfig({
  build: {
    inlineStylesheets: 'always',
  },
  site: 'https://andreacanton.dev',
  trailingSlash: 'always',
  integrations: [mdx()],
  image: {
    service: passthroughImageService(),
  },
  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          api: 'modern-compiler',
        },
      },
    },
  },
});
