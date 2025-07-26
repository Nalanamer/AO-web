// pages/profile.tsx - Complete Profile/Settings Page mirroring mobile app
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import { databases, DATABASE_ID, USER_PROFILES_COLLECTION_ID, Query } from '../lib/appwrite';
import MainLayout from '../components/layout/MainLayout';
import StripeWebTest from '@/components/StripeWebTest';
import { useFeatureAccess } from '../hooks/useFeatureAccess';
import { useSubscription } from '../hooks/useSubscription';
//import { account } from '../lib/appwrite'; // Add this import



// Types matching Appwrite schema
interface UserProfile {
  $id: string;
  userId: string;
  name: string;
  email: string;
  dateOfBirth: string | null;
  disciplines: string[];
  provider: string;
  profileComplete: boolean;
  isPublicProfile: boolean;
  location: string;
  searchRadius: number;
  locationCoords: any;
  availability: any;
  experienceLevels: any;
  phoneNumber: string | null;
  phoneVerified: boolean;
  emergencyContactV2: any;
  medicalInfo: any;
  notificationPreferences: any;
  onboardingProgress: any;
  bio?: string;
  username?: string;
  displayName?: string;
  showLocation?: boolean;
  allowMessages?: boolean;
  activitiesCount?: number;
  eventsCount?: number;
  commentsCount?: number;
  activitiesCreated?: number;
  eventsCreated?: number;
  eventsJoined?: number;
  activitiesViewed?: number;
  emailVerification?: boolean;
  subscriptionTier?: string;
  subscriptionStatus?: string;
  lastActiveAt?: string;
  profileImageUrl?: string;
  experienceLevel?: string;
  preferredActivities?: string[];
  certifications?: string[];
  createdAt: string;
  updatedAt: string;
}

// Modal component for editing fields
interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const EditModal: React.FC<EditModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

