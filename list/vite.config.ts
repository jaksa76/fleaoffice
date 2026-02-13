import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/list/',
  build: {
    outDir: 'dist/list',
    emptyOutDir: true
  },
  plugins: [react()],
})
