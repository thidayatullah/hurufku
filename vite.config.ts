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
        name: 'HurufPad',
        short_name: 'HurufPad',
        description:
          'Letter pad for kids: scribble or type letters, then arrange and hear them.',
        theme_color: '#f5f7fa',
        background_color: '#f5f7fa',
        display: 'standalone',
        start_url: '/',
      },
    }),
  ],
})
