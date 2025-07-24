import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface FormData {
  // Step 1: Account Basics (Required)
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  dateOfBirth: string;
  
  // Step 2: Profile Setup (Required)
  disciplines: string;
  bio: string;
  username: string;
  displayName: string;
  
  // Step 3: Preferences (Optional)
  location: string;
  searchRadius: string;
  availability: string;
  experienceLevels: string;
  preferredActivities: string;
  showLocation: boolean;
  allowMessages: boolean;
  
  // Step 4: Safety Info (Optional)
  phoneNumber: string;
  emergencyContactV2: string;
  medicalInfo: string;
  notificationPreferences: string;
}

const AVAILABLE_DISCIPLINES = [
  'Hiking', 'Rock Climbing', 'Cycling', 'Running', 'Swimming', 'Kayaking',
  'Surfing', 'Skiing', 'Snowboarding', 'Mountaineering', 'Trail Running',
  'Bouldering', 'Camping', 'Backpacking', 'Photography', 'Bird Watching'
];

const WEEKDAYS = [
  { id: 'monday', label: 'Monday' },
  { id: 'tuesday', label: 'Tuesday' },
  { id: 'wednesday', label: 'Wednesday' },
  { id: 'thursday', label: 'Thursday' },
  { id: 'friday', label: 'Friday' },
  { id: 'saturday', label: 'Saturday' },
  { id: 'sunday', label: 'Sunday' }
];

const TIME_SLOTS = [
  { id: 'early_morning', label: 'Early Morning (6-9 AM)' },
  { id: 'morning', label: 'Morning (9-12 PM)' },
  { id: 'afternoon', label: 'Afternoon (12-5 PM)' },
  { id: 'evening', label: 'Evening (5-8 PM)' },
  { id: 'night', label: 'Night (8-11 PM)' }
];

// =================== MOVED OUTSIDE MAIN COMPONENT ===================

