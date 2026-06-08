import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
  animate?: boolean;
  delay?: number;
}

export default function GlassCard({ children, className = '', onClick, hover = false, animate = true, delay = 0 }: GlassCardProps) {
  return (
    <div
      onClick={onClick}
      className={`
        rounded-2xl
        ${animate ? 'animate-slideUp' : ''}
        ${hover ? 'cursor-pointer transition-all duration-300 hover:scale-[1.025] hover:-translate-y-0.5' : ''}
        ${onClick && !hover ? 'cursor-pointer' : ''}
        ${className}
      `}
      style={{
        background: 'rgba(255, 220, 238, 0.40)',
        backdropFilter: 'blur(22px)',
        WebkitBackdropFilter: 'blur(22px)',
        border: '1px solid rgba(255, 168, 210, 0.45)',
        boxShadow: '0 8px 32px rgba(244,114,182,0.14), 0 2px 8px rgba(244,114,182,0.08), inset 0 1px 0 rgba(255,255,255,0.75)',
        animationDelay: delay ? `${delay}ms` : undefined,
        animationFillMode: 'both',
      }}
    >
      {children}
    </div>
  );
}
