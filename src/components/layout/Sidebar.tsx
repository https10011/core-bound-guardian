import { Page } from '../../types';
import { Heart, BookImage, StickyNote, Settings, Sparkles } from 'lucide-react';

interface SidebarProps {
  activePage: Page;
  onNavigate: (page: Page) => void;
  partnerName: string;
}

const navItems = [
  { id: 'dashboard' as Page, label: 'Home', icon: Heart },
  { id: 'vault' as Page, label: 'Memory Vault', icon: BookImage },
  { id: 'ourstory' as Page, label: 'Our Story', icon: Sparkles },
  { id: 'notes' as Page, label: 'Notes', icon: StickyNote },
  { id: 'settings' as Page, label: 'Settings', icon: Settings },
];

export default function Sidebar({ activePage, onNavigate, partnerName }: SidebarProps) {
  return (
    <aside
      className="hidden md:flex flex-col w-64 h-screen sticky top-0 z-20"
      style={{
        background: 'rgba(255, 210, 232, 0.38)',
        backdropFilter: 'blur(32px)',
        WebkitBackdropFilter: 'blur(32px)',
        borderRight: '1px solid rgba(255, 168, 210, 0.40)',
        boxShadow: '2px 0 24px rgba(244,114,182,0.08)',
      }}
    >
      {/* Decorative floating hearts */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <span className="absolute top-16 right-4 text-pink-200/50 text-xs animate-float" style={{ animationDelay: '0s' }}>♥</span>
        <span className="absolute top-32 right-8 text-rose-200/40 text-[8px] animate-float" style={{ animationDelay: '1.2s' }}>♥</span>
        <span className="absolute bottom-32 right-5 text-pink-200/40 text-xs animate-float" style={{ animationDelay: '0.6s' }}>♥</span>
        <span className="absolute bottom-16 right-12 text-rose-200/30 text-[8px] animate-float" style={{ animationDelay: '1.8s' }}>♥</span>
      </div>

      {/* Logo */}
      <div className="px-6 pt-8 pb-6 relative">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg animate-pulsePink"
            style={{ background: 'linear-gradient(135deg, #f472b6, #fb7185)' }}
          >
            <Heart size={19} className="text-white fill-white animate-heartbeat" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight"
              style={{ background: 'linear-gradient(135deg, #ec4899, #f43f5e)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Memora
            </h1>
            {partnerName && (
              <p className="text-[11px] text-pink-400/80 mt-0.5 font-semibold">with {partnerName} ♥</p>
            )}
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5">
        {navItems.map(({ id, label, icon: Icon }, i) => {
          const active = activePage === id;
          return (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm font-bold transition-all duration-250 group animate-slideUp`}
              style={{
                animationDelay: `${i * 50}ms`,
                background: active ? 'rgba(255, 182, 220, 0.45)' : 'transparent',
                border: active ? '1px solid rgba(255, 150, 200, 0.5)' : '1px solid transparent',
                boxShadow: active ? '0 4px 16px rgba(244,114,182,0.15), inset 0 1px 0 rgba(255,255,255,0.6)' : 'none',
                color: active ? '#db2777' : '#9ca3af',
              }}
            >
              <span className={`transition-all duration-200 ${active ? 'scale-110' : 'group-hover:scale-105'}`}
                style={active ? { filter: 'drop-shadow(0 0 5px rgba(244,114,182,0.5))' } : {}}>
                <Icon
                  size={17}
                  className={active ? 'fill-pink-200' : 'group-hover:text-pink-400'}
                />
              </span>
              <span className={active ? 'text-pink-700' : 'group-hover:text-pink-500 transition-colors'}>{label}</span>
              {active && <div className="ml-auto w-2 h-2 rounded-full animate-popIn" style={{ background: 'linear-gradient(135deg, #f472b6, #fb7185)' }} />}
            </button>
          );
        })}
      </nav>

      {/* Bottom card */}
      <div className="px-5 py-6">
        <div
          className="rounded-2xl p-3.5 text-center animate-slideUp"
          style={{
            background: 'rgba(255, 200, 228, 0.35)',
            border: '1px solid rgba(255,168,210,0.4)',
          }}
        >
          <span className="text-base animate-sway inline-block">🌸</span>
          <p className="text-xs text-pink-500 font-bold mt-1">Made with love</p>
          <p className="text-[10px] text-pink-400/70 mt-0.5 font-medium">Every memory matters ♥</p>
        </div>
      </div>
    </aside>
  );
}
