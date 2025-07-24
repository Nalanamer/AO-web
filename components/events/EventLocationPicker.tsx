// components/events/EventLocationPicker.tsx
import React, { useState } from 'react';
import { Wrapper } from '@googlemaps/react-wrapper';
import GoogleMapComponent from '../GoogleMapComponent';

interface LocationData {
  address: string;
  latitude: number;
  longitude: number;
}

interface EventLocationPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationSelect: (location: LocationData) => void;
  onClear: () => void;
  currentLocation: LocationData | null;
}

const EventLocationPicker: React.FC<EventLocationPickerProps> = ({
  isOpen,
  onClose,
  onLocationSelect,
  onClear,
  currentLocation
}) => {
  const [coordinates, setCoordinates] = useState({
    latitude: currentLocation?.latitude?.toString() || '',
    longitude: currentLocation?.longitude?.toString() || ''
  });

  if (!isOpen) return null;

  const handleMapClick = (lat: number, lng: number) => {
    setCoordinates({
      latitude: lat.toString(),
      longitude: lng.toString()
    });
  };

  const handleLocationSubmit = () => {
    if (coordinates.latitude && coordinates.longitude) {
      const generatedAddress = `${parseFloat(coordinates.latitude).toFixed(4)}, ${parseFloat(coordinates.longitude).toFixed(4)}`;
      onLocationSelect({
        address: generatedAddress,
        latitude: parseFloat(coordinates.latitude),
        longitude: parseFloat(coordinates.longitude)
      });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Select Search Location
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Coordinate Inputs */}
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Enter Coordinates
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                Enter latitude and longitude to search for events in that area
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Latitude
                </label>
                <input
                  type="number"
                  step="any"
                  value={coordinates.latitude}
                  onChange={(e) => setCoordinates(prev => ({ ...prev, latitude: e.target.value }))}
                  placeholder="-33.8688"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Longitude
                </label>
                <input
                  type="number"
                  step="any"
                  value={coordinates.longitude}
                  onChange={(e) => setCoordinates(prev => ({ ...prev, longitude: e.target.value }))}
                  placeholder="151.2093"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm"
                />
              </div>
            </div>
          </div>

          {/* Map */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Or Click on Map
            </label>
            <div className="w-full h-64 rounded-lg border border-gray-200 dark:border-slate-600 relative overflow-hidden">
              {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? (
                <Wrapper apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}>
                  <GoogleMapComponent
                    onLocationSelect={handleMapClick}
                    selectedLocation={coordinates.latitude && coordinates.longitude ? {
                      lat: parseFloat(coordinates.latitude),
                      lng: parseFloat(coordinates.longitude)
                    } : null}
                  />
                </Wrapper>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-slate-700">
                  <div className="text-center">
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                      Google Maps API key required
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2 px-4 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700"
            >
              Cancel
            </button>
            {currentLocation && (
              <button
                onClick={() => {
                  onClear();
                  onClose();
                }}
                className="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Clear Location
              </button>
            )}
            <button
              onClick={handleLocationSubmit}
              disabled={!coordinates.latitude || !coordinates.longitude}
              className="flex-1 py-2 px-4 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Select Location
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventLocationPicker;