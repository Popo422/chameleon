import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Pinned so E2E (Playwright) always hits a known port and doesn't
  // collide with other local dev servers.
  server: { port: 5180, strictPort: true },
})
