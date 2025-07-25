import React from 'react';
import { useStripePortal } from '../hooks/useStripePortal';
import { useAuth } from '../contexts/AuthContext';

const StripeWebTest: React.FC = () => {
  const { openBillingPortal, subscribeToPlan, loading } = useStripePortal();
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="p-6 border rounded-lg bg-gray-50">
        <p className="text-gray-600">Please log in to test Stripe integration</p>
      </div>
    );
  }

  const handlePortalTest = async () => {
    const result = await openBillingPortal();
    if (!result.success) {
      alert(`Error: ${result.error}`);
    }
  };

  const handleSubscribeTest = async (planId: string) => {
    const result = await subscribeToPlan(planId);
    if (!result.success) {
      alert(`Error: ${result.error}`);
    }
  };

  return (
    <div className="p-6 border rounded-lg bg-white shadow-sm">
      <h3 className="text-lg font-semibold mb-4">🧪 Test Stripe Web Integration</h3>
      
      <div className="space-y-3">
        <button
          onClick={handlePortalTest}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Loading...' : '🏢 Open Billing Portal'}
        </button>
        
        <button
          onClick={() => handleSubscribeTest('pro')}
          disabled={loading}
          className="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Loading...' : '💳 Subscribe to Pro ($9.99/mo)'}
        </button>
        
        <button
          onClick={() => handleSubscribeTest('pro_plus')}
          disabled={loading}
          className="w-full bg-purple-600 text-white py-2 px-4 rounded hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Loading...' : '⭐ Subscribe to Pro+ ($19.99/mo)'}
        </button>
      </div>
      
      <div className="mt-4 p-3 bg-gray-50 rounded text-sm">
        <p><strong>User:</strong> {user.email}</p>
        <p><strong>User ID:</strong> {user.$id}</p>
        <p><strong>Current Plan:</strong> {(user as any).subscriptionTier || 'free'}</p>
        <p><strong>Has Stripe Customer:</strong> {(user as any).stripeCustomerId ? 'Yes' : 'No'}</p>
      </div>
      
      <div className="mt-4 text-xs text-gray-500">
        <p>🔒 This will use Stripe's test mode for safe testing</p>
        <p>📱 Your mobile app payments are completely separate and unaffected</p>
      </div>
    </div>
  );
};

export default StripeWebTest;