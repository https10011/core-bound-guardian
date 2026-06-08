import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.memora.alpha',
  appName: 'Memora',
  webDir: 'dist',
  bundledWebRuntime: false,
  plugins: {
    CapacitorSQLite: {
      androidIsEncryption: false,
      iosIsEncryption: false,
    },
  },
};

export default config;