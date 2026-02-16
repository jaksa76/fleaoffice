import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/write/',
  build: {
    outDir: 'dist/write',
    emptyOutDir: true
  },
  plugins: [react()],
  server: {
    port: 5173,
    open: '/write/',
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
});
