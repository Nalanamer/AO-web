import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import MainLayout from '../../components/layout/MainLayout';
import { useAuth } from '../../contexts/AuthContext';
import { useStripePortal } from '../../hooks/useStripePortal';
import { SUBSCRIPTION_PLANS } from '../../lib/stripe';

const BillingPage: React.FC = () => {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { openBillingPortal, subscribeToPlan, loading } = useStripePortal();
  const [currentPlan, setCurrentPlan] = useState('free');

  useEffect(() => {
    // Handle return from Stripe
    const { success, canceled } = router.query;
    
    if (success) {
      // Show success message
      setTimeout(() => {
        alert('🎉 Subscription activated successfully! Welcome to your new plan!');
      }, 1000);
    } else if (canceled) {
      console.log('User canceled subscription');
    }

    // Get current plan from user
    if (user) {
         console.log('🔍 DEBUG - Full user object:', user);
      console.log('🔍 DEBUG - User subscriptionTier:', (user as any).subscriptionTier);
      console.log('🔍 DEBUG - User subscriptionStatus:', (user as any).subscriptionStatus);
      
      setCurrentPlan((user as any).subscriptionTier || 'free');
    }
  }, [router.query, user]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/billing');
    }
  }, [user, authLoading, router]);

  const handlePlanSelect = async (planId: string) => {
    if (planId === 'free') {
      // For downgrading to free, open portal to cancel
      await openBillingPortal();
    } else if (planId === currentPlan) {
      // If selecting current plan, open portal to manage
      await openBillingPortal();
    } else {
      // For upgrading, start subscription flow
      const result = await subscribeToPlan(planId);
      if (!result.success) {
        alert(result.error || 'Failed to start subscription');
      }
    }
  };

  const handleManageBilling = async () => {
    const result = await openBillingPortal();
    if (!result.success) {
      alert(result.error || 'Failed to open billing portal');
    }
  };

  

  if (authLoading) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
        </div>
      </MainLayout>
    );
  }

  if (!user) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Please log in</h1>
            <button
              onClick={() => router.push('/login')}
              className="bg-emerald-500 text-white px-6 py-3 rounded-lg hover:bg-emerald-600"
            >
              Go to Login
            </button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Billing & Subscription
          </h1>
          <p className="text-lg text-gray-600">
            Manage your subscription and billing preferences
          </p>
        </div>

        {/* Current Plan Info */}
        {currentPlan !== 'free' && (
          <div className="mb-8 p-6 bg-emerald-50 border border-emerald-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-emerald-900">
                  Current Plan: {SUBSCRIPTION_PLANS[currentPlan as keyof typeof SUBSCRIPTION_PLANS]?.name}
                </h3>
                <p className="text-emerald-700">
                  Manage your subscription, view invoices, and update payment methods
                </p>
              </div>
              <button
                onClick={handleManageBilling}
                disabled={loading}
                className="bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Manage Billing'}
              </button>
            </div>
          </div>
        )}

        {/* Plan Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          {Object.values(SUBSCRIPTION_PLANS).map((plan) => (
            <div
              key={plan.id}
              className={`
                border rounded-lg p-6 relative
                ${currentPlan === plan.id ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200'}
                ${plan.id === 'pro' ? 'ring-2 ring-emerald-500' : ''}
              `}
            >
              {plan.id === 'pro' && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-emerald-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center">
                <h3 className="text-xl font-semibold text-gray-900">{plan.name}</h3>
                <div className="mt-2">
                  {plan.id === 'free' ? (
                    <span className="text-3xl font-bold text-gray-900">Free</span>
                  ) : (
                    <div>
                      <span className="text-3xl font-bold text-gray-900">${plan.price}</span>
                      <span className="text-gray-500">/month</span>
                    </div>
                  )}
                </div>
                <p className="mt-2 text-gray-600">{plan.description}</p>
              </div>

              <ul className="mt-6 space-y-3">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-8">
                {currentPlan === plan.id ? (
                  <div className="w-full py-3 px-4 text-center text-emerald-600 bg-emerald-100 rounded-lg font-medium">
                    Current Plan
                  </div>
                ) : (
                  <button
                    onClick={() => handlePlanSelect(plan.id)}
                    disabled={loading}
                    className={`
                      w-full py-3 px-4 rounded-lg font-medium transition-colors
                      ${plan.id === 'free' 
                        ? 'bg-gray-100 text-gray-800 hover:bg-gray-200' 
                        : 'bg-emerald-600 text-white hover:bg-emerald-700'
                      }
                      ${loading ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                  >
                    {loading ? 'Processing...' : (plan.id === 'free' ? 'Downgrade' : 'Upgrade')}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="text-center">
          <p className="text-gray-600">
            Questions about billing? {' '}
            <button 
              onClick={handleManageBilling}
              className="text-emerald-600 hover:text-emerald-700 font-medium underline"
            >
              Visit your billing portal
            </button>
            {' '} for invoices, payment methods, and more.
          </p>
        </div>
      </div>
    </MainLayout>
  );
};

export default BillingPage;
