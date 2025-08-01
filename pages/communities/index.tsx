
// pages/communities/index.tsx (if using Pages Router)
// OR app/communities/page.tsx (if using App Router)

import React, { useState, useEffect ,useCallback } from 'react';
import { useCommunities } from '../../hooks/useCommunities';
import { CommunityCard } from '../../components/CommunityCard';
import { useRouter } from 'next/router'; // or 'next/navigation' for App Router
import MainLayout from '@/components/layout/MainLayout'; // Adjust path as needed
import { useAuth } from '../../contexts/AuthContext';
import { databases, DATABASE_ID, COMMUNITIES_COLLECTION_ID, APP_CONFIG_COLLECTION_ID, Query } from '../../lib/appwrite';
import { AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline';
import ActivityLocationPicker from '../../components/activities/ActivityLocationPicker';
import { Wrapper } from '@googlemaps/react-wrapper';
import GoogleMapComponent from '../../components/GoogleMapComponent';
import CommunitiesMap from '../../components/CommunitiesMap';


const SearchIcon = ({ className = "h-5 w-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
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
// Enhanced Community interface with metadata
interface Community {
  $id: string;
  name: string;
  description?: string;
  type: 'public' | 'private';
  creatorId: string;
  admins: string[];
  members: string[];
  pendingMembers?: string[];
  activityTypes: string[];
  location?: {
    address: string;
    latitude: number;
    longitude: number;
    radius?: number;
  };
  avatar?: string;
  coverImage?: string;
  memberCount: number;
  activityCount?: number;
  eventCount?: number;
  upcomingEventCount?: number;
  isActive: boolean;
  settings: {
    autoApproveMembers: boolean;
    allowMemberEvents: boolean;
    allowMemberPosts: boolean;
    requireEventApproval: boolean;
  };
  createdAt: string;
  updatedAt?: string;
  hasLocationData?: boolean;
  distance?: number; // Distance from search location
}

// Search filters interface
interface SearchFilters {
  search: string;
  location: {
    address: string;
    latitude: number;
    longitude: number;
  } | null;
  maxDistance: number;
  activityTypes: string[];
  communityType: 'all' | 'public' | 'private';
  hasUpcomingEvents: boolean;
  minMembers: number;
  myCommunitiesOnly: boolean;
}

// Activity type interface (for filters)
interface ActivityType {
  id: string;
  label: string;
  emoji: string;
}

// Default activity types (fallback if appwrite fails)
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


function debounce<T extends (...args: any[]) => any>(func: T, delay: number): T {
  let timeoutId: NodeJS.Timeout;
  return ((...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  }) as T;
}




export default function CommunitiesPage() {



  const router = useRouter();
  
  const { user } = useAuth();
  const { 
    communities, 
    userCommunities, 
    searchCommunities, 
    loading, 
    error,
    checkCommunityCreationPermission,
    fetchUserCommunities 
  } = useCommunities();
  
  const [searchQuery, setSearchQuery] = useState('');


  
  // Enhanced state variables
  const [activityTypes, setActivityTypes] = useState<ActivityType[]>(DEFAULT_ACTIVITY_TYPES);
  
  // View and tab state
  const [activeTab, setActiveTab] = useState<'my' | 'browse'>('my');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  
  // Search and filter state
  const [filters, setFilters] = useState<SearchFilters>({
    search: '',
    location: null,
    maxDistance: 50,
    activityTypes: [],
    communityType: 'all',
    hasUpcomingEvents: false,
    minMembers: 1,
    myCommunitiesOnly: false
  });
  
  // Permission checking
  const [canCreateCommunity, setCanCreateCommunity] = useState(false);

// Update this useEffect to handle enhanced searching
// Remove the problematic useEffect entirely and update this one:
useEffect(() => {
  if (activeTab === 'browse') {
    const searchLocation = filters.location ? {
      latitude: filters.location.latitude,
      longitude: filters.location.longitude
    } : undefined;
    
    searchCommunities(filters.search, undefined, 20, searchLocation);
  } else if (activeTab === 'my' && filters.location) {
    // Refetch user communities with location when location changes
    const searchLocation = {
      latitude: filters.location.latitude,
      longitude: filters.location.longitude
    };
    fetchUserCommunities(searchLocation);
  }
}, [activeTab, filters.search, filters.location, searchCommunities, fetchUserCommunities]);
// Add a separate useEffect to update communities when location changes
useEffect(() => {
  if (activeTab === 'browse' && filters.location) {
    // Trigger a new search when location is set
    searchCommunities(filters.search, undefined, 20);
  }
}, [filters.location, searchCommunities, activeTab, filters.search]);
  

useEffect(() => {
    checkCommunityCreationPermission().then(result => {
      setCanCreateCommunity(result.allowed);
    });
  }, [checkCommunityCreationPermission]);







  const handleSearch = () => {
    searchCommunities(searchQuery);
  };

  const handleCreateCommunity = () => {
    router.push('/communities/create');
  };

  const handleCommunityClick = (communityId: string) => {
    router.push(`/communities/${communityId}`);
  };

  const clearAllFilters = () => {
  setFilters({
    search: '',
    location: null,
    maxDistance: 50,
    activityTypes: [],
    communityType: 'all',
    hasUpcomingEvents: false,
    minMembers: 1,
    myCommunitiesOnly: false
  });
};

// Get active filter count
const getActiveFilterCount = () => {
  let count = 0;
  if (filters.search) count++;
  if (filters.location) count++;
  if (filters.activityTypes.length > 0) count++;
  if (filters.communityType !== 'all') count++;
  if (filters.hasUpcomingEvents) count++;
  if (filters.minMembers > 1) count++;
  return count;
};


  // Add this function to load activity types from appwrite app_config
// Place this inside your CommunitiesPage component

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
      
      // Parse display labels if they exist
      let displayLabels: Record<string, string> = {};
      if (doc.display_labels) {
        try {
          displayLabels = typeof doc.display_labels === 'string' 
            ? JSON.parse(doc.display_labels) 
            : doc.display_labels;
        } catch (e) {
          console.warn('Failed to parse display labels:', e);
        }
      }

      // Map types to our ActivityType interface
      const mappedTypes = types.map((type: string) => {
        const defaultType = DEFAULT_ACTIVITY_TYPES.find(dt => dt.id === type);
        return {
          id: type,
          label: displayLabels[type] || defaultType?.label || type,
          emoji: defaultType?.emoji || '🎯'
        };
      });

      setActivityTypes(mappedTypes);
      console.log('Loaded activity types from Appwrite:', mappedTypes);
    } else {
      console.warn('No activity types found in app_config, using defaults');
      setActivityTypes(DEFAULT_ACTIVITY_TYPES);
    }
  } catch (error) {
    console.error('Error loading activity types:', error);
    setActivityTypes(DEFAULT_ACTIVITY_TYPES);
  }
}, []);

