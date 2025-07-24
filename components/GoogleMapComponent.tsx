// components/GoogleMapComponent.tsx
import React, { useEffect, useRef, useState } from 'react';

interface GoogleMapComponentProps {
  onLocationSelect: (lat: number, lng: number) => void;
  selectedLocation?: { lat: number; lng: number } | null;
}

const GoogleMapComponent: React.FC<GoogleMapComponentProps> = ({
  onLocationSelect,
  selectedLocation
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [marker, setMarker] = useState<google.maps.Marker | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || !window.google) return;

    const mapInstance = new window.google.maps.Map(mapRef.current, {
      center: selectedLocation || { lat: -33.8688, lng: 151.2093 }, // Sydney default
      zoom: 10,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    });

    setMap(mapInstance);

    // Add click listener
    const clickListener = mapInstance.addListener('click', (e: google.maps.MapMouseEvent) => {
      if (e.latLng) {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        onLocationSelect(lat, lng);
      }
    });

    return () => {
      window.google.maps.event.removeListener(clickListener);
    };
  }, [onLocationSelect]);

  // Update marker when location changes
  useEffect(() => {
    if (!map || !selectedLocation) return;

    // Remove existing marker
    if (marker) {
      marker.setMap(null);
    }

    // Add new marker
    const newMarker = new window.google.maps.Marker({
      position: selectedLocation,
      map: map,
      draggable: true,
    });

    // Add drag listener
    newMarker.addListener('dragend', () => {
      const position = newMarker.getPosition();
      if (position) {
        onLocationSelect(position.lat(), position.lng());
      }
    });

    setMarker(newMarker);
    map.panTo(selectedLocation);
  }, [map, selectedLocation, onLocationSelect]);

  return <div ref={mapRef} style={{ width: '100%', height: '100%' }} />;
};

export default GoogleMapComponent;