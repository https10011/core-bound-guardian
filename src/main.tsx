import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { Capacitor } from '@capacitor/core';

// Native chrome: status bar tint + keyboard inset.
if (Capacitor.isNativePlatform()) {
  (async () => {
    try {
      const { StatusBar, Style } = await import('@capacitor/status-bar');
      await StatusBar.setStyle({ style: Style.Light });
      await StatusBar.setBackgroundColor({ color: '#fff0f5' });
      await StatusBar.setOverlaysWebView({ overlay: false });
    } catch { /* status bar plugin optional */ }
    try {
      const { Keyboard } = await import('@capacitor/keyboard');
      Keyboard.addListener('keyboardWillShow', (info) => {
        document.documentElement.style.setProperty('--kb-h', `${info.keyboardHeight}px`);
      });
      Keyboard.addListener('keyboardWillHide', () => {
        document.documentElement.style.setProperty('--kb-h', '0px');
      });
    } catch { /* keyboard plugin optional */ }
  })();
}

// NOTE: StrictMode is intentionally disabled in production builds. On Android
// WebView its double-invocation of effects doubles SQLite init + initial
// queries, which is visible as extra splash-to-interaction latency on
// low-end devices.
const root = createRoot(document.getElementById('root')!);

if (import.meta.env.DEV) {
  // Dev-only: enable StrictMode to surface effect/cleanup issues during build.
  import('react').then(({ StrictMode }) => {
    root.render(<StrictMode><App /></StrictMode>);
  });
} else {
  root.render(<App />);
}