// Add this useEffect to load activity types on component mount
useEffect(() => {
  loadActivityTypes();
}, [loadActivityTypes]);

// Replace your problematic useEffect with this:
// REMOVE THIS ENTIRE BLOCK:
/*useEffect(() => {
  if (activeTab === 'my' && user) {
    const fetchWithLocation = async () => {
      try {
        // Convert filters.location to the expected format
        const searchLocation = filters.location ? {
          latitude: filters.location.latitude,
          longitude: filters.location.longitude
        } : undefined;
        
        await fetchUserCommunities(searchLocation);
      } catch (error) {
        console.error('Error fetching user communities with location:', error);
      }
    };

    fetchWithLocation();
  }
}, [activeTab, filters.location, user, fetchUserCommunities]);
*/

const handleSearchChange = useCallback(
  debounce((searchValue: string) => {
    setFilters(prev => ({ ...prev, search: searchValue }));
  }, 300),
  []
);

// Add this helper function for debouncing (place with your other functions)
function debounce<T extends (...args: any[]) => any>(func: T, delay: number): T {
  let timeoutId: NodeJS.Timeout;
  return ((...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  }) as T;
}

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


const getFilteredCommunities = useCallback(() => {
  let filtered = activeTab === 'my' ? userCommunities : communities;

  // Search filter
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    filtered = filtered.filter(community => 
      community.name.toLowerCase().includes(searchLower) ||
      community.description?.toLowerCase().includes(searchLower) ||
      community.location?.address?.toLowerCase().includes(searchLower)
    );
  }

  // Location filter with distance
  if (filters.location && filters.maxDistance) {
    filtered = filtered.filter(community => {
      if (!community.hasLocationData || community.distance === undefined) return false;
      return community.distance <= filters.maxDistance;
    });
  }

  // Activity types filter
  if (filters.activityTypes.length > 0) {
    filtered = filtered.filter(community => {
      if (!community.activityTypes || community.activityTypes.length === 0) return false;
      return filters.activityTypes.some(filterType => 
        community.activityTypes.includes(filterType)
      );
    });
  }

  // Community type filter
  if (filters.communityType !== 'all') {
    filtered = filtered.filter(community => community.type === filters.communityType);
  }

  // Upcoming events filter
  if (filters.hasUpcomingEvents) {
    filtered = filtered.filter(community => (community.upcomingEventCount || 0) > 0);
  }

  // Minimum members filter
  if (filters.minMembers > 1) {
    filtered = filtered.filter(community => (community.memberCount || 0) >= filters.minMembers);
  }

  return filtered;
}, [communities, userCommunities, activeTab, filters]);

const filteredCommunities = getFilteredCommunities();
const communitiesWithLocation = filteredCommunities.filter(c => 
  c.location && c.location.latitude && c.location.longitude
);

console.log('Communities with location check:', {
  filteredCommunities: filteredCommunities.length,
  communitiesWithLocation: communitiesWithLocation.length,
  sampleCommunity: filteredCommunities[0]
});
// Format location display
const formatLocation = (location: any) => {
  if (typeof location === 'string') return location;
  return location?.address || `${location?.latitude}, ${location?.longitude}`;
};


 

  return (
     <MainLayout>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Communities</h1>
          <p className="text-gray-600 mt-1">Connect with people who share your interests</p>
        </div>
        
        
        {canCreateCommunity && (
          <button 
            onClick={handleCreateCommunity}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium transition-colors"
          >
            Create Community
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-8 bg-gray-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('my')}
          className={`px-6 py-2 rounded-md font-medium transition-colors ${
            activeTab === 'my' 
              ? 'bg-white text-blue-600 shadow-sm' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          My Communities ({userCommunities.length})
        </button>
        <button
          onClick={() => setActiveTab('browse')}
          className={`px-6 py-2 rounded-md font-medium transition-colors ${
            activeTab === 'browse' 
              ? 'bg-white text-blue-600 shadow-sm' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Browse Communities
        </button>
      </div>

      

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading communities...</p>
        </div>
      )}


        
{/* Enhanced Search Interface */}
<div className="mb-6">
  {/* Search Toggle Button */}
  <div className="flex items-center justify-between mb-4">
    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
      {activeTab === 'my' ? 'My Communities' : 'Browse Communities'}
    </h2>
    
    <button
      onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
      className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
        showAdvancedSearch || getActiveFilterCount() > 0
          ? 'bg-blue-600 text-white'
          : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
      }`}
    >
      <AdjustmentsHorizontalIcon className="h-5 w-5" />
      <span>Filters</span>
      {getActiveFilterCount() > 0 && (
        <span className="bg-white text-blue-600 text-xs px-2 py-1 rounded-full font-medium">
          {getActiveFilterCount()}
        </span>
      )}
    </button>
  </div>

  {/* Advanced Search Filters */}
  {showAdvancedSearch && (
    <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-6 space-y-6">
      
      {/* Search Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          🔍 Search Communities
        </label>
        <input
          type="text"
          value={filters.search}
          onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
          placeholder="Search by name, description, or location..."
          className="w-full p-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

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
              <span className="text-blue-600">🗺️</span>
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
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          🏃 Activity Types
        </label>
        <div className="flex flex-wrap gap-2">
          {activityTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => {
                setFilters(prev => ({
                  ...prev,
                  activityTypes: prev.activityTypes.includes(type.id)
                    ? prev.activityTypes.filter(t => t !== type.id)
                    : [...prev.activityTypes, type.id]
                }));
              }}
              className={`inline-flex items-center space-x-1 px-3 py-2 rounded-full text-sm transition-colors ${
                filters.activityTypes.includes(type.id)
                  ? 'bg-blue-500 text-white'
                  : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700'
              }`}
            >
              <span>{type.emoji}</span>
              <span>{type.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Community Type Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          🌍 Community Type
        </label>
        <div className="flex space-x-2">
          {[
            { value: 'all', label: 'All Communities', emoji: '🌐' },
            { value: 'public', label: 'Public Only', emoji: '🌍' },
            { value: 'private', label: 'Private Only', emoji: '🔒' }
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setFilters(prev => ({ ...prev, communityType: option.value as any }))}
              className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                filters.communityType === option.value
                  ? 'bg-blue-500 text-white'
                  : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700'
              }`}
            >
              <span>{option.emoji}</span>
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Additional Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Upcoming Events Toggle */}
        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            id="hasUpcomingEvents"
            checked={filters.hasUpcomingEvents}
            onChange={(e) => setFilters(prev => ({ ...prev, hasUpcomingEvents: e.target.checked }))}
            className="h-4 w-4 text-blue-600 border-gray-300 dark:border-slate-600 rounded focus:ring-blue-500 bg-white dark:bg-slate-800"
          />
          <label htmlFor="hasUpcomingEvents" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            📅 Has upcoming events
          </label>
        </div>

        {/* Minimum Members Slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              👥 Min Members
            </label>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {filters.minMembers}+
            </span>
          </div>
          <input
            type="range"
            min="1"
            max="50"
            value={filters.minMembers}
            onChange={(e) => setFilters(prev => ({ ...prev, minMembers: parseInt(e.target.value) }))}
            className="w-full h-2 bg-gray-200 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer"
          />
        </div>
      </div>

      {/* Clear Filters */}
      {getActiveFilterCount() > 0 && (
        <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-slate-600">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {getActiveFilterCount()} filter{getActiveFilterCount() === 1 ? '' : 's'} applied
          </span>
          <button
            onClick={clearAllFilters}
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-500 font-medium"
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
  )}
</div>

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

        
{/* View Mode Toggle */}
<div className="flex items-center justify-between mb-6">
  <div className="flex items-center space-x-2">
    <span className="text-sm text-gray-600 dark:text-gray-400">
      {filteredCommunities.length} {filteredCommunities.length === 1 ? 'community' : 'communities'}
      {communitiesWithLocation.length > 0 && (
        <span> • {communitiesWithLocation.length} with location</span>
      )}
    </span>
  </div>
  
  <div className="flex bg-gray-100 dark:bg-slate-700 rounded-lg p-1">
    {([
      { mode: 'list', icon: ListIcon, label: 'List' },
      { mode: 'map', icon: MapIcon, label: `Map (${communitiesWithLocation.length})` }
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



{/* Communities Content */}
{viewMode === 'map' ? (
  <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6">
    {communitiesWithLocation.length > 0 ? (
      <>
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            🗺️ Communities Map
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Showing {communitiesWithLocation.length} communities with location data
            {filters.location && ` within ${filters.maxDistance}km of ${filters.location.address}`}
          </p>
        </div>
       <div className="w-full h-96 rounded-lg border border-gray-300 dark:border-slate-600 overflow-hidden">
  {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? (
    <Wrapper apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}>
      <CommunitiesMap
            communities={filteredCommunities}
            onCommunitySelect={handleCommunityClick}
        searchLocation={filters.location ? {
          latitude: filters.location.latitude,
          longitude: filters.location.longitude
        } : null}
        searchRadius={filters.maxDistance}
      />
    </Wrapper>
  ) : (
    <div className="w-full h-full flex items-center justify-center bg-gray-100">
      <p className="text-gray-500 text-sm">Google Maps API key required</p>
    </div>
  )}
</div>
      </>
    ) : (
      <div className="text-center py-12">
        <MapIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
          No communities with location data
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          Communities need coordinates to appear on the map
        </p>
      </div>
    )}
  </div>

) : (
  // Fixed List View - Using CommunityCard Component
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {filteredCommunities.length > 0 ? (
      filteredCommunities.map((community) => (
        <CommunityCard
          key={community.$id}
          community={community}
          showJoinButton={true}  // ← This ensures join buttons show
          onClick={() => handleCommunityClick(community.$id!)}
          onJoinUpdate={() => {
            // Refresh communities when join status changes
            if (activeTab === 'my') {
              fetchUserCommunities();
            } else {
              searchCommunities(filters.search, undefined, 20);
            }
          }}
        />
      ))
    ) : (
      <div className="col-span-full">
        <div className="text-center py-12">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-12">
            <div className="text-6xl mb-4">🏘️</div>
            <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
              {activeTab === 'my' 
                ? "You haven't joined any communities yet"
                : filters.search || getActiveFilterCount() > 0
                ? "No communities match your search"
                : "No communities found"
              }
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto">
              {activeTab === 'my'
                ? "Join your first community to start connecting with like-minded people!"
                : filters.search || getActiveFilterCount() > 0
                ? "Try adjusting your search filters or clearing them to see more communities"
                : "Be the first to create a community in your area and start building a community"
              }
            </p>
            <div className="flex justify-center space-x-4">
              {canCreateCommunity && (
                <button
                  onClick={() => router.push('/communities/create')}
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors font-medium"
                >
                  ➕ {activeTab === 'my' ? 'Create Your First Community' : 'Create Community'}
                </button>
              )}
              {(filters.search || getActiveFilterCount() > 0) && (
                <button
                  onClick={clearAllFilters}
                  className="inline-flex items-center gap-2 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-300 px-6 py-3 rounded-lg transition-colors font-medium"
                >
                  🔄 Clear Filters
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    )}
  </div>
)}

      

      {/* Pro+ Upgrade Prompt for Non-Pro+ Users */}
      {!canCreateCommunity && activeTab === 'my' && userCommunities.length === 0 && (
        <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start">
             
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-blue-900">Create Your Own Community</h3>
              <p className="mt-1 text-blue-700">
                Upgrade to Pro+ to create and manage your own communities. Bring people together around shared interests and activities.
              </p>
              <div className="mt-4">
                <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium transition-colors">
                  Upgrade to Pro+
                </button>
               
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </MainLayout>
  );
}