export const STRIPE_CONFIG = {
  publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'https://ao-production-83fe.up.railway.app'
};

// Add a validation function
export const validateStripeConfig = () => {
  if (!STRIPE_CONFIG.publishableKey) {
    console.warn('⚠️ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY not set');
    return false;
  }
  return true;
};

export const SUBSCRIPTION_PLANS = {
  free: {
    id: 'free',
    name: 'Free Plan',
    price: 0,
     priceId: null,
    description: 'Perfect for getting started',
    features: [
      '5 events per month',
      '10 event joins per month',
      'Basic activity creation',
      'Community access'
    ],
    limits: {
      eventsCreated: 5,
      eventsJoined: 10,
      activitiesCreated: -1
    }
  },
  pro: {
    id: 'pro',
    name: 'Pro Plan',
    price: 2.99,
    description: 'For active adventurers',
    priceId: 'price_1RocpwLbsXxlWE2gHa0XJU7V',
    features: [
      'Unlimited events',
      'Unlimited event joins', 
      'Unlimited activities',
      'Priority support',
      'Advanced analytics'
    ],
    limits: {
      eventsCreated: -1,
      eventsJoined: -1,
      activitiesCreated: -1
    }
  },
  pro_plus: {
    id: 'pro_plus',
    name: 'Pro+ Plan',
    price: 9.99,
    description: 'For adventure organizers',
    priceId: 'price_1Rocn1LbsXxlWE2gfKr8KPEx',
    features: [
      'Everything in Pro',
      'AI-powered recommendations',
      'Advanced event management',
      'White-label options',
      'Dedicated support'
    ],
    limits: {
      eventsCreated: -1,
      eventsJoined: -1,
      activitiesCreated: -1
    }
  }
};
