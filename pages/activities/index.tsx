// pages/activities/index.tsx - Enhanced with Mobile App Structure & Map Integration
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import MainLayout from '../../components/layout/MainLayout';
import ActivityCard from '../../components/activities/ActivityCard';
import ActivitiesMap from '../../components/activities/ActivitiesMap';
import { useAuth } from '../../contexts/AuthContext';
import { databases, DATABASE_ID, ACTIVITIES_COLLECTION_ID, EVENTS_COLLECTION_ID, APP_CONFIG_COLLECTION_ID, Query } from '../../lib/appwrite';
import { 
  AdjustmentsHorizontalIcon,} from '@heroicons/react/24/outline';
import ActivityLocationPicker from '../../components/activities/ActivityLocationPicker';

// Enhanced interfaces matching mobile app
interface Activity {
  $id: string;
  activityname: string;
  location: string | { 
    address: string; 
    latitude: number; 
    longitude: number; 
  };
  description?: string;
  types: string[];
  subTypes?: string[];
  typeSpecificData?: Record<string, any>;
  isPrivate: boolean;
  userId: string;
  createdBy: string;
  latitude?: number;
  longitude?: number;
  externalUrls?: string[];
  createdAt: string;
  updatedAt?: string;
  eventCount?: number;
  hasLocationData?: boolean;
}

interface SearchFilters {
  search: string;
  location: {
    address: string;
    latitude: number;
    longitude: number;
  } | null;
  maxDistance: number;
  types: string[];
  hasEvents: boolean;
  privacy: 'all' | 'public' | 'private';
  myActivitiesOnly: boolean;
}

interface ActivityType {
  id: string;
  label: string;
  emoji: string;
}

// Default activity types (Australian standards)
const DEFAULT_ACTIVITY_TYPES: ActivityType[] = [
  { id: 'hike', label: 'Hiking', emoji: '🥾' },
  { id: 'bike', label: 'Cycling', emoji: '🚴‍♂️' },
  { id: 'run', label: 'Running', emoji: '🏃‍♂️' },
  { id: 'climbing', label: 'Climbing', emoji: '🧗‍♂️' },
  { id: 'scuba', label: 'Scuba Diving', emoji: '🤿' },
  { id: 'swimming', label: 'Swimming', emoji: '🏊‍♂️' },
  { id: 'kayaking', label: 'Kayaking', emoji: '🛶' },
  { id: 'snow', label: 'Snow Sports', emoji: '⛷️' },
  { id: 'surfing', label: 'Surfing', emoji: '🏄‍♂️' },
  { id: 'camping', label: 'Camping', emoji: '🏕️' },
  { id: 'fishing', label: 'Fishing', emoji: '🎣' },
  { id: 'sailing', label: 'Sailing/Boating', emoji: '⛵' },
  { id: 'fourwd', label: '4WD/Off-Road', emoji: '🚙' },
  { id: 'sup', label: 'Stand-Up Paddleboarding', emoji: '🏄‍♀️' }
];



