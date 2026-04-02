/// <reference types="vitest" />
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
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts']
  },
  server: {
    port: 5174,
    open: '/list/',
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
})
