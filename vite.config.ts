import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

import config from './src/business.json'

// Подпапка GitHub Pages. Для корня домена: VITE_BASE=/ npm run build
const rawBase = process.env.VITE_BASE || '/rublevka174/'
const base = `/${rawBase.replace(/^\/+|\/+$/g, '')}/`.replace(/^\/\/$/, '/')

export default defineConfig({
  base,
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['apple-touch-icon.png'],
      manifest: {
        name: config.name,
        short_name: config.shortName,
        description: config.description,
        lang: 'ru',
        id: base,
        start_url: base,
        scope: base,
        display: 'standalone',
        orientation: 'portrait',
        theme_color: config.themeColor,
        background_color: config.backgroundColor,
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        navigateFallback: `${base}index.html`,
        runtimeCaching: [
          {
            urlPattern: ({ request }: { request: Request }) => request.destination === 'image',
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'images',
              cacheableResponse: { statuses: [0, 200] },
              expiration: { maxEntries: 80, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
})