import { useState } from 'react';
import { Page } from '../../types';
import { Heart, BookImage, Sparkles, StickyNote, Settings } from 'lucide-react';

interface BottomNavProps {
  activePage: Page;
  onNavigate: (page: Page) => void;
}

const navItems = [
  { id: 'dashboard' as Page, icon: Heart, label: 'Home' },
  { id: 'vault' as Page, icon: BookImage, label: 'Vault' },
  { id: 'ourstory' as Page, icon: Sparkles, label: 'Story' },
  { id: 'notes' as Page, icon: StickyNote, label: 'Notes' },
  { id: 'settings' as Page, icon: Settings, label: 'Settings' },
];

export default function BottomNav({ activePage, onNavigate }: BottomNavProps) {
  const [tapped, setTapped] = useState<Page | null>(null);

  const handleTap = (id: Page) => {
    setTapped(id);
    onNavigate(id);
    setTimeout(() => setTapped(null), 400);
  };

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-20 border-t"
      style={{
        background: 'rgba(255, 228, 242, 0.92)',
        backdropFilter: 'blur(32px)',
        WebkitBackdropFilter: 'blur(32px)',
        borderColor: 'rgba(255, 168, 210, 0.45)',
        boxShadow: '0 -4px 24px rgba(244,114,182,0.12)',
      }}
    >
      <div className="flex items-center justify-around px-2 py-2 pb-safe">
        {navItems.map(({ id, icon: Icon, label }) => {
          const active = activePage === id;
          const bouncing = tapped === id;
          return (
            <button
              key={id}
              onClick={() => handleTap(id)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-2xl transition-all duration-200 ${
                active ? 'text-pink-500' : 'text-gray-400'
              } ${bouncing ? 'animate-wiggle' : ''}`}
            >
              <div className={`transition-all duration-200 ${active ? 'scale-110' : 'scale-100'}`}>
                <Icon
                  size={21}
                  className={active ? 'fill-pink-200 drop-shadow-sm' : ''}
                  style={active ? { filter: 'drop-shadow(0 0 4px rgba(244,114,182,0.5))' } : {}}
                />
              </div>
              <span className={`text-[10px] font-bold tracking-wide ${active ? 'text-pink-500' : 'text-gray-400'}`}>
                {label}
              </span>
              {active && (
                <div className="w-1 h-1 rounded-full bg-pink-400 animate-popIn" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
