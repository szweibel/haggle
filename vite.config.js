import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/haggle-react/',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true
  }
})
