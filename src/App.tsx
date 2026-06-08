import { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import { supabase } from './lib/supabase';
import { Page } from './types';
import AppLayout from './components/layout/AppLayout';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import MemoryVault from './pages/MemoryVault';
import OurStory from './pages/OurStory';
import Notes from './pages/Notes';
import Settings from './pages/Settings';

export default function App() {
  const { user, loading } = useAuth();
  const [activePage, setActivePage] = useState<Page>('dashboard');
  const [partnerName, setPartnerName] = useState('');

  useEffect(() => {
    if (!user) return;
    supabase.from('relationships').select('name').eq('user_id', user.id).maybeSingle().then(({ data }) => {
      if (data?.name) setPartnerName(data.name);
    });
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-3xl bg-gradient-to-br from-pink-400 to-rose-400 flex items-center justify-center shadow-xl shadow-pink-300/40 mx-auto mb-4 animate-pulse">
            <span className="text-white text-xl">♥</span>
          </div>
          <p className="text-pink-400 text-sm font-medium">Loading Memora...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Auth />;

  const pages: Record<Page, JSX.Element> = {
    dashboard: <Dashboard userId={user.id} onNavigate={setActivePage} />,
    vault: <MemoryVault userId={user.id} />,
    ourstory: <OurStory userId={user.id} />,
    notes: <Notes userId={user.id} />,
    settings: (
      <Settings
        userId={user.id}
        userEmail={user.email ?? ''}
        onSignOut={async () => { await supabase.auth.signOut(); }}
      />
    ),
  };

  return (
    <AppLayout activePage={activePage} onNavigate={setActivePage} partnerName={partnerName}>
      <div className="animate-fadeIn">
        {pages[activePage]}
      </div>
    </AppLayout>
  );
}
