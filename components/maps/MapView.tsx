// components/maps/MapView.tsx - Advanced Maps Integration Component
import React, { useState, useEffect, useRef } from 'react';

// Icons
const MapPinIcon: React.FC<{ className?: string }> = ({ className = "h-5 w-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const NavigationIcon: React.FC<{ className?: string }> = ({ className = "h-5 w-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m0 0L9 7" />
  </svg>
);

const ShareIcon: React.FC<{ className?: string }> = ({ className = "h-5 w-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
  </svg>
);

const LayersIcon: React.FC<{ className?: string }> = ({ className = "h-5 w-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
  </svg>
);

const FullscreenIcon: React.FC<{ className?: string }> = ({ className = "h-5 w-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
  </svg>
);

// Interfaces
interface LocationData {
  address: string;
  latitude?: number;
  longitude?: number;
}

interface MarkerData {
  id: string;
  location: LocationData;
  title: string;
  description?: string;
  type: 'activity' | 'event' | 'user';
  color?: string;
}

interface MapViewProps {
  location: string | LocationData;
  title?: string;
  markers?: MarkerData[];
  height?: string;
  showControls?: boolean;
  showDirections?: boolean;
  showShare?: boolean;
  zoom?: number;
  className?: string;
}

// Mock geocoding function (replace with real service)
const geocodeAddress = async (address: string): Promise<{ lat: number; lng: number } | null> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Mock coordinates for common Australian locations
  const mockCoordinates: { [key: string]: { lat: number; lng: number } } = {
    'sydney': { lat: -33.8688, lng: 151.2093 },
    'melbourne': { lat: -37.8136, lng: 144.9631 },
    'brisbane': { lat: -27.4698, lng: 153.0251 },
    'perth': { lat: -31.9505, lng: 115.8605 },
    'adelaide': { lat: -34.9285, lng: 138.6007 },
    'blue mountains': { lat: -33.7067, lng: 150.3098 },
    'bondi beach': { lat: -33.8915, lng: 151.2767 },
    'circular quay': { lat: -33.8634, lng: 151.2108 },
    'royal national park': { lat: -34.0659, lng: 151.0513 },
    'hunter valley': { lat: -32.8384, lng: 151.1913 }
  };

  const normalizedAddress = address.toLowerCase();
  
  // Check for exact matches
  for (const [key, coords] of Object.entries(mockCoordinates)) {
    if (normalizedAddress.includes(key)) {
      return coords;
    }
  }

  // Default to Sydney CBD if no match found
  return { lat: -33.8688, lng: 151.2093 };
};

const MapView: React.FC<MapViewProps> = ({
  location,
  title,
  markers = [],
  height = "400px",
  showControls = true,
  showDirections = true,
  showShare = true,
  zoom = 15,
  className = ""
}) => {
  const [mapCoords, setMapCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapType, setMapType] = useState<'roadmap' | 'satellite' | 'hybrid' | 'terrain'>('roadmap');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  const locationAddress = typeof location === 'string' ? location : location.address;
  const locationCoords = typeof location === 'object' && location.latitude && location.longitude 
    ? { lat: location.latitude, lng: location.longitude }
    : null;

  useEffect(() => {
    const initializeMap = async () => {
      setLoading(true);
      setError(null);

      try {
        let coords: { lat: number; lng: number };

        if (locationCoords) {
          coords = locationCoords;
        } else {
          const geocoded = await geocodeAddress(locationAddress);
          if (!geocoded) {
            throw new Error('Could not find location coordinates');
          }
          coords = geocoded;
        }

        setMapCoords(coords);
      } catch (err) {
        console.error('Error initializing map:', err);
        setError('Failed to load map location');
      } finally {
        setLoading(false);
      }
    };

    initializeMap();
  }, [locationAddress, locationCoords]);

  // Get user's current location
  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting user location:', error);
        }
      );
    }
  };

  useEffect(() => {
    getUserLocation();
  }, []);

  const openDirections = () => {
    if (!mapCoords) return;
    
    const destination = encodeURIComponent(locationAddress);
    const url = `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
    window.open(url, '_blank');
  };

  const shareLocation = async () => {
    const shareData = {
      title: title || 'Location',
      text: `Check out this location: ${locationAddress}`,
      url: window.location.href
    };

    if (navigator.share && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // Fallback to copying to clipboard
        copyToClipboard();
      }
    } else {
      copyToClipboard();
    }
  };

  const copyToClipboard = () => {
    const mapUrl = mapCoords 
      ? `https://www.google.com/maps?q=${mapCoords.lat},${mapCoords.lng}`
      : `https://www.google.com/maps/search/${encodeURIComponent(locationAddress)}`;
    
    navigator.clipboard.writeText(mapUrl).then(() => {
      // You could show a toast notification here
      console.log('Location copied to clipboard');
    });
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const getMapTypeLabel = (type: string) => {
    switch (type) {
      case 'roadmap': return 'Map';
      case 'satellite': return 'Satellite';
      case 'hybrid': return 'Hybrid';
      case 'terrain': return 'Terrain';
      default: return 'Map';
    }
  };

  if (loading) {
    return (
      <div 
        className={`relative rounded-lg overflow-hidden bg-gray-100 dark:bg-slate-700 ${className}`}
        style={{ height }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Loading map...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !mapCoords) {
    return (
      <div 
        className={`relative rounded-lg overflow-hidden bg-gray-100 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 ${className}`}
        style={{ height }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center p-6">
            <MapPinIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {error || 'Map not available'}
            </p>
            <div className="space-y-2">
              <p className="text-xs text-gray-500 dark:text-gray-500">
                <strong>Location:</strong> {locationAddress}
              </p>
              {showDirections && (
                <button
                  onClick={openDirections}
                  className="inline-flex items-center space-x-1 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 text-sm"
                >
                  <NavigationIcon className="h-4 w-4" />
                  <span>Get Directions</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Mock interactive map using iframe (replace with real map component)
  const mapSrc = `https://www.google.com/maps/embed/v1/place?key=YOUR_API_KEY&q=${mapCoords.lat},${mapCoords.lng}&zoom=${zoom}&maptype=${mapType}`;
  
  return (
    <div 
      ref={mapContainerRef}
      className={`relative rounded-lg overflow-hidden border border-gray-200 dark:border-slate-600 ${
        isFullscreen ? 'fixed inset-4 z-50 rounded-lg' : ''
      } ${className}`}
      style={{ height: isFullscreen ? 'calc(100vh - 2rem)' : height }}
    >
      {/* Map Container */}
      <div className="relative w-full h-full bg-gray-100 dark:bg-slate-700">
        {/* Mock Map Display */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-100 to-blue-100 dark:from-green-900/20 dark:to-blue-900/20">
          {/* Central Marker */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="relative">
              <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center shadow-lg">
                <MapPinIcon className="h-5 w-5 text-white" />
              </div>
              {title && (
                <div className="absolute top-10 left-1/2 transform -translate-x-1/2 bg-white dark:bg-slate-800 px-2 py-1 rounded shadow-lg text-xs whitespace-nowrap">
                  {title}
                </div>
              )}
            </div>
          </div>

          {/* Additional Markers */}
          {markers.map((marker, index) => (
            <div
              key={marker.id}
              className="absolute"
              style={{
                top: `${45 + (index * 5)}%`,
                left: `${50 + ((index % 2 === 0 ? 1 : -1) * (10 + index * 3))}%`
              }}
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center shadow-lg ${
                marker.type === 'activity' ? 'bg-emerald-500' :
                marker.type === 'event' ? 'bg-blue-500' : 'bg-purple-500'
              }`}>
                <MapPinIcon className="h-3 w-3 text-white" />
              </div>
            </div>
          ))}

          {/* User Location */}
          {userLocation && (
            <div className="absolute top-1/3 left-1/3">
              <div className="w-4 h-4 bg-blue-600 rounded-full border-2 border-white shadow-lg animate-pulse"></div>
            </div>
          )}

          {/* Grid Pattern for Visual Appeal */}
          <div className="absolute inset-0 opacity-10">
            <div className="w-full h-full" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
            }}></div>
          </div>
        </div>

        {/* Map Controls */}
        {showControls && (
          <div className="absolute top-4 right-4 space-y-2">
            {/* Map Type Selector */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-slate-600 overflow-hidden">
              <select
                value={mapType}
                onChange={(e) => setMapType(e.target.value as any)}
                className="px-3 py-2 text-sm bg-transparent border-none focus:ring-0 focus:outline-none text-gray-700 dark:text-gray-300"
              >
                <option value="roadmap">Map</option>
                <option value="satellite">Satellite</option>
                <option value="hybrid">Hybrid</option>
                <option value="terrain">Terrain</option>
              </select>
            </div>

            {/* Action Buttons */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-slate-600 overflow-hidden">
              <div className="flex flex-col">
                {showDirections && (
                  <button
                    onClick={openDirections}
                    className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                    title="Get Directions"
                  >
                    <NavigationIcon className="h-4 w-4" />
                    <span>Directions</span>
                  </button>
                )}
                
                {showShare && (
                  <button
                    onClick={shareLocation}
                    className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors border-t border-gray-200 dark:border-slate-600"
                    title="Share Location"
                  >
                    <ShareIcon className="h-4 w-4" />
                    <span>Share</span>
                  </button>
                )}
                
                <button
                  onClick={toggleFullscreen}
                  className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors border-t border-gray-200 dark:border-slate-600"
                  title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                >
                  <FullscreenIcon className="h-4 w-4" />
                  <span>{isFullscreen ? 'Exit' : 'Fullscreen'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Location Info */}
        <div className="absolute bottom-4 left-4 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-slate-600 p-3 max-w-xs">
          <div className="flex items-start space-x-2">
            <MapPinIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {title || 'Location'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {locationAddress}
              </p>
              {mapCoords && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {mapCoords.lat.toFixed(4)}, {mapCoords.lng.toFixed(4)}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Fullscreen Close Button */}
        {isFullscreen && (
          <button
            onClick={toggleFullscreen}
            className="absolute top-4 left-4 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-slate-600 p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
          >
            <XIcon className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
};

// Utility component for basic location display
export const LocationDisplay: React.FC<{
  location: string | LocationData;
  className?: string;
}> = ({ location, className = "" }) => {
  const address = typeof location === 'string' ? location : location.address;
  
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <MapPinIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
      <span className="text-gray-700 dark:text-gray-300">{address}</span>
    </div>
  );
};

// XIcon component for fullscreen close button
const XIcon: React.FC<{ className?: string }> = ({ className = "h-5 w-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

export default MapView;