// Progress Indicator Component
const ProgressIndicator = ({ 
  steps, 
  currentStep, 
  completedSteps, 
  skippedSteps 
}: {
  steps: Array<{ id: number; title: string; required: boolean }>;
  currentStep: number;
  completedSteps: number[];
  skippedSteps: number[];
}) => (
  <div className="mb-8">
    <div className="flex items-center justify-between">
      {steps.map((step, index) => (
        <div key={step.id} className="flex items-center">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
              ${currentStep === step.id
                ? 'bg-emerald-600 text-white'
                : completedSteps.includes(step.id)
                ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-300'
                : skippedSteps.includes(step.id)
                ? 'bg-gray-300 text-gray-600 dark:bg-slate-600 dark:text-slate-400'
                : 'bg-gray-200 text-gray-500 dark:bg-slate-700 dark:text-slate-500'
              }`}
          >
            {step.id}
          </div>
          <div className="ml-2 text-xs font-medium text-gray-600 dark:text-gray-400">
            {step.title}
            {step.required && <span className="text-red-500 ml-1">*</span>}
          </div>
          {index < steps.length - 1 && (
            <div className="ml-4 w-16 h-0.5 bg-gray-200 dark:bg-slate-700" />
          )}
        </div>
      ))}
    </div>
  </div>
);

// Step 1: Account Basics Component
const AccountBasicsStep = ({ 
  formData, 
  setFormData 
}: {
  formData: FormData;
  setFormData: (data: FormData) => void;
}) => (
  <div className="space-y-6">
    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
      Create Your Account
    </h3>
    
    <div className="grid grid-cols-1 gap-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Full Name *
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
          placeholder="Enter your full name"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Email Address *
        </label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
          placeholder="Enter your email"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Password *
        </label>
        <input
          type="password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
          placeholder="Create a password"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Confirm Password *
        </label>
        <input
          type="password"
          value={formData.confirmPassword}
          onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
          placeholder="Confirm your password"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Date of Birth *
        </label>
        <input
          type="date"
          value={formData.dateOfBirth}
          onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
        />
      </div>
    </div>
  </div>
);

// Step 2: Preferences Component (merged Profile Setup + Preferences)
const PreferencesStep = ({ 
  formData, 
  setFormData 
}: {
  formData: FormData;
  setFormData: (data: FormData) => void;
}) => {
  // Parse data for UI
  const availability = JSON.parse(formData.availability || '{}');
  const weekdays = availability.weekdays || [];
  const preferredTimes = availability.preferredTimes || [];
  const selectedActivities = JSON.parse(formData.preferredActivities || '[]'); // ✅ Changed variable name
  
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
        Your Profile & Preferences
      </h3>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Select Your Preferred Activities * {/* ✅ Updated label */}
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {AVAILABLE_DISCIPLINES.map((activity) => ( // ✅ Changed variable name
            <button
              key={activity}
              type="button"
              onClick={() => {
                const updated = selectedActivities.includes(activity) // ✅ Updated variable
                  ? selectedActivities.filter((d: string) => d !== activity)
                  : [...selectedActivities, activity];
                setFormData({ ...formData, preferredActivities: JSON.stringify(updated) }); // ✅ Updated field name
              }}
              className={`px-3 py-2 text-sm rounded-md border transition-colors
                ${selectedActivities.includes(activity) // ✅ Updated variable
                  ? 'bg-emerald-100 border-emerald-300 text-emerald-700 dark:bg-emerald-900 dark:border-emerald-700 dark:text-emerald-300'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-slate-800 dark:border-slate-600 dark:text-gray-300 dark:hover:bg-slate-700'
                }`}
            >
              {activity}
            </button>
          ))}
        </div>
      </div>

      {/* Rest of your component stays the same */}
    </div>
  );
};

// Step 3: Preferences Component
{/*const PreferencesStep = ({ 
  formData, 
  setFormData 
}: {
  formData: FormData;
  setFormData: (data: FormData) => void;
}) => {
  // Parse data for UI
  const availability = JSON.parse(formData.availability || '{}');
  const weekdays = availability.weekdays || [];
  const preferredTimes = availability.preferredTimes || [];
  const preferredActivities = JSON.parse(formData.preferredActivities || '[]');
  
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
        Your Preferences
      </h3>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Location
        </label>
        <input
          type="text"
          value={formData.location}
          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
          placeholder="Enter your city or location"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Search Radius (km): {formData.searchRadius}
        </label>
        <input
          type="range"
          min="5"
          max="100"
          value={formData.searchRadius}
          onChange={(e) => setFormData({ ...formData, searchRadius: e.target.value })}
          className="mt-1 block w-full"
        />
      </div>

      <div className="space-y-4">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={formData.showLocation}
            onChange={(e) => setFormData({ ...formData, showLocation: e.target.checked })}
            className="rounded border-gray-300 dark:border-slate-600 text-emerald-600 focus:ring-emerald-500"
          />
          <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Show my location publicly</span>
        </label>

        <label className="flex items-center">
          <input
            type="checkbox"
            checked={formData.allowMessages}
            onChange={(e) => setFormData({ ...formData, allowMessages: e.target.checked })}
            className="rounded border-gray-300 dark:border-slate-600 text-emerald-600 focus:ring-emerald-500"
          />
          <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Allow messages from other users</span>
        </label>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Available Days
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {WEEKDAYS.map((day) => (
            <button
              key={day.id}
              type="button"
              onClick={() => {
                const updated = weekdays.includes(day.id)
                  ? weekdays.filter((d: string) => d !== day.id)
                  : [...weekdays, day.id];
                setFormData({
                  ...formData,
                  availability: JSON.stringify({ ...availability, weekdays: updated })
                });
              }}
              className={`px-3 py-2 text-sm rounded-md border transition-colors
                ${weekdays.includes(day.id)
                  ? 'bg-emerald-100 border-emerald-300 text-emerald-700 dark:bg-emerald-900 dark:border-emerald-700 dark:text-emerald-300'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-slate-800 dark:border-slate-600 dark:text-gray-300 dark:hover:bg-slate-700'
                }`}
            >
              {day.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Preferred Times
        </label>
        <div className="space-y-2">
          {TIME_SLOTS.map((time) => (
            <button
              key={time.id}
              type="button"
              onClick={() => {
                const updated = preferredTimes.includes(time.id)
                  ? preferredTimes.filter((t: string) => t !== time.id)
                  : [...preferredTimes, time.id];
                setFormData({
                  ...formData,
                  availability: JSON.stringify({ ...availability, preferredTimes: updated })
                });
              }}
              className={`w-full px-3 py-2 text-sm rounded-md border transition-colors text-left
                ${preferredTimes.includes(time.id)
                  ? 'bg-emerald-100 border-emerald-300 text-emerald-700 dark:bg-emerald-900 dark:border-emerald-700 dark:text-emerald-300'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-slate-800 dark:border-slate-600 dark:text-gray-300 dark:hover:bg-slate-700'
                }`}
            >
              {time.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Preferred Activities
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {AVAILABLE_DISCIPLINES.map((activity) => (
            <button
              key={activity}
              type="button"
              onClick={() => {
                const updated = preferredActivities.includes(activity)
                  ? preferredActivities.filter((a: string) => a !== activity)
                  : [...preferredActivities, activity];
                setFormData({ ...formData, preferredActivities: JSON.stringify(updated) });
              }}
              className={`px-3 py-2 text-sm rounded-md border transition-colors
                ${preferredActivities.includes(activity)
                  ? 'bg-emerald-100 border-emerald-300 text-emerald-700 dark:bg-emerald-900 dark:border-emerald-700 dark:text-emerald-300'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-slate-800 dark:border-slate-600 dark:text-gray-300 dark:hover:bg-slate-700'
                }`}
            >
              {activity}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};*/}

// Step 4: Safety Info Component
const SafetyInfoStep = ({ 
  formData, 
  setFormData 
}: {
  formData: FormData;
  setFormData: (data: FormData) => void;
}) => {
  // Parse emergency contact data
  const emergencyContact = JSON.parse(formData.emergencyContactV2 || '{}');
  const medicalInfo = JSON.parse(formData.medicalInfo || '{}');
  const notificationPrefs = JSON.parse(formData.notificationPreferences || '{}');
  
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
        Safety Information
      </h3>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Phone Number
        </label>
        <input
          type="tel"
          value={formData.phoneNumber}
          onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
          placeholder="Your phone number"
        />
      </div>

      <div className="space-y-4">
        <h4 className="font-medium text-gray-900 dark:text-white">Emergency Contact</h4>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Name
          </label>
          <input
            type="text"
            value={emergencyContact.name || ''}
            onChange={(e) => setFormData({
              ...formData,
              emergencyContactV2: JSON.stringify({ ...emergencyContact, name: e.target.value })
            })}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
            placeholder="Emergency contact name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Phone
          </label>
          <input
            type="tel"
            value={emergencyContact.phone || ''}
            onChange={(e) => setFormData({
              ...formData,
              emergencyContactV2: JSON.stringify({ ...emergencyContact, phone: e.target.value })
            })}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
            placeholder="Emergency contact phone"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Relationship
          </label>
          <select
            value={emergencyContact.relationship || ''}
            onChange={(e) => setFormData({
              ...formData,
              emergencyContactV2: JSON.stringify({ ...emergencyContact, relationship: e.target.value })
            })}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="">Select relationship</option>
            <option value="Parent">Parent</option>
            <option value="Spouse">Spouse</option>
            <option value="Sibling">Sibling</option>
            <option value="Friend">Friend</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="font-medium text-gray-900 dark:text-white">Medical Information (Optional)</h4>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Medical Conditions
          </label>
          <textarea
            value={medicalInfo.conditions || ''}
            onChange={(e) => setFormData({
              ...formData,
              medicalInfo: JSON.stringify({ ...medicalInfo, conditions: e.target.value })
            })}
            rows={3}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
            placeholder="Any medical conditions to be aware of..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Allergies
          </label>
          <textarea
            value={medicalInfo.allergies || ''}
            onChange={(e) => setFormData({
              ...formData,
              medicalInfo: JSON.stringify({ ...medicalInfo, allergies: e.target.value })
            })}
            rows={2}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
            placeholder="Any allergies..."
          />
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="font-medium text-gray-900 dark:text-white">Notification Preferences</h4>
        
        <div className="space-y-3">
          {[
            { key: 'email', label: 'Email notifications' },
            { key: 'sms', label: 'SMS notifications' },
            { key: 'push', label: 'Push notifications' },
            { key: 'marketing', label: 'Marketing emails' }
          ].map((pref) => (
            <label key={pref.key} className="flex items-center">
              <input
                type="checkbox"
                checked={notificationPrefs[pref.key] || false}
                onChange={(e) => setFormData({
                  ...formData,
                  notificationPreferences: JSON.stringify({ 
                    ...notificationPrefs, 
                    [pref.key]: e.target.checked 
                  })
                })}
                className="rounded border-gray-300 dark:border-slate-600 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{pref.label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};

// =================== MAIN COMPONENT ===================

export default function Register() {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [skippedSteps, setSkippedSteps] = useState<number[]>([]);
  const { signup } = useAuth();
  const router = useRouter();

  const [formData, setFormData] = useState<FormData>({
    // Step 1: Account Basics
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    dateOfBirth: '',
    
    // Step 2: Profile Setup
    disciplines: '[]',
    bio: '',
    username: '',
    displayName: '',
    
    // Step 3: Preferences
    location: '',
    searchRadius: '50',
    availability: '{}',
    experienceLevels: '{}',
    preferredActivities: '[]',
    showLocation: false,
    allowMessages: true,
    
    // Step 4: Safety Info
    phoneNumber: '',
    emergencyContactV2: '{}',
    medicalInfo: '{}',
    notificationPreferences: '{}'
  });

  const steps = [
    { id: 1, title: 'Account Basics', required: true },
    { id: 2, title: 'Profile & Preferences', required: true },
    { id: 3, title: 'Safety Info', required: false }
  ];

  // Validation
  const validateCurrentStep = () => {
    switch (currentStep) {
      case 1:
        if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword || !formData.dateOfBirth) {
          alert('Please fill in all required fields');
          return false;
        }
        if (formData.password !== formData.confirmPassword) {
          alert('Passwords do not match');
          return false;
        }
        return true;
      case 2:
        const disciplines = JSON.parse(formData.disciplines || '[]');
        if (disciplines.length === 0) {
          alert('Please select at least one discipline');
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  // Submit registration
  const handleSubmit = async () => {
  setLoading(true);
  try {
    await signup(formData.email, formData.password, formData.name);
    
    const { account } = await import('@/lib/appwrite');
    const session = await account.get();
    
    const { databases, DATABASE_ID, USER_PROFILES_COLLECTION_ID, ID } = await import('@/lib/appwrite');
    
    const preferredActivitiesArray = JSON.parse(formData.preferredActivities || '[]');
    
    const profileData = {
      userId: session.$id,
      name: formData.name,
      email: formData.email,
      dateOfBirth: new Date(formData.dateOfBirth).toISOString(),
      preferredActivities: preferredActivitiesArray, // ✅ Only this field, no 'disciplines'
      bio: formData.bio,
      username: formData.username || '',
      displayName: formData.displayName || formData.name,
      location: formData.location,
      searchRadius: formData.searchRadius,
      availability: formData.availability,
      experienceLevels: formData.experienceLevels,
      showLocation: false,
      allowMessages: true,
      phoneNumber: formData.phoneNumber,
      phoneVerified: false,
      emergencyContactV2: formData.emergencyContactV2,
      medicalInfo: formData.medicalInfo,
      notificationPreferences: formData.notificationPreferences,
      profileComplete: true,
      isPublicProfile: true,
      provider: 'email',
      activitiesCount: 0,
      eventsCount: 0,
      commentsCount: 0,
      activitiesCreated: 0,
      eventsCreated: 0,
      eventsJoined: 0,
      activitiesViewed: 0,
      emailVerification: false,
      subscriptionTier: 'free',
      subscriptionStatus: 'active',
      onboardingProgress: 'completed',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString()
    };
    
    await databases.createDocument(
      DATABASE_ID,
      USER_PROFILES_COLLECTION_ID,
      ID.unique(),
      profileData
    );
    
    console.log('✅ Registration completed successfully');
    router.push('/feed');
  } catch (error) {
    console.error('Registration failed:', error);
    alert('Registration failed. Please try again.');
  } finally {
    setLoading(false);
  }
};

  // Navigation handlers
  const handleNext = () => {
    if (validateCurrentStep()) {
      setCompletedSteps([...completedSteps.filter(s => s !== currentStep), currentStep]);
      setSkippedSteps(skippedSteps.filter(s => s !== currentStep));
      
      if (currentStep < 4) {
        setCurrentStep(currentStep + 1);
      } else {
        handleSubmit();
      }
    }
  };

  const handleSkip = () => {
    const currentStepData = steps.find(s => s.id === currentStep);
    if (currentStepData && !currentStepData.required) {
      setSkippedSteps([...skippedSteps.filter(s => s !== currentStep), currentStep]);
      setCompletedSteps(completedSteps.filter(s => s !== currentStep));
      
      if (currentStep < 4) {
        setCurrentStep(currentStep + 1);
      } else {
        handleSubmit();
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Render current step
  const renderCurrentStep = () => {
  switch (currentStep) {
    case 1:
      return <AccountBasicsStep formData={formData} setFormData={setFormData} />;
    case 2:
      return <PreferencesStep formData={formData} setFormData={setFormData} />;
    case 3:
      return <SafetyInfoStep formData={formData} setFormData={setFormData} />;
    default:
      return <AccountBasicsStep formData={formData} setFormData={setFormData} />;
  }
};

  const currentStepData = steps.find(s => s.id === currentStep);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8">
        <div>
          <div className="flex justify-center">
            <div className="w-12 h-12 bg-emerald-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">A1</span>
            </div>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Join AdventureOne
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Connect with outdoor enthusiasts in your area
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 py-8 px-6 shadow-lg rounded-lg">
          <ProgressIndicator 
            steps={steps} 
            currentStep={currentStep} 
            completedSteps={completedSteps} 
            skippedSteps={skippedSteps} 
          />
          
          {renderCurrentStep()}

          <div className="mt-8 flex justify-between items-center">
            <button
              type="button"
              onClick={handleBack}
              disabled={currentStep === 1}
              className={`flex items-center px-4 py-2 text-sm font-medium rounded-md
                ${currentStep === 1
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'
                }`}
            >
              <ChevronLeftIcon className="w-4 h-4 mr-1" />
              Back
            </button>

            <div className="flex space-x-3">
              {currentStepData && !currentStepData.required && (
                <button
                  type="button"
                  onClick={handleSkip}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-md"
                >
                  Skip
                </button>
              )}
              
              <button
                type="button"
                onClick={handleNext}
                disabled={loading}
                className="flex items-center px-6 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-md disabled:opacity-50"
              >
                {loading ? (
                  'Processing...'
                ) : currentStep === 4 ? (
                  'Complete Registration'
                ) : (
                  <>
                    Next
                    <ChevronRightIcon className="w-4 h-4 ml-1" />
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Already have an account?{' '}
              <button
                onClick={() => router.push('/auth/login')}
                className="font-medium text-emerald-600 hover:text-emerald-500"
              >
                Sign in
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}