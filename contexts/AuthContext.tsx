// contexts/AuthContext.tsx - Real Appwrite integration
import React, { createContext, useContext, useState, useEffect } from 'react';
import { account, databases, DATABASE_ID, USER_PROFILES_COLLECTION_ID, Query } from '../lib/appwrite';

interface User {
   $id: string;
  name?: string;
  email: string;
  location?: {
    address: string;
    latitude: number;
    longitude: number;
  } | string;
  searchRadius?: number;
  disciplines?: string[];
  emailVerification?: boolean;
  phoneVerification?: boolean;
  createdAt?: string;
  avatar?: string;
  bio?: string;
  subscriptionTier?: string;    // ← MOVE HERE (top level)
  subscriptionStatus?: string;  // ← MOVE HERE (top level)
  stats?: {
    activitiesCreated: number;
    eventsHosted: number;
    eventsJoined: number;
  };
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
  // ✅ ADD THESE EMAIL VERIFICATION FUNCTIONS:
  sendEmailVerification: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Get user profile from Appwrite database
  // In your contexts/AuthContext.tsx, find the getUserProfile function and UPDATE it:

// In your AuthContext, update the getUserProfile function to include stats fields:

const getUserProfile = async (userId: string) => {
  try {
    if (!USER_PROFILES_COLLECTION_ID) {
      console.log('⚠️ User profiles collection not configured');
      return null;
    }

    const profiles = await databases.listDocuments(
      DATABASE_ID,
      USER_PROFILES_COLLECTION_ID,
      [Query.equal('userId', userId)]
    );

    if (profiles.documents.length === 0) {
      console.log('⚠️ No profile found for user:', userId);
      return null;
    }

    const profile = profiles.documents[0] as any;
    console.log('✅ Profile found for user:', userId);

    // ✅ ADD DEBUG LOG TO SEE ALL PROFILE FIELDS:
    console.log('🔍 DEBUG - All profile fields:', Object.keys(profile));
    console.log('🔍 DEBUG - Stats fields:', {
      activitiesCreated: profile.activitiesCreated,
      eventsCreated: profile.eventsCreated,
      eventsJoined: profile.eventsJoined,
      activitiesCount: profile.activitiesCount,
      eventsCount: profile.eventsCount
    });

    return {
      $id: profile.$id,
      userId: profile.userId,
      name: profile.name || '',
      email: profile.email || '',
      disciplines: Array.isArray(profile.disciplines) ? profile.disciplines : [],
      location: profile.location || '',
      searchRadius: profile.searchRadius ? parseInt(profile.searchRadius.toString()) : 50,
      emailVerification: profile.emailVerification || false,
      phoneVerification: profile.phoneVerification || false,
      createdAt: profile.createdAt,
      subscriptionTier: profile.subscriptionTier || 'free',
      subscriptionStatus: profile.subscriptionStatus || 'active',
      
      // ✅ ADD ALL POSSIBLE STATS FIELDS FROM DATABASE:
      activitiesCreated: profile.activitiesCreated || 0,
      eventsCreated: profile.eventsCreated || 0,
      eventsJoined: profile.eventsJoined || 0,
      activitiesCount: profile.activitiesCount || 0,  // Alternative field name
      eventsCount: profile.eventsCount || 0,          // Alternative field name
      commentsCount: profile.commentsCount || 0,
      activitiesViewed: profile.activitiesViewed || 0
    };
  } catch (error) {
    console.error('❌ Error fetching user profile:', error);
    return null;
  }
};

