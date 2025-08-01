// components/layout/MobileNavigation.tsx - Fixed mobile navigation
import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

const MobileNavigation = () => {
  const router = useRouter();

  const navigationItems = [
    { name: 'Feed', href: '/feed', icon: '🏠' },
    { name: 'Activities', href: '/activities', icon: '🗺️' },
    { name: 'Events', href: '/events', icon: '📅' },
    //{ name: 'Chat', href: '/chat', icon: '💬' },
    { name: 'Communities', href: '/communities', icon: '👥' },
    { name: 'Profile', href: '/profile', icon: '👤' },
    
  ];

  const isActiveRoute = (href: string) => {
    if (href === '/feed') {
      return router.pathname === '/' || router.pathname === '/feed';
    }
    return router.pathname.startsWith(href);
  };

  return (
    <>
      {/* Top Header Bar */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 lg:hidden">
        <div className="flex h-16 items-center justify-between px-4">
          <div className="flex items-center">
            <img 
  src="/AdventureOne-Logo-nowords.png" 
  alt="AdventureOne Logo-no words" 
  className="h-9 w-9 object-contain rounded-lg"
/>
            <span className="ml-2 text-lg font-semibold text-gray-900 dark:text-white">
              AdventureOne
            </span>
          </div>
          
          {/* Optional: Add menu button or user avatar here */}
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600">
            <span className="text-sm font-medium text-white">A</span>
          </div>
        </div>
      </div>

      {/* Bottom Navigation Tabs */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 lg:hidden">
        <div className="grid grid-cols-5 h-16
        ">
          {navigationItems.map((item) => {
            const isActive = isActiveRoute(item.href);
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex flex-col items-center justify-center space-y-1 transition-colors ${
                  isActive
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="text-xs font-medium">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default MobileNavigation;