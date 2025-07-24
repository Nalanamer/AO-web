// components/maps/ActivityDetailMap.tsx - Fixed TypeScript version
import React, { useState, useEffect, useRef } from 'react';

// Add global type declarations for Google Maps
declare global {
  interface Window {
    google: any;
  }
}

interface ActivityDetailMapProps {
  activity: {
    activityname: string;
    location: string | { address: string; coordinates?: { lat: number; lng: number } };
    latitude?: string | number;
    longitude?: string | number;
  };
  className?: string;
  height?: string;
}

const ActivityDetailMap: React.FC<ActivityDetailMapProps> = ({ 
  activity, 
  className = "",
  height = "256px" 
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mapInstance, setMapInstance] = useState<any>(null);

  // Extract coordinates from activity data
  // Enhanced coordinate extraction
const getActivityCoordinates = () => {
  console.log('🔍 Checking activity for coordinates:', { 
    latitude: activity.latitude, 
    longitude: activity.longitude,
    location: activity.location 
  });

  // ✅ PRIORITY 1: Direct latitude/longitude fields
  if (activity.latitude !== undefined && activity.longitude !== undefined) {
    const lat = typeof activity.latitude === 'string' ? parseFloat(activity.latitude) : activity.latitude;
    const lng = typeof activity.longitude === 'string' ? parseFloat(activity.longitude) : activity.longitude;
    
    if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
      console.log('✅ Found valid coordinates from lat/lng fields:', { lat, lng });
      return { lat, lng };
    }
  }

  // ✅ PRIORITY 2: Location object coordinates
  if (typeof activity.location === 'object' && activity.location.coordinates) {
    console.log('✅ Found coordinates from location.coordinates:', activity.location.coordinates);
    return activity.location.coordinates;
  }

  // ✅ PRIORITY 3: Try to parse coordinates from location string
  if (typeof activity.location === 'string') {
    const coordMatch = activity.location.match(/-?\d+\.?\d*,\s*-?\d+\.?\d*/);
    if (coordMatch) {
      const [lat, lng] = coordMatch[0].split(',').map(coord => parseFloat(coord.trim()));
      if (!isNaN(lat) && !isNaN(lng)) {
        console.log('✅ Parsed coordinates from location string:', { lat, lng });
        return { lat, lng };
      }
    }
  }

  console.log('❌ No valid coordinates found');
  return null;
};
  // Get location address for display and geocoding
  const getLocationAddress = () => {
    if (typeof activity.location === 'string') {
      return activity.location;
    }
    if (typeof activity.location === 'object' && activity.location.address) {
      return activity.location.address;
    }
    return activity.activityname || 'Activity Location';
  };

  // Load Google Maps script
  useEffect(() => {
    // Check if Google Maps is already loaded
    if (typeof window !== 'undefined' && window.google && window.google.maps) {
      setIsLoaded(true);
      return;
    }

    // Check if API key exists
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      setError('Google Maps API key not configured');
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=geometry`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => setIsLoaded(true);
    script.onerror = () => setError('Failed to load Google Maps');
    
    document.head.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  // Initialize map when loaded
  useEffect(() => {
    if (!isLoaded || !mapRef.current || !window.google) return;

   // In components/maps/ActivityDetailMap.tsx
// Replace the existing initializeMap function with this improved version:

const initializeMap = async () => {
  try {
    const coordinates = getActivityCoordinates();
    let mapCenter: { lat: number; lng: number };

    // ✅ FIXED: Always prioritize coordinates over geocoding
    if (coordinates) {
      mapCenter = coordinates;
      console.log('✅ Using activity coordinates directly:', mapCenter);
    } else {
      // ✅ IMPROVED: Try to parse coordinates from location string before geocoding
      const address = getLocationAddress();
      const coordMatch = address.match(/-?\d+\.?\d*,\s*-?\d+\.?\d*/);
      
      if (coordMatch) {
        // Parse coordinates from string like "-33.8506, 150.8333"
        const [lat, lng] = coordMatch[0].split(',').map(coord => parseFloat(coord.trim()));
        if (!isNaN(lat) && !isNaN(lng)) {
          mapCenter = { lat, lng };
          console.log('✅ Parsed coordinates from location string:', mapCenter);
        } else {
          throw new Error('Invalid coordinate format');
        }
      } else {
        // ✅ LAST RESORT: Try geocoding for real addresses only
        if (address && !address.match(/-?\d+\.?\d*/) && address.length > 5) {
          console.log('🔍 Attempting to geocode address:', address);
          const geocoder = new window.google.maps.Geocoder();
          
          try {
            const response: any = await new Promise((resolve, reject) => {
              geocoder.geocode({ address }, (results: any, status: any) => {
                if (status === 'OK' && results && results[0]) {
                  resolve({ results, status });
                } else {
                  reject(new Error(`Geocoding failed: ${status}`));
                }
              });
            });

            const location = response.results[0].geometry.location;
            mapCenter = { lat: location.lat(), lng: location.lng() };
            console.log('✅ Geocoded address to coordinates:', mapCenter);
          } catch (geocodeError) {
            console.error('❌ Geocoding failed:', geocodeError);
            throw new Error('Could not find location coordinates');
          }
        } else {
          // Fallback to Sydney CBD
          mapCenter = { lat: -33.8688, lng: 151.2093 };
          console.log('🏙️ Using Sydney CBD fallback coordinates');
        }
      }
    }

    // Create map
    const map = new window.google.maps.Map(mapRef.current!, {
      center: mapCenter,
      zoom: 15,
      mapTypeId: window.google.maps.MapTypeId.ROADMAP,
      disableDefaultUI: false,
      zoomControl: true,
      mapTypeControl: true,
      scaleControl: true,
      streetViewControl: true,
      rotateControl: true,
      fullscreenControl: true,
      styles: [
        {
          featureType: "poi.business",
          stylers: [{ visibility: "off" }]
        }
      ]
    });

    // Add marker
    new window.google.maps.Marker({
      position: mapCenter,
      map,
      title: activity.activityname,
      icon: {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="16" cy="16" r="12" fill="#10b981" stroke="white" stroke-width="3"/>
            <circle cx="16" cy="16" r="6" fill="white"/>
          </svg>
        `),
        scaledSize: new window.google.maps.Size(32, 32),
        anchor: new window.google.maps.Point(16, 16)
      }
    });

    setMapInstance(map);
  } catch (err) {
    console.error('❌ Error initializing map:', err);
    setError('Failed to load location on map');
  }
};

    initializeMap();
  }, [isLoaded, activity]);

  // Handle directions
  const openDirections = () => {
    const coordinates = getActivityCoordinates();
    const address = getLocationAddress();
    
    if (coordinates) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${coordinates.lat},${coordinates.lng}`;
      window.open(url, '_blank');
    } else {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
      window.open(url, '_blank');
    }
  };

  // Handle sharing
  const shareLocation = async () => {
    const coordinates = getActivityCoordinates();
    const address = getLocationAddress();
    
    const shareText = coordinates 
      ? `${activity.activityname} - ${address}\nhttps://maps.google.com/?q=${coordinates.lat},${coordinates.lng}`
      : `${activity.activityname} - ${address}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: activity.activityname,
          text: shareText,
          url: window.location.href
        });
      } catch (err) {
        // Fallback to clipboard
        copyToClipboard(shareText);
      }
    } else {
      copyToClipboard(shareText);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      // You could add a toast notification here
      console.log('Location copied to clipboard');
    });
  };

  // Render fallback/error state
  if (error || !process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
    const coordinates = getActivityCoordinates();
    const address = getLocationAddress();

    return (
      <div className={`relative rounded-lg overflow-hidden bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 ${className}`} style={{ height }}>
        <div className="absolute inset-0 flex items-center justify-center p-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-emerald-900 mb-2">{activity.activityname}</h3>
            <p className="text-emerald-700 mb-4">{address}</p>
            
            {coordinates && (
              <p className="text-sm text-emerald-600 mb-4">
                📍 {coordinates.lat.toFixed(4)}, {coordinates.lng.toFixed(4)}
              </p>
            )}
            
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <button
                onClick={openDirections}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 font-medium transition-colors"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                <span>Get Directions</span>
              </button>
              
              <button
                onClick={shareLocation}
                className="bg-white hover:bg-gray-50 text-emerald-700 px-4 py-2 rounded-lg flex items-center justify-center space-x-2 font-medium border border-emerald-200 transition-colors"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                </svg>
                <span>Share Location</span>
              </button>
            </div>

            {error && (
              <p className="text-xs text-emerald-600 mt-3 italic">
                {error === 'Google Maps API key not configured' 
                  ? 'Map will show after API key is configured'
                  : error
                }
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className={`relative rounded-lg overflow-hidden bg-gray-100 ${className}`} style={{ height }}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Loading map...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative rounded-lg overflow-hidden border border-gray-200 ${className}`} style={{ height }}>
      {/* Map Container */}
      <div ref={mapRef} className="w-full h-full" />
      
      {/* Map Controls Overlay */}
      <div className="absolute top-4 right-4 flex flex-col space-y-2">
        {/* Directions Button */}
        <button
          onClick={openDirections}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-lg shadow-lg flex items-center space-x-1 text-sm font-medium transition-colors"
          title="Get Directions"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          <span>Directions</span>
        </button>

        {/* Share Button */}
        <button
          onClick={shareLocation}
          className="bg-white hover:bg-gray-50 text-gray-700 px-3 py-2 rounded-lg shadow-lg flex items-center space-x-1 text-sm font-medium border transition-colors"
          title="Share Location"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
          </svg>
          <span>Share</span>
        </button>
      </div>

      {/* Location Info Overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
        <div className="text-white">
          <h3 className="font-semibold text-sm">{activity.activityname}</h3>
          <p className="text-xs opacity-90">{getLocationAddress()}</p>
        </div>
      </div>
    </div>
  );
};

export default ActivityDetailMap;