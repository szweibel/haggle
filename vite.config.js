import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/haggle/', // Update base path to match repository name
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true
  }
})
