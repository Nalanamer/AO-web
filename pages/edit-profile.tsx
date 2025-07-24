// pages/edit-profile.tsx - Complete Edit Profile Page with All Mobile App Features
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import { databases, DATABASE_ID, USER_PROFILES_COLLECTION_ID, APP_CONFIG_COLLECTION_ID, Query, account } from '../lib/appwrite';
import MainLayout from '../components/layout/MainLayout';

interface UserProfile {
  $id: string;
  userId: string;
  name: string;
  email: string;
  dateOfBirth: string | null;
  disciplines: string[];
  bio?: string;
  username?: string;
  displayName?: string;
  provider: string;
  profileComplete: boolean;
  isPublicProfile: boolean;
  location: string;
  searchRadius: number;
  showLocation?: boolean;
  phoneNumber: string | null;
  emergencyContactV2: any;
  medicalInfo: any;
  notificationPreferences: any;
  availability: any;
  experienceLevels: any;
  allowMessages?: boolean;
  createdAt: string;
  updatedAt: string;
  
}

interface ActivityType {
  key: string;
  label: string;
  icon?: string;
  color?: string;
}

const EditProfile: React.FC = () => {
  const { user } = useAuth();
  const router = useRouter();
  
  // State
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activityTypes, setActivityTypes] = useState<ActivityType[]>([]);
 const [formData, setFormData] = useState<{
  name: string;
  dateOfBirth: string;
  disciplines: string[];
  isPublicProfile: boolean;
  location: string;
  searchRadius: number;
  showLocation: boolean;
  phoneNumber: string;
  allowMessages: boolean;
  emergencyContact: { name: string; phone: string; relationship: string };
  medicalInfo: { allergies: string[]; conditions: string[]; medications: string[]; notes: string };
  notificationPreferences: { email: boolean; push: boolean; sms: boolean };
  experienceLevels: { [key: string]: string };
  availability: { weekdays: string[]; preferredTimes: string[] };
}>({
  name: '',
  dateOfBirth: '',
  disciplines: [],
  isPublicProfile: false,
  location: '',
  searchRadius: 50,
  showLocation: false,
  phoneNumber: '',
  allowMessages: true,
  emergencyContact: { name: '', phone: '', relationship: '' },
  medicalInfo: { allergies: [], conditions: [], medications: [], notes: '' },
  notificationPreferences: { email: true, push: true, sms: false },
  experienceLevels: {},
  availability: { weekdays: [], preferredTimes: [] }
});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

    const weekdayOptions = [
    { id: 'monday', label: 'Monday' },
    { id: 'tuesday', label: 'Tuesday' },
    { id: 'wednesday', label: 'Wednesday' },
    { id: 'thursday', label: 'Thursday' },
    { id: 'friday', label: 'Friday' },
    { id: 'saturday', label: 'Saturday' },
    { id: 'sunday', label: 'Sunday' }
  ];

  const timeSlotOptions = [
    { id: 'early_morning', label: 'Early Morning (5-8 AM)' },
    { id: 'morning', label: 'Morning (8-12 PM)' },
    { id: 'afternoon', label: 'Afternoon (12-5 PM)' },
    { id: 'evening', label: 'Evening (5-8 PM)' },
    { id: 'night', label: 'Night (8 PM+)' }
  ];
  



  // Fetch profile and activity types
  useEffect(() => {
    if (user) {
      Promise.all([
        fetchProfile(),
        fetchActivityTypes()
      ]);
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    
    try {
      const profiles = await databases.listDocuments(
        DATABASE_ID,
        USER_PROFILES_COLLECTION_ID,
        [Query.equal('userId', user.$id)]
      );

      if (profiles.documents.length > 0) {
        const profileData = profiles.documents[0] as any;
        setProfile(profileData);
        
        // Parse JSON fields safely
        const parseJSON = (field: any, defaultValue: any) => {
          if (!field) return defaultValue;
          if (typeof field === 'object') return field;
          try { return JSON.parse(field); } catch { return defaultValue; }
        };

        const emergencyContact = parseJSON(profileData.emergencyContactV2, { name: '', phone: '', relationship: '' });
        const medicalInfo = parseJSON(profileData.medicalInfo, { allergies: [], conditions: [], medications: [], notes: '' });
        const notificationPrefs = parseJSON(profileData.notificationPreferences, { email: true, push: true, sms: false });
        
        // Initialize form data
        setFormData({
  name: user.name || profileData.name || '',
  dateOfBirth: profileData.dateOfBirth ? profileData.dateOfBirth.split('T')[0] : '',
  disciplines: profileData.disciplines || [],
  isPublicProfile: profileData.isPublicProfile || false,
  location: profileData.location || '',
  searchRadius: profileData.searchRadius || 50,
  showLocation: profileData.showLocation || false,
  phoneNumber: profileData.phoneNumber || '',
  allowMessages: profileData.allowMessages ?? true,
  emergencyContact: emergencyContact,
  medicalInfo: medicalInfo,
  notificationPreferences: notificationPrefs,
  experienceLevels: parseJSON(profileData.experienceLevels, {}) as Record<string, string>,
  availability: parseJSON(profileData.availability, { weekdays: [], preferredTimes: [] })
});
      }
    } catch (err: any) {
      console.error('Error fetching profile:', err);
      setError('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const fetchActivityTypes = async () => {
    try {
         console.log('🔍 Fetching activity types from database...');
      const configs = await databases.listDocuments(
        DATABASE_ID,
        APP_CONFIG_COLLECTION_ID,
        [Query.equal('key', 'activity_types')]
      );

       console.log('📊 Database response:', configs);
    console.log('📊 Documents found:', configs.documents.length);

      if (configs.documents.length > 0) {
        const config = configs.documents[0] as any;

        console.log('📊 Config document:', config);
      console.log('📊 Values field:', config.values);

        let types = config.values || [];
console.log('📊 Raw types from database:', types);

// Check if we have strings or objects
if (types.length > 0 && typeof types[0] === 'string') {
  // Convert strings to objects using display_labels if available
  const displayLabels = config.display_labels ? JSON.parse(config.display_labels) : {};
  console.log('📊 Display labels:', displayLabels);
  
  types = types.map((key: string) => ({
    key,
    label: displayLabels[key] || `${key.charAt(0).toUpperCase()}${key.slice(1)}`
  }));
  console.log('📊 Converted types:', types);
} else {
  // Filter objects (your existing logic)
  types = types.filter((type: any) => 
    type && 
    typeof type === 'object' && 
    type.key && 
    type.key.trim() !== '' &&
    type.label && 
    type.label.trim() !== ''
  );
}
        
        setActivityTypes(types);
      } else {
        // Fallback activity types
        setActivityTypes([
          { key: 'hiking', label: '🥾 Hiking' },
          { key: 'climbing', label: '🧗 Climbing' },
          { key: 'biking', label: '🚴 Biking' },
          { key: 'running', label: '🏃 Running' },
          { key: 'swimming', label: '🏊 Swimming' },
          { key: 'yoga', label: '🧘 Yoga' },
          { key: 'skiing', label: '⛷️ Skiing' },
          { key: 'snowboarding', label: '🏂 Snowboarding' },
          { key: 'surfing', label: '🏄 Surfing' },
          { key: 'kayaking', label: '🚣 Kayaking' },
          { key: 'camping', label: '🏕️ Camping' },
          { key: 'fishing', label: '🎣 Fishing' }
        ]);
      }
    } catch (err) {
       console.error('❌ Error fetching activity types:', err);
      setActivityTypes([
        { key: 'hiking', label: '🥾 Hiking' },
          { key: 'climbing', label: '🧗 Climbing' },
          { key: 'biking', label: '🚴 Biking' },
          { key: 'running', label: '🏃 Running' },
          { key: 'swimming', label: '🏊 Swimming' },
          { key: 'yoga', label: '🧘 Yoga' },
          { key: 'skiing', label: '⛷️ Skiing' },
          { key: 'snowboarding', label: '🏂 Snowboarding' },
          { key: 'surfing', label: '🏄 Surfing' },
          { key: 'kayaking', label: '🚣 Kayaking' },
          { key: 'camping', label: '🏕️ Camping' },
          { key: 'fishing', label: '🎣 Fishing' }
      ]);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!profile || !user) return;
    
    // Validation
    if (!formData.name.trim()) {
      setError('Name is required');
      return;
    }

    if (formData.disciplines.length === 0) {
      setError('Please select at least one activity type');
      return;
    }
    
    try {
      setSaving(true);
      setError(null);
      
      // Update Appwrite Auth user name if changed
      if (formData.name !== user.name) {
        await account.updateName(formData.name.trim());
      }

      // Update profile in database
      const updateData = {
                name: formData.name.trim(),
                dateOfBirth: formData.dateOfBirth ? new Date(formData.dateOfBirth).toISOString() : null,
                disciplines: formData.disciplines,
                isPublicProfile: formData.isPublicProfile,
                location: formData.location.trim(),
                searchRadius: formData.searchRadius,
                showLocation: formData.showLocation,
                phoneNumber: formData.phoneNumber.trim() || null,
                allowMessages: formData.allowMessages,
                emergencyContactV2: JSON.stringify(formData.emergencyContact),
                medicalInfo: JSON.stringify(formData.medicalInfo),
                notificationPreferences: JSON.stringify(formData.notificationPreferences),
                experienceLevels: JSON.stringify(formData.experienceLevels),
                availability: JSON.stringify(formData.availability),
                updatedAt: new Date().toISOString()
                };

      await databases.updateDocument(
        DATABASE_ID,
        USER_PROFILES_COLLECTION_ID,
        profile.$id,
        updateData
      );

      // Redirect back to profile
      router.push('/profile');
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Handle discipline toggle - FIXED to prevent selecting all when clicking empty tiles
  const toggleDiscipline = (disciplineKey: string) => {
    if (!disciplineKey || disciplineKey.trim() === '') return; // Prevent empty selections
    
    setFormData(prev => ({
      ...prev,
      disciplines: prev.disciplines.includes(disciplineKey)
        ? prev.disciplines.filter(d => d !== disciplineKey)
        : [...prev.disciplines, disciplineKey]
    }));
  };

  // Format phone number
  const formatPhoneNumber = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  };

  // Handle weekday toggle
const toggleWeekday = (dayId: string) => {
  setFormData(prev => ({
    ...prev,
    availability: {
      ...prev.availability,
      weekdays: prev.availability.weekdays.includes(dayId)
        ? prev.availability.weekdays.filter(d => d !== dayId)
        : [...prev.availability.weekdays, dayId]
    }
  }));
};

// Handle time slot toggle
const toggleTimeSlot = (timeId: string) => {
  setFormData(prev => ({
    ...prev,
    availability: {
      ...prev.availability,
      preferredTimes: prev.availability.preferredTimes.includes(timeId)
        ? prev.availability.preferredTimes.filter(t => t !== timeId)
        : [...prev.availability.preferredTimes, timeId]
    }
  }));
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
        <div className="max-w-4xl mx-auto p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 dark:bg-slate-700 rounded w-1/3"></div>
            <div className="h-32 bg-gray-200 dark:bg-slate-700 rounded"></div>
            <div className="h-48 bg-gray-200 dark:bg-slate-700 rounded"></div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error && !profile) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto p-6 text-center">
          <div className="text-red-600 dark:text-red-400 mb-4">{error}</div>
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
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center mb-8">
          <button
            onClick={() => router.back()}
            className="mr-4 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Edit Profile</h1>
            <p className="text-gray-600 dark:text-gray-400">Update your personal information and preferences</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Left Column */}
            <div className="space-y-6">
              
              {/* Basic Information */}
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Basic Information</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-white dark:text-gray-900"
                      placeholder="Your full name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date of Birth</label>
                    <input
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-white dark:text-gray-900"
                    />
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Contact Information</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Phone Number</label>
                    <input
                      type="tel"
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        phoneNumber: formatPhoneNumber(e.target.value)
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-white dark:text-gray-900"
                      placeholder="(555) 123-4567"
                    />
                  </div>
                </div>
              </div>

              {/* Location */}
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Location Preferences</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Location</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formData.location}
                        onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-white dark:text-gray-900"
                        placeholder="Enter address or coordinates"
                      />
                      <button
                        type="button"
                        onClick={() => alert('Map location picker coming soon!')}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-emerald-600 hover:text-emerald-700"
                        title="Pick location on map"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      You can enter an address or coordinates (lat, lng format: -33.8688, 151.2093)
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Search Radius (km)</label>
                    <input
                      type="number"
                      min="1"
                      max="500"
                      value={formData.searchRadius}
                      onChange={(e) => setFormData(prev => ({ ...prev, searchRadius: parseInt(e.target.value) || 50 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-white dark:text-gray-900"
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
                        checked={formData.showLocation}
                        onChange={(e) => setFormData(prev => ({ ...prev, showLocation: e.target.checked }))}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 dark:peer-focus:ring-emerald-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              
              {/* Activity Types */}
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Activity Types *</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Select the activities you're interested in</p>
                
                {activityTypes.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400 mb-4">Loading activity types...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {activityTypes.map((activity, index) => {
                      // Debug log each activity
                      console.log(`Activity ${index}:`, activity);
                      
                      // Skip empty or invalid activity types
                      if (!activity || !activity.key || activity.key.trim() === '' || !activity.label || activity.label.trim() === '') {
                        console.log(`Skipping invalid activity at index ${index}:`, activity);
                        return null;
                      }
                      
                      const isSelected = formData.disciplines.includes(activity.key);
                      return (
                        <button
                          key={`${activity.key}-${index}`}
                          type="button"
                          onClick={() => toggleDiscipline(activity.key)}
                          className={`p-4 rounded-lg border-2 transition-all text-left min-h-[60px] flex items-center ${
                            isSelected
                              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'
                              : 'border-gray-200 dark:border-slate-600 hover:border-emerald-300 dark:hover:border-emerald-600 text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          <div>
                            <div className="text-sm font-medium">{activity.label}</div>
                            {activity.key !== activity.label && (
                              <div className="text-xs text-gray-500 mt-1">{activity.key}</div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Debug info */}
                <div className="mt-4 p-3 bg-gray-50 dark:bg-slate-700 rounded text-xs text-gray-600 dark:text-gray-400">
                  <p>Debug: Found {activityTypes.length} activity types</p>
                  <p>Selected: {formData.disciplines.join(', ') || 'None'}</p>
                </div>

                {formData.disciplines.length === 0 && (
                  <p className="text-red-600 dark:text-red-400 text-sm mt-2">Please select at least one activity type</p>
                )}
              </div>

              {/* Emergency Contact */}
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Emergency Contact</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Contact Name</label>
                    <input
                      type="text"
                      value={formData.emergencyContact.name}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        emergencyContact: { ...prev.emergencyContact, name: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-white dark:text-gray-900"
                      placeholder="Full name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Phone Number</label>
                    <input
                      type="tel"
                      value={formData.emergencyContact.phone}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        emergencyContact: { ...prev.emergencyContact, phone: formatPhoneNumber(e.target.value) }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-white dark:text-gray-900"
                      placeholder="(555) 123-4567"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Relationship</label>
                    <select
                      value={formData.emergencyContact.relationship}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        emergencyContact: { ...prev.emergencyContact, relationship: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-white dark:text-gray-900"
                    >
                      <option value="">Select relationship</option>
                      <option value="parent">Parent</option>
                      <option value="spouse">Spouse</option>
                      <option value="sibling">Sibling</option>
                      <option value="friend">Friend</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
                
              </div>

              {/* Experience Levels */}
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Experience Levels</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Set your skill level for each activity</p>
                
                <div className="space-y-4">
                  {formData.disciplines.map((activity) => (
                    <div key={activity} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">{activity}</p>
                      </div>
                      <select
                        value={formData.experienceLevels[activity] || 'beginner'}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          experienceLevels: {
                            ...prev.experienceLevels,
                            [activity]: e.target.value
                          }
                        }))}
                        className="px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-white dark:text-gray-900 text-sm"
                      >
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                        <option value="expert">Expert</option>
                      </select>
                    </div>
                  ))}
                  
                  {formData.disciplines.length === 0 && (
                    <p className="text-gray-500 dark:text-gray-400 text-sm italic">
                      Select activity types above to set experience levels
                    </p>
                  )}
                </div>
              </div>


              {/* Availability */}
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Availability</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">When are you typically available for activities?</p>
                
                <div className="space-y-6">
                  {/* Weekdays */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Available Days
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {weekdayOptions.map((day) => {
                        const isSelected = formData.availability.weekdays.includes(day.id);
                        return (
                          <button
                            key={day.id}
                            type="button"
                            onClick={() => toggleWeekday(day.id)}
                            className={`p-2 rounded-lg border-2 transition-all text-sm ${
                              isSelected
                                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'
                                : 'border-gray-200 dark:border-slate-600 hover:border-emerald-300 dark:hover:border-emerald-600 text-gray-700 dark:text-gray-300'
                            }`}
                          >
                            {day.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Time Slots */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Preferred Times
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {timeSlotOptions.map((timeSlot) => {
                        const isSelected = formData.availability.preferredTimes.includes(timeSlot.id);
                        return (
                          <button
                            key={timeSlot.id}
                            type="button"
                            onClick={() => toggleTimeSlot(timeSlot.id)}
                            className={`p-3 rounded-lg border-2 transition-all text-left text-sm ${
                              isSelected
                                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'
                                : 'border-gray-200 dark:border-slate-600 hover:border-emerald-300 dark:hover:border-emerald-600 text-gray-700 dark:text-gray-300'
                            }`}
                          >
                            {timeSlot.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Summary */}
                  {(formData.availability.weekdays.length > 0 || formData.availability.preferredTimes.length > 0) && (
                    <div className="p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        <strong>Summary:</strong> Available {formData.availability.weekdays.length > 0 ? `${formData.availability.weekdays.length} days` : 'no specific days'} 
                        {formData.availability.preferredTimes.length > 0 && `, ${formData.availability.preferredTimes.length} time slots selected`}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Medical Information */}
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Medical Information</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Allergies</label>
                    <input
                      type="text"
                      value={formData.medicalInfo.allergies.join(', ')}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        medicalInfo: { 
                          ...prev.medicalInfo, 
                          allergies: e.target.value.split(',').map(s => s.trim()).filter(s => s)
                        }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-white dark:text-gray-900"
                      placeholder="Peanuts, shellfish, etc."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Medical Conditions</label>
                    <input
                      type="text"
                      value={formData.medicalInfo.conditions.join(', ')}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        medicalInfo: { 
                          ...prev.medicalInfo, 
                          conditions: e.target.value.split(',').map(s => s.trim()).filter(s => s)
                        }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-white dark:text-gray-900"
                      placeholder="Diabetes, asthma, etc."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Current Medications</label>
                    <input
                      type="text"
                      value={formData.medicalInfo.medications.join(', ')}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        medicalInfo: { 
                          ...prev.medicalInfo, 
                          medications: e.target.value.split(',').map(s => s.trim()).filter(s => s)
                        }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-white dark:text-gray-900"
                      placeholder="Insulin, inhaler, etc."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Additional Notes</label>
                    <textarea
                      rows={3}
                      value={formData.medicalInfo.notes}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        medicalInfo: { ...prev.medicalInfo, notes: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-white dark:text-gray-900"
                      placeholder="Any additional medical information..."
                    />
                  </div>
                

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Current Medications</label>
                    <input
                      type="text"
                      value={formData.medicalInfo.medications.join(', ')}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        medicalInfo: { 
                          ...prev.medicalInfo, 
                          medications: e.target.value.split(',').map(s => s.trim()).filter(s => s)
                        }
                      }))}
className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-white dark:text-gray-900"                      placeholder="Insulin, inhaler, etc."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Additional Notes</label>
                    <textarea
                      rows={3}
                      value={formData.medicalInfo.notes}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        medicalInfo: { ...prev.medicalInfo, notes: e.target.value }
                      }))}
className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-white dark:text-gray-900"                      placeholder="Any additional medical information..."
                    />
                  </div>
                </div>
              </div>

              {/* Privacy & Preferences */}
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Privacy & Preferences</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Public Profile</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Make your profile visible to other users</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={formData.isPublicProfile}
                        onChange={(e) => setFormData(prev => ({ ...prev, isPublicProfile: e.target.checked }))}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 dark:peer-focus:ring-emerald-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Allow Messages</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Let other users send you messages</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={formData.allowMessages}
                        onChange={(e) => setFormData(prev => ({ ...prev, allowMessages: e.target.checked }))}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 dark:peer-focus:ring-emerald-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Email Notifications</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Receive activity updates via email</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={formData.notificationPreferences.email}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          notificationPreferences: { 
                            ...prev.notificationPreferences, 
                            email: e.target.checked 
                          }
                        }))}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 dark:peer-focus:ring-emerald-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Push Notifications</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Receive real-time notifications</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={formData.notificationPreferences.push}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          notificationPreferences: { 
                            ...prev.notificationPreferences, 
                            push: e.target.checked 
                          }
                        }))}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 dark:peer-focus:ring-emerald-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-red-800 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 px-6 py-3 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 font-medium transition-colors"
            >
              Cancel
            </button>
            
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
            >
              {saving ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving Changes...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </MainLayout>
  );
};

export default EditProfile;