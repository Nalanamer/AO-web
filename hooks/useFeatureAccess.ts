// hooks/useFeatureAccess.ts - Web feature access with subscription limits
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { usageAPI } from '@/lib/api';

interface FeatureLimits {
  eventsCreated: number;
  eventsJoined: number;
  activitiesCreated: number;
  activitiesViewed: number;
  advancedFilters: number;
  exportData: number;
  prioritySupport: number;
}

interface UsageData {
  eventsCreated: number;
  eventsJoined: number;
  activitiesCreated: number;
  activitiesViewed: number;
  advancedFilters: number;
  exportData: number;
}

interface UseFeatureAccessReturn {
  canUseFeature: (feature: string) => boolean;
  getRemainingUsage: (feature: string) => string;
  getUsagePercentage: (feature: string) => number;
  trackFeatureUsage: (feature: string, amount?: number) => Promise<boolean>;
  currentUsage: UsageData;
  featureLimits: FeatureLimits;
  loading: boolean;
  refreshUsage: () => Promise<void>;
  isFeatureAtLimit: (feature: string) => boolean;
  getUpgradeMessage: (feature: string) => string;
  resetInfo: {
    resetDate?: string;
    resetDateFormatted?: string;
    daysUntilReset?: number;
  };
}

// Feature limits by plan tier
const PLAN_LIMITS: Record<string, FeatureLimits> = {
  free: {
    eventsCreated: 5,
    eventsJoined: 10,
    activitiesCreated: -1, // Unlimited
    activitiesViewed: -1,
    advancedFilters: 0,
    exportData: 0,
    prioritySupport: 0
  },
  pro: {
    eventsCreated: -1, // Unlimited
    eventsJoined: -1,
    activitiesCreated: -1,
    activitiesViewed: -1,
    advancedFilters: 50,
    exportData: 10,
    prioritySupport: -1
  },
  pro_plus: {
    eventsCreated: -1, // Unlimited
    eventsJoined: -1,
    activitiesCreated: -1,
    activitiesViewed: -1,
    advancedFilters: -1,
    exportData: -1,
    prioritySupport: -1
  }
};

const FEATURE_NAMES: Record<string, string> = {
  eventsCreated: 'Event Creation',
  eventsJoined: 'Event Participation',
  activitiesCreated: 'Activity Creation',
  activitiesViewed: 'Activity Viewing',
  advancedFilters: 'Advanced Filters',
  exportData: 'Data Export',
  prioritySupport: 'Priority Support'
};

const UPGRADE_MESSAGES: Record<string, string> = {
  eventsCreated: 'Upgrade to Pro to create unlimited events and organize your community!',
  eventsJoined: 'Upgrade to Pro to join unlimited events and expand your adventures!',
  advancedFilters: 'Upgrade to Pro+ for unlimited advanced search and filtering capabilities!',
  exportData: 'Upgrade to Pro+ for unlimited data export and advanced analytics!',
  prioritySupport: 'Upgrade to Pro for priority support and faster response times!'
};

