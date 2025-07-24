// pages/events/create.tsx - UPDATED to Match Mobile App Structure
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import MainLayout from '../../components/layout/MainLayout';
import { useAuth } from '../../contexts/AuthContext';
import { databases, DATABASE_ID, ACTIVITIES_COLLECTION_ID, EVENTS_COLLECTION_ID, ID } from '../../lib/appwrite';
import { Wrapper } from "@googlemaps/react-wrapper";
import GoogleMapComponent from '@/components/GoogleMapComponent';

// Mobile App Matching Options
const INCLUSIVE_OPTIONS = [
  { id: 'all_women', label: 'All Women', emoji: '👩', description: 'This event welcomes and focuses on women participants' },
  { id: 'lgbtiq', label: 'LGBTIQ+', emoji: '🏳️‍🌈', description: 'This event welcomes and focuses on LGBTIQ+ participants' },
  { id: 'physically_inclusive', label: 'Physically Inclusive', emoji: '♿', description: 'This event is accessible to people with physical disabilities' }
];

const DIFFICULTY_OPTIONS = [
  { id: 'skill_agnostic', label: 'Skill Agnostic', emoji: '🎲', description: 'No specific skill level required - suitable for everyone' },
  { id: 'easy', label: 'Easy', emoji: '🟢', description: 'Easy difficulty for beginners' },
  { id: 'medium', label: 'Medium', emoji: '🟡', description: 'Moderate difficulty requiring some experience or fitness' },
  { id: 'difficult', label: 'Difficult', emoji: '🔴', description: 'High difficulty requiring significant experience or fitness' }
];

// Interfaces
interface Activity {
  $id: string;
  activityname: string;
  location: string | { address: string };
  description: string;
  types: string[];
  difficulty: string;
  userId: string;
  latitude?: number;
  longitude?: number;
}

interface LocationData {
  address: string;
  latitude: number;
  longitude: number;
}

interface FormData {
  eventName: string;
  title: string;
  activityId: string;
  activityName: string;
  date: string;
  meetupTime: string;
  meetupPoint: string;
  location: string;
  description: string;
  maxParticipants: number;
  difficulty: string;
  inclusive: string[];
  isPublic: boolean;
  endDate?: string;
  endTime?: string;
  latitude: number | null;
  longitude: number | null;
  
}

interface FormErrors {
  eventName?: string;
  title?: string;
  date?: string;
  meetupTime?: string;
  meetupPoint?: string;
  location?: string;
  maxParticipants?: string;
  general?: string;
}

