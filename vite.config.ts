import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    restoreMocks: true,
    // Node 25+ ships a built-in localStorage that shadows jsdom's; turn it off in tests.
    execArgv: ['--no-experimental-webstorage'],
  },
})
