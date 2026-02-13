import { defineConfig } from 'vite';
import { resolve } from 'path';
import { writeFileSync, mkdirSync, readFileSync } from 'fs';

export default defineConfig({
  base: '/write/',
  build: {
    outDir: 'dist/write',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/index.html'),
        editor: resolve(__dirname, 'src/editor.html')
      }
    }
  },
  plugins: [
    {
      name: 'move-html-to-root',
      closeBundle() {
        // Move HTML files from dist/write/src/ to dist/write/
        try {
          const indexHtml = readFileSync('dist/write/src/index.html', 'utf-8');
          const editorHtml = readFileSync('dist/write/src/editor.html', 'utf-8');
          
          // Fix asset paths (remove src/ prefix)
          const fixedIndex = indexHtml.replace(/src="\/write\/src\//g, 'src="/write/')
                                      .replace(/href="\/write\/src\//g, 'href="/write/');
          const fixedEditor = editorHtml.replace(/src="\/write\/src\//g, 'src="/write/')
                                       .replace(/href="\/write\/src\//g, 'href="/write/');
          
          writeFileSync('dist/write/index.html', fixedIndex);
          writeFileSync('dist/write/editor.html', fixedEditor);
        } catch (e) {
          console.log('Note: HTML files already in correct location or error:', e.message);
        }
      }
    }
  ],
  server: {
    port: 3000,
    open: '/write/'
  }
});
