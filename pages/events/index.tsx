// pages/events/index.tsx - Enhanced with Mobile App Structure & Map Integration
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import MainLayout from '../../components/layout/MainLayout';
import { useAuth } from '../../contexts/AuthContext';
import { databases, DATABASE_ID, EVENTS_COLLECTION_ID, ACTIVITIES_COLLECTION_ID, APP_CONFIG_COLLECTION_ID, Query } from '../../lib/appwrite';
import { Wrapper, Status } from "@googlemaps/react-wrapper"; // ADD THIS LINE
import EventsMap from '../../components/events/EventsMap';
import EventLocationPicker from '../../components/events/EventLocationPicker';
import { useFeatureAccess } from '../../hooks/useFeatureAccess';


// Mobile App Matching Options
const INCLUSIVE_OPTIONS = [
  { id: 'all_women', label: 'All Women', emoji: '👩', description: 'This event welcomes and focuses on women participants' },
  { id: 'lgbtiq', label: 'LGBTIQ+', emoji: '🏳️‍🌈', description: 'This event welcomes and focuses on LGBTIQ+ participants' },
  { id: 'physically_inclusive', label: 'Physically Inclusive', emoji: '♿', description: 'This event is accessible to people with physical disabilities' }
];

const DIFFICULTY_OPTIONS = [
  { id: 'any', label: 'Any Difficulty', emoji: '🎲', description: 'Any skill level' },
  { id: 'skill_agnostic', label: 'Skill Agnostic', emoji: '🎲', description: 'No specific skill level required' },
  { id: 'easy', label: 'Easy', emoji: '🟢', description: 'Easy difficulty for beginners' },
  { id: 'medium', label: 'Medium', emoji: '🟡', description: 'Moderate difficulty' },
  { id: 'difficult', label: 'Difficult', emoji: '🔴', description: 'High difficulty' }
];

const EVENT_FILTER_OPTIONS = [
  { id: 'all', label: 'All Events' },
  { id: 'joined', label: 'My Events Only' },
  { id: 'hosting', label: 'Events I\'m Hosting' }
];

const DATE_FILTER_OPTIONS = [
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'all', label: 'All Events' },
  { id: 'custom', label: 'Custom Range' }
];

// Default activity types
const DEFAULT_ACTIVITY_TYPES = [
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

// Interfaces
interface Event {
  $id: string;
  eventName: string;
  title: string;
  activityId: string;
  activityName?: string;
  date: string;
  meetupTime: string;
  meetupPoint: string;
  location: string;
  description: string;
  maxParticipants: number;
  participants: string[];
  organizerId: string;
  difficulty: string;
  inclusive: string[];
  isPublic: boolean;
  endDate?: string;
  endTime?: string;
  latitude?: number;
  longitude?: number;
  activityTypes?: string[];
  createdAt: string;
  updatedAt?: string;
  hasLocationData?: boolean;
}

interface ActivityType {
  id: string;
  label: string;
  emoji: string;
}

interface SearchFilters {
  search: string;
  location: {
    address: string;
    latitude: number;
    longitude: number;
  } | null;
  maxDistance: number;
  activityTypes: string[];
  difficulty: string;
  inclusive: string[];
  dateRange: string;
  customStartDate: string;
  customEndDate: string;
  eventFilter: string;
  myEventsOnly: boolean;
}




// Google Map Component with Error Handling
const GoogleMapComponent: React.FC<{
  onLocationSelect: (lat: number, lng: number) => void;
  selectedLocation: { lat: number; lng: number } | null;
  quickLocations: Array<{ name: string; lat: number; lng: number }>;
}> = ({ onLocationSelect, selectedLocation, quickLocations }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [showMap, setShowMap] = useState(true); // Add this line if missing

  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);


  useEffect(() => {
    if (!mapRef.current || !window.google) return;

    try {
      // Use selected location as center if available, otherwise default to Australia center
      const center = selectedLocation || { lat: -25.2744, lng: 133.7751 };
      const zoom = selectedLocation ? 12 : 5; // Zoom in if we have a specific location

      const mapInstance = new window.google.maps.Map(mapRef.current, {
        center: center,
        zoom: zoom,
        styles: [
          {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "off" }]
          }
        ]
      });

      // Add click listener
      mapInstance.addListener('click', (e: google.maps.MapMouseEvent) => {
        if (e.latLng) {
          onLocationSelect(e.latLng.lat(), e.latLng.lng());
        }
      });

      setMap(mapInstance);
    } catch (error) {
      console.error('Error initializing Google Maps:', error);
    }
  }, [onLocationSelect, selectedLocation]); // Add selectedLocation as dependency
  // Update markers when locations change
  
  useEffect(() => {
    if (!map) return;

    try {
      // Clear existing markers
      markers.forEach(marker => marker.setMap(null));
      const newMarkers: google.maps.Marker[] = [];

      // Add quick location markers
      quickLocations.forEach((location) => {
        const marker = new window.google.maps.Marker({
          position: { lat: location.lat, lng: location.lng },
          map: map,
          title: location.name,
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="10" cy="10" r="8" fill="#3b82f6" stroke="white" stroke-width="2"/>
              </svg>
            `),
            scaledSize: new window.google.maps.Size(20, 20)
          }
        });

        marker.addListener('click', () => {
          onLocationSelect(location.lat, location.lng);
        });

        newMarkers.push(marker);
      });

      // Add selected location marker
      if (selectedLocation) {
        const selectedMarker = new window.google.maps.Marker({
          position: selectedLocation,
          map: map,
          title: 'Selected Location',
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" fill="#ef4444" stroke="white" stroke-width="2"/>
                <circle cx="12" cy="12" r="4" fill="white"/>
              </svg>
            `),
            scaledSize: new window.google.maps.Size(24, 24)
          }
        });

        newMarkers.push(selectedMarker);
      }

      setMarkers(newMarkers);
    } catch (error) {
      console.error('Error updating map markers:', error);
    }
  }, [map, selectedLocation, quickLocations, onLocationSelect]);

  return <div ref={mapRef} className="w-full h-full" />;
};

