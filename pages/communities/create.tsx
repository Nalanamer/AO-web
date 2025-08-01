// pages/communities/create.tsx
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useCommunities } from '../../hooks/useCommunities';
import { databases, Query, DATABASE_ID, APP_CONFIG_COLLECTION_ID } from '../../lib/appwrite';
import GoogleMapComponent from '../../components/GoogleMapComponent';
import { Wrapper } from '@googlemaps/react-wrapper';

interface LocationData {
  address: string;
  latitude: number;
  longitude: number;
  radius?: number;
}

interface ActivityType {
  key: string;
  label: string;
}

export default function CreateCommunityPage() {
  const router = useRouter();
  const { createCommunity, loading, error } = useCommunities();
  const [activityTypes, setActivityTypes] = useState<ActivityType[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(true);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'public' as 'public' | 'private',
    website: '',
    activityTypes: [] as string[],
    activitySubTypes: [] as string[]
  });
  
  const [location, setLocation] = useState<LocationData | null>(null);
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  useEffect(() => {
    loadActivityTypes();
  }, []);

  const loadActivityTypes = async () => {
    try {
      setLoadingActivities(true);
      
      console.log('🔍 Loading activity types from Appwrite...');
      
      const response = await databases.listDocuments(
        DATABASE_ID,
        APP_CONFIG_COLLECTION_ID,
        [Query.equal('key', 'activity_types')]
      );

      console.log('🎯 Activity types query result:', response.documents);

      if (response.documents.length > 0) {
        const config = response.documents[0];
        console.log('⚙️ Config document:', config);
        
        let types = config.values;
        let displayLabels: Record<string, string> = {};
        
        // Parse display labels for emojis and formatted names
        if (config.display_labels) {
          try {
            displayLabels = JSON.parse(config.display_labels);
            console.log('🏷️ Display labels:', displayLabels);
          } catch (e) {
            console.warn('Could not parse display labels');
          }
        }
        
        // Handle if types is stored as JSON string
        if (typeof types === 'string') {
          types = JSON.parse(types);
        }
        
        // Convert to the format we need with proper labels
        const formattedTypes = types.map((type: string) => ({
          key: type,
          label: (displayLabels as any)[type] || type.charAt(0).toUpperCase() + type.slice(1)
        }));
        
        console.log('✅ Formatted types with labels:', formattedTypes);
        setActivityTypes(formattedTypes);
      } else {
        console.log('❌ No activity_types found, using fallback');
        // Fallback activity types
        setActivityTypes([
          { key: 'hiking', label: 'Hiking' },
          { key: 'climbing', label: 'Climbing' },
          { key: 'running', label: 'Running' },
          { key: 'cycling', label: 'Cycling' },
          { key: 'swimming', label: 'Swimming' }
        ]);
      }
    } catch (error) {
      console.error('💥 Error loading activity types:', error);
      // Use fallback on error
      setActivityTypes([
        { key: 'hiking', label: 'Hiking' },
        { key: 'climbing', label: 'Climbing' },
        { key: 'running', label: 'Running' },
        { key: 'cycling', label: 'Cycling' },
        { key: 'swimming', label: 'Swimming' }
      ]);
    } finally {
      setLoadingActivities(false);
    }
  };

  const handleLocationSelect = (selectedLocation: LocationData) => {
    setLocation(selectedLocation);
    setShowLocationPicker(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!location) {
      alert('Please set a location for your community');
      return;
    }

    try {
      const communityData = {
        ...formData,
        location
      };

      const newCommunity = await createCommunity(communityData);
      
      if (newCommunity) {
        alert(`Community "${newCommunity.name}" created successfully!`);
        router.push('/communities');
      }
    } catch (err) {
      console.error('Error creating community:', err);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Create Community</h1>
        <p className="text-gray-600 mt-2">Build a community around shared interests and activities</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Community Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Community Name *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            placeholder="e.g., Sydney Rock Climbers"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description *
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            placeholder="Describe what your community is about..."
            required
          />
        </div>

        {/* Community Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Community Type *
          </label>
          <div className="space-y-3">
            <label className="flex items-start p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                value="public"
                checked={formData.type === 'public'}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as 'public' | 'private' })}
                className="mt-1 mr-3"
              />
              <div>
                <div className="font-medium text-gray-900">Public Community</div>
                <div className="text-sm text-gray-600">Anyone can join and see community activities</div>
              </div>
            </label>
            
            <label className="flex items-start p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                value="private"
                checked={formData.type === 'private'}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as 'public' | 'private' })}
                className="mt-1 mr-3"
              />
              <div>
                <div className="font-medium text-gray-900">Private Community</div>
                <div className="text-sm text-gray-600">Members must be approved by admins</div>
              </div>
            </label>
          </div>
        </div>

        {/* Activity Types Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
  Preferred Activities (Optional)
</label>
          
          {loadingActivities ? (
            <div className="p-4 text-center text-gray-500">
              Loading activity types...
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-48 overflow-y-auto border border-gray-300 rounded-lg p-4">
              {activityTypes.map((activity) => (
                <label key={activity.key} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.activityTypes.includes(activity.key)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({
                          ...formData,
                          activityTypes: [...formData.activityTypes, activity.key]
                        });
                      } else {
                        setFormData({
                          ...formData,
                          activityTypes: formData.activityTypes.filter(type => type !== activity.key)
                        });
                      }
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{activity.label}</span>
                </label>
              ))}
            </div>
          )}
          
          
        </div>

        {/* Location Picker */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Community Location *
          </label>
          
          {!location ? (
            <button
              type="button"
              onClick={() => setShowLocationPicker(true)}
              className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Click to set location on map
              </div>
            </button>
          ) : (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-green-900">Location Set</p>
                  <p className="text-sm text-green-700">{location.address}</p>
                  <p className="text-xs text-green-600 mt-1">
                    {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowLocationPicker(true)}
                  className="text-green-600 hover:text-green-700 text-sm font-medium"
                >
                  Change
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Website (Optional) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Website (Optional)
          </label>
          <input
            type="text"
            value={formData.website}
            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            placeholder="https://..."
          />
        </div>

        {/* Submit Buttons */}
        <div className="flex gap-4 pt-6">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium bg-white"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !location}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {loading ? 'Creating...' : 'Create Community'}
          </button>
        </div>
      </form>

      {/* Location Picker Modal */}
      {showLocationPicker && (
        <LocationPickerModal
          onLocationSelect={handleLocationSelect}
          onClose={() => setShowLocationPicker(false)}
          initialLocation={location}
        />
      )}
    </div>
  );
}

// ============================================================================
// Location Picker Modal Component
// ============================================================================

interface LocationPickerModalProps {
  onLocationSelect: (location: LocationData) => void;
  onClose: () => void;
  initialLocation?: LocationData | null;
}

const LocationPickerModal: React.FC<LocationPickerModalProps> = ({
  onLocationSelect,
  onClose,
  initialLocation
}) => {
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(initialLocation || null);
  const [manualEntry, setManualEntry] = useState({
    address: initialLocation?.address || '',
    latitude: initialLocation?.latitude?.toString() || '',
    longitude: initialLocation?.longitude?.toString() || ''
  });
  const [useManualEntry, setUseManualEntry] = useState(false);
  const [selectedMapLocation, setSelectedMapLocation] = useState<{ lat: number; lng: number } | null>(
  initialLocation ? { lat: initialLocation.latitude, lng: initialLocation.longitude } : null
);
  const handleMapClick = (event: any) => {
    // This would integrate with your existing map implementation
    // For now, we'll use a placeholder
    const lat = -33.8688 + (Math.random() - 0.5) * 0.1; // Sydney area
    const lng = 151.2093 + (Math.random() - 0.5) * 0.1;
    
    const location: LocationData = {
      address: `Selected location near Sydney`,
      latitude: lat,
      longitude: lng,
      radius: 10
    };
    
    setSelectedLocation(location);
  };

  const handleManualSubmit = () => {
    if (!manualEntry.latitude || !manualEntry.longitude) {
      alert('Please fill in lat and long fields');
      return;
    }

    const location: LocationData = {
      address: `${manualEntry.latitude}, ${manualEntry.longitude}`,
      latitude: parseFloat(manualEntry.latitude),
      longitude: parseFloat(manualEntry.longitude),
      radius: 10
    };

    setSelectedLocation(location);
  };

  const handleConfirm = () => {
    if (selectedLocation) {
      onLocationSelect(selectedLocation);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Set Community Location</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Toggle between map and manual entry */}
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setUseManualEntry(false)}
              className={`px-4 py-2 rounded-lg font-medium ${
                !useManualEntry 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Pick on Map
            </button>
            <button
              onClick={() => setUseManualEntry(true)}
              className={`px-4 py-2 rounded-lg font-medium ${
                useManualEntry 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Enter Manually
            </button>
          </div>

          {!useManualEntry ? (
            // Map picker (placeholder for your existing map implementation)
            <div className="space-y-4">
              <p className="text-sm text-gray-600">Click on the map to set your community's location</p>
              <div className="w-full h-64 rounded-lg border border-gray-200 overflow-hidden">
  {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? (
    <Wrapper apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}>
      <GoogleMapComponent
        onLocationSelect={(lat: number, lng: number) => {
          setSelectedMapLocation({ lat, lng });
          const location: LocationData = {
            address: `Location: ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
            latitude: lat,
            longitude: lng,
            radius: 10
          };
          setSelectedLocation(location);
        }}
        selectedLocation={selectedMapLocation}
      />
    </Wrapper>
  ) : (
    <div className="w-full h-full flex items-center justify-center bg-gray-100">
      <p className="text-gray-500 text-sm">Google Maps API key required</p>
    </div>
  )}
</div>
            </div>
          ) : (
            // Manual entry
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Latitude</label>
                  <input
                    type="number"
                    step="any"
                    value={manualEntry.latitude}
                    onChange={(e) => setManualEntry({ ...manualEntry, latitude: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    placeholder="-33.8688"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Longitude</label>
                  <input
                    type="number"
                    step="any"
                    value={manualEntry.longitude}
                    onChange={(e) => setManualEntry({ ...manualEntry, longitude: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    placeholder="151.2093"
                  />
                </div>
              </div>
              
              <button
                onClick={handleManualSubmit}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Set Location
              </button>
            </div>
          )}

          {/* Selected location display */}
          {selectedLocation && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-medium text-green-900 mb-2">Selected Location</h4>
              <p className="text-sm text-green-700">{selectedLocation.address}</p>
              <p className="text-xs text-green-600">
                {selectedLocation.latitude.toFixed(4)}, {selectedLocation.longitude.toFixed(4)}
              </p>
            </div>
          )}
        </div>

        <div className="p-6 border-t bg-gray-50 sticky bottom-0">
          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!selectedLocation}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Confirm Location
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};