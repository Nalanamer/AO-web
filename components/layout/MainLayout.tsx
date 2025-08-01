// components/layout/MainLayout.tsx - Fixed professional layout
import React from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import Navigation from './Navigation';
import MobileNavigation from './MobileNavigation';
import SettingsIcon from './SettingsIcon';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { user } = useAuth();
  const router = useRouter();

  // Don't show navigation on login/auth pages
  const hideNavigation = router.pathname.includes('/auth');

  if (hideNavigation) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Desktop Sidebar - Hidden on mobile */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:block lg:w-64 lg:overflow-y-auto lg:bg-white lg:dark:bg-slate-800 lg:border-r lg:border-gray-200 lg:dark:border-slate-700">
        <Navigation />
      </div>

      {/* Mobile Navigation - Only show on small screens */}
      <div className="lg:hidden">
        <MobileNavigation />
      </div>

      {/* Main Content Area */}
      <main className="lg:pl-64">
        {/* Content Container */}
        <div className="min-h-screen">
          {/* Top padding for mobile navigation */}
          <div className="lg:hidden h-16"></div>
          
          {/* Page Content */}
          <div className="px-4 py-6 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">
              {children}
            </div>
          </div>
          
          {/* Bottom padding for mobile navigation */}
          <div className="lg:hidden h-20"></div>
        </div>
      </main>
    </div>
  );
};

export default MainLayout;