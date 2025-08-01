// components/layout/SettingsIcon.tsx
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import  CommunityService  from '@/services/useCommunities';

interface SettingsIconProps {
  className?: string;
}

const SettingsIcon: React.FC<SettingsIconProps> = ({ className = "" }) => {
  const { user } = useAuth();
  const [notificationCount, setNotificationCount] = useState(0);

  useEffect(() => {
    if (user) {
      loadNotificationCount();
      
      // Set up polling for notifications (every 30 seconds)
      const interval = setInterval(loadNotificationCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const loadNotificationCount = async () => {
    try {
      const count = await CommunityService.getPendingNotificationCount(user?.$id || '');
      setNotificationCount(count);
    } catch (error) {
      console.error('Error loading notification count:', error);
    }
  };

  return (
    <Link href="/settings" className={`relative inline-flex ${className}`}>
      <div className="p-2 text-gray-600 hover:text-gray-900 transition-colors">
        {/* Settings Icon */}
        <svg 
          width="24" 
          height="24" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="3"/>
          <path d="m12 1 1.09 3.26L16 2l-1.26 3.26L18 6l-3.26 1.09L16 10l-3.26-1.09L12 12l-1.09-3.26L8 10l1.26-3.26L6 6l3.26-1.09L8 2l3.26 1.09z"/>
        </svg>
        
        {/* Notification Badge */}
        {notificationCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
            {notificationCount > 9 ? '9+' : notificationCount}
          </span>
        )}
      </div>
    </Link>
  );
};

// Hook to use notification count in other components
export const useNotificationCount = () => {
  const { user } = useAuth();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (user) {
      const loadCount = async () => {
        try {
          const notificationCount = await CommunityService.getPendingNotificationCount(user.$id);
          setCount(notificationCount);
        } catch (error) {
          console.error('Error loading notification count:', error);
        }
      };
      
      loadCount();
      const interval = setInterval(loadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  return count;
};

export default SettingsIcon;