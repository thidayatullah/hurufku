import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  server: {
    host: true,
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'models/**/*'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json,bin,txt,md}'],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
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
        name: 'HurufPad',
        short_name: 'HurufPad',
        description:
          'Letter pad for kids: scribble or type letters, then arrange and hear them.',
        theme_color: '#fdf7f3',
        background_color: '#fdf7f3',
        display: 'standalone',
        start_url: '/',
      },
    }),
  ],
})