// Enhanced Location Picker Component with Google Map
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

  const quickLocations = [
    { name: 'Sydney', lat: -33.8688, lng: 151.2093 },
    { name: 'Melbourne', lat: -37.8136, lng: 144.9631 },
    { name: 'Brisbane', lat: -27.4698, lng: 153.0251 },
    { name: 'Perth', lat: -31.9505, lng: 115.8605 },
    { name: 'Adelaide', lat: -34.9285, lng: 138.6007 }
  ];

  const handleMapClick = (lat: number, lng: number) => {
    setCoordinates({
      latitude: lat.toString(),
      longitude: lng.toString()
    });
    setAddress(`Location: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    
    // Automatically submit the location
    onLocationSelect({
      address: `Location: ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      latitude: lat,
      longitude: lng
    });
  };

  return (
    <div className="space-y-4">
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

      {/* Coordinate Input Fields */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Latitude
          </label>
          <input
            type="number"
            step="any"
            value={coordinates.latitude}
            onChange={(e) => {
              const newLat = e.target.value;
              setCoordinates(prev => ({ ...prev, latitude: newLat }));
              
              // If both coordinates are valid, auto-submit and update map
              if (newLat && coordinates.longitude) {
                const lat = parseFloat(newLat);
                const lng = parseFloat(coordinates.longitude);
                if (!isNaN(lat) && !isNaN(lng)) {
                  handleMapClick(lat, lng);
                }
              }
            }}
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
            onChange={(e) => {
              const newLng = e.target.value;
              setCoordinates(prev => ({ ...prev, longitude: newLng }));
              
              // If both coordinates are valid, auto-submit and update map
              if (coordinates.latitude && newLng) {
                const lat = parseFloat(coordinates.latitude);
                const lng = parseFloat(newLng);
                if (!isNaN(lat) && !isNaN(lng)) {
                  handleMapClick(lat, lng);
                }
              }
            }}
            placeholder="151.2093"
            className="w-full p-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Google Map Section */}
      <div className="space-y-4">
        <div className="w-full h-64 rounded-lg border border-gray-200 dark:border-slate-600 relative overflow-hidden">
          {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? (
            <Wrapper apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY} render={(status) => <div>Loading map... {status}</div>}>
              <GoogleMapComponent
                onLocationSelect={handleMapClick}
                selectedLocation={coordinates.latitude && coordinates.longitude ? {
                  lat: parseFloat(coordinates.latitude),
                  lng: parseFloat(coordinates.longitude)
                } : null}
                quickLocations={quickLocations}
              />
            </Wrapper>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-slate-700">
              <div className="text-center">
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  Google Maps API key required
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to your .env.local file
                </p>
              </div>
            </div>
          )}
        </div>


    </div>

    </div>

  );
};