export const useFeatureAccess = (): UseFeatureAccessReturn => {
  const { user } = useAuth();
  const { currentPlan } = useSubscription();
  const [currentUsage, setCurrentUsage] = useState<UsageData>({
    eventsCreated: 0,
    eventsJoined: 0,
    activitiesCreated: 0,
    activitiesViewed: 0,
    advancedFilters: 0,
    exportData: 0
  });
  const [loading, setLoading] = useState(false);
  const [resetInfo, setResetInfo] = useState({});


  // Get feature limits for current plan
  const featureLimits = PLAN_LIMITS[currentPlan] || PLAN_LIMITS.free;

  // Load current usage
  // Load current usage
const loadUsage = useCallback(async () => {
  if (!user?.$id) return;

  setLoading(true);
  try {
    const response = await usageAPI.getUserUsage(user.$id);
    if (response.usage) {
      setCurrentUsage({
        eventsCreated: response.usage.eventsCreated || 0,
        eventsJoined: response.usage.eventsJoined || 0,
        activitiesCreated: response.usage.activitiesCreated || 0,
        activitiesViewed: response.usage.activitiesViewed || 0,
        advancedFilters: response.usage.advancedFiltersUsed || 0,
        exportData: response.usage.exportsGenerated || 0
      });
      
      // ✅ ADD: Store reset date info
      setResetInfo({
        resetDate: response.resetDate,
        resetDateFormatted: response.resetDateFormatted,
        daysUntilReset: response.daysUntilReset
      });
    }
  } catch (error) {
    console.error('❌ Error loading usage:', error);
  } finally {
    setLoading(false);
  }
}, [user?.$id]);

  // Check if user can use a feature
  const canUseFeature = useCallback((feature: string): boolean => {
    const limit = featureLimits[feature as keyof FeatureLimits];
    const usage = currentUsage[feature as keyof UsageData];
    
    // Unlimited access
    if (limit === -1) return true;
    
    // No access to feature
    if (limit === 0) return false;
    
    // Check against limit
    return usage < limit;
  }, [featureLimits, currentUsage]);

  // Check if feature is at limit
  const isFeatureAtLimit = useCallback((feature: string): boolean => {
    const limit = featureLimits[feature as keyof FeatureLimits];
    const usage = currentUsage[feature as keyof UsageData];
    
    if (limit === -1) return false; // Unlimited
    if (limit === 0) return true; // No access
    return usage >= limit;
  }, [featureLimits, currentUsage]);

  // Get remaining usage for a feature
  const getRemainingUsage = useCallback((feature: string): string => {
    const limit = featureLimits[feature as keyof FeatureLimits];
    const usage = currentUsage[feature as keyof UsageData];
    
    if (limit === -1) return 'Unlimited';
    if (limit === 0) return 'Not Available';
    return `${Math.max(0, limit - usage)}`;
  }, [featureLimits, currentUsage]);

  // Get usage percentage for progress bars
  const getUsagePercentage = useCallback((feature: string): number => {
    const limit = featureLimits[feature as keyof FeatureLimits];
    const usage = currentUsage[feature as keyof UsageData];
    
    if (limit === -1 || limit === 0) return 0;
    return Math.min((usage / limit) * 100, 100);
  }, [featureLimits, currentUsage]);

  // Track feature usage
  const trackFeatureUsage = useCallback(async (feature: string, amount: number = 1): Promise<boolean> => {
  if (!user?.$id) return false;

  // Check if user can use feature before tracking
  if (!canUseFeature(feature)) {
    console.warn(`⚠️ Feature ${feature} is at limit or not available`);
    return false;
  }

  try {
    console.log(`📊 Tracking usage: ${feature} (+${amount})`);
    
    // ✅ ADD THIS: Actually call the backend API
    const response = await usageAPI.trackFeatureUsage(user.$id, feature, amount);
    
    if (response.success) {
      // Update local usage
      setCurrentUsage(prev => ({
        ...prev,
        [feature]: (prev[feature as keyof UsageData] || 0) + amount
      }));
      
      console.log(`✅ Usage tracked: ${feature} = ${(currentUsage[feature as keyof UsageData] || 0) + amount}`);
      return true;
    } else {
      console.error('❌ Usage tracking failed:', response.error);
      return false;
    }
  } catch (error) {
    console.error('❌ Error tracking usage:', error);
    return false;
  }
}, [user?.$id, canUseFeature, currentUsage]);

  // Get upgrade message for blocked features
  const getUpgradeMessage = useCallback((feature: string): string => {
    return UPGRADE_MESSAGES[feature] || `Upgrade your plan to access ${FEATURE_NAMES[feature]}!`;
  }, []);

  // Refresh usage data
  const refreshUsage = useCallback(async () => {
    await loadUsage();
  }, [loadUsage]);

  // Load usage on mount and plan change
  useEffect(() => {
    if (user) {
      loadUsage();
    }
  }, [user, currentPlan, loadUsage]);

  return {
    canUseFeature,
    getRemainingUsage,
    getUsagePercentage,
    trackFeatureUsage,
    currentUsage,
    featureLimits,
    loading,
    refreshUsage,
    isFeatureAtLimit,
    getUpgradeMessage,
    resetInfo  
  };
};