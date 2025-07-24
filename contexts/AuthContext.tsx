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
  stats?: {
    activitiesCreated: number;
    eventsHosted: number;
    eventsJoined: number;
  };
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>; // Add this line
  logout: () => void;
  loading: boolean;
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

      return {
        $id: profile.$id,
        userId: profile.userId,
        name: profile.name || '',
        email: profile.email || '',
        disciplines: Array.isArray(profile.disciplines) ? profile.disciplines : [],
        location: profile.location || '',
        searchRadius: profile.searchRadius ? parseInt(profile.searchRadius) : 50,
        emailVerification: true,
        phoneVerification: profile.phoneVerified || false,
        createdAt: profile.createdAt || new Date().toISOString()
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
            stats: {
              activitiesCreated: 2,
              eventsHosted: 1,
              eventsJoined: 5
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

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      console.log('🔐 Attempting login for:', email);
      
      // Create session with Appwrite
      await account.createEmailPasswordSession(email, password);
      const session = await account.get();
      console.log('✅ Login successful:', session.email);

      // Get user profile
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
            activitiesCreated: 2,
            eventsHosted: 1,
            eventsJoined: 5
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
    } catch (error) {
      console.error('❌ Login failed:', error);
      throw new Error('Invalid email or password. Please try again.');
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
    signup
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};