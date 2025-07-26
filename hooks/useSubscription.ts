// hooks/useSubscription.ts - Web subscription hook with mobile-like verification
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { stripeAPI } from '@/lib/api';
import { databases, DATABASE_ID, Query } from '@/lib/appwrite';

interface SubscriptionPlan {
  id: string;
  name: string;
  priceId: string;
  price: number;
  features: string[];
}

export const SUBSCRIPTION_PLANS: Record<string, SubscriptionPlan> = {
  free: {
    id: 'free',
    name: 'Free',
    priceId: '',
    price: 0,
    features: ['5 events per month', 'Basic features']
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID || '',
    price: 4.99,
    features: ['Unlimited events', 'Advanced features', 'Priority support']
  },
  pro_plus: {
    id: 'pro_plus',
    name: 'Pro+',
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PLUS_PRICE_ID || '',
    price: 9.99,
    features: ['Everything in Pro', 'Advanced analytics', 'API access']
  }
};

interface UseSubscriptionReturn {
  currentPlan: string;
  subscription: any;
  loading: boolean;
  error: string | null;
  openBillingPortal: () => Promise<{ success: boolean; error?: string }>;
  subscribeToPlan: (planId: string) => Promise<{ success: boolean; error?: string }>;
  refreshSubscription: () => Promise<void>;
  verifyCheckoutCompletion: (sessionId: string) => Promise<boolean>;
}

export const useSubscription = (): UseSubscriptionReturn => {
  const [currentPlan, setCurrentPlan] = useState<string>('free');
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Load subscription data from Appwrite
  const loadSubscription = async () => {
    if (!user || !databases) return;

    try {
      setLoading(true);
      setError(null);

      const response = await databases.listDocuments(
        DATABASE_ID,
        'user_subscriptions',
        [Query.equal('userId', user.$id)]
      );

      if (response.documents.length > 0) {
        const sub = response.documents[0];
        setSubscription(sub);
        setCurrentPlan(sub.subscriptionTier || 'free');
        console.log('✅ Subscription loaded:', sub.subscriptionTier);
      } else {
        setSubscription(null);
        setCurrentPlan('free');
        console.log('ℹ️ No subscription found, defaulting to free');
      }
    } catch (err: any) {
      console.error('❌ Error loading subscription:', err);
      setError(err.message);
      setCurrentPlan('free');
    } finally {
      setLoading(false);
    }
  };

  // Verify checkout completion with webhook validation
  const verifyCheckoutCompletion = async (sessionId: string): Promise<boolean> => {
    try {
      console.log('🔍 Verifying checkout completion:', sessionId);
      
      // Wait for webhook processing
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const response = await stripeAPI.verifyCheckoutCompletion(sessionId);
      
      if (response.webhookProcessed && response.subscription) {
        // Update local state with webhook-processed subscription
        setSubscription(response.subscription);
        setCurrentPlan(response.subscription.subscriptionTier);
        console.log('✅ Webhook verification successful');
        return true;
      } else {
        console.log('⚠️ Webhook verification failed');
        return false;
      }
    } catch (err: any) {
      console.error('❌ Checkout verification error:', err);
      return false;
    }
  };

  // Open billing portal
  const openBillingPortal = async (): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      return { success: false, error: 'No authenticated user' };
    }

    setLoading(true);
    try {
      // Get or create customer ID
      let customerId = (user as any).stripeCustomerId;
      
      if (!customerId) {
        const customerData = await stripeAPI.createCustomer({
          email: user.email || '',
          userId: user.$id || '',
          name: (user as any).name || user.email || 'Unknown User'
        });
        customerId = customerData.customerId;
      }

      const portalData = await stripeAPI.createPortalSession(
        customerId,
        `${window.location.origin}/billing`
      );

      window.location.href = portalData.url;
      return { success: true };
    } catch (error: any) {
      console.error('Failed to open billing portal:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || 'Failed to open billing portal' 
      };
    } finally {
      setLoading(false);
    }
  };

  // Subscribe to plan with webhook verification
  const subscribeToPlan = async (planId: string): Promise<{ success: boolean; error?: string }> => {
    const plan = SUBSCRIPTION_PLANS[planId];
    if (!plan || plan.id === 'free' || !plan.priceId) {
      return { success: false, error: 'Invalid plan selected' };
    }

    if (!user) {
      return { success: false, error: 'No authenticated user' };
    }

    setLoading(true);
    try {
      // Get or create customer ID
      let customerId = (user as any).stripeCustomerId;
      
      if (!customerId) {
        const customerData = await stripeAPI.createCustomer({
          email: user.email || '',
          userId: user.$id || '',
          name: (user as any).name || user.email || 'Unknown User'
        });
        customerId = customerData.customerId;
      }

      // Create checkout session
      const checkoutData = await stripeAPI.createCheckoutSession({
        priceId: plan.priceId,
        customerId: customerId,
        successUrl: `${window.location.origin}/billing?session_id={CHECKOUT_SESSION_ID}&success=true`,
        cancelUrl: `${window.location.origin}/billing?canceled=true`
      });

      // Store session ID for verification
      const sessionId = checkoutData.sessionId;

      // Redirect to checkout
      window.location.href = checkoutData.url;
      
      return { 
        success: true
      };
    } catch (error: any) {
      console.error('Failed to subscribe:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || 'Failed to start subscription' 
      };
    } finally {
      setLoading(false);
    }
  };

  // Refresh subscription data
  const refreshSubscription = async () => {
    await loadSubscription();
  };

  // Load subscription on mount and user change
  useEffect(() => {
    if (user) {
      loadSubscription();
    }
  }, [user]);

  return {
    currentPlan,
    subscription,
    loading,
    error,
    openBillingPortal,
    subscribeToPlan,
    refreshSubscription,
    verifyCheckoutCompletion
  };
};