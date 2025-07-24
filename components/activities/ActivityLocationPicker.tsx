// components/activities/ActivityLocationPicker.tsx
import React, { useState } from 'react';
import { Wrapper } from "@googlemaps/react-wrapper";
import GoogleMapComponent from '../GoogleMapComponent';

interface LocationData {
  address: string;
  latitude: number;
  longitude: number;
}

interface ActivityLocationPickerProps {
  onLocationSelect: (location: LocationData) => void;
  onClear: () => void;
  currentLocation: LocationData | null;
  isOpen: boolean;
  onClose: () => void;
}

const ActivityLocationPicker: React.FC<ActivityLocationPickerProps> = ({
  onLocationSelect,
  onClear,
  currentLocation,
  isOpen,
  onClose
}) => {
  const [coordinates, setCoordinates] = useState({
    latitude: currentLocation?.latitude?.toString() || '',
    longitude: currentLocation?.longitude?.toString() || ''
  });
  const [address, setAddress] = useState(currentLocation?.address || '');
  const [showMapPicker, setShowMapPicker] = useState(false);

  if (!isOpen) return null;

  const handleMapClick = (lat: number, lng: number) => {
    setCoordinates({
      latitude: lat.toString(),
      longitude: lng.toString()
    });
    setAddress(`Location: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
  };

  const handleLocationSubmit = () => {
    if (coordinates.latitude && coordinates.longitude && address) {
      onLocationSelect({
        address,
        latitude: parseFloat(coordinates.latitude),
        longitude: parseFloat(coordinates.longitude)
      });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">📍 Select Search Location</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            ✕
          </button>
        </div>

        {/* Mode Toggle */}
        <div className="flex space-x-2 mb-6">
          <button
            onClick={() => setShowMapPicker(false)}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
              !showMapPicker
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
            }`}
          >
            📝 Enter Coordinates
          </button>
          <button
            onClick={() => setShowMapPicker(true)}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
              showMapPicker
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
            }`}
          >
            🗺️ Pick on Map
          </button>
        </div>

        {!showMapPicker ? (
          // Manual Entry Mode
          <div className="space-y-4">
            

            {/* Coordinates */}
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
                    
                    // Auto-update map if both coordinates are provided
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
                    
                    // Auto-update map if both coordinates are provided
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
          </div>
        ) : (
          // Map Picker Mode
          <div className="space-y-4">

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
        <div className="text-4xl mb-2">🗺️</div>
        <p className="text-sm font-medium">Click anywhere to set location</p>
        <p className="text-xs mt-2">
          {coordinates.latitude && coordinates.longitude 
            ? `📍 ${parseFloat(coordinates.latitude).toFixed(4)}, ${parseFloat(coordinates.longitude).toFixed(4)}`
            : 'No location selected'
          }
        </p>
      </div>
    </div>
  )}
</div>


          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-2 px-4 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700"
          >
            Cancel
          </button>
          {currentLocation && (
            <button
              onClick={() => {
                onClear();
                onClose();
              }}
              className="flex-1 py-2 px-4 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              Clear Location
            </button>
          )}
          <button
            onClick={handleLocationSubmit}
            disabled={!coordinates.latitude || !coordinates.longitude || !address}
            className="flex-1 py-2 px-4 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Select Location
          </button>
        </div>
      </div>
    </div>
  );
};

export default ActivityLocationPicker;