// components/events/EventsGoogleMap.tsx
import React, { useEffect, useRef, useState } from 'react';

interface Event {
  $id: string;
  eventName?: string;
  title?: string;
  description?: string;
  date?: string;
  latitude?: number;
  longitude?: number;
}

interface EventsGoogleMapProps {
  events: Event[];
  onEventSelect: (event: Event) => void;
  userLocation?: { latitude: number; longitude: number } | null;
  searchLocation?: { latitude: number; longitude: number; address: string } | null;
  searchRadius?: number;
}

const EventsGoogleMap: React.FC<EventsGoogleMapProps> = ({
  events,
  onEventSelect,
  userLocation,
  searchLocation,
  searchRadius = 25
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
      center: searchLocation ? 
        { lat: searchLocation.latitude, lng: searchLocation.longitude } :
        userLocation ? 
        { lat: userLocation.latitude, lng: userLocation.longitude } :
        { lat: -33.8688, lng: 151.2093 }, // Default to Sydney
      zoom: 12,
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

  // Add event markers
  useEffect(() => {
    if (!map || !infoWindow) return;

    // Clear existing markers
    markers.forEach(marker => marker.setMap(null));

    const newMarkers: google.maps.Marker[] = [];

    // Add user location marker
    if (userLocation) {
      const userMarker = new window.google.maps.Marker({
        position: { lat: userLocation.latitude, lng: userLocation.longitude },
        map: map,
        title: 'Your Location',
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="8" fill="#3B82F6" stroke="white" stroke-width="3"/>
              <circle cx="12" cy="12" r="3" fill="white"/>
            </svg>
          `),
          scaledSize: new window.google.maps.Size(24, 24),
          anchor: new window.google.maps.Point(12, 12)
        }
      });
      newMarkers.push(userMarker);
    }

    // Add search location marker
    if (searchLocation) {
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
      newMarkers.push(searchMarker);
    }

    // Add event markers
    events.forEach((event) => {
      if (!event.latitude || !event.longitude) return;

      const marker = new window.google.maps.Marker({
        position: { lat: event.latitude, lng: event.longitude },
        map: map,
        title: event.eventName || event.title,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="32" height="40" viewBox="0 0 24 30" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 0C7.58 0 4 3.58 4 8C4 14 12 22 12 22S20 14 20 8C20 3.58 16.42 0 12 0Z" fill="#EF4444"/>
              <circle cx="12" cy="8" r="3" fill="white"/>
            </svg>
          `),
          scaledSize: new window.google.maps.Size(32, 40),
          anchor: new window.google.maps.Point(16, 40)
        }
      });

      marker.addListener('click', () => {
        const content = `
          <div style="
            max-width: 300px; 
            padding: 12px; 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          ">
            <h3 style="
              margin: 0 0 8px 0; 
              font-size: 16px; 
              font-weight: 600; 
              color: #111827; 
              line-height: 1.2;
            ">
              ${event.eventName || event.title}
            </h3>
            ${event.description ? `
              <p style="margin: 0 0 8px 0; font-size: 14px; color: #374151; line-height: 1.4;">
                ${event.description.substring(0, 100)}${event.description.length > 100 ? '...' : ''}
              </p>
            ` : ''}
            ${event.date ? `
              <p style="margin: 0 0 8px 0; font-size: 14px; color: #6B7280;">
                📅 ${event.date}
              </p>
            ` : ''}
            <button 
              onclick="window.selectEvent('${event.$id}')" 
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
              View Event
            </button>
          </div>
        `;

        infoWindow.setContent(content);
        infoWindow.open(map, marker);

        // Store event selection globally for the button click
        (window as any).selectEvent = (eventId: string) => {
          const selectedEvent = events.find(e => e.$id === eventId);
          if (selectedEvent) {
            onEventSelect(selectedEvent);
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
      
      // Add all event markers to bounds
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

  }, [map, events, infoWindow, onEventSelect, userLocation, searchLocation, searchRadius]);

  return <div ref={mapRef} style={{ width: '100%', height: '100%' }} />;
};

export default EventsGoogleMap;