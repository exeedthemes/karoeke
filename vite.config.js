import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // Ensures relative assets load properly on GitHub Pages or custom subpaths
  server: {
    host: '0.0.0.0',
    port: 3000
  }
})

