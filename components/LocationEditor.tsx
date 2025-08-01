// components/LocationEditor.tsx - Fixed using your working Google Maps pattern
import React, { useState, useCallback } from 'react';
import { Wrapper } from '@googlemaps/react-wrapper';
import GoogleMapComponent from './GoogleMapComponent';

interface LocationData {
  address: string;
  locationCoords: string; // Change this to string
  searchRadius: number;
}

interface LocationEditorProps {
  initialLocation: LocationData;
  onSave: (location: LocationData) => Promise<boolean>;
  onCancel: () => void;
}

const LocationEditor: React.FC<LocationEditorProps> = ({ 
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
  
  const [location, setLocation] = useState({
    address: initialLocation.address,
    latitude: initialCoords.lat,
    longitude: initialCoords.lng,
    searchRadius: initialLocation.searchRadius
  });const [addressInput, setAddressInput] = useState(initialLocation.address);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Handle map click to set location
 // Fix 1: Replace the handleMapClick function
const handleMapClick = useCallback((lat: number, lng: number) => {
  setLocation(prev => ({
    ...prev,
    latitude: lat,
    longitude: lng
  }));

  // Reverse geocode to get address
  if (window.google?.maps) {
    setIsGeocoding(true);
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode(
      { location: { lat, lng } },
      (results: google.maps.GeocoderResult[] | null, status: google.maps.GeocoderStatus) => {
        setIsGeocoding(false);
        if (status === 'OK' && results?.[0]) {
          const address = results[0].formatted_address;
          setLocation(prev => ({ ...prev, address }));
          setAddressInput(address);
          setError(null);
        } else {
          setError('Could not determine address for this location');
        }
      }
    );
  }
}, []);

// Fix 2: Replace the handleAddressSubmit function
const handleAddressSubmit = useCallback(() => {
  if (!window.google?.maps || !addressInput.trim()) return;

  setIsGeocoding(true);
  setError(null);

  const geocoder = new window.google.maps.Geocoder();
  geocoder.geocode(
    { address: addressInput },
    (results: google.maps.GeocoderResult[] | null, status: google.maps.GeocoderStatus) => {
      setIsGeocoding(false);
      if (status === 'OK' && results?.[0]) {
        const result = results[0];
        const lat = result.geometry.location.lat();
        const lng = result.geometry.location.lng();
        const address = result.formatted_address;

        setLocation(prev => ({
          ...prev,
          address,
          latitude: lat,
          longitude: lng
        }));
        setAddressInput(address);
      } else {
        setError('Could not find this address. Please try a different search term.');
      }
    }
  );
}, [addressInput]);


  // Handle enter key in address input
  const handleAddressKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddressSubmit();
    }
  };

  // Handle save
  const handleSave = async () => {
    if (!location.address || !location.latitude || !location.longitude) {
      setError('Please select a valid location');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const success = await onSave({
        address: location.address,
        locationCoords: `${location.latitude},${location.longitude}`, // String format
        searchRadius: location.searchRadius
      });

      if (success) {
        onCancel();
      } else {
        setError('Failed to save location. Please try again.');
      }
    } catch (error) {
      setError('An error occurred while saving. Please try again.');
    } finally {
      setSaving(false);
    }
  };
  // Get current map center for display
  const selectedLocation = location.latitude && location.longitude 
    ? { lat: location.latitude, lng: location.longitude }
    : null;

  return (
    <div className="space-y-6">
      {/* Address Input with Search */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Search for Address
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={addressInput}
            onChange={(e) => setAddressInput(e.target.value)}
            onKeyPress={handleAddressKeyPress}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
            placeholder="Enter address, city, or landmark"
          />
          <button
            onClick={handleAddressSubmit}
            disabled={isGeocoding || !addressInput.trim()}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGeocoding ? 'Searching...' : 'Search'}
          </button>
        </div>
      </div>

      {/* Map */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Click on map to set exact location
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
          Click anywhere on the map to set your exact location
        </p>
      </div>

      {/* Current Location Display */}
      {location.latitude && location.longitude && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
          <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
            Selected Location:
          </p>
          <p className="text-sm text-emerald-700 dark:text-emerald-300">
            {location.address || `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`}
          </p>
          <p className="text-xs text-emerald-600 dark:text-emerald-400">
            Coordinates: {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
          </p>
        </div>
      )}

      {/* Manual Coordinates Input (Fallback) */}
      <div className="border-t border-gray-200 dark:border-slate-600 pt-4">
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
              value={location.latitude || ''}
              onChange={(e) => setLocation(prev => ({ 
                ...prev, 
                latitude: parseFloat(e.target.value) || 0 
              }))}
              placeholder="-33.8688"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Longitude
            </label>
            <input
              type="number"
              step="any"
              value={location.longitude || ''}
              onChange={(e) => setLocation(prev => ({ 
                ...prev, 
                longitude: parseFloat(e.target.value) || 0 
              }))}
              placeholder="151.2093"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white text-sm"
            />
          </div>
        </div>
      </div>

      {/* Search Radius */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Search Radius: {location.searchRadius} km
        </label>
        <input
          type="range"
          min="1"
          max="100"
          step="1"
          value={location.searchRadius}
          onChange={(e) => setLocation(prev => ({ 
            ...prev, 
            searchRadius: parseInt(e.target.value) 
          }))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700"
        />
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
          <span>1 km</span>
          <span>100 km</span>
        </div>
      </div>

      {/* Show Location Toggle 
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Show Location to Others
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Allow other users to see your general location
          </p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={location.showLocation}
            onChange={(e) => setLocation(prev => ({ 
              ...prev, 
              showLocation: e.target.checked 
            }))}
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 dark:peer-focus:ring-emerald-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-emerald-600"></div>
        </label>
      </div>*/}

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* Geocoding Status */}
      {isGeocoding && (
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-200 flex items-center">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Finding location...
          </p>
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
          disabled={saving || !location.latitude || !location.longitude}
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

export default LocationEditor;