// Enhanced Event Card Component
const EventCard: React.FC<{
  event: Event;
  onJoin: () => void;
  onLeave: () => void;
  userStatus: string;
  isUpcoming: boolean;
  isFull: boolean;
  activityTypes: ActivityType[];
}> = ({ event, onJoin, onLeave, userStatus, isUpcoming, isFull, activityTypes }) => {
  const router = useRouter();

  const getDifficultyInfo = () => {
    const option = DIFFICULTY_OPTIONS.find(d => d.id === event.difficulty);
    return option || { emoji: '⚡', label: event.difficulty || 'Unknown' };
  };

  const getActivityTypeInfo = () => {
    if (event.activityTypes && event.activityTypes.length > 0) {
      return event.activityTypes.map(typeId => {
        const type = activityTypes.find(t => t.id === typeId);
        return type || { id: typeId, label: typeId, emoji: '🎯' };
      });
    }
    return [];
  };

  const difficultyInfo = getDifficultyInfo();
  const eventActivityTypes = getActivityTypeInfo();

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6 hover:shadow-md transition-shadow">
      {/* Event Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 
            className="text-lg font-semibold text-gray-900 dark:text-white mb-2 cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400"
            onClick={() => router.push(`/events/${event.$id}`)}
          >
            {event.eventName || event.title}
          </h3>
          
          {/* Activity Link */}
          {event.activityName && (
            <p 
              className="text-sm text-emerald-600 dark:text-emerald-400 mb-2 cursor-pointer hover:underline"
              onClick={() => router.push(`/activities/${event.activityId}`)}
            >
              Part of: {event.activityName}
            </p>
          )}

          {/* Date and Time */}
          <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400 mb-2">
            <div className="flex items-center space-x-1">
              <span>📅</span>
              <span>{new Date(event.date).toLocaleDateString('en-AU')}</span>
            </div>
            <div className="flex items-center space-x-1">
              <span>⏰</span>
              <span>{event.meetupTime}</span>
            </div>
          </div>

          {/* Location */}
          <div className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-400 mb-3">
            <span>📍</span>
            <span>{event.meetupPoint}</span>
            {event.hasLocationData && (
              <span className="text-xs bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 px-2 py-1 rounded-full ml-2">
                🗺️ Mapped
              </span>
            )}
          </div>
        </div>

        {/* Status Badges */}
        <div className="text-right flex flex-col gap-1">
          {!isUpcoming && (
            <span className="inline-block px-2 py-1 text-xs bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400 rounded">
              Past Event
            </span>
          )}
          {isFull && isUpcoming && (
            <span className="inline-block px-2 py-1 text-xs bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400 rounded">
              Full
            </span>
          )}
          {userStatus === 'organizer' && (
            <span className="inline-block px-2 py-1 text-xs bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-400 rounded">
              Organizer
            </span>
          )}
          {userStatus === 'joined' && (
            <span className="inline-block px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded">
              Joined
            </span>
          )}
        </div>
      </div>

      {/* Event Details Row */}
      <div className="flex items-center justify-between text-sm mb-4">
        <div className="flex items-center space-x-4 text-gray-600 dark:text-gray-300">
          {/* Difficulty */}
          <div className="flex items-center space-x-1">
            <span>{difficultyInfo.emoji}</span>
            <span>{difficultyInfo.label}</span>
          </div>

          {/* Participants */}
          <div className="flex items-center space-x-1">
            <span>👥</span>
            <span>
              {event.participants.length}
              {event.maxParticipants && `/${event.maxParticipants}`}
            </span>
          </div>
        </div>
      </div>

      {/* Activity Types */}
      {eventActivityTypes.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {eventActivityTypes.map((type) => (
            <span
              key={type.id}
              className="inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200"
            >
              <span>{type.emoji}</span>
              <span>{type.label}</span>
            </span>
          ))}
        </div>
      )}

      {/* Inclusive Options */}
      {event.inclusive && event.inclusive.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {event.inclusive.map((optionId) => {
            const option = INCLUSIVE_OPTIONS.find(o => o.id === optionId);
            return option ? (
              <span
                key={optionId}
                className="inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
              >
                <span>{option.emoji}</span>
                <span>{option.label}</span>
              </span>
            ) : null;
          })}
        </div>
      )}

      {/* Description */}
      {event.description && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
          {event.description}
        </p>
      )}

      {/* Action Buttons */}
      {isUpcoming && userStatus !== 'organizer' && (
        <div className="flex space-x-2">
          {userStatus === 'joined' ? (
            <button
              onClick={onLeave}
              className="flex-1 py-2 px-4 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-800 transition-colors text-sm font-medium"
            >
              Leave Event
            </button>
          ) : (
            <button
              onClick={onJoin}
              disabled={isFull}
              className={`flex-1 py-2 px-4 rounded-lg transition-colors text-sm font-medium ${
                isFull
                  ? 'bg-gray-100 dark:bg-slate-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              {isFull ? 'Event Full' : 'Join Event'}
            </button>
          )}
          
          <button
            onClick={() => router.push(`/events/${event.$id}`)}
            className="py-2 px-4 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors text-sm font-medium"
          >
            View Details
          </button>
        </div>
      )}

      {!isUpcoming && (
        <button
          onClick={() => router.push(`/events/${event.$id}`)}
          className="w-full py-2 px-4 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors text-sm font-medium"
        >
          View Event Details
        </button>
      )}

      {userStatus === 'organizer' && (
        <button
          onClick={() => router.push(`/events/${event.$id}`)}
          className="w-full py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors text-sm font-medium"
        >
          Manage Event
        </button>
      )}
    </div>
  );
};

// Main Events Component
// Main Events Component
export default function EventsIndex() {
  const router = useRouter();
  const { user } = useAuth();
    const { canUseFeature, trackFeatureUsage, getUpgradeMessage } = useFeatureAccess();

  // State
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [activityTypes, setActivityTypes] = useState<ActivityType[]>(DEFAULT_ACTIVITY_TYPES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  const [filters, setFilters] = useState<SearchFilters>({
    search: '',
  location: null,
  maxDistance: 25, // Add this if missing
  activityTypes: [],
  difficulty: 'any',
  inclusive: [],
  dateRange: 'upcoming',
  customStartDate: '',
  customEndDate: '',
  eventFilter: 'all',
  myEventsOnly: false
  });

  // Helper functions
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const isEventUpcoming = (dateString: string) => {
    return new Date(dateString) > new Date();
  };

  const isEventFull = (participants: string[], maxParticipants: number) => {
    return participants.length >= maxParticipants;
  };

  const getUserParticipantStatus = (event: Event, userId?: string) => {
    if (!userId) return 'not-logged-in';
    if (event.organizerId === userId) return 'organizer';
    if (event.participants.includes(userId)) return 'joined';
    return 'not-joined';
  };

  // Load activity types
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

  // Fetch events
  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const eventsResponse = await databases.listDocuments(
        DATABASE_ID,
        EVENTS_COLLECTION_ID,
        [Query.orderDesc('date'), Query.limit(1000)]
      );

      const eventsWithMetadata = await Promise.all(
        eventsResponse.documents.map(async (eventDoc) => {
          const event = {
            $id: eventDoc.$id,
            eventName: eventDoc.eventName || eventDoc.title || '',
            title: eventDoc.title || eventDoc.eventName || '',
            activityId: eventDoc.activityId || '',
            activityName: eventDoc.activityName || '',
            date: eventDoc.date || '',
            meetupTime: eventDoc.meetupTime || '',
            meetupPoint: eventDoc.meetupPoint || '',
            location: eventDoc.location || '',
            description: eventDoc.description || '',
            maxParticipants: eventDoc.maxParticipants || 10,
            participants: Array.isArray(eventDoc.participants) ? eventDoc.participants : [],
            organizerId: eventDoc.organizerId || eventDoc.createdBy || '',
            difficulty: eventDoc.difficulty || '',
            inclusive: Array.isArray(eventDoc.inclusive) ? eventDoc.inclusive : [],
            isPublic: eventDoc.isPublic !== false,
            endDate: eventDoc.endDate,
            endTime: eventDoc.endTime,
            latitude: eventDoc.latitude,
            longitude: eventDoc.longitude,
            activityTypes: Array.isArray(eventDoc.activityTypes) ? eventDoc.activityTypes : [],
            createdAt: eventDoc.createdAt || eventDoc.$createdAt || '',
            updatedAt: eventDoc.updatedAt || eventDoc.$updatedAt,
            hasLocationData: !!(eventDoc.latitude && eventDoc.longitude)
          } as Event;
          
          if (event.activityId) {
            try {
              const activityDoc = await databases.getDocument(
                DATABASE_ID,
                ACTIVITIES_COLLECTION_ID,
                event.activityId
              );
              event.activityName = activityDoc.activityname || 'Unknown Activity';
              if (activityDoc.types || activityDoc.activityTypes) {
                event.activityTypes = Array.isArray(activityDoc.types) ? 
                  activityDoc.types : 
                  Array.isArray(activityDoc.activityTypes) ? 
                  activityDoc.activityTypes : [];
              }
            } catch (activityError) {
              console.warn(`Could not fetch activity name for ${event.activityId}`);
              event.activityName = 'Activity Not Found';
            }
          }
          
          return event;
        })
      );

      setAllEvents(eventsWithMetadata);
      
    } catch (error) {
      console.error('Error fetching events:', error);
      setError('Failed to load events. Please try again.');
      setAllEvents([]);
    } finally {
      setLoading(false);
    }
  };

  // Filtering
  const getFilteredEvents = useCallback(() => {
    let filtered = [...allEvents];

    if (filters.eventFilter === 'joined' && user) {
      filtered = filtered.filter(event => event.participants.includes(user.$id));
    } else if (filters.eventFilter === 'hosting' && user) {
      filtered = filtered.filter(event => event.organizerId === user.$id);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(event => 
        event.eventName.toLowerCase().includes(searchLower) ||
        event.description?.toLowerCase().includes(searchLower) ||
        event.activityName?.toLowerCase().includes(searchLower) ||
        event.meetupPoint.toLowerCase().includes(searchLower)
      );
    }

    // Location filter
if (filters.location && filters.maxDistance) {
  filtered = filtered.filter(event => {
    if (!event.hasLocationData || !event.latitude || !event.longitude) return false;
    const distance = calculateDistance(
      filters.location!.latitude,
      filters.location!.longitude,
      event.latitude,
      event.longitude
    );
    return distance <= filters.maxDistance;
  });
}

    if (filters.activityTypes.length > 0) {
      filtered = filtered.filter(event => {
        if (!event.activityTypes || event.activityTypes.length === 0) return false;
        return filters.activityTypes.some(filterType => 
          event.activityTypes!.includes(filterType)
        );
      });
    }

    if (filters.difficulty !== 'any') {
      filtered = filtered.filter(event => event.difficulty === filters.difficulty);
    }

    if (filters.inclusive.length > 0) {
      filtered = filtered.filter(event => 
        filters.inclusive.some(filterOption => event.inclusive.includes(filterOption))
      );
    }

    const now = new Date();
if (filters.dateRange === 'upcoming') {
  filtered = filtered.filter(event => new Date(event.date) > now);
} else if (filters.dateRange === 'all') {
  // Show all events - no date filtering
  // This line intentionally left empty
} else if (filters.dateRange === 'custom') {
  if (filters.customStartDate) {
    const startDate = new Date(filters.customStartDate);
    filtered = filtered.filter(event => new Date(event.date) >= startDate);
  }
  if (filters.customEndDate) {
    const endDate = new Date(filters.customEndDate);
    filtered = filtered.filter(event => new Date(event.date) <= endDate);
  }
}

    return filtered;
  }, [allEvents, filters, user]);

  const filteredEvents = getFilteredEvents();
  const eventsWithLocation = filteredEvents.filter(e => e.hasLocationData);

  // Event actions
  const handleJoinEvent = async (eventId: string) => {
  if (!user) {
    router.push('/auth/login');
    return;
  }

  // ✅ ADD: Check feature limits before joining
  if (!canUseFeature('eventsJoined')) {
    alert(getUpgradeMessage('eventsJoined'));
    return;
  }

  try {
    const event = allEvents.find(e => e.$id === eventId);
    if (!event) return;

    const updatedParticipants = [...event.participants, user.$id];
    
    await databases.updateDocument(
      DATABASE_ID,
      EVENTS_COLLECTION_ID,
      eventId,
      { participants: updatedParticipants }
    );

    // ✅ ADD: Track usage after successful join
    await trackFeatureUsage('eventsJoined');

    setAllEvents(prevEvents =>
      prevEvents.map(e =>
        e.$id === eventId ? { ...e, participants: updatedParticipants } : e
      )
    );
  } catch (error) {
    console.error('Error joining event:', error);
    alert('Failed to join event. Please try again.');
  }
};
 const handleLeaveEvent = async (eventId: string) => {
  if (!user) return;

  try {
    const event = allEvents.find(e => e.$id === eventId);
    if (!event) return;

    const updatedParticipants = event.participants.filter(id => id !== user.$id);
    
    await databases.updateDocument(
      DATABASE_ID,
      EVENTS_COLLECTION_ID,
      eventId,
      { participants: updatedParticipants }
    );

    // ✅ ADD: Track usage decrease when leaving event
    await trackFeatureUsage('eventsJoined', -1);

    setAllEvents(prevEvents =>
      prevEvents.map(e =>
        e.$id === eventId ? { ...e, participants: updatedParticipants } : e
      )
    );
  } catch (error) {
    console.error('Error leaving event:', error);
    alert('Failed to leave event. Please try again.');
  }
};

// Simple fix - just remove the explicit typing and let TypeScript infer:

const fetchAllEvents = async () => {
  try {
    setLoading(true);
    setError(null);

    console.log('🔄 Fetching all events from Appwrite...');
    
    const response = await databases.listDocuments(
      DATABASE_ID,
      EVENTS_COLLECTION_ID,
      [
        Query.orderDesc('date'),
        Query.limit(500)
      ]
    );

    console.log(`✅ Fetched ${response.documents.length} events`);
    
    // ✅ Let TypeScript infer the types - no explicit typing needed
    const eventsWithMetadata = await Promise.all(
      response.documents.map(async (eventDoc) => {
        const event = {
          $id: eventDoc.$id,
          eventName: eventDoc.eventName || eventDoc.title || 'Unnamed Event',
          activityId: eventDoc.activityId || '',
          date: eventDoc.date || '',
          meetupTime: eventDoc.meetupTime || '',
          meetupPoint: eventDoc.meetupPoint || eventDoc.location || '',
          location: eventDoc.location || eventDoc.meetupPoint || '',
          description: eventDoc.description || '',
          maxParticipants: eventDoc.maxParticipants || 10,
          participants: Array.isArray(eventDoc.participants) ? eventDoc.participants : [],
          organizerId: eventDoc.organizerId || eventDoc.createdBy || '',
          difficulty: eventDoc.difficulty || 'beginner',
          inclusive: Array.isArray(eventDoc.inclusive) ? eventDoc.inclusive : [],
          isPublic: eventDoc.isPublic !== false,
          endDate: eventDoc.endDate || '',
          endTime: eventDoc.endTime || '',
          latitude: eventDoc.latitude || null,
          longitude: eventDoc.longitude || null,
          activityTypes: Array.isArray(eventDoc.activityTypes) ? eventDoc.activityTypes : [],
          createdAt: eventDoc.createdAt || eventDoc.$createdAt || '',
          updatedAt: eventDoc.updatedAt || eventDoc.$updatedAt || '',
          hasLocationData: Boolean(eventDoc.latitude && eventDoc.longitude)
        };

        // Fetch activity metadata if activityId exists
        if (event.activityId) {
          try {
            const activityDoc = await databases.getDocument(
              DATABASE_ID,
              ACTIVITIES_COLLECTION_ID,
              event.activityId
            );
            // ✅ Add activityName dynamically
            (event as any).activityName = activityDoc.activityname || activityDoc.name || 'Unknown Activity';
            event.activityTypes = Array.isArray(activityDoc.types) ? activityDoc.types : 
              Array.isArray(activityDoc.activityTypes) ? activityDoc.activityTypes : [];
          } catch (activityError) {
            console.warn(`Could not fetch activity name for ${event.activityId}`);
            (event as any).activityName = 'Activity Not Found';
          }
        }
        
        return event;
      })
    );

    setAllEvents(eventsWithMetadata as any);
    
  } catch (error) {
    console.error('Error fetching events:', error);
    setError('Failed to load events. Please try again.');
    setAllEvents([]);
  } finally {
    setLoading(false);
  }
};






  const clearAllFilters = () => {
    setFilters({
      search: '',
      location: null,
      maxDistance: 50,
      activityTypes: [],
      difficulty: 'any',
      inclusive: [],
      dateRange: 'all',
      customStartDate: '',
      customEndDate: '',
      eventFilter: 'all',
      myEventsOnly: false
    });
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.location) count++;
    if (filters.activityTypes.length > 0) count++;
    if (filters.difficulty !== 'any') count++;
    if (filters.inclusive.length > 0) count++;
    if (filters.dateRange !== 'upcoming') count++;
    if (filters.eventFilter !== 'all') count++;
    return count;
  };

  useEffect(() => {
    loadActivityTypes();
    fetchAllEvents();
  }, [loadActivityTypes, user?.$id]);

  // Icon components
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
            onClick={fetchAllEvents}
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Events</h1>
            <p className="text-gray-600 dark:text-gray-400">
              {filters.location 
                ? `📍 ${filters.location.address} (${filters.maxDistance}km radius)` 
                : 'Click the search icon to find events by location, type, and more'
              }
            </p>
          </div>
          

         

          <div className="flex space-x-2">
            <div className="relative">
            <button
              onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
              className={`p-2 rounded-lg transition-colors ${
                showAdvancedSearch || getActiveFilterCount() > 0
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
              }`}
              title={showAdvancedSearch ? 'Close Search' : 'Open Search & Filters'}
            >
              <SearchIcon className="h-5 w-5" />
              {getActiveFilterCount() > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {getActiveFilterCount()}
                </span>
              )}
            </button>
            </div>
            
            <button
              onClick={() => router.push('/activities')}
              className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
            >
              <PlusIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

       {/* Search Bar - Only shows when advanced search is open */}
        {showAdvancedSearch && (
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              placeholder="Search events by location, date, type, difficulty..."
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
        )}

        {/* Advanced Search Panel - Mobile App Style */}
        {showAdvancedSearch && (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">🔍 Search Events</h3>
              <button
                onClick={clearAllFilters}
                className="text-sm text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300"
              >
                Clear All ({getActiveFilterCount()} filters)
              </button>
            </div>
            
            <div className="space-y-6">


              {/* Location & Distance Search */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      📍 Location & Distance
                    </label>
                    
                    {/* Location Picker Button */}
                    <button
                      type="button"
                      onClick={() => setShowLocationPicker(true)}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg text-left bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors mb-4"
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
                  </div>

{/* Distance Range - Keep your existing distance slider */}
{filters.location && (
  <div>
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
      🎯 Search Radius: {filters.maxDistance} km
    </label>
    <div className="relative">
      <input
        type="range"
        min="5"
        max="200"
        step="5"
        value={filters.maxDistance}
        onChange={(e) => setFilters(prev => ({ ...prev, maxDistance: Number(e.target.value) }))}
        className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 slider"
        style={{
          background: `linear-gradient(to right, #10b981 0%, #10b981 ${((filters.maxDistance - 5) / 195) * 100}%, #e5e7eb ${((filters.maxDistance - 5) / 195) * 100}%, #e5e7eb 100%)`
        }}
      />
      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #10b981;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #10b981;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
      `}</style>
    </div>
    <div className="flex justify-between text-xs text-gray-500 mt-2">
      <span>5km</span>
      <span>50km</span>
      <span>100km</span>
      <span>200km</span>
    </div>
  </div>
)}

              {/* Activity Types Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  🏃 Activity Type
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setFilters(prev => ({ ...prev, activityTypes: [] }))}
                    className={`px-3 py-2 rounded-full text-sm font-medium transition-colors ${
                      filters.activityTypes.length === 0
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                    }`}
                  >
                    Any Activity
                  </button>
                  {activityTypes.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => {
                        setFilters(prev => ({
                          ...prev,
                          activityTypes: prev.activityTypes.includes(type.id)
                            ? prev.activityTypes.filter(t => t !== type.id)
                            : [type.id] // Single selection like mobile
                        }));
                      }}
                      className={`px-3 py-2 rounded-full text-sm font-medium transition-colors ${
                        filters.activityTypes.includes(type.id)
                          ? 'bg-emerald-600 text-white'
                          : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                      }`}
                    >
                      {type.emoji} {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Inclusive Events */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  🤝 Inclusive Events
                </label>
                <div className="flex flex-wrap gap-2">
                  {INCLUSIVE_OPTIONS.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => {
                        setFilters(prev => ({
                          ...prev,
                          inclusive: prev.inclusive.includes(option.id)
                            ? prev.inclusive.filter(i => i !== option.id)
                            : [...prev.inclusive, option.id]
                        }));
                      }}
                      className={`px-3 py-2 rounded-full text-sm font-medium transition-colors ${
                        filters.inclusive.includes(option.id)
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                      }`}
                    >
                      {option.emoji} {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Event Difficulty */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  ⚡ Event Difficulty
                </label>
                <div className="flex flex-wrap gap-2">
                  {DIFFICULTY_OPTIONS.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setFilters(prev => ({ ...prev, difficulty: option.id }))}
                      className={`px-3 py-2 rounded-full text-sm font-medium transition-colors ${
                        filters.difficulty === option.id
                          ? 'bg-orange-600 text-white'
                          : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                      }`}
                    >
                      {option.emoji} {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Event Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  👤 Event Filter
                </label>
                <div className="flex flex-wrap gap-2">
                  {EVENT_FILTER_OPTIONS.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setFilters(prev => ({ ...prev, eventFilter: option.id }))}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                        filters.eventFilter === option.id
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  📅 Date Filter
                </label>
                <div className="flex flex-wrap gap-2">
                  {DATE_FILTER_OPTIONS.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setFilters(prev => ({ ...prev, dateRange: option.id }))}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        filters.dateRange === option.id
                          ? 'bg-emerald-600 text-white'
                          : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Date Range */}
              {filters.dateRange === 'custom' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      From Date
                    </label>
                    <input
                      type="date"
                      value={filters.customStartDate}
                      onChange={(e) => setFilters(prev => ({ ...prev, customStartDate: e.target.value }))}
                      className="w-full p-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      To Date
                    </label>
                    <input
                      type="date"
                      value={filters.customEndDate}
                      onChange={(e) => setFilters(prev => ({ ...prev, customEndDate: e.target.value }))}
                      className="w-full p-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* View Mode Toggle - Mobile App Style */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {filteredEvents.length} {filteredEvents.length === 1 ? 'event' : 'events'}
              {eventsWithLocation.length > 0 && (
                <span> • {eventsWithLocation.length} with location</span>
              )}
            </span>
            {filters.search && (
              <span className="text-sm text-emerald-600 dark:text-emerald-400">
                matching "{filters.search}"
              </span>
            )}
          </div>
          
          <div className="flex bg-gray-100 dark:bg-slate-700 rounded-lg p-1">
            {([
              { mode: 'list', icon: ListIcon, label: 'List' },
              { mode: 'map', icon: MapIcon, label: `Map (${eventsWithLocation.length})` }
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

        {/* Clear Search Results */}
        {(filters.search || getActiveFilterCount() > 0) && (
          <div className="flex items-center justify-center">
            <button
              onClick={clearAllFilters}
              className="inline-flex items-center gap-2 px-4 py-2 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium"
            >
              Clear Search ({filteredEvents.length} results, {eventsWithLocation.length} with location)
            </button>
          </div>
        )}

        {/* Events Content */}
        {viewMode === 'map' ? (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6">
            {eventsWithLocation.length > 0 ? (
                        <EventsMap
            events={filteredEvents.filter(event => event.latitude && event.longitude)}
            onEventSelect={(event) => router.push(`/events/${event.$id}`)}
            searchLocation={filters.location}
            searchRadius={filters.maxDistance}
          />
            ) : (
              <div className="text-center py-12">
                <MapIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl  font-medium text-gray-900 dark:text-white mb-2">
                  No events with location data
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Events need coordinates to appear on the map
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredEvents.length > 0 ? (
              filteredEvents.map((event: Event) => {
                const userStatus = getUserParticipantStatus(event, user?.$id);
                const isUpcoming = isEventUpcoming(event.date);
                const isFull = isEventFull(event.participants, event.maxParticipants);

                return (
                  <EventCard
                    key={event.$id}
                    event={event}
                    onJoin={() => handleJoinEvent(event.$id)}
                    onLeave={() => handleLeaveEvent(event.$id)}
                    userStatus={userStatus}
                    isUpcoming={isUpcoming}
                    isFull={isFull}
                    activityTypes={activityTypes}
                  />
                );
              })
            ) : (
              <div className="text-center py-12">
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-12">
                  <div className="text-6xl mb-4">📅</div>
                  <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
                    {filters.search || getActiveFilterCount() > 0
                      ? "No events found with current filters"
                      : allEvents.length === 0
                      ? "No events available"
                      : "No events match your criteria"
                    }
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto">
                    {filters.search || getActiveFilterCount() > 0
                      ? "Try adjusting your search filters to see more events"
                      : allEvents.length === 0
                      ? "Be the first to create an event in your area and start building a community"
                      : "Check back later for new events or create your own"
                    }
                  </p>
                  <div className="flex justify-center space-x-4">
                    <button
                      onClick={() => router.push('/activities')}
                      className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg transition-colors font-medium"
                    >
                      <PlusIcon className="h-4 w-4" />
                      Browse Activities
                    </button>
                    {(filters.search || getActiveFilterCount() > 0) && (
                      <button
                        onClick={clearAllFilters}
                        className="inline-flex items-center gap-2 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-300 px-6 py-3 rounded-lg transition-colors font-medium"
                      >
                        Clear Filters
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Refresh Button */}
        <div className="flex justify-center pt-6">
          <button
            onClick={fetchAllEvents}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
          >
            <svg className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh Events
          </button>
        </div>

          <EventLocationPicker
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


      </div>



    </MainLayout>
  );
};
