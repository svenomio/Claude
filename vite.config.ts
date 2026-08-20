import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  base: '/Claude/',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Sparcity Voice',
        short_name: 'Sparcity',
        description: 'Sprich deine Ausgaben – Sparcity trackt dein Budget per Voice.',
        theme_color: '#7c3aed',
        background_color: '#f7f7fb',
        display: 'standalone',
        start_url: '/Claude/',
        scope: '/Claude/',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        shortcuts: [
          {
            name: 'Ausgabe diktieren',
            short_name: 'Diktieren',
            description: 'Direkt zum Mikro springen und eine Ausgabe diktieren, ohne die App-Übersicht zu öffnen.',
            url: '/Claude/?quick=1',
            icons: [{ src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' }],
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
      },
    }),
  ],
})
