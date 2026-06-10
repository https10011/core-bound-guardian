import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Capacitor-compatible: emits a static SPA in dist/ that the Android WebView
// loads. Build target matches the minimum Android WebView we support
// (Android 10 / Chromium 71+ — es2020 is universally available there) and
// produces smaller, faster-parsing output than es2019 with downleveling.
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react', '@capacitor-community/sqlite'],
  },
  esbuild: {
    // Strip console + debugger in production for smaller bundle and zero
    // logging cost on the device.
    drop: ['debugger'],
    pure: ['console.log', 'console.debug', 'console.info'],
  },
  build: {
    outDir: 'dist',
    target: 'es2020',
    cssCodeSplit: true,
    sourcemap: false,
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        // Split vendor bundles so the React runtime can be cached separately
        // from app code (and so bcryptjs / sqlite never block first paint).
        manualChunks: {
          react: ['react', 'react-dom'],
          icons: ['lucide-react'],
          sqlite: ['@capacitor-community/sqlite', 'jeep-sqlite'],
          crypto: ['bcryptjs'],
        },
      },
    },
  },
});