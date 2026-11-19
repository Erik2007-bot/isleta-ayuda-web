import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', 'VITE_')
  const apiPath = new URL(env.VITE_API_URL || '/api', 'http://localhost').pathname.replace(/\/+$/, '')
  const apiPattern = apiPath && !['/api', '/auth'].includes(apiPath)
    ? new RegExp(`^${apiPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:[/?]|$)`)
    : null

  return {
    plugins: [react(), VitePWA({
      strategies: 'generateSW',
      injectRegister: 'script-defer',
      registerType: 'prompt',
      manifest: {
        id: '/',
        name: 'Isleta Ayuda',
        short_name: 'Isleta Ayuda',
        description: 'Encuentra recursos y servicios de ayuda para la comunidad de La Isleta.',
        lang: 'es',
        dir: 'ltr',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        theme_color: '#176B55',
        background_color: '#F7F5EF',
        icons: [
          { src: '/icons/pwa-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icons/pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icons/pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        cacheId: 'isleta-ayuda',
        globPatterns: ['index.html', 'registerSW.js', 'assets/**/*.{js,css,png,svg,woff,woff2}', 'images/logo-isleta-ayuda.png'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api(?:[/?]|$)/, /^\/auth(?:[/?]|$)/, ...(apiPattern ? [apiPattern] : [])],
        cleanupOutdatedCaches: true,
        runtimeCaching: [{
          urlPattern: ({ request }) => request.destination === '' || request.headers.has('Authorization'),
          handler: 'NetworkOnly',
          options: { fetchOptions: { cache: 'no-store' } },
        }],
      },
      devOptions: { enabled: false },
    })],
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:8080',
          changeOrigin: true,
        },
      },
    },
  }
})
