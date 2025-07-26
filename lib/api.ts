import axios from 'axios'

// Use your Railway backend URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://ao-production-83fe.up.railway.app'
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add request interceptor for auth (integrate with your Appwrite auth)
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token if available (from Appwrite)
    const token = localStorage.getItem('appwrite-token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error)
    
    // Handle specific error cases
    if (error.response?.status === 401) {
      // Redirect to login if unauthorized
      window.location.href = '/login'
    }
    
    return Promise.reject(error)
  }
)

// Chat API functions
export const chatAPI = {
  sendMessage: async (message: string, conversationId?: string) => {
    const response = await apiClient.post('/api/chat/messages', { 
      message,
      conversationId 
    })
    return response.data
  },
  
  getHistory: async (conversationId: string) => {
    const response = await apiClient.get(`/api/chat/conversations/${conversationId}`)
    return response.data
  },
  
  uploadFile: async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    
    const response = await apiClient.post('/api/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  }
}

export const stripeAPI = {
  createCustomer: async (userData: { email: string; userId: string; name: string }) => {
    console.log('🔄 Creating Stripe customer:', userData.email);
    const response = await apiClient.post('/create-customer', userData);
    return response.data;
  },

  createPortalSession: async (customerId: string, returnUrl?: string) => {
    console.log('🏢 Creating portal session for customer:', customerId);
    const response = await apiClient.post('/create-portal-session', {
      customerId,
      returnUrl: returnUrl || `${window.location.origin}/billing`
    });
    return response.data;
  },

  createCheckoutSession: async (data: {
    priceId: string;
    customerId: string;
    successUrl: string;
    cancelUrl: string;
  }) => {
    console.log('🛒 Creating checkout session:', data.priceId);
    const response = await apiClient.post('/create-checkout-session', data);
    return response.data;
  },

  getCustomerStatus: async (customerId: string) => {
    console.log('📋 Getting customer status:', customerId);
    const response = await apiClient.get(`/customer-status/${customerId}`);
    return response.data;
  },

  // ADD these functions to your existing stripeAPI object:

// ✅ NEW: Verify checkout completion with webhook validation
verifyCheckoutCompletion: async (sessionId: string) => {
  console.log('🔍 Verifying checkout completion:', sessionId);
  const response = await apiClient.post('/verify-checkout-completion', { sessionId });
  return response.data;
},

// ✅ NEW: Get user plan and limits
getUserPlan: async (userId: string) => {
  console.log('📊 Getting user plan:', userId);
  const response = await apiClient.get(`/user-plan/${userId}`);
  return response.data;
},

// ✅ NEW: Get user usage data
getUserUsage: async (userId: string) => {
  console.log('📈 Getting user usage:', userId);
  const response = await apiClient.get(`/user-usage/${userId}`);
  return response.data;
},

// ✅ NEW: Track usage
trackUsage: async (data: {
  userId: string;
  feature: string;
  amount?: number;
  metadata?: any;
}) => {
  console.log('📊 Tracking usage:', data.feature);
  const response = await apiClient.post('/track-usage', data);
  return response.data;
}
};

// Usage tracking API
export const usageAPI = {
  trackFeatureUsage: async (userId: string, feature: string, amount: number = 1) => {
    return await stripeAPI.trackUsage({ userId, feature, amount });
  },

  getUserUsage: async (userId: string) => {
    return await stripeAPI.getUserUsage(userId);
  },

  getUserLimits: async (userId: string) => {
    return await stripeAPI.getUserPlan(userId);
  }
};