import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

const base = '/Spielraum/';

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icon.svg', 'icon-maskable.svg'],
      manifest: {
        name: 'Spielraum – Intelligenter Tagesplaner',
        short_name: 'Spielraum',
        description: 'Behalte den Überblick über deinen Tag. Plane Tasks, tracke Zeit und schütze deinen Spielraum.',
        theme_color: '#0B0B0F',
        background_color: '#0B0B0F',
        display: 'standalone',
        orientation: 'portrait-primary',
        start_url: '/Spielraum/',
        scope: '/Spielraum/',
        lang: 'de',
        categories: ['productivity', 'utilities'],
        icons: [
          {
            src: 'icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any',
          },
          {
            src: 'icon-maskable.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'maskable',
          },
        ],
        shortcuts: [
          {
            name: 'Tagesplan',
            short_name: 'Plan',
            description: 'Aufgaben des Tages anzeigen',
            url: '/Spielraum/?view=plan',
            icons: [{ src: 'icon.svg', sizes: 'any' }],
          },
          {
            name: 'Tages-Setup',
            short_name: 'Setup',
            description: 'Tag konfigurieren',
            url: '/Spielraum/?view=setup',
            icons: [{ src: 'icon.svg', sizes: 'any' }],
          },
        ],
        screenshots: [],
      },
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,woff}'],
      },
      devOptions: {
        enabled: true,
        type: 'module',
      },
    }),
  ],
});
