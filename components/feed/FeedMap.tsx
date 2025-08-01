// components/feed/FeedMap.tsx
import React, { useRef, useEffect, useState } from 'react';
import { Wrapper } from '@googlemaps/react-wrapper';

interface MapLocation {
  lat: number;
  lng: number;
  title: string;
  type: 'activity' | 'event';
  difficulty?: string; // Optional for activities
  description?: string;
  id: string;
}

interface FeedMapProps {
  locations: MapLocation[];
  userLocation: { lat: number; lng: number } | null;
  onLocationClick?: (id: string, type: 'activity' | 'event') => void;
  className?: string;
  height?: string;
}

const FeedMapComponent: React.FC<{
  locations: MapLocation[];
  userLocation: { lat: number; lng: number } | null;
  onLocationClick?: (id: string, type: 'activity' | 'event') => void;
}> = ({ locations, userLocation, onLocationClick }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || !window.google) return;

    const mapCenter = userLocation || { lat: -33.8688, lng: 151.2093 }; // Default to Sydney

    const mapInstance = new window.google.maps.Map(mapRef.current, {
      center: mapCenter,
      zoom: userLocation ? 10 : 8,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        }
      ]
    });

    setMap(mapInstance);
  }, [userLocation]);

  // Update markers when locations or map changes
  useEffect(() => {
    if (!map || !window.google) return;

    // Clear existing markers
    markers.forEach(marker => marker.setMap(null));
    setMarkers([]);

    const newMarkers: google.maps.Marker[] = [];

    // Add user location marker
    if (userLocation) {
      const userMarker = new window.google.maps.Marker({
        position: userLocation,
        map: map,
        title: 'Your Location',
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="16" cy="16" r="14" fill="#3b82f6" stroke="white" stroke-width="3"/>
              <circle cx="16" cy="16" r="6" fill="white"/>
            </svg>
          `),
          scaledSize: new window.google.maps.Size(32, 32),
          anchor: new window.google.maps.Point(16, 16)
        },
        zIndex: 1000
      });

      newMarkers.push(userMarker);
    }

    // Add location markers
    locations.forEach((location) => {
      const getMarkerColor = (type: 'activity' | 'event', difficulty?: string) => {
        if (type === 'activity') {
          return '#8b5cf6'; // Purple for all activities
        } else {
          // Events: color coded by difficulty, grey if no difficulty
          if (!difficulty) return '#6b7280'; // Grey for events with no difficulty
          
          switch (difficulty) {
            case 'beginner': return '#10b981'; // Green
            case 'intermediate': return '#f59e0b'; // Orange
            case 'advanced': return '#ef4444'; // Red
            default: return '#6b7280'; // Grey
          }
        }
      };

      const getTypeIcon = (type: 'activity' | 'event') => {
        return type === 'activity' ? '🎯' : '📅';
      };

      const color = getMarkerColor(location.type, location.difficulty);
      const icon = getTypeIcon(location.type);

      const marker = new window.google.maps.Marker({
        position: { lat: location.lat, lng: location.lng },
        map: map,
        title: location.title,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="20" cy="20" r="18" fill="${color}" stroke="white" stroke-width="2"/>
              <text x="20" y="26" text-anchor="middle" font-size="16" fill="white">${icon}</text>
            </svg>
          `),
          scaledSize: new window.google.maps.Size(40, 40),
          anchor: new window.google.maps.Point(20, 20)
        }
      });

      // Add click listener
      marker.addListener('click', () => {
        if (onLocationClick) {
          onLocationClick(location.id, location.type);
        }
      });

      // Add info window
      const getDifficultyText = (type: 'activity' | 'event', difficulty?: string) => {
        if (type === 'activity') {
          return '🎯 Activity';
        } else {
          return difficulty ? `📅 Event • ${difficulty}` : '📅 Event';
        }
      };

      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="padding: 8px; max-width: 200px;">
            <h3 style="margin: 0 0 4px 0; font-size: 14px; font-weight: 600;">${location.title}</h3>
            <p style="margin: 0 0 4px 0; font-size: 12px; color: #666;">
              ${getDifficultyText(location.type, location.difficulty)}
            </p>
            ${location.description ? `<p style="margin: 0; font-size: 11px; color: #888;">${location.description.substring(0, 80)}${location.description.length > 80 ? '...' : ''}</p>` : ''}
          </div>
        `
      });

      marker.addListener('click', () => {
        infoWindow.open(map, marker);
      });

      newMarkers.push(marker);
    });

    setMarkers(newMarkers);

    // Fit map to show all markers
    if (newMarkers.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      newMarkers.forEach(marker => {
        if (marker.getPosition()) {
          bounds.extend(marker.getPosition()!);
        }
      });
      map.fitBounds(bounds);
      
      // Don't zoom in too much for single markers
      const listener = window.google.maps.event.addListener(map, 'idle', () => {
        if (map.getZoom()! > 15) map.setZoom(15);
        window.google.maps.event.removeListener(listener);
      });
    }

  }, [map, locations, userLocation, onLocationClick]);

  return <div ref={mapRef} className="w-full h-full rounded-lg" />;
};

const FeedMap: React.FC<FeedMapProps> = ({ 
  locations, 
  userLocation, 
  onLocationClick, 
  className = "",
  height = "400px" 
}) => {
  return (
    <div className={`${className}`} style={{ height }}>
      {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? (
        <Wrapper apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}>
          <FeedMapComponent
            locations={locations}
            userLocation={userLocation}
            onLocationClick={onLocationClick}
          />
        </Wrapper>
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-slate-700 rounded-lg">
          <div className="text-center">
            <div className="text-4xl mb-2">🗺️</div>
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
              Map view requires Google Maps API
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeedMap;