// Native (Capacitor) helpers — image picker, file picker, local file storage,
// share/export. All functions degrade gracefully in the browser preview so
// the dev environment keeps working without the native plugins installed.

import { Capacitor } from '@capacitor/core';
import { Camera, CameraSource, CameraResultType } from '@capacitor/camera';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

export const isNative = Capacitor.isNativePlatform();

const IMG_DIR = 'memora-images';

/** Convert a stored path/URI into something an <img src=> can display. */
export function toDisplayUrl(stored: string): string {
  if (!stored) return '';
  // Already a remote / data / blob URL — return as-is for backwards compat.
  if (/^(https?:|data:|blob:|file:|content:)/i.test(stored)) {
    return isNative && stored.startsWith('file:') ? Capacitor.convertFileSrc(stored) : stored;
  }
  // Bare path stored by us (relative to Data dir). Resolve to a file:// URI
  // then convert for the WebView.
  if (isNative) {
    try {
      // Filesystem.getUri is async; for sync access we use convertFileSrc on
      // a deterministic path that the WebView can read via the capacitor
      // scheme — but native path resolution requires the absolute URI. We
      // therefore cache resolved URIs on first sight.
      const cached = uriCache.get(stored);
      if (cached) return cached;
      // Kick off resolution; until it lands, return empty so <img> shows
      // placeholder. Component will re-render once cache populates.
      void resolveAndCache(stored);
      return cached ?? '';
    } catch {
      return '';
    }
  }
  return stored;
}

const uriCache = new Map<string, string>();
const cacheListeners = new Set<() => void>();

async function resolveAndCache(stored: string) {
  if (uriCache.has(stored)) return;
  try {
    const { uri } = await Filesystem.getUri({ directory: Directory.Data, path: stored });
    uriCache.set(stored, Capacitor.convertFileSrc(uri));
    cacheListeners.forEach((l) => l());
  } catch {
    uriCache.set(stored, '');
  }
}

/** Subscribe to URI cache updates so <img> components re-render. */
export function subscribeImageCache(cb: () => void): () => void {
  cacheListeners.add(cb);
  return () => cacheListeners.delete(cb);
}

/** Native multi-image picker. Returns an array of stored paths (relative). */
export async function pickImages(opts?: { multiple?: boolean; limit?: number }): Promise<string[]> {
  const multiple = opts?.multiple ?? true;
  const limit = opts?.limit ?? 10;

  if (!isNative) {
    return pickImagesViaInput(multiple);
  }

  try {
    const result = await Camera.pickImages({ quality: 85, limit });
    const photos = multiple ? result.photos : result.photos.slice(0, 1);
    const saved: string[] = [];
    for (const p of photos) {
      const stored = await copyToAppStorage(p.webPath ?? p.path ?? '');
      if (stored) saved.push(stored);
    }
    return saved;
  } catch (e: any) {
    if (String(e?.message || '').toLowerCase().includes('cancel')) return [];
    console.warn('pickImages failed:', e);
    return [];
  }
}

/** Take a single photo with the camera (separate UI affordance if needed). */
export async function capturePhoto(): Promise<string | null> {
  if (!isNative) return null;
  try {
    const photo = await Camera.getPhoto({
      quality: 85,
      resultType: CameraResultType.Uri,
      source: CameraSource.Camera,
      saveToGallery: false,
    });
    return await copyToAppStorage(photo.webPath ?? photo.path ?? '');
  } catch (e: any) {
    if (String(e?.message || '').toLowerCase().includes('cancel')) return null;
    return null;
  }
}

async function copyToAppStorage(src: string): Promise<string | null> {
  if (!src) return null;
  try {
    await Filesystem.mkdir({ directory: Directory.Data, path: IMG_DIR, recursive: true }).catch(() => {});
    // Fetch the source as a blob (works for file:// & content:// inside WebView).
    const blob = await (await fetch(src)).blob();
    const ext = (blob.type.split('/')[1] || 'jpg').replace('jpeg', 'jpg').slice(0, 5);
    const name = `${IMG_DIR}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const dataUrl: string = await blobToDataUrl(blob);
    const base64 = dataUrl.split(',')[1];
    await Filesystem.writeFile({ directory: Directory.Data, path: name, data: base64 });
    // Pre-warm the display cache.
    void resolveAndCache(name);
    return name;
  } catch (e) {
    console.warn('copyToAppStorage failed', e);
    return null;
  }
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
}

/** Browser fallback used in dev preview — converts files to data URLs. */
function pickImagesViaInput(multiple: boolean): Promise<string[]> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = multiple;
    input.onchange = async () => {
      const files = Array.from(input.files ?? []);
      const out: string[] = [];
      for (const f of files) out.push(await blobToDataUrl(f));
      resolve(out);
    };
    input.oncancel = () => resolve([]);
    input.click();
  });
}

/** Delete a stored image from app storage. Best-effort. */
export async function removeStoredImage(stored: string) {
  if (!stored || !isNative) return;
  if (/^(https?:|data:|blob:|file:|content:)/i.test(stored)) return;
  try {
    await Filesystem.deleteFile({ directory: Directory.Data, path: stored });
    uriCache.delete(stored);
  } catch { /* noop */ }
}

/** Native file picker (any type). Returns the file contents as text. */
export function pickJsonFile(): Promise<string | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';
    input.onchange = async () => {
      const f = input.files?.[0];
      if (!f) return resolve(null);
      resolve(await f.text());
    };
    input.oncancel = () => resolve(null);
    input.click();
  });
}

/** Export arbitrary JSON to the device — uses native Share on Android, blob
 *  download in the browser. */
export async function exportJson(filename: string, data: unknown): Promise<void> {
  const json = JSON.stringify(data, null, 2);
  if (!isNative) {
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
    return;
  }
  const path = `exports/${filename}`;
  await Filesystem.mkdir({ directory: Directory.Data, path: 'exports', recursive: true }).catch(() => {});
  await Filesystem.writeFile({
    directory: Directory.Data,
    path,
    data: btoa(unescape(encodeURIComponent(json))),
  });
  const { uri } = await Filesystem.getUri({ directory: Directory.Data, path });
  try {
    await Share.share({ title: 'Memora export', url: uri, dialogTitle: 'Save Memora export' });
  } catch { /* user cancelled */ }
}