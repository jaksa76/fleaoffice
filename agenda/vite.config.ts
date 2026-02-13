import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/agenda/',
  build: {
    outDir: 'dist/agenda',
    emptyOutDir: true
  },
  plugins: [react()],
})
