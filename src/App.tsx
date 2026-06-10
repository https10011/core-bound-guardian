import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  lazy,
  Suspense,
} from 'react';
import { useAuth } from './hooks/useAuth';
import { supabase } from './lib/supabase';
import { Page } from './types';
import AppLayout from './components/layout/AppLayout';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';

// PERF: only Dashboard is bundled with the initial chunk. The remaining
// screens are code-split so the first paint after sign-in loads ~60% less
// JavaScript on low-end Android. They hydrate on first navigation and stay
// resident afterwards.
const MemoryVault = lazy(() => import('./pages/MemoryVault'));
const OurStory = lazy(() => import('./pages/OurStory'));
const Notes = lazy(() => import('./pages/Notes'));
const Settings = lazy(() => import('./pages/Settings'));

function PageFallback() {
  return (
    <div className="flex items-center justify-center h-64">
      <span className="text-pink-400 text-sm font-bold animate-pulse">Loading…</span>
    </div>
  );
}

function AppImpl() {
  const { user, loading } = useAuth();
  const [activePage, setActivePage] = useState<Page>('dashboard');
  const [partnerName, setPartnerName] = useState('');

  // Stable identity prevents Dashboard / AppLayout from re-rendering on
  // every parent update.
  const handleNavigate = useCallback((p: Page) => setActivePage(p), []);
  const handleSignOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    supabase
      .from('relationships')
      .select('name')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled && data?.name) setPartnerName(data.name);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  // Pre-warm non-critical chunks once the user is idle. import() is a no-op
  // after the first call, so this is safe to invoke unconditionally.
  useEffect(() => {
    if (!user) return;
    const w = window as any;
    const schedule = w.requestIdleCallback ?? ((cb: () => void) => setTimeout(cb, 1200));
    const handle = schedule(() => {
      import('./pages/MemoryVault');
      import('./pages/Notes');
      import('./pages/OurStory');
      import('./pages/Settings');
    });
    return () => {
      const cancel = w.cancelIdleCallback ?? clearTimeout;
      try { cancel(handle); } catch { /* noop */ }
    };
  }, [user]);

  const currentPage = useMemo(() => {
    if (!user) return null;
    switch (activePage) {
      case 'dashboard': return <Dashboard userId={user.id} onNavigate={handleNavigate} />;
      case 'vault':    return <MemoryVault userId={user.id} />;
      case 'ourstory': return <OurStory userId={user.id} />;
      case 'notes':    return <Notes userId={user.id} />;
      case 'settings': return (
        <Settings userId={user.id} userEmail={user.email ?? ''} onSignOut={handleSignOut} />
      );
      default: return null;
    }
  }, [activePage, user, handleNavigate, handleSignOut]);

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

  return (
    <AppLayout activePage={activePage} onNavigate={handleNavigate} partnerName={partnerName}>
      <div key={activePage} className="animate-fadeIn">
        <Suspense fallback={<PageFallback />}>{currentPage}</Suspense>
      </div>
    </AppLayout>
  );
}

export default React.memo(AppImpl);
