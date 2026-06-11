import React, { useEffect, useState, useCallback } from 'react';
import { ImagePlus, Trash2, RefreshCw, X } from 'lucide-react';
import { pickImages, removeStoredImage, toDisplayUrl, subscribeImageCache } from '../../lib/native';

interface PhotoPickerProps {
  values: string[];
  onChange: (next: string[]) => void;
  multiple?: boolean;
  label?: string;
  max?: number;
}

/** Native gallery/file picker. Replaces all "paste URL here" image inputs.
 *  Stores values as opaque strings (file path, data URL, or http URL) — the
 *  database schema is unchanged. */
export default function PhotoPicker({
  values,
  onChange,
  multiple = true,
  label = 'Photos',
  max = 20,
}: PhotoPickerProps) {
  const [tick, setTick] = useState(0);
  useEffect(() => subscribeImageCache(() => setTick((t) => t + 1)), []);

  const handleAdd = useCallback(async () => {
    const picked = await pickImages({ multiple, limit: max - values.length });
    if (!picked.length) return;
    onChange(multiple ? [...values, ...picked].slice(0, max) : picked.slice(0, 1));
  }, [multiple, values, onChange, max]);

  const handleReplace = useCallback(async (idx: number) => {
    const picked = await pickImages({ multiple: false, limit: 1 });
    if (!picked.length) return;
    const old = values[idx];
    const next = [...values];
    next[idx] = picked[0];
    onChange(next);
    void removeStoredImage(old);
  }, [values, onChange]);

  const handleRemove = useCallback((idx: number) => {
    const old = values[idx];
    onChange(values.filter((_, i) => i !== idx));
    void removeStoredImage(old);
  }, [values, onChange]);

  // tick referenced so cache updates re-render
  void tick;

  return (
    <div>
      <label className="block text-sm font-medium text-gray-600 mb-2">{label}</label>
      <div className="flex flex-wrap gap-2">
        {values.map((v, i) => {
          const url = toDisplayUrl(v);
          return (
            <div
              key={`${v}-${i}`}
              className="relative w-20 h-20 rounded-xl overflow-hidden border border-pink-200 bg-pink-50 group flex-shrink-0"
            >
              {url ? (
                <img src={url} alt="" className="w-full h-full object-cover" loading="lazy" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-pink-300 text-xs">…</div>
              )}
              <button
                type="button"
                onClick={() => handleRemove(i)}
                className="absolute top-0.5 right-0.5 w-6 h-6 rounded-full bg-white/95 text-pink-500 flex items-center justify-center shadow active:scale-90"
                aria-label="Remove image"
              >
                <X size={13} />
              </button>
              <button
                type="button"
                onClick={() => handleReplace(i)}
                className="absolute bottom-0.5 right-0.5 w-6 h-6 rounded-full bg-white/95 text-pink-500 flex items-center justify-center shadow active:scale-90"
                aria-label="Replace image"
              >
                <RefreshCw size={11} />
              </button>
            </div>
          );
        })}
        {(multiple || values.length === 0) && values.length < max && (
          <button
            type="button"
            onClick={handleAdd}
            className="w-20 h-20 rounded-xl border-2 border-dashed border-pink-300 bg-pink-50/60 flex flex-col items-center justify-center text-pink-500 text-[10px] font-bold gap-1 active:scale-95 transition-transform"
          >
            <ImagePlus size={20} />
            {multiple ? 'Add' : 'Choose'}
          </button>
        )}
      </div>
    </div>
  );
}