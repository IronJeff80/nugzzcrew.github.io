// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  // Tell Astro your official URL
  site: '/nugzzcrew.github.io',
  base: '/',
  vite: {
    plugins: [tailwindcss()]
  }
});
