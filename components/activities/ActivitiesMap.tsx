// components/activities/ActivitiesMap.tsx - Interactive map view for activities
import React, { useState } from 'react';
import { Wrapper } from '@googlemaps/react-wrapper';
import ActivitiesGoogleMap from './ActivitiesGoogleMap'; // Add this import


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
  latitude?: number;
  longitude?: number;
  hasLocationData?: boolean;
  difficulty?: string; // Add this line
  eventCount?: number; // Add this line
  participantCount?: number; // Add this line (you might need this too)
  isPrivate?: boolean; // Add this line (you might need this too)
  userId?: string; // Add this line (you might need this too)
  createdBy?: string; // Add this line (you might need this too)
  createdAt?: string; // Add this line (you might need this too)
}

interface ActivitiesMapProps {
  activities: Activity[];
  onActivitySelect: (activity: Activity) => void;
  userLocation?: { latitude: number; longitude: number } | null;
  searchLocation?: { latitude: number; longitude: number; address: string } | null;
  searchRadius?: number;
}

const ActivitiesMap: React.FC<ActivitiesMapProps> = ({ 
  activities, 
  onActivitySelect, 
  userLocation,
  searchLocation,
  searchRadius = 50
}) => {
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [mapView, setMapView] = useState<'street' | 'satellite' | 'terrain'>('street');

  // Get location string for display
  const getLocationString = (location: string | { address: string; latitude: number; longitude: number }) => {
    if (typeof location === 'string') return location;
    return location.address;
  };

  // Get difficulty color
  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-500';
      case 'intermediate': return 'bg-yellow-500';
      case 'advanced': return 'bg-red-500';
      case 'expert': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  // Handle activity marker click
  const handleActivityClick = (activity: Activity) => {
    setSelectedActivity(activity);
  };

  // Handle activity selection
  const handleSelectActivity = (activity: Activity) => {
    onActivitySelect(activity);
  };

  return (
    <div className="relative w-full h-full bg-gray-100 dark:bg-slate-800 rounded-lg overflow-hidden">
      {/* Map Container */}
      <div className="relative w-full h-full">
        <div className="w-full h-96 rounded-lg border border-gray-200 dark:border-slate-600 relative overflow-hidden">
          {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? (
            <Wrapper apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}>
              <ActivitiesGoogleMap
  activities={activities}
  onActivitySelect={onActivitySelect}
  userLocation={userLocation}
  searchLocation={searchLocation}
  searchRadius={searchRadius}
/>
            </Wrapper>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-slate-700">
              <div className="text-center p-8">
                <div className="text-6xl mb-4">🗺️</div>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
                  Interactive Map View
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to your .env.local file to enable Google Maps
                </p>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  📍 {activities.length} activities in your area
                </div>
              </div>
            </div>
          )}
        </div>
        {/* Map Controls */}
        <div className="absolute top-4 right-4 flex flex-col space-y-2">
          {/* View Mode Toggle */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-slate-600 p-1">
            <button
              onClick={() => setMapView('street')}
              className={`px-3 py-1 rounded text-xs transition-colors ${
                mapView === 'street'
                  ? 'bg-emerald-600 text-white'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'
              }`}
            >
              Street
            </button>
            <button
              onClick={() => setMapView('satellite')}
              className={`px-3 py-1 rounded text-xs transition-colors ${
                mapView === 'satellite'
                  ? 'bg-emerald-600 text-white'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'
              }`}
            >
              Satellite
            </button>
            <button
              onClick={() => setMapView('terrain')}
              className={`px-3 py-1 rounded text-xs transition-colors ${
                mapView === 'terrain'
                  ? 'bg-emerald-600 text-white'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'
              }`}
            >
              Terrain
            </button>
          </div>

          {/* Zoom Controls */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-slate-600 flex flex-col">
            <button 
              onClick={() => {
                // This will be handled by the Google Maps component
                window.dispatchEvent(new CustomEvent('mapZoomIn'));
              }}
              className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors rounded-t-lg"
            >
              <svg className="h-4 w-4 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
            <div className="border-t border-gray-200 dark:border-slate-600"></div>
            <button 
              onClick={() => {
                // This will be handled by the Google Maps component
                window.dispatchEvent(new CustomEvent('mapZoomOut'));
              }}
              className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors rounded-b-lg"
            >
              <svg className="h-4 w-4 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
          </div>


        </div>

        {/* Activity Markers Overlay */}
        <div className="absolute inset-0 pointer-events-none">
          {activities.slice(0, 8).map((activity, index) => (
            <div
              key={activity.$id}
              className="absolute pointer-events-auto cursor-pointer transform -translate-x-1/2 -translate-y-1/2"
              style={{
                // Distribute markers across the map area
                left: `${20 + (index % 4) * 20}%`,
                top: `${20 + Math.floor(index / 4) * 30}%`,
              }}
              onClick={() => handleActivityClick(activity)}
            >
              
              
            </div>
          ))}
        </div>

        {/* User Location Marker */}
        {userLocation && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
            <div className="w-4 h-4 bg-blue-600 rounded-full border-2 border-white shadow-lg">
              <div className="w-8 h-8 bg-blue-200 rounded-full opacity-50 absolute -top-2 -left-2 animate-ping"></div>
            </div>
          </div>
        )}
      </div>

      

      {/* Activities List Overlay */}
      {activities.length > 8 && (
        <div className="absolute bottom-4 right-4 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-slate-600 p-3">
          <div className="text-xs text-gray-600 dark:text-gray-300">
            Showing 8 of {activities.length} activities
          </div>
          <button className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline mt-1">
            View all in list
          </button>
        </div>
      )}
    </div>
  );
};

export default ActivitiesMap;