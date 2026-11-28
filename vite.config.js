import react from '@vitejs/plugin-react'
import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import { latestRelease } from './scripts/release-notes.mjs'

const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'))

// https://vite.dev/config/
// release.json next to the app: this build's version and the newest CHANGELOG entry. An open
// (older) app fetches it when a new version is waiting, to say what's new. Not part of the
// offline copy, so it always comes from the server.
const releaseNotes = {
  name: 'release-notes',
  generateBundle() {
    const notes = latestRelease(readFileSync(new URL('./CHANGELOG.md', import.meta.url), 'utf8'))
    this.emitFile({ type: 'asset', fileName: 'release.json', source: JSON.stringify({ version, notes }) })
  },
}

export default defineConfig(({ command, isPreview }) => ({
  plugins: [
    react(),
    releaseNotes,
    // Installable app with an offline copy: a service worker caches the built files, so the app
    // opens without a network. New versions wait until "Reload" is tapped (see UpdatePrompt).
    // Only active in builds; the dev server runs without a service worker.
    VitePWA({
      registerType: 'prompt',
      injectRegister: false,
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Training Cycle',
        short_name: 'Training',
        description: 'Strength training cycles with sessions, rest timers and history.',
        lang: 'en',
        display: 'standalone',
        orientation: 'portrait',
        theme_color: '#f4f4f8',
        background_color: '#f4f4f8',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}'],
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  // GitHub Pages serves the app from /training-cycle-app-react/ (so does `npm run preview`, to test
  // the real build); the dev server stays at /
  base: command === 'build' || isPreview ? '/training-cycle-app-react/' : '/',
  // Shown at the bottom of Settings; bump it in package.json and add a CHANGELOG entry per release.
  define: { __APP_VERSION__: JSON.stringify(version) },
}))