// Enhanced Location Picker matching mobile app
const LocationPicker: React.FC<{
  onLocationSelect: (location: { address: string; latitude: number; longitude: number }) => void;
  onClear: () => void;
  currentLocation: { address: string; latitude: number; longitude: number } | null;
}> = ({ onLocationSelect, onClear, currentLocation }) => {
  const [coordinates, setCoordinates] = useState({
    latitude: currentLocation?.latitude?.toString() || '',
    longitude: currentLocation?.longitude?.toString() || ''
  });
  const [address, setAddress] = useState(currentLocation?.address || '');
  const [showMapPicker, setShowMapPicker] = useState(false);
const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  // Quick locations for Australia
  const quickLocations = [
    { name: 'Sydney', lat: -33.8688, lng: 151.2093 },
    { name: 'Melbourne', lat: -37.8136, lng: 144.9631 },
    { name: 'Brisbane', lat: -27.4698, lng: 153.0251 },
    { name: 'Perth', lat: -31.9505, lng: 115.8605 },
    { name: 'Adelaide', lat: -34.9285, lng: 138.6007 },
    { name: 'Gold Coast', lat: -28.0167, lng: 153.4000 },
    { name: 'Newcastle', lat: -32.9267, lng: 151.7789 },
    { name: 'Wollongong', lat: -34.4278, lng: 150.8931 }
  ];

  const handleMapClick = (lat: number, lng: number) => {
    setCoordinates({
      latitude: lat.toString(),
      longitude: lng.toString()
    });
    setAddress(`Location: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
  };

  const handleLocationSubmit = () => {
    if (coordinates.latitude && coordinates.longitude && address) {
      onLocationSelect({
        address,
        latitude: parseFloat(coordinates.latitude),
        longitude: parseFloat(coordinates.longitude)
      });
    }
  };

  // Add this useEffect to get user location
useEffect(() => {
  const getUserLocation = async () => {
    try {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setUserLocation({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            });
          },
          (error) => {
            console.log('Location access denied or unavailable:', error);
            // Optionally set a default location (Sydney)
            setUserLocation({
              latitude: -33.8688,
              longitude: 151.2093
            });
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000 // 5 minutes
          }
        );
      } else {
        console.log('Geolocation not supported');
        // Set default location (Sydney)
        setUserLocation({
          latitude: -33.8688,
          longitude: 151.2093
        });
      }
    } catch (error) {
      console.error('Error getting user location:', error);
      // Set default location (Sydney)
      setUserLocation({
        latitude: -33.8688,
        longitude: 151.2093
      });
    }
  };

  getUserLocation();
}, []);

  return (
    <div className="space-y-4">
      {/* Location Input Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">📍 Search Location</h3>
        {currentLocation && (
          <button
            onClick={onClear}
            className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
          >
            Clear Location
          </button>
        )}
      </div>

      {/* Mode Toggle */}
      <div className="flex space-x-2">
        <button
          onClick={() => setShowMapPicker(false)}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
            !showMapPicker
              ? 'bg-emerald-600 text-white'
              : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
          }`}
        >
          📍 Enter Details
        </button>
        <button
          onClick={() => setShowMapPicker(true)}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
            showMapPicker
              ? 'bg-emerald-600 text-white'
              : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
          }`}
        >
          🗺️ Pick on Map
        </button>
      </div>

      {!showMapPicker ? (
        // Manual Entry Mode
        <div className="space-y-4">
          {/* Address Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Location Name/Address
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter location or address..."
              className="w-full p-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          {/* Coordinates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Latitude
              </label>
              <input
                type="number"
                step="any"
                value={coordinates.latitude}
                onChange={(e) => setCoordinates(prev => ({ ...prev, latitude: e.target.value }))}
                placeholder="-33.8688"
                className="w-full p-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Longitude
              </label>
              <input
                type="number"
                step="any"
                value={coordinates.longitude}
                onChange={(e) => setCoordinates(prev => ({ ...prev, longitude: e.target.value }))}
                placeholder="151.2093"
                className="w-full p-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Quick Locations */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Quick Locations
            </label>
            <div className="flex flex-wrap gap-2">
              {quickLocations.map((location) => (
                <button
                  key={location.name}
                  onClick={() => {
                    setCoordinates({ 
                      latitude: location.lat.toString(), 
                      longitude: location.lng.toString() 
                    });
                    setAddress(location.name);
                  }}
                  className="px-3 py-2 text-sm bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 rounded-full hover:bg-emerald-200 dark:hover:bg-emerald-800 transition-colors"
                >
                  {location.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        // Map Picker Mode
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Click on Map to Select Location
            </label>
            <div 
              className="w-full h-64 bg-gray-100 dark:bg-slate-700 rounded-lg border-2 border-dashed border-gray-300 dark:border-slate-600 flex items-center justify-center cursor-crosshair relative overflow-hidden"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                // Convert to lat/lng (simplified calculation for demo)
                const lat = -33.8688 + (y - rect.height/2) * 0.0005;
                const lng = 151.2093 + (x - rect.width/2) * 0.0005;
                handleMapClick(lat, lng);
              }}
            >
              <div className="text-center text-gray-500 dark:text-gray-400">
                <div className="text-4xl mb-2">🗺️</div>
                <p className="text-sm font-medium">Click anywhere to set location</p>
                <p className="text-xs mt-2">
                  {coordinates.latitude && coordinates.longitude 
                    ? `📍 ${parseFloat(coordinates.latitude).toFixed(4)}, ${parseFloat(coordinates.longitude).toFixed(4)}`
                    : 'No location selected'
                  }
                </p>
              </div>
              
              {/* Visual marker if location selected */}
              {coordinates.latitude && coordinates.longitude && (
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-red-500 text-2xl">
                  📍
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Current Selection Display */}
      {currentLocation && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
          <h4 className="font-medium text-emerald-700 dark:text-emerald-300 mb-1">Current Search Location:</h4>
          <p className="text-sm text-emerald-600 dark:text-emerald-400">
            📍 {currentLocation.address}
          </p>
          <p className="text-xs text-emerald-500 dark:text-emerald-500">
            {currentLocation.latitude.toFixed(4)}, {currentLocation.longitude.toFixed(4)}
          </p>
        </div>
      )}

      {/* Set Location Button */}
      <button
        onClick={handleLocationSubmit}
        disabled={!coordinates.latitude || !coordinates.longitude || !address}
        className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
      >
        Set Search Location
      </button>
    </div>
  );
};

// Main Activities Component
const Activities: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();
  
  // State
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activityTypes, setActivityTypes] = useState<ActivityType[]>(DEFAULT_ACTIVITY_TYPES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [activeTab, setActiveTab] = useState<'public' | 'mine'>('public');
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  
  const [filters, setFilters] = useState<SearchFilters>({
    search: '',
    location: null as { address: string; latitude: number; longitude: number } | null,
    maxDistance: 500,
    types: []as string[],
    hasEvents: false,
    privacy: 'all',
    myActivitiesOnly: false
  });
  const [showLocationPicker, setShowLocationPicker] = useState(false);


  // Enhanced distance calculation
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Load activity types from app config
  const loadActivityTypes = useCallback(async () => {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        APP_CONFIG_COLLECTION_ID,
        [Query.equal('key', 'activity_types')]
      );

      if (response.documents.length > 0) {
        const doc = response.documents[0];
        const types = Array.isArray(doc.values) ? doc.values : [];
        
        let displayLabels: Record<string, string> = {};
        if (doc.display_labels) {
          try {
            displayLabels = typeof doc.display_labels === 'string' 
              ? JSON.parse(doc.display_labels) 
              : doc.display_labels;
          } catch (e) {
            console.warn('Failed to parse display labels');
          }
        }

        const mappedTypes = types.map((type: string) => {
          const defaultType = DEFAULT_ACTIVITY_TYPES.find(dt => dt.id === type);
          return {
            id: type,
            label: displayLabels[type] || defaultType?.label || type,
            emoji: defaultType?.emoji || '🎯'
          };
        });

        setActivityTypes(mappedTypes);
      } else {
        setActivityTypes(DEFAULT_ACTIVITY_TYPES);
      }
    } catch (error) {
      console.error('Error loading activity types:', error);
      setActivityTypes(DEFAULT_ACTIVITY_TYPES);
    }
  }, []);

  // Enhanced fetch activities with privacy and event counts
  const fetchActivities = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all activities
      const response = await databases.listDocuments(
        DATABASE_ID,
        ACTIVITIES_COLLECTION_ID,
        [
          Query.orderDesc('$createdAt'),
          Query.limit(100)
        ]
      );

      // Filter based on privacy and user permissions
      const visibleActivities = response.documents.filter((activity: any) => {
        if (!activity.isPrivate) return true; // Public activities
        if (activity.isPrivate && activity.createdBy === user?.$id) return true; // User's private activities
        return false; // Hide others' private activities
      });

      // Get event counts and location data for each activity
      const activitiesWithMetadata = await Promise.all(
        visibleActivities.map(async (activity: any) => {
          try {
            // Count events for this activity
            const eventsResponse = await databases.listDocuments(
              DATABASE_ID,
              EVENTS_COLLECTION_ID,
              [
                Query.equal('activityId', activity.$id),
                Query.limit(1000)
              ]
            );

            // Parse location and determine if it has coordinates
            let hasLocationData = false;
            if (activity.latitude && activity.longitude) {
              hasLocationData = true;
            } else if (typeof activity.location === 'object' && 
                      activity.location?.latitude && activity.location?.longitude) {
              hasLocationData = true;
            }

            return {
              ...activity,
              eventCount: eventsResponse.documents.length,
              hasLocationData
            } as Activity;
          } catch (error) {
            console.warn(`Failed to fetch event count for activity ${activity.$id}:`, error);
            return {
              ...activity,
              eventCount: 0,
              hasLocationData: false
            } as Activity;
          }
        })
      );

      setActivities(activitiesWithMetadata);

    } catch (err: any) {
      console.error('Error fetching activities:', err);
      setError(err.message || 'Failed to load activities');
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  // Enhanced search and filtering
  const getFilteredActivities = useCallback(() => {
  let filtered = [...activities];

  // Tab filter (existing)
  if (activeTab === 'mine') {
    if (!user) return [];
    filtered = filtered.filter(activity => activity.createdBy === user.$id);
  } else {
    filtered = filtered.filter(activity => 
      !activity.isPrivate || activity.createdBy === user?.$id
    );
  }

  // Search filter
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    filtered = filtered.filter(activity => 
      activity.activityname.toLowerCase().includes(searchLower) ||
      activity.description?.toLowerCase().includes(searchLower) ||
      (typeof activity.location === 'string' 
        ? activity.location.toLowerCase().includes(searchLower)
        : activity.location?.address?.toLowerCase().includes(searchLower))
    );
  }

  // Location filter
  if (filters.location && filters.maxDistance) {
    filtered = filtered.filter(activity => {
      if (!activity.hasLocationData) return false;
      
      let activityLat, activityLng;
      if (activity.latitude && activity.longitude) {
        activityLat = activity.latitude;
        activityLng = activity.longitude;
      } else if (typeof activity.location === 'object' && 
                activity.location?.latitude && activity.location?.longitude) {
        activityLat = activity.location.latitude;
        activityLng = activity.location.longitude;
      } else {
        return false;
      }

      const distance = calculateDistance(
        filters.location!.latitude,
        filters.location!.longitude,
        activityLat,
        activityLng
      );
      return distance <= filters.maxDistance;
    });
  }

  // Activity types filter
  if (filters.types.length > 0) {
    filtered = filtered.filter(activity => {
      if (!activity.types || activity.types.length === 0) return false;
      return filters.types.some(filterType => 
        activity.types.includes(filterType)
      );
    });
  }

  // Has events filter (📅 Only show activities with events)
  if (filters.hasEvents) {
    filtered = filtered.filter(activity => (activity.eventCount || 0) > 0);
  }

  return filtered;
}, [activities, activeTab, filters, user]);

  const filteredActivities = getFilteredActivities();
  const activitiesWithLocation = filteredActivities.filter(a => a.hasLocationData);

  // Clear all filters
  const clearAllFilters = () => {
    setFilters({
      search: '',
      location: null,
      maxDistance: 50,
      types: [],
      hasEvents: false,
      privacy: 'all',
      myActivitiesOnly: false
    });
  };

  // Get active filter count
  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.location) count++;
    if (filters.types.length > 0) count++;
    if (filters.hasEvents) count++;
    if (filters.privacy !== 'all') count++;
    return count;
  };

  // Format location display
  const formatLocation = (location: string | { address: string; latitude: number; longitude: number; }) => {
    if (typeof location === 'string') {
      return location;
    }
    return location.address || `${location.latitude}, ${location.longitude}`;
  };

  // Load data on mount
  useEffect(() => {
    loadActivityTypes();
    fetchActivities();
  }, [loadActivityTypes, user?.$id]);

  // Icon components
  const SearchIcon = ({ className = "h-5 w-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );

  
  const FilterIcon = ({ className = "h-5 w-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
    </svg>
  );

  const MapIcon = ({ className = "h-5 w-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );

  const ListIcon = ({ className = "h-5 w-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
    </svg>
  );

  const PlusIcon = ({ className = "h-5 w-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  );

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-96">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Something went wrong</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <button
            onClick={fetchActivities}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header - Mobile App Style */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Activities</h1>
            <p className="text-gray-600 dark:text-gray-400">
              {filters.location 
                ? `Search area: ${filters.location.address}` 
                : 'Discover outdoor activities in your area'
              }
            </p>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
              className={`p-2 rounded-lg transition-colors ${
                showAdvancedSearch || getActiveFilterCount() > 0
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
              }`}
            >
              <SearchIcon className="h-5 w-5" />
            </button>
            
            <button
              onClick={() => router.push('/activities/create')}
              className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
            >
              <PlusIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Search Bar - Mobile App Style 

        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <SearchIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            placeholder="Search activities by name, description, location..."
            className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>*/}



        {/* Advanced Search Panel */}
        

        {/* Tabs - Mobile App Style */}
        <div className="flex bg-gray-100 dark:bg-slate-700 rounded-lg p-1">
          {([
            { key: 'public', label: `👥 Public Activities (${activities.filter(a => !a.isPrivate || a.createdBy === user?.$id).length})` },
            { key: 'mine', label: `👤 My Activities (${activities.filter(a => a.createdBy === user?.$id).length})` }
          ] as const).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'bg-white dark:bg-slate-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Interface */}
<div className="mb-6">
  {/* Main Search Bar 
  <div className="relative">
    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
      <SearchIcon className="h-5 w-5 text-gray-400" />
    </div>
    <input
      type="text"
      value={filters.search}
      onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
      placeholder="Search activities by name, description, or location..."
      className="block w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-slate-600 rounded-lg 
                 bg-white dark:bg-slate-800 text-gray-900 dark:text-white 
                 placeholder-gray-500 dark:placeholder-gray-400 
                 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
    />
    <button
      onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
      className="absolute inset-y-0 right-0 pr-3 flex items-center"
    >
      <AdjustmentsHorizontalIcon className={`h-5 w-5 transition-colors ${
        showAdvancedSearch ? 'text-emerald-600' : 'text-gray-400'
      }`} />
    </button>
  </div>*/}

  {/* Advanced Search Filters */}
  {showAdvancedSearch && (
    <div className="mt-4 p-4 bg-gray-50 dark:bg-slate-700 rounded-lg space-y-4">
      
      {/* Location & Distance Section */}
<div className="space-y-4">
  <h4 className="font-medium text-gray-900 dark:text-white">📍 Location & Distance</h4>
  
  {/* Location Selection Button */}
  <button
    onClick={() => setShowLocationPicker(true)}
    className="w-full p-4 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-left hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
  >
    {filters.location ? (
      <div>
        <p className="text-sm font-medium text-gray-900 dark:text-white">
          📍 {filters.location.address}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {filters.location.latitude.toFixed(4)}, {filters.location.longitude.toFixed(4)}
        </p>
      </div>
    ) : (
      <div className="flex items-center justify-between">
        <span className="text-gray-500 dark:text-gray-400">Select search location...</span>
        <span className="text-emerald-600">🗺️</span>
      </div>
    )}
  </button>

  {/* Distance Slider */}
  {filters.location && (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Distance
        </label>
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {filters.maxDistance} km
        </span>
      </div>
      <input
        type="range"
        min="1"
        max="100"
        value={filters.maxDistance}
        onChange={(e) => setFilters(prev => ({ ...prev, maxDistance: parseInt(e.target.value) }))}
        className="w-full h-2 bg-gray-200 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer"
      />
      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>1km</span>
        <span>100km</span>
      </div>
    </div>
  )}
</div>
      {/* Activity Types Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          🏃 Activity Types
        </label>
        <div className="flex flex-wrap gap-2">
          {DEFAULT_ACTIVITY_TYPES.map((type) => (
            <button
              key={type.id}
              onClick={() => {
                setFilters(prev => ({
                  ...prev,
                  types: prev.types.includes(type.id)
                    ? prev.types.filter(t => t !== type.id)
                    : [...prev.types, type.id]
                }));
              }}
              className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm transition-colors ${
                filters.types.includes(type.id)
                  ? 'bg-emerald-500 text-white'
                  : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700'
              }`}
            >
              <span>{type.emoji}</span>
              <span>{type.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Only show activities with events toggle */}
      <div className="flex items-center space-x-3">
        <input
          type="checkbox"
          id="hasEvents"
          checked={filters.hasEvents}
          onChange={(e) => setFilters(prev => ({ ...prev, hasEvents: e.target.checked }))}
          className="h-4 w-4 text-emerald-600 border-gray-300 dark:border-slate-600 rounded 
                     focus:ring-emerald-500 bg-white dark:bg-slate-800"
        />
        <label htmlFor="hasEvents" className="text-sm font-medium text-gray-700 dark:text-gray-300">
          📅 Only show activities with events
        </label>
      </div>




      {/* Clear Filters */}
      {(filters.search || filters.location || filters.types.length > 0 || filters.hasEvents) && (
        <button
          onClick={() => setFilters({
            search: '',
            location: null,
            maxDistance: 500,
            types: [],
            hasEvents: false,
            privacy: 'all',
    myActivitiesOnly: false
          })}
          className="text-sm text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 font-medium"
        >
          Clear all filters
        </button>
      )}
    </div>
  )}
