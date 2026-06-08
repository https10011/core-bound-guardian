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
    <div className="flex min-h-screen">
      <Sidebar activePage={activePage} onNavigate={onNavigate} partnerName={partnerName} />
      <main className="flex-1 pb-20 md:pb-0 overflow-x-hidden">
        {children}
      </main>
      <BottomNav activePage={activePage} onNavigate={onNavigate} />
    </div>
  );
}
