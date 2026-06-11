import type { CapacitorConfig } from '@capacitor/cli';

// Tuned for Android WebView on low/mid-range devices (Tecno, Infinix, Redmi,
// Realme, Samsung A-series). Keep the JS bundle the single source of truth —
// no remote `server.url`, no mixed content, no web debugging in release.
const config: CapacitorConfig = {
  appId: 'app.memora.alpha',
  appName: 'Memora',
  webDir: 'dist',
  bundledWebRuntime: false,
  // Use the standard https scheme on Android so localStorage/IndexedDB
  // (used by jeep-sqlite fallback) is properly partitioned and persistent.
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
    backgroundColor: '#fff0f5',
  },
  server: {
    androidScheme: 'https',
  },
  plugins: {
    CapacitorSQLite: {
      androidIsEncryption: false,
      iosIsEncryption: false,
    },
    Camera: {
      // Android 13+ uses scoped media permissions automatically (READ_MEDIA_IMAGES).
      // We don't request camera permission unless capturePhoto() is called.
      androidScaleType: 'CENTER_CROP',
    },
    Keyboard: {
      resize: 'native',
      resizeOnFullScreen: true,
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#fff0f5',
      overlaysWebView: false,
    },
    SplashScreen: {
      launchShowDuration: 400,
      launchAutoHide: true,
      backgroundColor: '#fff0f5',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: false,
      splashImmersive: false,
    },
  },
};

export default config;