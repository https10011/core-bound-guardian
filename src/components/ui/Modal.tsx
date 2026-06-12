import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export default function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) {
      document.addEventListener('keydown', handleKey);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClass = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }[size];

  // Compute available height once so the modal never grows past the visible
  // viewport — accounts for status bar, gesture bar, and the soft keyboard.
  const availableHeight =
    'calc(100dvh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px) - var(--kb-h, 0px))';

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + var(--kb-h, 0px))',
      }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 animate-fadeIn"
        // PERF: removed backdrop-filter on the modal scrim (was creating a
        // full-screen blurred layer on every dialog open).
        style={{ background: 'rgba(244, 114, 182, 0.28)' }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`relative w-full ${sizeClass} rounded-t-3xl sm:rounded-3xl overflow-hidden animate-bounceIn flex flex-col`}
        style={{
          maxHeight: availableHeight,
          background: 'rgba(255, 244, 250, 0.98)',
          border: '1px solid rgba(255, 168, 210, 0.55)',
          boxShadow:
            '0 20px 48px rgba(244,114,182,0.20), 0 6px 18px rgba(244,114,182,0.10), inset 0 1px 0 rgba(255,255,255,0.90)',
        }}
      >
        {/* Decorative top hearts */}
        <div className="absolute top-3 right-16 text-pink-200/60 text-xs pointer-events-none animate-float" style={{ animationDelay: '0.2s' }}>♥</div>
        <div className="absolute top-5 right-24 text-rose-200/50 text-[10px] pointer-events-none animate-float" style={{ animationDelay: '0.8s' }}>♥</div>

        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: 'rgba(255,168,210,0.4)', background: 'rgba(255,228,240,0.30)' }}
        >
          <h2 className="text-base font-bold text-gray-700 tracking-tight">{title}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-gray-400 hover:text-pink-500 hover:bg-pink-100/60 transition-all hover:scale-110 active:scale-95"
          >
            <X size={17} />
          </button>
        </div>

        <div className="overflow-y-auto overscroll-contain flex-1" style={{ WebkitOverflowScrolling: 'touch' as any }}>
          {children}
        </div>
      </div>
    </div>
  );
}
