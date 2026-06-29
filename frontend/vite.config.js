import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'], // Adjusting to the existing favicon in public/
      manifest: {
        name: 'Synapse',
        short_name: 'Synapse',
        description: 'Your AI-powered student operating system',
        theme_color: '#5B5BD6',
        background_color: '#FFF8F0',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/dashboard',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        importScripts: ['/push-sw.js'],
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024, // 10 MB
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        runtimeCaching: [
          /*
           * EXCLUSIONS (Intentionally NOT cached):
           * - Everything under /ai/*
           * - Everything under /notebooks/*
           * - Everything under /career-vault/*
           * - All non-GET methods (POST, PUT, PATCH, DELETE)
           */
          {
            urlPattern: /.*\/api\/auth\/me.*/i,
            handler: 'StaleWhileRevalidate',
            method: 'GET',
            options: {
              cacheName: 'synapse-auth-me-cache',
              expiration: { maxEntries: 1, maxAgeSeconds: 60 * 60 * 24 }
            }
          },
          {
            urlPattern: /.*\/api\/subjects.*/i,
            handler: 'StaleWhileRevalidate',
            method: 'GET',
            options: {
              cacheName: 'synapse-subjects-cache',
              expiration: { maxEntries: 1, maxAgeSeconds: 60 * 60 * 24 }
            }
          },
          {
            urlPattern: /.*\/api\/academics\/cgpa.*/i,
            handler: 'StaleWhileRevalidate',
            method: 'GET',
            options: {
              cacheName: 'synapse-cgpa-cache',
              expiration: { maxEntries: 1, maxAgeSeconds: 60 * 60 * 24 }
            }
          },
          {
            urlPattern: /.*\/api\/attendance.*/i,
            handler: 'StaleWhileRevalidate',
            method: 'GET',
            options: {
              cacheName: 'synapse-attendance-cache',
              expiration: { maxEntries: 1, maxAgeSeconds: 60 * 60 * 24 }
            }
          },
          {
            urlPattern: /.*\/api\/marks.*/i,
            handler: 'StaleWhileRevalidate',
            method: 'GET',
            options: {
              cacheName: 'synapse-marks-cache',
              expiration: { maxEntries: 1, maxAgeSeconds: 60 * 60 * 24 }
            }
          },
          {
            urlPattern: /.*\/api\/semesters.*/i,
            handler: 'StaleWhileRevalidate',
            method: 'GET',
            options: {
              cacheName: 'synapse-semesters-cache',
              expiration: { maxEntries: 1, maxAgeSeconds: 60 * 60 * 24 }
            }
          },
          {
            urlPattern: /.*\/api\/expenses\/summary.*/i,
            handler: 'StaleWhileRevalidate',
            method: 'GET',
            options: {
              cacheName: 'synapse-expenses-summary-cache',
              expiration: { maxEntries: 1, maxAgeSeconds: 60 * 60 * 24 }
            }
          },
          {
            urlPattern: /.*\/api\/habits\/analytics.*/i,
            handler: 'StaleWhileRevalidate',
            method: 'GET',
            options: {
              cacheName: 'synapse-habits-analytics-cache',
              expiration: { maxEntries: 1, maxAgeSeconds: 60 * 60 * 24 }
            }
          },
          {
            urlPattern: /.*\/api\/tasks.*/i,
            handler: 'StaleWhileRevalidate',
            method: 'GET',
            options: {
              cacheName: 'synapse-tasks-cache',
              expiration: { maxEntries: 1, maxAgeSeconds: 60 * 60 * 24 }
            }
          },
          {
            urlPattern: /.*\/api\/notifications.*/i,
            handler: 'StaleWhileRevalidate',
            method: 'GET',
            options: {
              cacheName: 'synapse-notifications-cache',
              expiration: { maxEntries: 1, maxAgeSeconds: 60 * 60 * 24 }
            }
          }
        ]
      }
    })
  ],
  define: {
    global: 'globalThis',
    'process.env': {}
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    include: ['react-dropzone', 'tslib']
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'vendor-react';
            }
            if (id.includes('lucide-react') || id.includes('framer-motion') || id.includes('clsx') || id.includes('tailwind-merge')) {
              return 'vendor-ui';
            }
            if (id.includes('recharts') || id.includes('chart.js')) {
              return 'vendor-charts';
            }
            return 'vendor-core';
          }
        }
      }
    }
  }
})