</div>

        {/* View Mode Toggle - Mobile App Style */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {filteredActivities.length} {filteredActivities.length === 1 ? 'activity' : 'activities'}
              {activitiesWithLocation.length > 0 && (
                <span> • {activitiesWithLocation.length} with location</span>
              )}
            </span>
          </div>
          
          <div className="flex bg-gray-100 dark:bg-slate-700 rounded-lg p-1">
            {([
              { mode: 'list', icon: ListIcon, label: 'List' },
              { mode: 'map', icon: MapIcon, label: `Map (${activitiesWithLocation.length})` }
            ] as const).map(({ mode, icon: Icon, label }) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`flex items-center space-x-1 px-3 py-2 rounded transition-colors ${
                  viewMode === mode
                    ? 'bg-white dark:bg-slate-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="text-sm">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Activities Content */}
        {viewMode === 'map' ? (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6">
            {activitiesWithLocation.length > 0 ? (
              <>
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    🗺️ Activities Map
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Showing {activitiesWithLocation.length} activities with location data
                    {filters.location && ` within ${filters.maxDistance}km of ${filters.location.address}`}
                  </p>
                </div>
                <ActivitiesMap
  activities={activitiesWithLocation.map(activity => ({
    ...activity,
    userId: activity.userId || activity.createdBy,
  }))}
  onActivitySelect={(activity) => router.push(`/activities/${activity.$id}`)}
  searchLocation={filters.location}
  searchRadius={filters.maxDistance}
/>
              </>
            ) : (
              <div className="text-center py-12">
                <MapIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
                  No activities with location data
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Activities need coordinates to appear on the map
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredActivities.length > 0 ? (
              filteredActivities.map((activity: Activity) => (
                <div
                  key={activity.$id}
                  onClick={() => router.push(`/activities/${activity.$id}`)}
                  className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6 hover:shadow-md transition-all cursor-pointer"
                >
                  {/* Activity Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                        {activity.activityname}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                        📍 {formatLocation(activity.location)}
                      </p>
                    </div>
                    <div className="ml-3 flex flex-col items-end gap-1">
                      {activity.isPrivate ? (
                        <span className="inline-flex items-center gap-1 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 text-xs px-2 py-1 rounded-full">
                          🔒 Private
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 text-xs px-2 py-1 rounded-full">
                          🌍 Public
                        </span>
                      )}
                      {activity.createdBy === user?.$id && (
                        <span className="inline-flex items-center gap-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs px-2 py-1 rounded-full">
                          👤 Yours
                        </span>
                      )}
                      {activity.hasLocationData && (
                        <span className="inline-flex items-center gap-1 bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 text-xs px-2 py-1 rounded-full">
                          🗺️ Mapped
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  {activity.description && (
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-4 line-clamp-2">
                      {activity.description}
                    </p>
                  )}

                  {/* Activity Types */}
                  {activity.types && activity.types.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {activity.types.slice(0, 3).map((type, index) => {
                        const typeInfo = activityTypes.find(t => t.id === type);
                        return (
                          <span
                            key={index}
                            className="bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 px-2 py-1 rounded text-xs"
                          >
                            {typeInfo?.emoji} {typeInfo?.label || type}
                          </span>
                        );
                      })}
                      {activity.types.length > 3 && (
                        <span className="bg-gray-100 dark:bg-slate-600 text-gray-600 dark:text-gray-400 px-2 py-1 rounded text-xs">
                          +{activity.types.length - 3} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Stats */}
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>
                      📅 {activity.eventCount || 0} event{(activity.eventCount || 0) !== 1 ? 's' : ''}
                    </span>
                    <span>
                      Created {new Date(activity.createdAt).toLocaleDateString('en-AU', {
                        month: 'short',
                        day: 'numeric',
                        year: new Date(activity.createdAt).getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
                      })}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-12">
                  <div className="text-6xl mb-4">🎯</div>
                  <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
                    {activeTab === 'mine' 
                      ? "You haven't created any activities yet"
                      : filters.search || getActiveFilterCount() > 0
                      ? "No activities match your search"
                      : "No activities found"
                    }
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto">
                    {activeTab === 'mine'
                      ? "Create your first activity to start building your adventure community!"
                      : filters.search || getActiveFilterCount() > 0
                      ? "Try adjusting your search filters or clearing them to see more activities"
                      : "Be the first to create an activity in your area and start building a community"
                    }
                  </p>
                  <div className="flex justify-center space-x-4">
                    <button
                      onClick={() => router.push('/activities/create')}
                      className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg transition-colors font-medium"
                    >
                      <PlusIcon className="h-4 w-4" />
                      {activeTab === 'mine' ? 'Create Your First Activity' : 'Create Activity'}
                    </button>
                    {(filters.search || getActiveFilterCount() > 0) && (
                      <button
                        onClick={clearAllFilters}
                        className="inline-flex items-center gap-2 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-300 px-6 py-3 rounded-lg transition-colors font-medium"
                      >
                        <FilterIcon className="h-4 w-4" />
                        Clear Filters
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Location Picker Modal */}
<ActivityLocationPicker
  isOpen={showLocationPicker}
  onClose={() => setShowLocationPicker(false)}
  onLocationSelect={(location) => {
    setFilters(prev => ({ ...prev, location }));
  }}
  onClear={() => {
    setFilters(prev => ({ ...prev, location: null }));
  }}
  currentLocation={filters.location}
/>

        {/* Refresh Button */}
        <div className="flex justify-center pt-6">
          <button
            onClick={fetchActivities}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
          >
            <svg className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh Activities
          </button>
        </div>
      </div>
    </MainLayout>
  );
};

export default Activities;