// Profile Card Component
interface ProfileCardProps {
  title: string;
  icon: string;
  children: React.ReactNode;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ title, icon, children }) => {
const iconMap: { [key: string]: React.ReactNode } = {
    'person-outline': (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    'call-outline': (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
      </svg>
    ),
    'calendar-outline': (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    'fitness-outline': (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    'medical-outline': (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
      </svg>
    ),
    'notifications-outline': (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
    'location-outline': (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    'shield-outline': (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    )
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6 mb-6">
      <div className="flex items-center mb-4">
        <div className="text-emerald-600 dark:text-emerald-400 mr-3">
          {iconMap[icon] || iconMap['person-outline']}
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
      </div>
      {children}
    </div>
  );
};

// Editable Info Row Component
interface EditableInfoRowProps {
  label: string;
  value: string;
  onEdit: () => void;
}

const EditableInfoRow: React.FC<EditableInfoRowProps> = ({ label, value, onEdit }) => (
  <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-slate-700 last:border-b-0">
    <div>
      <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p>
      <p className="text-gray-900 dark:text-white font-medium">{value}</p>
    </div>
    <button
      onClick={onEdit}
      className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    </button>
  </div>
);

// Main Profile Component
const Profile: React.FC = () => {
  const { user, logout, sendEmailVerification, refreshUser } = useAuth();

  const router = useRouter();
  
  // State
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [showPhoneEdit, setShowPhoneEdit] = useState(false);
  const [showEmergencyEdit, setShowEmergencyEdit] = useState(false);
  const [showMedicalEdit, setShowMedicalEdit] = useState(false);
  const [showNotificationEdit, setShowNotificationEdit] = useState(false);
  const [showLocationEdit, setShowLocationEdit] = useState(false);
  const [verificationLoading, setVerificationLoading] = useState(false);
const [verificationMessage, setVerificationMessage] = useState('');



  // Temp edit states
  const [tempPhoneNumber, setTempPhoneNumber] = useState('');
  const [tempEmergencyContact, setTempEmergencyContact] = useState({ 
    name: '', 
    phone: '', 
    relationship: '' 
  });
  

  const [tempMedicalInfo, setTempMedicalInfo] = useState(() => ({
  allergies: [] as string[], 
  conditions: [] as string[], 
  medications: [] as string[], 
  notes: '' 
}));
  const [tempNotificationPrefs, setTempNotificationPrefs] = useState({ 
    email: true, 
    push: true, 
    sms: false 
  });
  const [tempLocation, setTempLocation] = useState({ 
    location: '', 
    searchRadius: 50, 
    showLocation: false 
  });
  const { currentPlan,subscription} = useSubscription();
const { 
  getRemainingUsage, 
  currentUsage, 
  featureLimits, 
  loading: usageLoading,
  refreshUsage , // ✅ ADD THIS
  resetInfo
} = useFeatureAccess();
console.log('🔍 Debug subscription data:', subscription);
console.log('🔍 currentPeriodEnd:', subscription?.currentPeriodEnd);
console.log('🔍 cancelAtPeriodEnd:', subscription?.cancelAtPeriodEnd);

  // Fetch profile data
  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const profiles = await databases.listDocuments(
        DATABASE_ID,
        USER_PROFILES_COLLECTION_ID,
        [Query.equal('userId', user.$id)]
      );

      if (profiles.documents.length > 0) {
        const profileData = profiles.documents[0] as any;
        setProfile(profileData);
        console.log('✅ Profile loaded:', profileData.name);
      } else {
        setError('Profile not found');
      }
    } catch (err: any) {
      console.error('Error fetching profile:', err);
      setError('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  // Update profile helper
  const updateProfile = async (updates: Partial<UserProfile>): Promise<boolean> => {
    if (!profile) return false;

    try {
      const updateData = {
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      await databases.updateDocument(
        DATABASE_ID,
        USER_PROFILES_COLLECTION_ID,
        profile.$id,
        updateData
      );

      setProfile(prev => prev ? { ...prev, ...updateData } : null);
      return true;
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile');
      return false;
    }
  };

  // Parse JSON fields safely
  const parseJSON = (field: any, defaultValue: any) => {
  if (!field) return defaultValue;
  if (typeof field === 'object') return field;
  try {
    return JSON.parse(field);
  } catch {
    return defaultValue;
  }
};

// Parse JSON fields safely with enhanced medical info parsing
const parseMedicalInfoSafely = (medicalData: any) => {
  const defaultMedical = { allergies: [], conditions: [], medications: [], notes: '' };
  if (!medicalData) return defaultMedical;

  let parsed = medicalData;
  if (typeof medicalData === 'string') {
    try {
      parsed = JSON.parse(medicalData);
    } catch {
      return defaultMedical;
    }
  }

  return {
    allergies: Array.isArray(parsed.allergies)
      ? parsed.allergies
      : typeof parsed.allergies === 'string'
        ? parsed.allergies
            .split(',')
            .map((item: string) => item.trim())
            .filter((item: string) => item)
        : [],
    conditions: Array.isArray(parsed.conditions)
      ? parsed.conditions
      : typeof parsed.conditions === 'string'
        ? parsed.conditions
            .split(',')
            .map((item: string) => item.trim())
            .filter((item: string) => item)
        : [],
    medications: Array.isArray(parsed.medications)
      ? parsed.medications
      : typeof parsed.medications === 'string'
        ? parsed.medications
            .split(',')
            .map((item: string) => item.trim())
            .filter((item: string) => item)
        : [],
    notes: typeof parsed.notes === 'string' ? parsed.notes : ''
  };
};

// Updated parsing section
// Updated parsing section
// Parse data safely with defaults
const parsedEmergencyContact = profile 
  ? parseJSON(profile.emergencyContactV2, { name: '', phone: '', relationship: '' })
  : { name: '', phone: '', relationship: '' };

const parsedMedicalInfo = profile 
  ? parseMedicalInfoSafely(profile.medicalInfo)
  : { allergies: [], conditions: [], medications: [], notes: '' };

const parsedNotificationPrefs = profile 
  ? parseJSON(profile.notificationPreferences, { email: true, push: true, sms: false })
  : { email: true, push: true, sms: false };

const parsedAvailability = profile 
  ? parseJSON(profile.availability, { weekdays: [], preferredTimes: [] })
  : { weekdays: [], preferredTimes: [] };

const parsedExperienceLevels = profile 
  ? parseJSON(profile.experienceLevels, {})
  : {};
  // Format functions
  const formatPhoneNumber = (phone: string) => {
    if (!phone) return '';
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 10) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    }
    return phone;
  };


  



  const formatAvailability = (availability: any) => {
    if (!availability?.weekdays || availability.weekdays.length === 0) {
      return 'No availability set';
    }
    const days = availability.weekdays.join(', ');
    const times = availability.preferredTimes?.join(', ') || '';
    return times ? `${days} - ${times}` : days;
  };

 const handleSendEmailVerification = async () => {
  try {
    setVerificationLoading(true);
    setVerificationMessage('');
    
    await sendEmailVerification();
    setVerificationMessage('Verification email sent! Please check your inbox.');
    
  } catch (error: any) {
    setVerificationMessage(error.message || 'Failed to send verification email');
  } finally {
    setVerificationLoading(false);
  }
};



  // Save functions
  const savePhoneNumber = async () => {
    if (await updateProfile({ phoneNumber: tempPhoneNumber })) {
      setShowPhoneEdit(false);
    }
  };

  const saveEmergencyContact = async () => {
    if (await updateProfile({ emergencyContactV2: JSON.stringify(tempEmergencyContact) })) {
      setShowEmergencyEdit(false);
    }
  };

  const saveMedicalInfo = async () => {
    if (await updateProfile({ medicalInfo: JSON.stringify(tempMedicalInfo) })) {
      setShowMedicalEdit(false);
    }
  };

  const saveNotificationPrefs = async () => {
    if (await updateProfile({ notificationPreferences: JSON.stringify(tempNotificationPrefs) })) {
      setShowNotificationEdit(false);
    }
  };

  const saveLocation = async () => {
    if (await updateProfile({ 
      location: tempLocation.location,
      searchRadius: tempLocation.searchRadius,
      showLocation: tempLocation.showLocation 
    })) {
      setShowLocationEdit(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/auth/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

// Add this to your profile page for testing monthly reset
// Add these inside your Profile component, after your existing hooks
const [monthlyTestResults, setMonthlyTestResults] = useState<string[]>([]);
const [monthlyTesting, setMonthlyTesting] = useState(false);




const addMonthlyResult = (message: string) => {
  setMonthlyTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
};

const testMonthlyReset = async () => {
  setMonthlyTesting(true);
  addMonthlyResult("🧪 Testing monthly reset simulation...");

  try {
    // Check current month and usage
    const currentMonth = new Date().toISOString().slice(0, 7);
    addMonthlyResult(`📅 Current month: ${currentMonth}`);
    addMonthlyResult(`📊 Current usage: Events Created: ${currentUsage.eventsCreated}, Events Joined: ${currentUsage.eventsJoined}`);
    addMonthlyResult(`📅 Reset date: ${resetInfo?.resetDateFormatted || 'Not available'}`);
    addMonthlyResult(`⏰ Days until reset: ${resetInfo?.daysUntilReset || 'Not available'}`);

    // Test what happens if we manually check next month's usage
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const nextMonthString = nextMonth.toISOString().slice(0, 7);
    
    addMonthlyResult(`\n🔮 Simulating next month (${nextMonthString}):`);
    addMonthlyResult("📝 In real system, usage would reset to 0 automatically");
    addMonthlyResult("📝 New usage document would be created");
    addMonthlyResult("📝 Users would get fresh limits");

    // Test the refresh functionality
    addMonthlyResult("\n🔄 Testing usage refresh...");
    await refreshUsage();
    addMonthlyResult("✅ Usage data refreshed successfully");

  } catch (error: any) {
    addMonthlyResult(`❌ Test failed: ${error.message}`);
  } finally {
    setMonthlyTesting(false);
    addMonthlyResult("🏁 Monthly reset test completed!");
  }
};



  // Redirect to login if no user
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <MainLayout>
        <div className="max-w-2xl mx-auto p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-32 bg-gray-200 dark:bg-slate-700 rounded-xl"></div>
            <div className="h-48 bg-gray-200 dark:bg-slate-700 rounded-xl"></div>
            <div className="h-48 bg-gray-200 dark:bg-slate-700 rounded-xl"></div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error || !profile) {
    return (
      <MainLayout>
        <div className="max-w-2xl mx-auto p-6 text-center">
          <div className="text-red-600 dark:text-red-400 mb-4">
            {error || 'Profile not found'}
          </div>
          <button 
            onClick={fetchProfile}
            className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700"
          >
            Retry
          </button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Profile & Settings</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your account information and preferences</p>
          
        </div>

                

        {/* Basic Profile Info */}
        <ProfileCard title="Profile Information" icon="person-outline">
          <EditableInfoRow
            label="Name"
            value={profile.name || 'Not set'}
            onEdit={() => router.push('/edit-profile')}
          />
          <EditableInfoRow
            label="Email"
            value={profile.email || 'Not set'}
            onEdit={() => router.push('/edit-profile')}
          />
          
          <EditableInfoRow
            label="Date of Birth"
            value={profile.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString() : 'Not set'}
            onEdit={() => router.push('/edit-profile')}
          />
          {/*<EditableInfoRow
            label="Bio"
            value={profile.bio || 'No bio added'}
            onEdit={() => router.push('/edit-profile')}
          />*/}
          <EditableInfoRow
            label="Activity Types"
            value={profile.disciplines?.length > 0 ? profile.disciplines.join(', ') : 'None selected'}
            onEdit={() => router.push('/edit-profile')}
          />
        </ProfileCard>

        {/* Contact Information */}
        <ProfileCard title="Contact Information" icon="call-outline">
          <EditableInfoRow
            label="Phone Number"
            value={profile.phoneNumber ? formatPhoneNumber(profile.phoneNumber) : 'Not set'}
            onEdit={() => {
              setTempPhoneNumber(profile.phoneNumber || '');
              setShowPhoneEdit(true);
            }}
          />
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Phone Verified</p>
              <p className="text-gray-900 dark:text-white font-medium">
                {profile.phoneVerified ? '✅ Verified' : '❌ Not verified'}
              </p>
            </div>
          </div>
        </ProfileCard>

        {/* Location Preferences */}
        <ProfileCard title="Location Preferences" icon="location-outline">
          <EditableInfoRow
            label="Location"
            value={profile.location || 'Not set'}
            onEdit={() => {
              setTempLocation({
                location: profile.location || '',
                searchRadius: profile.searchRadius || 50,
                showLocation: profile.showLocation || false
              });
              setShowLocationEdit(true);
            }}
          />
          <EditableInfoRow
            label="Search Radius"
            value={`${profile.searchRadius || 50} km`}
            onEdit={() => {
              setTempLocation({
                location: profile.location || '',
                searchRadius: profile.searchRadius || 50,
                showLocation: profile.showLocation || false
              });
              setShowLocationEdit(true);
            }}
          />
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Show Location to Others</p>
              <p className="text-gray-900 dark:text-white font-medium">
                {profile.showLocation ? 'Visible' : 'Hidden'}
              </p>
            </div>
          </div>
        </ProfileCard>

        {/* Availability */}
        <ProfileCard title="Availability" icon="calendar-outline">
          <EditableInfoRow
            label="Schedule"
            value={formatAvailability(parsedAvailability)}
            onEdit={() => router.push('/edit-profile')}
          />
        </ProfileCard>

        {/* Experience Levels */}
        <ProfileCard title="Experience Levels" icon="fitness-outline">
          {Object.keys(parsedExperienceLevels).length > 0 ? (
            <div>
              {Object.entries(parsedExperienceLevels).map(([activity, level]) => (
                <div key={activity} className="flex justify-between py-2">
                  <span className="text-gray-600 dark:text-gray-400 capitalize">{activity}:</span>
                  <span className="text-gray-900 dark:text-white font-medium capitalize">{String(level)}</span>
                </div>
              ))}
              <button
                onClick={() => alert('Experience levels editing can be added here')}
                className="mt-3 text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 text-sm flex items-center"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Experience Levels
              </button>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400 mb-4">No experience levels set</p>
              <button
                onClick={() => alert('Experience levels editing can be added here')}
                className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700"
              >
                Add Experience Levels
              </button>
            </div>
          )}
        </ProfileCard>

        {/* Emergency Contact */}
        <ProfileCard title="Emergency Contact" icon="medical-outline">
          {parsedEmergencyContact.name ? (
            <div>
              <EditableInfoRow
                label="Name"
                value={parsedEmergencyContact.name}
                onEdit={() => {
                  setTempEmergencyContact(parsedEmergencyContact);
                  setShowEmergencyEdit(true);
                }}
              />
              <EditableInfoRow
                label="Phone"
                value={formatPhoneNumber(parsedEmergencyContact.phone)}
                onEdit={() => {
                  setTempEmergencyContact(parsedEmergencyContact);
                  setShowEmergencyEdit(true);
                }}
              />
              <EditableInfoRow
                label="Relationship"
                value={parsedEmergencyContact.relationship}
                onEdit={() => {
                  setTempEmergencyContact(parsedEmergencyContact);
                  setShowEmergencyEdit(true);
                }}
              />
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400 mb-4">No emergency contact set</p>
              <button
                onClick={() => {
                  setTempEmergencyContact({ name: '', phone: '', relationship: '' });
                  setShowEmergencyEdit(true);
                }}
                className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700"
              >
                Add Emergency Contact
              </button>
            </div>
          )}
        </ProfileCard>

        {/* Medical Information */}
        <ProfileCard title="Medical Information" icon="shield-outline">
         <EditableInfoRow
  label="Allergies"
  value={Array.isArray(parsedMedicalInfo.allergies) && parsedMedicalInfo.allergies.length > 0 
    ? parsedMedicalInfo.allergies.join(', ') 
    : 'None specified'}
  onEdit={() => {
  const safeMedicalInfo = {
    allergies: Array.isArray(parsedMedicalInfo.allergies) ? parsedMedicalInfo.allergies : [],
    conditions: Array.isArray(parsedMedicalInfo.conditions) ? parsedMedicalInfo.conditions : [],
    medications: Array.isArray(parsedMedicalInfo.medications) ? parsedMedicalInfo.medications : [],
    notes: parsedMedicalInfo.notes || ''
  };
  setTempMedicalInfo(safeMedicalInfo);
  setShowMedicalEdit(true);
}}
/>
<EditableInfoRow
  label="Medical Conditions"
  value={Array.isArray(parsedMedicalInfo.conditions) && parsedMedicalInfo.conditions.length > 0 
    ? parsedMedicalInfo.conditions.join(', ') 
    : 'None specified'}
  onEdit={() => {
    const safeMedicalInfo = {
      allergies: Array.isArray(parsedMedicalInfo.allergies) ? parsedMedicalInfo.allergies : [],
      conditions: Array.isArray(parsedMedicalInfo.conditions) ? parsedMedicalInfo.conditions : [],
      medications: Array.isArray(parsedMedicalInfo.medications) ? parsedMedicalInfo.medications : [],
      notes: parsedMedicalInfo.notes || ''
    };
    setTempMedicalInfo(safeMedicalInfo);
    setShowMedicalEdit(true);
  }}
/>
<EditableInfoRow
  label="Medications"
  value={Array.isArray(parsedMedicalInfo.medications) && parsedMedicalInfo.medications.length > 0 
    ? parsedMedicalInfo.medications.join(', ') 
    : 'None specified'}
  onEdit={() => {
    const safeMedicalInfo = {
      allergies: Array.isArray(parsedMedicalInfo.allergies) ? parsedMedicalInfo.allergies : [],
      conditions: Array.isArray(parsedMedicalInfo.conditions) ? parsedMedicalInfo.conditions : [],
      medications: Array.isArray(parsedMedicalInfo.medications) ? parsedMedicalInfo.medications : [],
      notes: parsedMedicalInfo.notes || ''
    };
    setTempMedicalInfo(safeMedicalInfo);
    setShowMedicalEdit(true);
  }}
/>
        </ProfileCard>

        {/* Notification Preferences */}
        <ProfileCard title="Notification Preferences" icon="notifications-outline">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-900 dark:text-white font-medium">Email Notifications</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Activity updates and messages</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={parsedNotificationPrefs.email}
                  onChange={(e) => updateProfile({ 
  notificationPreferences: JSON.stringify({
    ...parsedNotificationPrefs,
    email: e.target.checked  // ✅ CORRECT
  })
})}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 dark:peer-focus:ring-emerald-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-900 dark:text-white font-medium">Allow Messages</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Let other users send you messages</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={profile.allowMessages ?? true}
                  onChange={(e) => updateProfile({ allowMessages: e.target.checked })}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 dark:peer-focus:ring-emerald-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-emerald-600"></div>
              </label>
            </div>
          </div>
        </ProfileCard>

        {/* Activity Statistics */}
        <ProfileCard title="Activity Statistics" icon="fitness-outline">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{profile.activitiesCreated || 0}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Activities Created</p>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{profile.eventsCreated || 0}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Events Created</p>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{profile.eventsJoined || 0}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Events Joined</p>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{profile.activitiesViewed || 0}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Activities Viewed</p>
            </div>
          </div>
        </ProfileCard>

        {/* ADD THIS NEW SECTION - Billing & Subscription */}
     
<ProfileCard title="Billing & Subscription" icon="card-outline">
  <div className="space-y-4">
    {/* Current Plan Display */}
    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
      <div>
        <p className="font-medium text-gray-900 dark:text-white">
          Current Plan: {currentPlan === 'pro' ? 'Pro Plan' : 
                       currentPlan === 'pro_plus' ? 'Pro+ Plan' : 'Free Plan'}
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {currentPlan === 'free' 
            ? 'Upgrade to unlock unlimited features' 
            : 'Manage your subscription and billing'}
        </p>
        
        {/* Show billing/cancellation dates */}
        {subscription && subscription.currentPeriodEnd && (
          <div className="mt-2">
            {subscription.cancelAtPeriodEnd ? (
              <div className="flex items-center text-amber-600 dark:text-amber-400">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <span className="text-sm font-medium">
                  Subscription cancelled. Access until {new Date(subscription.currentPeriodEnd).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
            ) : (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Next billing: {new Date(subscription.currentPeriodEnd).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            )}
          </div>
        )}
      </div>
      <div className={`px-3 py-1 rounded-full text-sm font-medium ${
        currentPlan === 'free' 
          ? 'bg-gray-200 text-gray-700 dark:bg-slate-600 dark:text-gray-300'
          : subscription?.cancelAtPeriodEnd
          ? 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200'
      }`}>
        {subscription?.cancelAtPeriodEnd ? 'Cancelled' : currentPlan === 'free' ? 'Free' : 'Premium'}
      </div>
    </div>

    {/* ✅ ADD THIS: Single Action Button */}
    <div className="mt-4">
      <button
        onClick={() => router.push('/billing')}
        className="w-full bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center"
      >
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        {currentPlan === 'free' ? 'Upgrade Plan' : 'Manage Billing'}
      </button>
    </div>
  </div>
</ProfileCard>

        {/* Feature Usage & Limits */}
<ProfileCard title="Feature Usage & Limits" icon="fitness-outline">
  {usageLoading ? (
    
    <div className="text-center py-4">
      <p className="text-gray-500 dark:text-gray-400">Loading usage data...</p>
    </div>
  ) : (
    <div className="space-y-4">
<div className="text-center pt-3 border-t border-gray-200 dark:border-slate-600">
            <p className="text-xs text-gray-500 dark:text-gray-400">
                Limits reset on {resetInfo.resetDateFormatted} ({resetInfo.daysUntilReset} days)
            </p>
            </div>

      {/* Events Created */}
      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
        <div>
          <p className="font-medium text-gray-900 dark:text-white">Events Created</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {currentUsage.eventsCreated} used • {getRemainingUsage('eventsCreated')} remaining
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
            {getRemainingUsage('eventsCreated')}
          </p>
          {featureLimits.eventsCreated !== -1 && (
            <p className="text-xs text-gray-500">of {featureLimits.eventsCreated}</p>
          )}
        </div>
      </div>
        
      {/* Events Joined */}
      
      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
        {/* Add this after the Events Joined section */}

            
        <div>
          <p className="font-medium text-gray-900 dark:text-white">Events Joined</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {currentUsage.eventsJoined} used • {getRemainingUsage('eventsJoined')} remaining
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
            {getRemainingUsage('eventsJoined')}
          </p>
          {featureLimits.eventsJoined !== -1 && (
            <p className="text-xs text-gray-500">of {featureLimits.eventsJoined}</p>
          )}
        </div>
      </div>
          
{/* Add this after your existing Feature Usage content, before the closing </ProfileCard> */}



    </div>
  )}
</ProfileCard>

        {/* Account Settings */}
        <ProfileCard title="Account Settings" icon="shield-outline">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-900 dark:text-white font-medium">Public Profile</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Make your profile visible to other users</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={profile.isPublicProfile}
                  onChange={(e) => updateProfile({ isPublicProfile: e.target.checked })}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 dark:peer-focus:ring-emerald-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            <div className="pt-4 border-t border-gray-200 dark:border-slate-700">
              <div className="mb-4">
                <p className="text-gray-900 dark:text-white font-medium">Subscription</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                  {profile.subscriptionTier || 'free'} plan - {profile.subscriptionStatus || 'active'}
                </p>
              </div>
              
              <div className="mb-4">
  <div className="mb-4">
  <div className="flex items-center justify-between">
    <div>
      <p className="text-gray-900 dark:text-white font-medium">Email Verification</p>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        {user?.emailVerification ? '✅ Verified' : '❌ Not verified'}
      </p>
      {verificationMessage && (
        <p className={`text-sm mt-1 ${
          verificationMessage.includes('sent') || verificationMessage.includes('already sent')
            ? 'text-emerald-600 dark:text-emerald-400'
            : 'text-red-600 dark:text-red-400'
        }`}>
          {verificationMessage}
        </p>
      )}
    </div>
    
    {/* Show verification button only if email is not verified */}
    {!user?.emailVerification && (
  <button
    onClick={handleSendEmailVerification}  // ✅ FIXED: Use the handler function
    disabled={verificationLoading}
    className={`px-4 py-2 text-sm rounded-lg transition-colors ${
      verificationLoading
        ? 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-slate-600 dark:text-slate-400'
        : 'bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600'
    }`}
  >
    {verificationLoading ? (
      <div className="flex items-center">
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Sending...
      </div>
    ) : (
      'Verify Email'
    )}
  </button>
)}
  </div>
</div>

</div>

              <div className="mb-4">
                <p className="text-gray-900 dark:text-white font-medium">Last Active</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {profile.lastActiveAt ? new Date(profile.lastActiveAt).toLocaleString() : 'Never'}
                </p>
              </div>
            </div>
          </div>
        </ProfileCard>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <button
            onClick={() => router.push('/edit-profile')}
            className="flex-1 bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit Profile
          </button>
          
          <button
            onClick={handleLogout}
            className="flex-1 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>

        {/* Edit Modals */}
        
        {/* Phone Number Edit Modal */}
        <EditModal
          isOpen={showPhoneEdit}
          onClose={() => setShowPhoneEdit(false)}
          title="Edit Phone Number"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                value={tempPhoneNumber}
                onChange={(e) => setTempPhoneNumber(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                placeholder="(555) 123-4567"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowPhoneEdit(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 dark:border-slate-600 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={savePhoneNumber}
                className="flex-1 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700"
              >
                Save
              </button>
            </div>
          </div>
        </EditModal>

        {/* Emergency Contact Edit Modal */}
        <EditModal
          isOpen={showEmergencyEdit}
          onClose={() => setShowEmergencyEdit(false)}
          title="Edit Emergency Contact"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Contact Name
              </label>
              <input
                type="text"
                value={tempEmergencyContact.name}
                onChange={(e) => setTempEmergencyContact(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                placeholder="Full name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                value={tempEmergencyContact.phone}
                onChange={(e) => setTempEmergencyContact(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                placeholder="(555) 123-4567"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Relationship
              </label>
              <select
                value={tempEmergencyContact.relationship}
                onChange={(e) => setTempEmergencyContact(prev => ({ ...prev, relationship: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
              >
                <option value="">Select relationship</option>
                <option value="parent">Parent</option>
                <option value="spouse">Spouse</option>
                <option value="sibling">Sibling</option>
                <option value="friend">Friend</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowEmergencyEdit(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 dark:border-slate-600 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={saveEmergencyContact}
                className="flex-1 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700"
              >
                Save
              </button>
            </div>
          </div>
        </EditModal>

        {/* Medical Info Edit Modal */}
        <EditModal
          isOpen={showMedicalEdit}
          onClose={() => setShowMedicalEdit(false)}
          title="Edit Medical Information"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Allergies (comma separated)
              </label>
              <input
                type="text"
                value={tempMedicalInfo.allergies?.join(', ') || ''}
                onChange={(e) => setTempMedicalInfo(prev => ({ 
                  ...prev, 
                  allergies: e.target.value.split(',').map(s => s.trim()).filter(s => s) 
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                placeholder="Peanuts, shellfish, etc."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Medical Conditions (comma separated)
              </label>
              <input
                type="text"
                value={tempMedicalInfo.conditions?.join(', ') || ''}
                onChange={(e) => setTempMedicalInfo(prev => ({ 
                  ...prev, 
                  conditions: e.target.value.split(',').map(s => s.trim()).filter(s => s) 
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                placeholder="Diabetes, asthma, etc."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Current Medications (comma separated)
              </label>
              <input
                type="text"
                value={tempMedicalInfo.medications?.join(', ') || ''}
                onChange={(e) => setTempMedicalInfo(prev => ({ 
                  ...prev, 
                  medications: e.target.value.split(',').map(s => s.trim()).filter(s => s) 
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                placeholder="Insulin, inhaler, etc."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Additional Notes
              </label>
              <textarea
                rows={3}
                value={tempMedicalInfo.notes || ''}
                onChange={(e) => setTempMedicalInfo(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                placeholder="Any additional medical information..."
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowMedicalEdit(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 dark:border-slate-600 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={saveMedicalInfo}
                className="flex-1 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700"
              >
                Save
              </button>
            </div>
          </div>
        </EditModal>

        {/* Location Edit Modal */}
        <EditModal
          isOpen={showLocationEdit}
          onClose={() => setShowLocationEdit(false)}
          title="Edit Location Preferences"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Location
              </label>
              <input
                type="text"
                value={tempLocation.location}
                onChange={(e) => setTempLocation(prev => ({ ...prev, location: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                placeholder="City, State"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Search Radius (km)
              </label>
              <input
                type="number"
                min="1"
                max="500"
                value={tempLocation.searchRadius}
                onChange={(e) => setTempLocation(prev => ({ ...prev, searchRadius: parseInt(e.target.value) || 50 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Show Location to Others</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Allow other users to see your general location</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={tempLocation.showLocation}
                  onChange={(e) => setTempLocation(prev => ({ ...prev, showLocation: e.target.checked }))}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 dark:peer-focus:ring-emerald-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-emerald-600"></div>
              </label>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLocationEdit(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 dark:border-slate-600 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={saveLocation}
                className="flex-1 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700"
              >
                Save
              </button>
            </div>
          </div>
        </EditModal>
      </div>
    </MainLayout>
  );
};
export default Profile;