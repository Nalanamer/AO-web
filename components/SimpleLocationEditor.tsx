// components/SimpleLocationEditor.tsx - Coordinates only
import React, { useState, useCallback } from 'react';
import { Wrapper } from '@googlemaps/react-wrapper';
import GoogleMapComponent from './GoogleMapComponent';

interface LocationData {
  locationCoords: string; // "lat,lng" format
  searchRadius: string;   // String to match Appwrite
}

interface SimpleLocationEditorProps {
  initialLocation: LocationData;
  onSave: (location: LocationData) => Promise<boolean>;
  onCancel: () => void;
}

const SimpleLocationEditor: React.FC<SimpleLocationEditorProps> = ({ 
  initialLocation, 
  onSave, 
  onCancel 
}) => {
  // Parse initial coordinates from string
  const parseCoords = (coordString: string) => {
    if (!coordString) return { lat: 0, lng: 0 };
    const parts = coordString.split(',');
    if (parts.length === 2) {
      return {
        lat: parseFloat(parts[0].trim()) || 0,
        lng: parseFloat(parts[1].trim()) || 0
      };
    }
    return { lat: 0, lng: 0 };
  };

  const initialCoords = parseCoords(initialLocation.locationCoords);
  
  const [coordinates, setCoordinates] = useState({
    latitude: initialCoords.lat,
    longitude: initialCoords.lng
  });
  
  const [searchRadius, setSearchRadius] = useState(initialLocation.searchRadius || '50');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Handle map click to set location
  const handleMapClick = useCallback((lat: number, lng: number) => {
    setCoordinates({
      latitude: lat,
      longitude: lng
    });
    setError(null);
  }, []);

  // Handle coordinate input changes
  const handleLatitudeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value)) {
      setCoordinates(prev => ({ ...prev, latitude: value }));
      setError(null);
    }
  };

  const handleLongitudeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value)) {
      setCoordinates(prev => ({ ...prev, longitude: value }));
      setError(null);
    }
  };

  // Handle save
  const handleSave = async () => {
    if (!coordinates.latitude || !coordinates.longitude) {
      setError('Please select a location on the map or enter coordinates');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const success = await onSave({
        locationCoords: `${coordinates.latitude},${coordinates.longitude}`,
        searchRadius: searchRadius // Keep as string
      });

      if (success) {
        onCancel(); // Close modal on success
      } else {
        setError('Failed to save location. Please try again.');
      }
    } catch (error) {
      setError('An error occurred while saving. Please try again.');
      console.error('Save error:', error);
    } finally {
      setSaving(false);
    }
  };

  // Get current map center for display
  const selectedLocation = coordinates.latitude && coordinates.longitude 
    ? { lat: coordinates.latitude, lng: coordinates.longitude }
    : null;

  return (
    <div className="space-y-6">
      {/* Map */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Click on map to set your location
        </label>
        <div className="border border-gray-300 dark:border-slate-600 rounded-lg overflow-hidden">
          <div style={{ width: '100%', height: '400px' }}>
            {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? (
              <Wrapper apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}>
                <GoogleMapComponent
                  onLocationSelect={handleMapClick}
                  selectedLocation={selectedLocation}
                />
              </Wrapper>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-slate-700">
                <div className="text-center">
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    Google Maps API key required
                  </p>
                  <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
                    Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to your .env.local file
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Click anywhere on the map to set your location for activity suggestions
        </p>
      </div>

      {/* Current Location Display */}
      {coordinates.latitude && coordinates.longitude && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
          <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
            Selected Location:
          </p>
          <p className="text-xs text-emerald-600 dark:text-emerald-400">
            Latitude: {coordinates.latitude.toFixed(6)}, Longitude: {coordinates.longitude.toFixed(6)}
          </p>
        </div>
      )}

      {/* Manual Coordinates Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Or Enter Coordinates Manually
        </label>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Latitude
            </label>
            <input
              type="number"
              step="any"
              value={coordinates.latitude || ''}
              onChange={handleLatitudeChange}
              placeholder="-33.8688"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-white dark:border-slate-600 dark:text-black text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Longitude
            </label>
            <input
              type="number"
              step="any"
              value={coordinates.longitude || ''}
              onChange={handleLongitudeChange}
              placeholder="151.2093"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-white dark:border-slate-600 dark:text-black text-sm"
            />
          </div>
        </div>
      </div>

      {/* Search Radius */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Search Radius: {searchRadius} km
        </label>
        <input
          type="range"
          min="1"
          max="100"
          step="1"
          value={parseInt(searchRadius)}
          onChange={(e) => setSearchRadius(e.target.value)} // Keep as string
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700"
        />
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
          <span>1 km</span>
          <span>100 km</span>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          disabled={saving}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 dark:border-slate-600 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving || !coordinates.latitude || !coordinates.longitude}
          className="flex-1 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center"
        >
          {saving ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </>
          ) : (
            'Save Location'
          )}
        </button>
      </div>
    </div>
  );
};

export default SimpleLocationEditor;