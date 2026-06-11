import React from 'react';
import { Page } from '../../types';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';

interface AppLayoutProps {
  activePage: Page;
  onNavigate: (page: Page) => void;
  partnerName: string;
  children: React.ReactNode;
}

export default function AppLayout({ activePage, onNavigate, partnerName, children }: AppLayoutProps) {
  return (
    <div className="flex min-h-dvh">
      <Sidebar activePage={activePage} onNavigate={onNavigate} partnerName={partnerName} />
      <main
        className="flex-1 md:pb-0 overflow-x-hidden pt-safe px-safe pb-nav md:pb-0"
        style={{ minHeight: '100dvh' }}
      >
        {children}
      </main>
      <BottomNav activePage={activePage} onNavigate={onNavigate} />
    </div>
  );
}
