import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

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
