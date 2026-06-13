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
      const setKb = (h: number) => {
        document.documentElement.style.setProperty('--kb-h', `${h}px`);
        document.documentElement.classList.toggle('kb-open', h > 0);
        // Keep the focused input visible above the keyboard.
        if (h > 0) {
          const el = document.activeElement as HTMLElement | null;
          if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT')) {
            requestAnimationFrame(() =>
              el.scrollIntoView({ behavior: 'smooth', block: 'center' }),
            );
          }
        }
      };
      Keyboard.addListener('keyboardWillShow', (info) => setKb(info.keyboardHeight));
      Keyboard.addListener('keyboardDidShow', (info) => setKb(info.keyboardHeight));
      Keyboard.addListener('keyboardWillHide', () => setKb(0));
      Keyboard.addListener('keyboardDidHide', () => setKb(0));
    } catch { /* keyboard plugin optional */ }
  })();
}

// Web fallback for keyboard tracking using VisualViewport (used in browser
// preview and Android browsers without the Capacitor plugin).
if (typeof window !== 'undefined' && 'visualViewport' in window) {
  const vv = window.visualViewport!;
  const update = () => {
    const kb = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
    document.documentElement.style.setProperty('--kb-h', `${kb}px`);
    document.documentElement.classList.toggle('kb-open', kb > 80);
  };
  vv.addEventListener('resize', update);
  vv.addEventListener('scroll', update);
}

// Scroll focused inputs into view (covers desktop, web preview, and any case
// the Keyboard plugin misses).
if (typeof document !== 'undefined') {
  document.addEventListener('focusin', (e) => {
    const t = e.target as HTMLElement;
    if (!t) return;
    if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT') {
      setTimeout(() => {
        try { t.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch { /* noop */ }
      }, 250);
    }
  });
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
