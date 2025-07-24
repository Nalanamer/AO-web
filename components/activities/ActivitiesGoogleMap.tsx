// components/activities/ActivitiesGoogleMap.tsx
import React, { useEffect, useRef, useState } from 'react';

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
  difficulty?: string;
  eventCount?: number;
  participantCount?: number;
  isPrivate?: boolean;
  userId?: string;
  createdBy?: string;
  createdAt?: string;
}

interface ActivitiesGoogleMapProps {
  activities: Activity[];
  onActivitySelect: (activity: Activity) => void;
  userLocation?: { latitude: number; longitude: number } | null;
  searchLocation?: { latitude: number; longitude: number; address: string } | null;
  searchRadius?: number; // in kilometers
}

const ActivitiesGoogleMap: React.FC<ActivitiesGoogleMapProps> = ({
  activities,
  onActivitySelect,
  userLocation,
  searchLocation,
  searchRadius = 50
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  const [infoWindow, setInfoWindow] = useState<google.maps.InfoWindow | null>(null);
  const [searchCircle, setSearchCircle] = useState<google.maps.Circle | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || !window.google) return;

    const mapInstance = new window.google.maps.Map(mapRef.current, {
      center: searchLocation || userLocation || { lat: -33.8688, lng: 151.2093 },
      zoom: searchLocation || userLocation ? 12 : 8,
      mapTypeControl: true,
      streetViewControl: true,
      fullscreenControl: true,
      styles: [
        {
          featureType: "poi",
          elementType: "labels",
          stylers: [{ visibility: "off" }]
        }
      ]
    });

    setMap(mapInstance);

    // Create info window
    const infoWindowInstance = new window.google.maps.InfoWindow();
    setInfoWindow(infoWindowInstance);

    // Add click listener to close info window when clicking on map
    mapInstance.addListener('click', () => {
      infoWindowInstance.close();
    });

    // Add zoom control listeners
    const handleZoomIn = () => {
      const currentZoom = mapInstance.getZoom() || 8;
      mapInstance.setZoom(currentZoom + 1);
    };

    const handleZoomOut = () => {
      const currentZoom = mapInstance.getZoom() || 8;
      mapInstance.setZoom(Math.max(currentZoom - 1, 1));
    };

    window.addEventListener('mapZoomIn', handleZoomIn);
    window.addEventListener('mapZoomOut', handleZoomOut);

    return () => {
      markers.forEach(marker => marker.setMap(null));
      window.removeEventListener('mapZoomIn', handleZoomIn);
      window.removeEventListener('mapZoomOut', handleZoomOut);
    };
  }, [searchLocation, userLocation]);

  // Add search radius circle
  useEffect(() => {
    if (!map || !searchLocation) {
      // Remove existing circle if no search location
      if (searchCircle) {
        searchCircle.setMap(null);
        setSearchCircle(null);
      }
      return;
    }

    // Remove existing circle
    if (searchCircle) {
      searchCircle.setMap(null);
    }

    // Create new search radius circle
    const circle = new window.google.maps.Circle({
      strokeColor: '#10B981',
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: '#10B981',
      fillOpacity: 0.15,
      map: map,
      center: { lat: searchLocation.latitude, lng: searchLocation.longitude },
      radius: searchRadius * 1000, // Convert km to meters
    });

    setSearchCircle(circle);

    return () => {
      circle.setMap(null);
    };
  }, [map, searchLocation, searchRadius]);

  // Add search location marker
  useEffect(() => {
    if (!map || !searchLocation) return;

    const searchMarker = new window.google.maps.Marker({
      position: { lat: searchLocation.latitude, lng: searchLocation.longitude },
      map: map,
      title: 'Search Location',
      icon: {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" fill="#10B981" stroke="white" stroke-width="2"/>
            <circle cx="12" cy="12" r="4" fill="white"/>
          </svg>
        `),
        scaledSize: new window.google.maps.Size(28, 28),
        anchor: new window.google.maps.Point(14, 14)
      }
    });

    return () => {
      searchMarker.setMap(null);
    };
  }, [map, searchLocation]);

  // Add user location marker
  useEffect(() => {
    if (!map || !userLocation) return;

    const userMarker = new window.google.maps.Marker({
      position: { lat: userLocation.latitude, lng: userLocation.longitude },
      map: map,
      title: 'Your Location',
      icon: {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="8" fill="#3B82F6" stroke="white" stroke-width="2"/>
            <circle cx="12" cy="12" r="3" fill="white"/>
          </svg>
        `),
        scaledSize: new window.google.maps.Size(24, 24),
        anchor: new window.google.maps.Point(12, 12)
      }
    });

    return () => {
      userMarker.setMap(null);
    };
  }, [map, userLocation]);

  // Add activity markers
  useEffect(() => {
    if (!map || !infoWindow) return;

    // Clear existing markers
    markers.forEach(marker => marker.setMap(null));
    
    const newMarkers: google.maps.Marker[] = [];

    activities.forEach((activity, index) => {
      let lat, lng;

      // Extract coordinates from activity
      if (activity.latitude && activity.longitude) {
        lat = typeof activity.latitude === 'string' ? parseFloat(activity.latitude) : activity.latitude;
        lng = typeof activity.longitude === 'string' ? parseFloat(activity.longitude) : activity.longitude;
      } else if (typeof activity.location === 'object' && activity.location?.latitude && activity.location?.longitude) {
        lat = activity.location.latitude;
        lng = activity.location.longitude;
      }

      if (!lat || !lng || isNaN(lat) || isNaN(lng)) return;

      // Create marker
      const marker = new window.google.maps.Marker({
        position: { lat, lng },
        map: map,
        title: activity.activityname,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#DC2626" stroke="white" stroke-width="1"/>
              <circle cx="12" cy="9" r="2.5" fill="white"/>
            </svg>
          `),
          scaledSize: new window.google.maps.Size(32, 32),
          anchor: new window.google.maps.Point(16, 32)
        },
        animation: google.maps.Animation.DROP,
        zIndex: 1000 - index
      });

      // Add click listener
      marker.addListener('click', (e: google.maps.MapMouseEvent) => {
        // Stop event propagation to prevent map click
        e.stop?.();
        
        // Create info window content
        const locationText = typeof activity.location === 'string' 
          ? activity.location 
          : activity.location?.address || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;

        const typesText = activity.types && activity.types.length > 0 
          ? activity.types.join(', ') 
          : 'Activity';

        const content = `
          <div style="max-width: 300px; padding: 8px;">
            <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: bold; color: #1F2937;">
              ${activity.activityname}
            </h3>
            <p style="margin: 0 0 4px 0; font-size: 14px; color: #6B7280;">
              📍 ${locationText}
            </p>
            <p style="margin: 0 0 8px 0; font-size: 14px; color: #6B7280;">
              🎯 ${typesText}
            </p>
            ${activity.description ? `
              <p style="margin: 0 0 8px 0; font-size: 14px; color: #374151; line-height: 1.4;">
                ${activity.description.substring(0, 100)}${activity.description.length > 100 ? '...' : ''}
              </p>
            ` : ''}
            <button 
              onclick="window.selectActivity('${activity.$id}')" 
              style="
                background: #10B981; 
                color: white; 
                border: none; 
                padding: 6px 12px; 
                border-radius: 6px; 
                cursor: pointer; 
                font-size: 14px;
                margin-top: 4px;
              "
            >
              View Activity
            </button>
          </div>
        `;

        infoWindow.setContent(content);
        infoWindow.open(map, marker);

        // Store activity selection globally for the button click
        (window as any).selectActivity = (activityId: string) => {
          const selectedActivity = activities.find(a => a.$id === activityId);
          if (selectedActivity) {
            onActivitySelect(selectedActivity);
            infoWindow.close();
          }
        };
      });

      newMarkers.push(marker);
    });

    setMarkers(newMarkers);

    // Fit bounds to show all markers and search area
    if (newMarkers.length > 0 || searchLocation) {
      const bounds = new window.google.maps.LatLngBounds();
      
      // Add search location to bounds if available
      if (searchLocation) {
        bounds.extend({ lat: searchLocation.latitude, lng: searchLocation.longitude });
        
        // Extend bounds to include search radius
        const radiusInDegrees = searchRadius / 111; // Rough conversion from km to degrees
        bounds.extend({ 
          lat: searchLocation.latitude + radiusInDegrees, 
          lng: searchLocation.longitude + radiusInDegrees 
        });
        bounds.extend({ 
          lat: searchLocation.latitude - radiusInDegrees, 
          lng: searchLocation.longitude - radiusInDegrees 
        });
      }
      
      // Add user location to bounds if available
      if (userLocation) {
        bounds.extend({ lat: userLocation.latitude, lng: userLocation.longitude });
      }
      
      // Add all activity markers to bounds
      newMarkers.forEach(marker => {
        const position = marker.getPosition();
        if (position) {
          bounds.extend(position);
        }
      });

      map.fitBounds(bounds);
      
      // Set a maximum zoom level
      const listener = window.google.maps.event.addListener(map, 'bounds_changed', () => {
        if (map.getZoom() && map.getZoom()! > 15) {
          map.setZoom(15);
        }
        window.google.maps.event.removeListener(listener);
      });
    }

  }, [map, activities, infoWindow, onActivitySelect, userLocation]);

  return <div ref={mapRef} style={{ width: '100%', height: '100%' }} />;
};

export default ActivitiesGoogleMap;