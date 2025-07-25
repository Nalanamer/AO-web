import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { stripeAPI } from '../lib/api';
import { SUBSCRIPTION_PLANS } from '../lib/stripe';

interface StripePortalResult {
  success: boolean;
  error?: string;
}

export const useStripePortal = () => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const openBillingPortal = async (returnUrl?: string): Promise<StripePortalResult> => {
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    setLoading(true);
    try {
      // Get or create customer ID - handle missing stripeCustomerId
      let customerId = (user as any).stripeCustomerId; // Cast to any to avoid TS error
      
      if (!customerId) {
        console.log('Creating new Stripe customer for web user');
        const customerData = await stripeAPI.createCustomer({
          email: user.email || '',
          userId: user.$id || '',
          name: (user as any).name || user.email || 'Unknown User' // Handle missing name
        });
        customerId = customerData.customerId;
      }

      // Create portal session and redirect
      const portalData = await stripeAPI.createPortalSession(customerId, returnUrl);
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

  const subscribeToPlan = async (planId: string): Promise<StripePortalResult> => {
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const plan = SUBSCRIPTION_PLANS[planId as keyof typeof SUBSCRIPTION_PLANS];
    if (!plan || plan.id === 'free' || !plan.priceId) { // Add priceId check
      return { success: false, error: 'Invalid plan selected' };
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

      // Create checkout session and redirect
      const checkoutData = await stripeAPI.createCheckoutSession({
       priceId: plan.priceId!,

        customerId: customerId,
        successUrl: `${window.location.origin}/billing?success=true`,
        cancelUrl: `${window.location.origin}/billing?canceled=true`
      });

      window.location.href = checkoutData.url;
      
      return { success: true };
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

  return {
    openBillingPortal,
    subscribeToPlan,
    loading
  };
};
