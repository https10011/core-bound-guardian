import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Capacitor-compatible: emits a static SPA in dist/ that the Android WebView loads.
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react', '@capacitor-community/sqlite'],
  },
  build: {
    outDir: 'dist',
    target: 'es2019',
  },
});