// Icons
const CalendarIcon: React.FC<{ className?: string }> = ({ className = "h-5 w-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const MapPinIcon: React.FC<{ className?: string }> = ({ className = "h-5 w-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const ArrowLeftIcon: React.FC<{ className?: string }> = ({ className = "h-5 w-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

const ClockIcon: React.FC<{ className?: string }> = ({ className = "h-5 w-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

// Helper functions
const formatLocation = (location: string | { address: string }) => {
  if (typeof location === 'string') return location;
  return location.address;
};

const getMinDateTime = () => {
  const now = new Date();
  now.setHours(now.getHours() + 1);
  return now.toISOString().slice(0, 16);
};

const getMinDate = () => {
  const now = new Date();
  return now.toISOString().slice(0, 10);
};

// Map Component for Location Selection
const MapLocationPicker: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onLocationSelect: (location: LocationData) => void;
  initialLocation?: LocationData | null;
}> = ({ isOpen, onClose, onLocationSelect, initialLocation }) => {
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(initialLocation || null);
  const [address, setAddress] = useState(initialLocation?.address || '');
  const [latitude, setLatitude] = useState(initialLocation?.latitude?.toString() || '');
  const [longitude, setLongitude] = useState(initialLocation?.longitude?.toString() || '');
  const [inputMode, setInputMode] = useState<'map' | 'coordinates'>('coordinates');

  const handleSave = () => {
  // Validate that we have the required data
  if (!address || !latitude || !longitude) {
    // Show error or validation message
    return;
  }

  // Call the parent component's onLocationSelect with proper data structure
  onLocationSelect({
    address: address.trim(),
    latitude: parseFloat(latitude),
    longitude: parseFloat(longitude)
  });
};

  const handleQuickLocation = (name: string, lat: number, lng: number) => {
    setAddress(name);
    setLatitude(lat.toString());
    setLongitude(lng.toString());
    setSelectedLocation({ address: name, latitude: lat, longitude: lng });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Select Event Location</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              ✕
            </button>
          </div>

          {/* Mode Selection */}
          <div className="mb-6">
            <div className="flex bg-gray-100 dark:bg-slate-700 rounded-lg p-1">
              <button
                onClick={() => setInputMode('coordinates')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  inputMode === 'coordinates'
                    ? 'bg-white dark:bg-slate-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                🧭 Enter Coordinates
              </button>
              <button
                onClick={() => setInputMode('map')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  inputMode === 'map'
                    ? 'bg-white dark:bg-slate-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                🗺️ Pick on Map
              </button>
            </div>
          </div>

          {inputMode === 'coordinates' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Location Address/Name *
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g., Blue Mountains National Park"
                  className="w-full p-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Latitude *
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    placeholder="-33.8688"
                    className="w-full p-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Longitude *
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    placeholder="151.2093"
                    className="w-full p-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Quick Location Buttons */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Quick Locations
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickLocation('Sydney Opera House', -33.8568, 151.2153)}
                    className="p-2 text-sm bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                  >
                    Sydney Opera House
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickLocation('Melbourne CBD', -37.8136, 144.9631)}
                    className="p-2 text-sm bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                  >
                    Melbourne CBD
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickLocation('Blue Mountains', -33.7269, 150.3112)}
                    className="p-2 text-sm bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                  >
                    Blue Mountains
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickLocation('Bondi Beach', -33.8915, 151.2767)}
                    className="p-2 text-sm bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                  >
                    Bondi Beach
                  </button>
                </div>
              </div>

              {/* Coordinate Preview */}
              {latitude && longitude && address && (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                  <h4 className="font-medium text-emerald-800 dark:text-emerald-200 mb-2">📍 Location Preview</h4>
                  <p className="text-sm text-emerald-700 dark:text-emerald-300">
                    <strong>{address}</strong><br />
                    Coordinates: {latitude}, {longitude}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">

                                    <div className="h-64 bg-gray-100 dark:bg-slate-700 rounded-lg overflow-hidden">
                        {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? (
                            <Wrapper apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}>
                            <GoogleMapComponent
                                onLocationSelect={(lat, lng) => {
                                setLatitude(lat.toString());
                                setLongitude(lng.toString());
                                setAddress(`Location: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
                                setSelectedLocation({
                                    address: `Location: ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
                                    latitude: lat,
                                    longitude: lng
                                });
                                }}
                                selectedLocation={
                                latitude && longitude
                                    ? {
                                        lat: parseFloat(latitude),
                                        lng: parseFloat(longitude)
                                    }
                                    : null
                                }
                            />
                            </Wrapper>
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                            <div className="text-center text-gray-500 dark:text-gray-400">
                                <MapPinIcon className="h-8 w-8 mx-auto mb-2" />
                                <p className="text-sm">Google Maps API key required</p>
                                <p className="text-xs mt-1">Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to .env.local</p>
                            </div>
                            </div>
                        )}
                        </div>
              
              {selectedLocation && (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                  <h4 className="font-medium text-emerald-800 dark:text-emerald-200 mb-2">📍 Selected Location</h4>
                  <p className="text-sm text-emerald-700 dark:text-emerald-300">
                    <strong>{selectedLocation.address}</strong><br />
                    Coordinates: {selectedLocation.latitude}, {selectedLocation.longitude}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200 dark:border-slate-600">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Save Location
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Inclusive Options Selector
const InclusiveOptionsSelector: React.FC<{
  selectedOptions: string[];
  onChange: (options: string[]) => void;
}> = ({ selectedOptions, onChange }) => {
  const toggleOption = (optionId: string) => {
    if (selectedOptions.includes(optionId)) {
      onChange(selectedOptions.filter(id => id !== optionId));
    } else {
      onChange([...selectedOptions, optionId]);
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
        🤝 Inclusive Event Options
      </label>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Select if your event is specifically designed for certain communities
      </p>
      <div className="space-y-3">
        {INCLUSIVE_OPTIONS.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => toggleOption(option.id)}
            className={`w-full p-4 text-left border rounded-lg transition-all ${
              selectedOptions.includes(option.id)
                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'
                : 'border-gray-200 dark:border-slate-600 hover:border-emerald-300 dark:hover:border-emerald-600 bg-white dark:bg-slate-700'
            }`}
          >
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{option.emoji}</span>
              <div className="flex-1">
                <div className="font-medium text-gray-900 dark:text-white">{option.label}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{option.description}</div>
              </div>
              {selectedOptions.includes(option.id) && (
                <span className="text-emerald-600 dark:text-emerald-400">✓</span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

// Difficulty Selector
const DifficultySelector: React.FC<{
  selectedDifficulty: string;
  onChange: (difficulty: string) => void;
}> = ({ selectedDifficulty, onChange }) => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
        ⚡ Event Difficulty
      </label>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Help participants understand the skill level required
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {DIFFICULTY_OPTIONS.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            className={`p-4 text-left border rounded-lg transition-all ${
              selectedDifficulty === option.id
                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'
                : 'border-gray-200 dark:border-slate-600 hover:border-emerald-300 dark:hover:border-emerald-600 bg-white dark:bg-slate-700'
            }`}
          >
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{option.emoji}</span>
              <div className="flex-1">
                <div className="font-medium text-gray-900 dark:text-white">{option.label}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{option.description}</div>
              </div>
              {selectedDifficulty === option.id && (
                <span className="text-emerald-600 dark:text-emerald-400">✓</span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

// Main Component
export default function CreateEvent() {
  const router = useRouter();
  const { activityId } = router.query;
  const { user } = useAuth();
  
  // State
  const [activity, setActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState<FormErrors>({});
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  
  const [formData, setFormData] = useState<FormData>({
    eventName: '',
    title: '',
    activityId: '',
    activityName: '',
    date: '',
    meetupTime: '',
    meetupPoint: '',
    location: '',
    description: '',
    maxParticipants: 10,
    difficulty: '',
    inclusive: [],
    isPublic: true,
    endDate: '',
    endTime: '',
    latitude: null as number | null,
  longitude: null as number | null
  });

  // Fetch activity data
  const fetchActivity = async () => {
    if (!activityId || typeof activityId !== 'string') {
      setErrors({ general: 'No activity selected. Please select an activity first.' });
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      const activityDoc = await databases.getDocument(
        DATABASE_ID,
        ACTIVITIES_COLLECTION_ID,
        activityId
      );
      
      const activityData = {
        $id: activityDoc.$id,
        activityname: activityDoc.activityname || '',
        location: activityDoc.location || '',
        description: activityDoc.description || '',
        types: Array.isArray(activityDoc.types) ? activityDoc.types : [],
        difficulty: activityDoc.difficulty || '',
        userId: activityDoc.userId || '',
        latitude: activityDoc.latitude,
        longitude: activityDoc.longitude
      };
      
      setActivity(activityData);
      
      // Pre-populate form with activity data
      setFormData(prev => ({
        ...prev,
        activityId: activityData.$id,
        activityName: activityData.activityname,
        title: `${activityData.activityname} Event`,
        eventName: `${activityData.activityname} Event`,
        meetupPoint: formatLocation(activityData.location),
        location: formatLocation(activityData.location),
        difficulty: activityData.difficulty || '',
        latitude: activityData.latitude,
        longitude: activityData.longitude
      }));
      
    } catch (error) {
      console.error('Error fetching activity:', error);
      setErrors({ general: 'Failed to load activity. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

   
    if (!formData.title.trim()) {
      newErrors.title = 'Event title is required';
    }

    if (!formData.date) {
      newErrors.date = 'Date is required';
    } else {
      const eventDate = new Date(formData.date);
      const now = new Date();
      if (eventDate <= now) {
        newErrors.date = 'Event must be scheduled for a future date';
      }
    }

    if (!formData.meetupTime) {
      newErrors.meetupTime = 'Meetup time is required';
    }

     if (!formData.meetupPoint && !formData.location) {
    newErrors.meetupPoint = 'Meeting point is required';
    // OR use: newErrors.location = 'Location is required';
  }

    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    }

    if (formData.maxParticipants < 1 || formData.maxParticipants > 100) {
      newErrors.maxParticipants = 'Max participants must be between 1 and 100';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
       
      setSubmitting(true);
      setErrors({});

      console.log('🔍 EVENT CREATION DEBUG:', {
        DATABASE_ID,
        EVENTS_COLLECTION_ID,
        userDetails: { id: user?.$id, name: user?.name }
      });

      // Prepare event data to match Appwrite Events collection schema
      const eventData = {
        // REQUIRED FIELDS
        activityId: formData.activityId,
        date: formData.date,
      meetupPoint: formData.meetupPoint || 'Sydney CBD, NSW, Australia',

        meetupTime: formData.meetupTime,
        createdBy: user!.$id,
        organizerId: user!.$id,  
        location: formData.location.trim(),
        
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),

        // OPTIONAL FIELDS
        title: formData.title.trim() || formData.eventName.trim(),
        eventName: formData.title.trim(),
        description: formData.description.trim(),
        maxParticipants: formData.maxParticipants,
        difficulty: formData.difficulty,
        isPublic: formData.isPublic,
        requiresApproval: false,
        currentParticipants: 0,
        
        // Arrays
        participants: [],
        participantIds: [],
        activityTypes: activity?.types || [],
        inclusive: formData.inclusive,
        
        // End date/time (optional)
        endDate: formData.endDate || null,
        endTime: formData.endTime || null,
        
        // Coordinates
        latitude: formData.latitude || -33.8688,
      longitude: formData.longitude || 151.2093,
      };

      if (eventData.meetupPoint.includes('Location:') && eventData.latitude && eventData.longitude) {
      // If we have a coordinate-based address, make it more readable
      eventData.meetupPoint = `Event Location (${eventData.latitude.toFixed(4)}, ${eventData.longitude.toFixed(4)})`;
      eventData.location = eventData.meetupPoint;
    }
      console.log('🚀 Creating event with data:', eventData);

      const newEvent = await databases.createDocument(
        DATABASE_ID,
        EVENTS_COLLECTION_ID,
        ID.unique(),
        eventData
      );

      console.log('✅ Event created successfully:', newEvent.$id);
      
      // Redirect to the new event
      router.push(`/events/${newEvent.$id}`);
      
    } catch (error: any) {
      console.error('❌ Error creating event:', error);
      
      if (error.message && error.message.includes('meetupTime')) {
        setErrors({ general: 'Missing meetup time. Please ensure all required fields are filled.' });
      } else if (error.message && error.message.includes('createdBy')) {
        setErrors({ general: 'Authentication error. Please try logging in again.' });
      } else {
        setErrors({ general: `Failed to create event: ${error.message}` });
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Handle input changes
  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  // Handle location selection
  const handleLocationSelect = (locationData: LocationData) => {
    setFormData(prev => ({
      ...prev,
      meetupPoint: locationData.address,
      location: locationData.address,
      latitude: locationData.latitude,
      longitude: locationData.longitude
    }));
    setShowLocationPicker(false);
  };

  // Auth check
  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    fetchActivity();
  }, [user, activityId]);

  if (loading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-600"></div>
        </div>
      </MainLayout>
    );
  }

  if (errors.general && !activity) {
    return (
      <MainLayout>
        <div className="max-w-2xl mx-auto p-6">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
            <h1 className="text-xl font-bold text-red-900 dark:text-red-200 mb-2">Cannot Create Event</h1>
            <p className="text-red-700 dark:text-red-300 mb-4">{errors.general}</p>
            <button
              onClick={() => router.push('/activities')}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
            >
              Browse Activities
            </button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push(`/activities/${activityId}`)}
            className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400 hover:underline mb-4"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            <span>Back to {activity?.activityname}</span>
          </button>
          
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Create New Event</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Create an event for <span className="font-medium text-emerald-600 dark:text-emerald-400">{activity?.activityname}</span>
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[
              { number: 1, title: 'Event Details' },
              { number: 2, title: 'Event Settings' },
              { number: 3, title: 'Review & Create' }
            ].map((step) => (
              <div key={step.number} className="flex items-center">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                  ${currentStep >= step.number 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-gray-200 dark:bg-slate-600 text-gray-600 dark:text-gray-400'
                  }
                `}>
                  {step.number}
                </div>
                <span className={`ml-2 text-sm ${currentStep >= step.number ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500 dark:text-gray-400'}`}>
                  {step.title}
                </span>
                {step.number < 3 && (
                  <div className={`mx-4 h-px w-12 ${currentStep > step.number ? 'bg-emerald-600' : 'bg-gray-200 dark:bg-slate-600'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-600 p-6">
          {errors.general && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-700 dark:text-red-300">{errors.general}</p>
            </div>
          )}

                            {/* Step 1: Event Details */}
                            {currentStep === 1 && (
                                <div className="space-y-6">
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Event Details</h2>
                                
                                

                                {/* ✅ UPDATED: Single Event Title field that syncs both values */}
                    <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Event Title *
                    </label>
                    <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => {
                        const newTitle = e.target.value;
                        setFormData(prev => ({ 
                            ...prev, 
                            title: newTitle,
                            eventName: newTitle  // ✅ Sync eventName with title
                        }));
                        }}
                        placeholder="Enter event title"
                        className="w-full px-4 py-3 bg-white text-gray-900 placeholder-gray-500 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        autoComplete="off"
                    />
                    {errors.title && (
                        <p className="text-red-500 text-sm mt-1">{errors.title}</p>
                    )}
                    </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleInputChange('date', e.target.value)}
                    min={getMinDate()}
                    className={`w-full p-3 border rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                      errors.date ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-slate-600'
                    }`}
                  />
                  {errors.date && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.date}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Meetup Time *
                  </label>
                  <input
                    type="time"
                    value={formData.meetupTime}
                    onChange={(e) => handleInputChange('meetupTime', e.target.value)}
                    className={`w-full p-3 border rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                      errors.meetupTime ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-slate-600'
                    }`}
                  />
                  {errors.meetupTime && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.meetupTime}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    End Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={formData.endDate || ''}
                    onChange={(e) => handleInputChange('endDate', e.target.value)}
                    min={formData.date || getMinDate()}
                    className="w-full p-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    End Time (Optional)
                  </label>
                  <input
                    type="time"
                    value={formData.endTime || ''}
                    onChange={(e) => handleInputChange('endTime', e.target.value)}
                    className="w-full p-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Meeting Point *
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={formData.meetupPoint}
                    onChange={(e) => handleInputChange('meetupPoint', e.target.value)}
                    placeholder="Where should participants meet?"
                    className={`flex-1 p-3 border rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                      errors.meetupPoint ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-slate-600'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowLocationPicker(true)}
                    className="px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center space-x-2"
                  >
                    <MapPinIcon className="h-4 w-4" />
                    <span>Map</span>
                  </button>
                </div>
                {errors.meetupPoint && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.meetupPoint}</p>
                )}
                {formData.latitude && formData.longitude && (
                  <p className="mt-1 text-sm text-emerald-600 dark:text-emerald-400">
                    📍 {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Provide details about the event, what to expect, etc."
                  rows={4}
                  className="w-full p-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Max Participants *
                </label>
                <input
                  type="number"
                  value={formData.maxParticipants}
                  onChange={(e) => handleInputChange('maxParticipants', parseInt(e.target.value) || 1)}
                  min="1"
                  max="100"
                  className={`w-full p-3 border rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                    errors.maxParticipants ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-slate-600'
                  }`}
                />
                {errors.maxParticipants && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.maxParticipants}</p>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Event Settings */}
          {currentStep === 2 && (
            <div className="space-y-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Event Settings</h2>
              
              {/* Inclusive Options */}
              <InclusiveOptionsSelector
                selectedOptions={formData.inclusive}
                onChange={(options) => handleInputChange('inclusive', options)}
              />

              {/* Difficulty */}
              <DifficultySelector
                selectedDifficulty={formData.difficulty}
                onChange={(difficulty) => handleInputChange('difficulty', difficulty)}
              />

              {/* Privacy Setting */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  🔒 Privacy Settings
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="isPublic"
                    checked={formData.isPublic}
                    onChange={(e) => handleInputChange('isPublic', e.target.checked)}
                    className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <label htmlFor="isPublic" className="text-sm text-gray-700 dark:text-gray-300">
                    Make this event public (anyone can join)
                  </label>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Private events are only visible to people you invite
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Review & Create</h2>
              
              <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">{formData.eventName}</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-500 dark:text-gray-400">Activity:</span>
                    <p className="text-gray-900 dark:text-white">{formData.activityName}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-500 dark:text-gray-400">Date & Time:</span>
                    <p className="text-gray-900 dark:text-white">
                      {formData.date && formData.meetupTime 
                        ? `${new Date(formData.date).toLocaleDateString()} at ${formData.meetupTime}`
                        : 'Not set'}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-500 dark:text-gray-400">Meeting Point:</span>
                    <p className="text-gray-900 dark:text-white">{formData.meetupPoint}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-500 dark:text-gray-400">Max Participants:</span>
                    <p className="text-gray-900 dark:text-white">{formData.maxParticipants}</p>
                  </div>
                  {formData.difficulty && (
                    <div>
                      <span className="font-medium text-gray-500 dark:text-gray-400">Difficulty:</span>
                      <p className="text-gray-900 dark:text-white">
                        {DIFFICULTY_OPTIONS.find(d => d.id === formData.difficulty)?.label || formData.difficulty}
                      </p>
                    </div>
                  )}
                  <div>
                    <span className="font-medium text-gray-500 dark:text-gray-400">Visibility:</span>
                    <p className="text-gray-900 dark:text-white">{formData.isPublic ? 'Public' : 'Private'}</p>
                  </div>
                </div>

                {formData.description && (
                  <div className="mt-4">
                    <span className="font-medium text-gray-500 dark:text-gray-400">Description:</span>
                    <p className="text-gray-900 dark:text-white mt-1">{formData.description}</p>
                  </div>
                )}

                {formData.inclusive.length > 0 && (
                  <div className="mt-4">
                    <span className="font-medium text-gray-500 dark:text-gray-400">Inclusive Options:</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {formData.inclusive.map((optionId) => {
                        const option = INCLUSIVE_OPTIONS.find(o => o.id === optionId);
                        return option ? (
                          <span key={optionId} className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 rounded text-xs">
                            {option.emoji} {option.label}
                          </span>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}

                {formData.endDate && (
                  <div className="mt-4">
                    <span className="font-medium text-gray-500 dark:text-gray-400">End:</span>
                    <p className="text-gray-900 dark:text-white">
                      {new Date(formData.endDate).toLocaleDateString()}
                      {formData.endTime && ` at ${formData.endTime}`}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStep(currentStep - 1)}
                className="px-6 py-2 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700"
              >
                Previous
              </button>
            ) : (
              <div />
            )}

            {currentStep < 3 ? (
              <button
                type="button"
                onClick={() => setCurrentStep(currentStep + 1)}
                className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
              >
                Next
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Creating Event...' : 'Create Event'}
              </button>
            )}
          </div>
        </div>

        {/* Location Picker Modal */}
        <MapLocationPicker
          isOpen={showLocationPicker}
          onClose={() => setShowLocationPicker(false)}
          onLocationSelect={handleLocationSelect}
          initialLocation={
            formData.latitude && formData.longitude
              ? {
                  address: formData.meetupPoint,
                  latitude: formData.latitude,
                  longitude: formData.longitude
                }
              : null
          }
        />
      </div>
    </MainLayout>
  );
}