import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export default function Button({ variant = 'primary', size = 'md', children, className = '', ...props }: ButtonProps) {
  const base = 'relative inline-flex items-center justify-center gap-2 font-bold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden select-none';

  const variants = {
    primary: 'btn-shimmer text-white shadow-lg shadow-pink-300/50 hover:shadow-pink-400/60 hover:scale-[1.04] active:scale-[0.96]',
    ghost: 'text-gray-600 hover:bg-pink-100/60 hover:text-pink-600 active:scale-95',
    outline: 'border border-pink-200 text-pink-600 bg-white/50 hover:bg-pink-50 hover:border-pink-300 active:scale-95',
    danger: 'bg-gradient-to-r from-red-400 to-rose-500 text-white shadow-lg shadow-red-200/50 hover:scale-[1.04] active:scale-[0.96]',
  };

  const sizes = {
    sm: 'px-3.5 py-1.5 text-sm',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {/* shine sweep on primary */}
      {variant === 'primary' && (
        <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-700 pointer-events-none" />
      )}
      {children}
    </button>
  );
}
