import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// App is published under a landing page's /canvas subpath: thidayatullah.github.io/hurufku/canvas/
const base = '/hurufku/canvas/'

export default defineConfig({
  base,
  server: {
    host: true,
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.png',
        'favicon-64.png',
        'pwa-192.png',
        'pwa-512.png',
        'brand/h-sticker.png',
        'brand/hurufku-wordmark.png',
      ],
      workbox: {
        runtimeCaching: [
          {
            urlPattern: ({ url }) =>
              url.origin === 'https://fonts.googleapis.com' ||
              url.origin === 'https://fonts.gstatic.com',
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: { maxEntries: 40, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      manifest: {
        name: 'Hurufku',
        short_name: 'Hurufku',
        description:
          'Letter pad for kids: scribble or type letters, then arrange and hear them.',
        theme_color: '#fdf7f3',
        background_color: '#fdf7f3',
        display: 'standalone',
        start_url: base,
        scope: base,
        icons: [
          {
            src: 'pwa-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
    }),
  ],
})
