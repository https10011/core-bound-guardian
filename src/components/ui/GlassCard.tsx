import React, { memo } from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
  animate?: boolean;
  delay?: number;
}

// PERF: GlassCard is rendered ~20-50× per screen. On Android WebView, every
// instance previously stacked a `backdrop-filter: blur(22px)` layer, which is
// the most expensive CSS operation on mid-range GPUs and triggers a full GPU
// composite each scroll frame. We replace it with a higher-opacity solid pink
// background that visually matches the frosted look, and keep only a single
// soft shadow. The animation stays identical.
function GlassCardImpl({
  children,
  className = '',
  onClick,
  hover = false,
  animate = true,
  delay = 0,
}: GlassCardProps) {
  return (
    <div
      onClick={onClick}
      className={`rounded-2xl${animate ? ' animate-slideUp' : ''}${
        hover ? ' cursor-pointer transition-transform duration-200 active:scale-[0.985]' : ''
      }${onClick && !hover ? ' cursor-pointer' : ''} ${className}`}
      style={{
        background: 'rgba(255, 232, 244, 0.85)',
        border: '1px solid rgba(255, 168, 210, 0.45)',
        boxShadow:
          '0 4px 14px rgba(244,114,182,0.12), inset 0 1px 0 rgba(255,255,255,0.75)',
        animationDelay: delay ? `${delay}ms` : undefined,
        animationFillMode: 'both',
      }}
    >
      {children}
    </div>
  );
}

export default memo(GlassCardImpl);
