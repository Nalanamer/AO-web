// components/maps/EventDetailMap.tsx
import React, { useState, useEffect, useRef } from 'react';

// Global type declarations for Google Maps
declare global {
  interface Window {
    google: any;
  }
}

interface EventDetailMapProps {
  event: {
    eventName: string;
    title?: string;
    meetupPoint?: string;
    location?: string;
    latitude?: string | number;
    longitude?: string | number;
  };
  className?: string;
  height?: string;
}

const EventDetailMap: React.FC<EventDetailMapProps> = ({ 
  event, 
  className = "",
  height = "256px" 
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mapInstance, setMapInstance] = useState<any>(null);

  // Extract coordinates from event data (improved from activity lessons)
  const getEventCoordinates = () => {
    console.log('🔍 Checking event for coordinates:', { 
      latitude: event.latitude, 
      longitude: event.longitude,
      meetupPoint: event.meetupPoint,
      location: event.location 
    });

    // ✅ PRIORITY 1: Direct latitude/longitude fields
    if (event.latitude !== undefined && event.longitude !== undefined) {
      const lat = typeof event.latitude === 'string' ? parseFloat(event.latitude) : event.latitude;
      const lng = typeof event.longitude === 'string' ? parseFloat(event.longitude) : event.longitude;
      
      if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
        console.log('✅ Found valid coordinates from lat/lng fields:', { lat, lng });
        return { lat, lng };
      }
    }

    // ✅ PRIORITY 2: Try to parse coordinates from meetupPoint or location string
    const locationText = event.meetupPoint || event.location || '';
    if (typeof locationText === 'string') {
      const coordMatch = locationText.match(/-?\d+\.?\d*,\s*-?\d+\.?\d*/);
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
    const eventTitle = event.eventName || event.title || 'Event';
    
    if (event.meetupPoint && typeof event.meetupPoint === 'string') {
      return event.meetupPoint;
    }
    if (event.location && typeof event.location === 'string') {
      return event.location;
    }
    return eventTitle + ' Location';
  };

  // Load Google Maps script
  useEffect(() => {
    if (typeof window !== 'undefined' && window.google && window.google.maps) {
      setIsLoaded(true);
      return;
    }

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

    const initializeMap = async () => {
      try {
        const coordinates = getEventCoordinates();
        let mapCenter: { lat: number; lng: number };

        // ✅ IMPROVED: Always prioritize coordinates over geocoding
        if (coordinates) {
          mapCenter = coordinates;
          console.log('✅ Using event coordinates directly:', mapCenter);
        } else {
          // ✅ Try to parse coordinates from location string before geocoding
          const address = getLocationAddress();
          const coordMatch = address.match(/-?\d+\.?\d*,\s*-?\d+\.?\d*/);
          
          if (coordMatch) {
            const [lat, lng] = coordMatch[0].split(',').map(coord => parseFloat(coord.trim()));
            if (!isNaN(lat) && !isNaN(lng)) {
              mapCenter = { lat, lng };
              console.log('✅ Parsed coordinates from location string:', mapCenter);
            } else {
              throw new Error('Invalid coordinate format');
            }
          } else {
            // ✅ Try geocoding for real addresses only
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
          title: event.eventName || event.title || 'Event Location',
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="16" cy="16" r="12" fill="#ef4444" stroke="white" stroke-width="3"/>
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
        setError('Failed to load event location on map');
      }
    };

    initializeMap();
  }, [isLoaded, event]);

  // Handle directions
  const openDirections = () => {
    const coordinates = getEventCoordinates();
    const address = getLocationAddress();
    
    if (coordinates) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${coordinates.lat},${coordinates.lng}`;
      window.open(url, '_blank');
    } else {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
      window.open(url, '_blank');
    }
  };

  // Render error state with useful info
  if (error || !process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
    const coordinates = getEventCoordinates();
    const address = getLocationAddress();

    return (
      <div className={`relative rounded-lg overflow-hidden bg-gradient-to-br from-red-50 to-red-100 border border-red-200 ${className}`} style={{ height }}>
        <div className="absolute inset-0 flex items-center justify-center p-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-red-900 mb-2">{event.eventName || event.title}</h3>
            <p className="text-red-700 mb-4">{address}</p>
            
            {coordinates && (
              <p className="text-sm text-red-600 mb-4">
                📍 {coordinates.lat.toFixed(4)}, {coordinates.lng.toFixed(4)}
              </p>
            )}
            
            <button
              onClick={openDirections}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 font-medium transition-colors"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3" />
              </svg>
              <span>Get Directions</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative rounded-lg overflow-hidden ${className}`} style={{ height }}>
      <div ref={mapRef} className="w-full h-full" />
      
      {/* Overlay controls */}
      <div className="absolute top-4 right-4">
        <button
          onClick={openDirections}
          className="bg-white hover:bg-gray-50 text-gray-700 px-3 py-2 rounded-lg shadow-lg border border-gray-200 flex items-center space-x-2 text-sm font-medium transition-colors"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3" />
          </svg>
          <span>Directions</span>
        </button>
      </div>
    </div>
  );
};

export default EventDetailMap;