import { defineConfig } from 'vite';

export default defineConfig({
  // Force absolute path base tracking to fix missing asset canvas links
  base: './',
  server: {
    port: 5173,
    strictPort: true,
    host: true, // Enables local cloud browser port forwarding links
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false
  }
});
