import react from '@vitejs/plugin-react'
import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite'

const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Shown at the bottom of Settings; bump it in package.json and add a CHANGELOG entry per release.
  define: { __APP_VERSION__: JSON.stringify(version) },
})