  // Check current session on app load
  useEffect(() => {
    const checkSession = async () => {
      try {
        console.log('🔍 Checking for existing session...');
        const session = await account.get();
        console.log('✅ Found active session:', session.email);

        // Get user profile from database
        const profile = await getUserProfile(session.$id);
        
        if (profile) {
          setUser({
             $id: session.$id,
  name: profile.name || session.name,
  email: session.email,
  location: profile.location || 'Sydney, NSW, Australia',
  searchRadius: profile.searchRadius || 50,
  disciplines: profile.disciplines || ['hiking', 'climbing', 'cycling'],
  emailVerification: session.emailVerification,
  phoneVerification: profile.phoneVerification || false,
  createdAt: profile.createdAt,
  subscriptionTier: profile.subscriptionTier || 'free',        // ← ADD
  subscriptionStatus: profile.subscriptionStatus || 'active',  // ← ADD
  stats: {
    activitiesCreated: profile.activitiesCreated || 0,    // ✅ Real data
    eventsHosted: profile.eventsCreated || 0,             // ✅ Real data  
    eventsJoined: profile.eventsJoined || 0               // ✅ Real data
  }
          });
        } else {
          // Use basic session data if no profile
          setUser({
            $id: session.$id,
            name: session.name,
            email: session.email,
            location: 'Sydney, NSW, Australia',
            searchRadius: 50,
            disciplines: ['hiking', 'climbing', 'cycling'],
            emailVerification: session.emailVerification,
            phoneVerification: false,
            createdAt: session.registration,
            stats: {
              activitiesCreated: 0,
              eventsHosted: 0,
              eventsJoined: 0
            }
          });
        }
      } catch (error) {
        console.log('ℹ️ No active session found');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

 const login = async (email: string, password: string, isRetry: boolean = false) => {
  setLoading(true);
  try {
    console.log('🔐 Attempting login for:', email);
    
    // Create session with Appwrite
    await account.createEmailPasswordSession(email, password);
    const session = await account.get();
    console.log('✅ Login successful:', session.email);

    // Get user profile (keep your existing profile logic here)
    const profile = await getUserProfile(session.$id);
    
    if (profile) {
      setUser({
        $id: session.$id,
        name: profile.name || session.name,
        email: session.email,
        location: profile.location || 'Sydney, NSW, Australia',
        searchRadius: profile.searchRadius || 50,
        disciplines: profile.disciplines || ['hiking', 'climbing', 'cycling'],
        emailVerification: session.emailVerification,
        phoneVerification: profile.phoneVerification || false,
        createdAt: profile.createdAt,
        stats: {
          activitiesCreated: profile.activitiesCreated || 0,
          eventsHosted: profile.eventsCreated || 0,
          eventsJoined: profile.eventsJoined || 0
        }
      });
    } else {
      // Fallback to session data
      setUser({
        $id: session.$id,
        name: session.name,
        email: session.email,
        location: 'Sydney, NSW, Australia',
        searchRadius: 50,
        disciplines: ['hiking', 'climbing', 'cycling'],
        emailVerification: session.emailVerification,
        phoneVerification: false,
        createdAt: session.registration,
        stats: {
          activitiesCreated: 0,
          eventsHosted: 0,
          eventsJoined: 0
        }
      });
    }
  } catch (error: any) {
    console.error('❌ Login failed:', error);
    
    // Extract error message safely
    const errorMessage = error?.message || error?.toString() || 'Unknown error';
    const errorCode = error?.code || error?.type || '';
    
    // Handle specific error cases with user-friendly messages
    
    // 1. Rate limiting
    if (errorMessage.includes('Rate limit') || errorMessage.includes('rate limit') || errorCode === 'rate_limit_exceeded') {
      throw new Error('Too many login attempts. Please wait a few minutes before trying again.');
    }
    
    // 2. Invalid credentials
    if (errorMessage.includes('Invalid credentials') || 
        errorMessage.includes('invalid_credentials') ||
        errorMessage.includes('user with the requested ID could not be found') ||
        errorMessage.includes('Invalid email or password') ||
        errorCode === 'user_invalid_credentials') {
      throw new Error('Invalid email or password. Please check your credentials and try again.');
    }
    
    // 3. Account not found
    if (errorMessage.includes('user not found') || errorMessage.includes('User not found')) {
      throw new Error('No account found with this email address. Please check your email or sign up for a new account.');
    }
    
    // 4. Account locked/disabled
    if (errorMessage.includes('account disabled') || errorMessage.includes('user_disabled')) {
      throw new Error('Your account has been disabled. Please contact support for assistance.');
    }
    
    // 5. Email not verified (if required)
    if (errorMessage.includes('email not verified') || errorMessage.includes('user_email_not_verified')) {
      throw new Error('Please verify your email address before logging in. Check your inbox for a verification link.');
    }
    
    // 6. Session conflict - auto-logout and retry
    if ((errorMessage.includes('session is active') || 
         errorMessage.includes('session is prohibited') ||
         errorMessage.includes('Creation of a session is prohibited')) && !isRetry) {
      try {
        console.log('🔄 Session conflict detected - auto-logout and retry...');
        
        // Logout existing session
        await account.deleteSession('current');
        console.log('✅ Logged out existing session, retrying login...');
        
        // Retry login (prevent infinite loop with isRetry flag)
        return await login(email, password, true);
        
      } catch (retryError: any) {
        console.error('❌ Retry failed:', retryError);
        throw new Error('You were already logged in with a different account. Please refresh the page and try again.');
      }
    }
    
    // 7. Network/connection errors
    if (errorMessage.includes('Failed to fetch') || 
        errorMessage.includes('Network error') ||
        errorMessage.includes('ERR_NETWORK') ||
        errorCode === 'network_error') {
      throw new Error('Network connection error. Please check your internet connection and try again.');
    }
    
    // 8. Server errors
    if (errorMessage.includes('Internal server error') || 
        errorMessage.includes('500') ||
        errorCode === 'internal_server_error') {
      throw new Error('Server error. Please try again in a few minutes or contact support if the problem persists.');
    }
    
    // 9. Service unavailable
    if (errorMessage.includes('Service unavailable') || 
        errorMessage.includes('503') ||
        errorCode === 'service_unavailable') {
      throw new Error('Service is temporarily unavailable. Please try again in a few minutes.');
    }
    
    // 10. Generic fallback with helpful message
    console.error('🔍 Unhandled login error:', {
      message: errorMessage,
      code: errorCode,
      fullError: error
    });
    
    throw new Error('Login failed. Please check your credentials and try again. If the problem persists, please contact support.');
    
  } finally {
    setLoading(false);
  }
};

  const signup = async (email: string, password: string, name: string) => {
    setLoading(true);
    try {
      console.log('📝 Creating new account for:', email);
      
      // Create account with Appwrite
      const authUser = await account.create('unique()', email, password, name);
      console.log('✅ Account created:', authUser.$id);
      
      // Create session
      await account.createEmailPasswordSession(email, password);
      const session = await account.get();
      
      // Try to create profile in database
      if (USER_PROFILES_COLLECTION_ID) {
        try {
          const profileData = {
            userId: authUser.$id,
            name: name.trim(),
            email: email,
            disciplines: ['hiking'], // Default
            provider: 'email',
            profileComplete: true,
            isPublicProfile: false,
            location: '',
            searchRadius: '50',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          
          await databases.createDocument(
            DATABASE_ID,
            USER_PROFILES_COLLECTION_ID,
            'unique()',
            profileData
          );
          console.log('✅ User profile created');
        } catch (profileError) {
          console.warn('⚠️ Could not create profile:', profileError);
        }
      }

      setUser({
        $id: session.$id,
        name: session.name,
        email: session.email,
        location: 'Sydney, NSW, Australia',
        searchRadius: 50,
        disciplines: ['hiking'],
        emailVerification: session.emailVerification,
        phoneVerification: false,
        createdAt: session.registration,
        stats: {
          activitiesCreated: 0,
          eventsHosted: 0,
          eventsJoined: 0
        }
      });
    } catch (error) {
      console.error('❌ Signup failed:', error);
      throw new Error('Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };


  const sendEmailVerification = async (): Promise<void> => {
  if (!user) {
    throw new Error('No user logged in');
  }

  try {
    const redirectUrl = process.env.NODE_ENV === 'production' 
      ? 'https://your-domain.com/verify-email'
      : 'http://localhost:3000/verify-email';
      
    await account.createVerification(redirectUrl);
    console.log('✅ Email verification sent');
    
  } catch (error: any) {
    console.error('❌ Failed to send email verification:', error);
    
    if (error?.code === 409) {
      throw new Error('Email verification already sent. Please check your inbox.');
    } else if (error?.code === 429) {
      throw new Error('Too many requests. Please wait a moment before trying again.');
    } else if (error?.code === 400) {
      throw new Error('Invalid email address. Please check and try again.');
    } else {
      throw new Error(`Failed to send verification email: ${error?.message || 'Unknown error'}`);
    }
  }
};

// Add this function to refresh user data after verification
const refreshUser = async (): Promise<void> => {
  try {
    const session = await account.get();
    
    // Fetch updated profile
    const profile = await getUserProfile(session.$id);

    if (profile) {
      setUser({
        $id: session.$id,
        name: profile.name || session.name,
        email: session.email,
        emailVerification: session.emailVerification, // This will be updated
        location: profile.location || 'Sydney, NSW, Australia',
        searchRadius: profile.searchRadius || 50,
        disciplines: profile.disciplines || ['hiking', 'climbing', 'cycling'],
        phoneVerification: profile.phoneVerification || false,
        createdAt: profile.createdAt,
        subscriptionTier: profile.subscriptionTier || 'free',
        subscriptionStatus: profile.subscriptionStatus || 'active',
        stats: {
          activitiesCreated: profile.activitiesCreated || 0,
          eventsHosted: profile.eventsCreated || 0,
          eventsJoined: profile.eventsJoined || 0
        }
      });
    } else {
      // Fallback to session data
      setUser(prev => prev ? {
        ...prev,
        emailVerification: session.emailVerification
      } : null);
    }
  } catch (error) {
    console.error('Failed to refresh user data:', error);
  }
};
  const logout = async () => {
    try {
      await account.deleteSession('current');
      setUser(null);
      console.log('✅ Logged out successfully');
    } catch (error) {
      console.error('❌ Logout error:', error);
      setUser(null); // Force logout even if API fails
    }
  };

  const value: AuthContextType = {
  user,
  login,
  logout,
  loading,
  signup,
    sendEmailVerification,
  refreshUser
};

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};