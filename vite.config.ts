import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'
import { fileURLToPath } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      'zwo-workout-parser': resolve(__dirname, 'packages/zwo-workout-parser/src/index.ts'),
    },
  },
  // base is set at build time via --base flag for GitHub Pages deployments.
  // For local dev and standard builds the default '/' is used.
})
