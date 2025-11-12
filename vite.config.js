import { defineConfig } from 'vite';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

// https://vitejs.dev/config/
export default defineConfig({
  root: resolve(__dirname, 'src'),
  publicDir: resolve(__dirname, 'public'),
  base: './', // Relative paths for GitHub Pages
  build: {
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/index.html'),
        // Add other entry points if needed
      },
    },
    // Enable build minification and sourcemaps for production
    minify: 'terser',
    sourcemap: true,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  // Environment variables
  define: {
    'import.meta.env.BUILD_TIME': JSON.stringify(new Date().toISOString()),
  },
  server: {
    port: 3000,
    open: true,
  },
  preview: {
    port: 3000,
    open: true,
  },
});
