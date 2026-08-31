import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'ReadCanvas',
        short_name: 'ReadCanvas',
        description:
          'Preschool letter canvas: scribble or type letters, then arrange and hear them.',
        theme_color: '#f7f3ea',
        background_color: '#f7f3ea',
        display: 'standalone',
        start_url: '/',
      },
    }),
  ],
})
