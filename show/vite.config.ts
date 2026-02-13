import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/show/',
  build: {
    outDir: 'dist/show',
    emptyOutDir: true
  },
  plugins: [react()],
})
