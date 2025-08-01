// components/layout/Navigation.tsx - Fixed desktop navigation
import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';

const Navigation = () => {
  const router = useRouter();
  const { user, logout } = useAuth();

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
    <div className="flex h-full w-64 flex-col">
      {/* Logo/Brand */}
      <div className="flex h-16 shrink-0 items-center px-6 border-b border-gray-200 dark:border-slate-700">
        <div className="flex items-center">
          <img 
  src="/AdventureOne-Logo-nowords.png" 
  alt="AdventureOne Logo-no words" 
  className="h-12 w-12 object-contain rounded-lg"
/>
          <div className="ml-3">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">AdventureOne</p>
          </div>
        </div>
      </div>

      {/* User Profile Section */}
      {user && (
        <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700">
          <div className="flex items-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-white font-medium">
              {user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
            </div>
            <div className="ml-3 min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {user.name || 'User'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {user.email}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Links */}
      <nav className="flex-1 px-6 py-6">
        <ul className="space-y-1">
          {navigationItems.map((item) => {
            const isActive = isActiveRoute(item.href);
            
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`group flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <span className="mr-3 text-lg">{item.icon}</span>
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom Actions */}
      <div className="px-6 py-4 border-t border-gray-200 dark:border-slate-700">
        <button
          onClick={logout}
          className="group flex w-full items-center rounded-lg px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <span className="mr-3 text-lg">🚪</span>
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default Navigation;