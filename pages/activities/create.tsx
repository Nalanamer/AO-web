// pages/activities/create.tsx - FIXED VERSION WITH NO TYPING ISSUES
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import MainLayout from '../../components/layout/MainLayout';
import { useAuth } from '../../contexts/AuthContext';
import { databases, DATABASE_ID, ACTIVITIES_COLLECTION_ID, APP_CONFIG_COLLECTION_ID, Query, ID } from '../../lib/appwrite';
import ActivityLocationPicker from '../../components/activities/ActivityLocationPicker';
import { Wrapper } from "@googlemaps/react-wrapper";
import GoogleMapComponent from '../../components/GoogleMapComponent';
import ActivityDataHandler from '@/utils/ActivityDataHandler';

// Interfaces
interface ActivityType {
  key: string;
  label: string;
  icon: string;
  color: string;
}

interface LocationData {
  address: string;
  latitude?: number;
  longitude?: number;
  name?: string;
}

interface ActivityConfiguration {
  [activityType: string]: {
    label: string;
    subTypes: {
      [subtypeKey: string]: {
        label: string;
        fields: Array<{
          key: string;
          label: string;
          type: 'text' | 'number' | 'select';
          placeholder?: string;
          options?: string[];
          required?: boolean;
        }>;
      };
    };
  };
}

interface FormData {
  activityname: string;
  location: LocationData | null;
  description: string;
  types: string[];
  subTypes: string[];
  typeSpecificData: Record<string, any>;
  isPrivate: boolean;
  externalUrls: { shortName: string; url: string }[];
}



interface FormErrors {
  activityname?: string;
  location?: string;
  types?: string;
  general?: string;
}

// Icons
const ArrowLeftIcon: React.FC<{ className?: string }> = ({ className = "h-5 w-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

const MapPinIcon: React.FC<{ className?: string }> = ({ className = "h-5 w-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const PlusIcon: React.FC<{ className?: string }> = ({ className = "h-5 w-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
  </svg>
);

const XIcon: React.FC<{ className?: string }> = ({ className = "h-5 w-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

// Default activity types
const DEFAULT_ACTIVITY_TYPES: ActivityType[] = [
  { key: 'hiking', label: 'Hiking', icon: '🥾', color: 'bg-green-500' },
  { key: 'cycling', label: 'Cycling', icon: '🚴', color: 'bg-blue-500' },
  { key: 'running', label: 'Running', icon: '🏃', color: 'bg-red-500' },
  { key: 'swimming', label: 'Swimming', icon: '🏊', color: 'bg-cyan-500' },
  { key: 'climbing', label: 'Rock Climbing', icon: '🧗', color: 'bg-orange-500' },
  { key: 'kayaking', label: 'Kayaking', icon: '🛶', color: 'bg-teal-500' },
  { key: 'skiing', label: 'Skiing', icon: '⛷️', color: 'bg-gray-500' },
  { key: 'surfing', label: 'Surfing', icon: '🏄', color: 'bg-blue-400' },
  { key: 'yoga', label: 'Yoga', icon: '🧘', color: 'bg-purple-500' },
  { key: 'fitness', label: 'Fitness', icon: '💪', color: 'bg-pink-500' },
  { key: 'fishing', label: 'Fishing', icon: '🎣', color: 'bg-indigo-500' },
  { key: 'sailing', label: 'Sailing', icon: '⛵', color: 'bg-blue-600' },
  { key: 'fourwd', label: '4WD', icon: '🚙', color: 'bg-yellow-600' },
  { key: 'sup', label: 'SUP', icon: '🏄‍♂️', color: 'bg-cyan-600' },
  { key: 'scuba', label: 'Scuba Diving', icon: '🤿', color: 'bg-blue-700' },
  { key: 'camping', label: 'Camping', icon: '⛺', color: 'bg-green-700' }
];

// 🎯 STEP COMPONENTS MOVED OUTSIDE - THIS FIXES THE TYPING ISSUE!

// Step 1: Basic Information
const BasicInfoStep: React.FC<{
  formData: FormData;
  errors: FormErrors;
  onFormDataChange: (field: keyof FormData, value: any) => void;
  onShowLocationPicker: () => void;
}> = ({ formData, errors, onFormDataChange, onShowLocationPicker }) => (
  <div className="space-y-6">
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Activity Name *
      </label>
      <input
        type="text"
        value={formData.activityname}
        onChange={(e) => onFormDataChange('activityname', e.target.value)}
        placeholder="Enter activity name"
        className="w-full px-4 py-3 bg-white text-gray-900 placeholder-gray-500 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
        autoComplete="off"
      />
      {errors.activityname && (
        <p className="text-red-500 text-sm mt-1">{errors.activityname}</p>
      )}
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Location *
      </label>
      <button
        type="button"
        onClick={onShowLocationPicker}
        className="w-full px-4 py-3 bg-white text-left border border-gray-300 rounded-lg hover:border-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 flex items-center gap-3"
      >
        <MapPinIcon className="h-5 w-5 text-gray-400" />
        <span className={formData.location ? "text-gray-900" : "text-gray-500"}>
          {formData.location ? (
            <span>
              📍 {formData.location.latitude?.toFixed(4)}, {formData.location.longitude?.toFixed(4)}
              {formData.location.name && formData.location.name !== formData.location.address && (
                <span className="text-gray-500 text-sm ml-2">({formData.location.name})</span>
              )}
            </span>
          ) : "Click to select location on map or enter coordinates"}
        </span>
      </button>
      {errors.location && (
        <p className="text-red-500 text-sm mt-1">{errors.location}</p>
      )}
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Description
      </label>
      <textarea
        value={formData.description}
        onChange={(e) => onFormDataChange('description', e.target.value)}
        placeholder="Enter activity description (optional)"
        rows={4}
        className="w-full px-4 py-3 bg-white text-gray-900 placeholder-gray-500 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
        autoComplete="off"
      />
    </div>
  </div>
);

// Step 2: Activity Types Selection
const ActivityTypesStep: React.FC<{
  activityTypes: ActivityType[];
  formData: FormData;
  errors: FormErrors;
  onFormDataChange: (field: keyof FormData, value: any) => void;
}> = ({ activityTypes, formData, errors, onFormDataChange }) => (
  <div className="space-y-6">
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-4">
        Select Activity Types (up to 3) *
      </label>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {activityTypes.map(type => (
          <button
            key={type.key}
            type="button"
            onClick={() => {
              const isSelected = formData.types.includes(type.key);
              if (isSelected) {
                onFormDataChange('types', formData.types.filter(t => t !== type.key));
              } else if (formData.types.length < 3) {
                onFormDataChange('types', [...formData.types, type.key]);
              }
            }}
            className={`p-4 rounded-lg border-2 transition-all ${
              formData.types.includes(type.key)
                ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className={`w-12 h-12 rounded-full ${type.color} flex items-center justify-center mx-auto mb-2 text-white text-2xl`}>
              {type.icon}
            </div>
            <div className="text-sm font-medium">{type.label}</div>
          </button>
        ))}
      </div>
      {errors.types && (
        <p className="text-red-500 text-sm mt-2">{errors.types}</p>
      )}
    </div>
  </div>
);

// Step 3: Enhanced Details
const EnhancedDetailsStep: React.FC<{
  formData: FormData;
  activityConfigurations: ActivityConfiguration;
  onFormDataChange: (field: keyof FormData, value: any) => void;
}> = ({ formData, activityConfigurations, onFormDataChange }) => (
  <div className="space-y-6">
    <div className="text-center text-gray-600 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Enhanced Details</h3>
      <p className="text-sm">Add specific details for your selected activities</p>
    </div>

    {formData.types.map(typeKey => {
      const typeConfig = activityConfigurations[typeKey];
      
      if (!typeConfig) {
        return (
          <div key={typeKey} className="border border-gray-200 rounded-lg p-4">
            <h4 className="text-lg font-semibold mb-2 capitalize">{typeKey} Details</h4>
            <p className="text-gray-500 text-sm">
              Enhanced details for {typeKey} will be available soon. 
              You can still create the activity and add details later.
            </p>
          </div>
        );
      }

      return (
        <div key={typeKey} className="border border-gray-200 rounded-lg p-6">
          <h4 className="text-lg font-semibold mb-4">{typeConfig.label} Details</h4>
          
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">
              Select Subtype
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.entries(typeConfig.subTypes).map(([subtypeKey, subtypeConfig]) => {
                const fullSubtypeKey = `${typeKey}.${subtypeKey}`;
                const isSelected = formData.subTypes.includes(fullSubtypeKey);
                
                return (
                  <button
                    key={subtypeKey}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        onFormDataChange('subTypes', formData.subTypes.filter(st => st !== fullSubtypeKey));
                      } else {
                        onFormDataChange('subTypes', [...formData.subTypes, fullSubtypeKey]);
                      }
                    }}
                    className={`p-3 text-left rounded-lg border transition-all ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium">{subtypeConfig.label}</div>
                  </button>
                );
              })}
            </div>

            {/* Enhanced details form for selected subtypes */}
            {Object.entries(typeConfig.subTypes).map(([subtypeKey, subtypeConfig]) => {
              const fullSubtypeKey = `${typeKey}.${subtypeKey}`;
              if (!formData.subTypes.includes(fullSubtypeKey)) return null;

              return (
                <div key={`details-${subtypeKey}`} className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h5 className="text-md font-medium mb-4 text-gray-900">
                    {subtypeConfig.label} - Enhanced Details
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {subtypeConfig.fields.map(fieldConfig => {
                     const fieldValue = formData.typeSpecificData[fullSubtypeKey]?.[fieldConfig.key] || '';
                      
                      return (
                        <div key={fieldConfig.key}>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {fieldConfig.label}
                          </label>
                          {fieldConfig.type === 'select' ? (
                            <select
                              value={fieldValue}
                              onChange={(e) => {
                                const updatedData = ActivityDataHandler.updateTypeSpecificField(
                                    formData.typeSpecificData,
                                    fullSubtypeKey,
                                    fieldConfig.key,
                                    e.target.value
                                );
                                onFormDataChange('typeSpecificData', updatedData);
                                }}
                              className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            >
                              <option value="">Select {fieldConfig.label}</option>
                              {fieldConfig.options?.map((option: string) => (
                                <option key={option} value={option}>
                                  {option}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type={fieldConfig.type}
                              value={fieldValue}
                              onChange={(e) => {
                                const updatedData = ActivityDataHandler.updateTypeSpecificField(
                                    formData.typeSpecificData,
                                    fullSubtypeKey,
                                    fieldConfig.key,
                                    e.target.value
                                );
                                onFormDataChange('typeSpecificData', updatedData);
                                }}
                              placeholder={fieldConfig.placeholder}
                              className="w-full px-3 py-2 bg-white text-gray-900 placeholder-gray-500 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    })}

    {formData.types.length === 0 && (
      <div className="text-center py-12 text-gray-500">
        <p>Select activity types in the previous step to add enhanced details</p>
      </div>
    )}
  </div>
);

// Step 4: Final Settings
const FinalSettingsStep: React.FC<{
  formData: FormData;
  onFormDataChange: (field: keyof FormData, value: any) => void;
  onShowUrlModal: () => void;
  onRemoveUrl: (index: number) => void;
}> = ({ formData, onFormDataChange, onShowUrlModal, onRemoveUrl }) => (
  <div className="space-y-6">
    {/* External URLs */}
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            External URLs
          </label>
          <p className="text-xs text-gray-500 mt-1">
            Add links to websites, social media, or other resources
          </p>
        </div>
        <button
          type="button"
          onClick={onShowUrlModal}
          className="flex items-center gap-2 px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm"
        >
          <PlusIcon className="h-4 w-4" />
          Add URL
        </button>
      </div>
      
      {formData.externalUrls.length > 0 && (
        <div className="space-y-2">
          {formData.externalUrls.map((url, index) => (
            <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">{url.shortName}</div>
                <div className="text-xs text-gray-500 truncate">{url.url}</div>
              </div>
              <button
                type="button"
                onClick={() => onRemoveUrl(index)}
                className="text-red-600 hover:text-red-800 p-1"
              >
                <XIcon className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>

    {/* Private Activity Toggle */}
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
      <div>
        <label className="text-sm font-medium text-gray-700">
          Private Activity
        </label>
        <p className="text-xs text-gray-500 mt-1">
          Private activities are only visible to you
        </p>
      </div>
      <button
        type="button"
        onClick={() => onFormDataChange('isPrivate', !formData.isPrivate)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          formData.isPrivate ? 'bg-emerald-600' : 'bg-gray-200'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            formData.isPrivate ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>

    {/* Summary */}
    <div className="p-4 bg-emerald-50 rounded-lg">
      <h4 className="font-medium text-emerald-900 mb-2">Activity Summary</h4>
      <div className="text-sm text-emerald-800 space-y-1">
        <div><strong>Name:</strong> {formData.activityname || 'Not set'}</div>
        <div><strong>Location:</strong> {formData.location?.address || 'Not set'}</div>
        <div><strong>Types:</strong> {formData.types.join(', ') || 'None selected'}</div>
        <div><strong>Subtypes:</strong> {formData.subTypes.length} selected</div>
        <div><strong>Privacy:</strong> {formData.isPrivate ? 'Private' : 'Public'}</div>
      </div>
    </div>
  </div>
);

export default function CreateActivity() {
  const router = useRouter();
  const { user } = useAuth();
  
  // State
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [showUrlModal, setShowUrlModal] = useState(false);
  
  // Data states
  const [activityTypes, setActivityTypes] = useState<ActivityType[]>(DEFAULT_ACTIVITY_TYPES);
  const [activityConfigurations, setActivityConfigurations] = useState<ActivityConfiguration>({});
  
  const [formData, setFormData] = useState<FormData>({
    activityname: '',
    location: null,
    description: '',
    types: [],
    subTypes: [],
    typeSpecificData: {},
    isPrivate: false,
    externalUrls: []
  });
  
  const [errors, setErrors] = useState<FormErrors>({});

  const totalSteps = 4;

  // Load configurations on mount
  useEffect(() => {
    const loadConfigurations = async () => {
      try {
        setLoading(true);

        // Fetch activity types
        const activityTypesQuery = await databases.listDocuments(
          DATABASE_ID,
          APP_CONFIG_COLLECTION_ID,
          [Query.equal('key', 'activity_types')]
        );

        if (activityTypesQuery.documents.length > 0) {
          const activityTypesDoc = activityTypesQuery.documents[0];
          const types = Array.isArray(activityTypesDoc.values) ? activityTypesDoc.values : [];
          
          // Parse display labels
          let displayLabels: Record<string, string> = {};
          if (activityTypesDoc.display_labels) {
            try {
              displayLabels = typeof activityTypesDoc.display_labels === 'string' 
                ? JSON.parse(activityTypesDoc.display_labels) 
                : activityTypesDoc.display_labels;
            } catch (e) {
              console.warn('Failed to parse display labels');
            }
          }

          // Map to activity types with icons and colors
          const mappedTypes = types.map((type: string) => {
            const defaultType = DEFAULT_ACTIVITY_TYPES.find(dt => dt.key === type);
            return {
              key: type,
              label: displayLabels[type] || defaultType?.label || type,
              icon: defaultType?.icon || '🎯',
              color: defaultType?.color || 'bg-gray-500'
            };
          });

          setActivityTypes(mappedTypes);
        }

        // Fetch activity configurations
        const configurationsQuery = await databases.listDocuments(
          DATABASE_ID,
          APP_CONFIG_COLLECTION_ID,
          [Query.equal('key', 'activity_configurations')]
        );

        if (configurationsQuery.documents.length > 0) {
          const configDoc = configurationsQuery.documents[0];
          
          let configs = {};
          if (configDoc.values) {
            // Handle mobile app's JSON string format
            if (Array.isArray(configDoc.values) && configDoc.values.length > 0) {
              try {
                configs = JSON.parse(configDoc.values[0]);
              } catch (e) {
                console.warn('Failed to parse configurations from array');
              }
            } else if (typeof configDoc.values === 'string') {
              try {
                configs = JSON.parse(configDoc.values);
              } catch (e) {
                console.warn('Failed to parse configurations from string');
              }
            } else if (typeof configDoc.values === 'object') {
              configs = configDoc.values;
            }
          }
          
          setActivityConfigurations(configs);
        }

      } catch (error) {
        console.error('Error loading configurations:', error);
      } finally {
        setLoading(false);
      }
    };

    loadConfigurations();
  }, []);

  // Handle form data changes
  const handleFormDataChange = (field: keyof FormData, value: any) => {
  setFormData(prev => {
    const updated = { ...prev, [field]: value };
    
    // Clean up typeSpecificData when types change
    if (field === 'types') {
      // Generate default subtypes for new types
      const newSubtypes = ActivityDataHandler.generateDefaultSubtypes(value, activityConfigurations);
      updated.subTypes = newSubtypes;
      updated.typeSpecificData = ActivityDataHandler.cleanupTypeSpecificData(
        prev.typeSpecificData,
        newSubtypes
      );
    }
    
    // Clean up typeSpecificData when subtypes change
    if (field === 'subTypes') {
      updated.typeSpecificData = ActivityDataHandler.cleanupTypeSpecificData(
        prev.typeSpecificData,
        value
      );
    }
    
    return updated;
  });
  
  // Clear errors
  setErrors(prev => {
    if (!prev[field as keyof FormErrors]) return prev;
    const newErrors = { ...prev };
    delete newErrors[field as keyof FormErrors];
    return newErrors;
  });
};

  // URL modal handlers - SIMPLIFIED
  const handleAddUrlFromModal = (urlData: { shortName: string; url: string }) => {
    handleFormDataChange('externalUrls', [...formData.externalUrls, urlData]);
  };

  const handleRemoveUrl = (index: number) => {
    handleFormDataChange('externalUrls', formData.externalUrls.filter((_, i) => i !== index));
  };

  // Location handler - SIMPLIFIED
  const handleSaveLocation = (locationData: LocationData) => {
    handleFormDataChange('location', locationData);
  };

// Helper function to get user's preferred location or Sydney CBD default
const getUserPreferredLocation = (): LocationData => {
  if (user?.location) {
    // If user location is an object with coordinates
    if (typeof user.location === 'object' && 'latitude' in user.location && 'longitude' in user.location) {
      return {
        address: user.location.address || 'User Location',
        latitude: user.location.latitude,
        longitude: user.location.longitude,
        name: user.location.address || 'User Location'
      };
    }
    
    // If user location is a string
    if (typeof user.location === 'string') {
      const locationStr = user.location.toLowerCase();
      
      if (locationStr.includes('sydney')) {
        return {
          address: user.location,
          latitude: -33.8688,
          longitude: 151.2093,
          name: user.location
        };
      }
      
      if (locationStr.includes('melbourne')) {
        return {
          address: user.location,
          latitude: -37.8136,
          longitude: 144.9631,
          name: user.location
        };
      }
      
      // Default Sydney with user's location text
      return {
        address: user.location,
        latitude: -33.8688,
        longitude: 151.2093,
        name: user.location
      };
    }
  }
  
  // Ultimate fallback
  return {
    address: 'Sydney CBD, NSW, Australia',
    latitude: -33.8688,
    longitude: 151.2093,
    name: 'Sydney CBD'
  };
};
  // Location Picker Modal - REDESIGNED with map/coordinates options
  const LocationPickerModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (location: LocationData) => void;
    currentLocation: LocationData | null;
  }> = ({ isOpen, onClose, onSave, currentLocation }) => {
    const [tempLocation, setTempLocation] = useState<LocationData>({
      address: currentLocation?.address || '',
      latitude: currentLocation?.latitude || undefined,
      longitude: currentLocation?.longitude || undefined,
      name: currentLocation?.name || ''
    });
    const [inputMode, setInputMode] = useState<'map' | 'coordinates'>('map');

    if (!isOpen) return null;

    const handleCoordinateChange = (field: 'latitude' | 'longitude', value: string) => {
      const numValue = value ? parseFloat(value) : undefined;
      setTempLocation(prev => ({ 
        ...prev, 
        [field]: numValue,
        // Auto-generate address from coordinates
        address: numValue && tempLocation[field === 'latitude' ? 'longitude' : 'latitude'] 
          ? `${tempLocation.latitude || numValue}, ${tempLocation.longitude || numValue}`
          : prev.address,
        name: numValue && tempLocation[field === 'latitude' ? 'longitude' : 'latitude']
          ? `Location: ${tempLocation.latitude || numValue}, ${tempLocation.longitude || numValue}`
          : prev.name
      }));
    };

    const handleMapClick = (lat: number, lng: number) => {
      // This would be connected to Google Maps API
      setTempLocation(prev => ({
        ...prev,
        latitude: lat,
        longitude: lng,
        address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        name: `Selected Location: ${lat.toFixed(4)}, ${lng.toFixed(4)}`
      }));
    };

    const handleSave = () => {
      if (tempLocation.latitude && tempLocation.longitude) {
        onSave({
          ...tempLocation,
          // Ensure we have an address even if coordinates-only
          address: tempLocation.address || `${tempLocation.latitude}, ${tempLocation.longitude}`,
          name: tempLocation.name || `Location: ${tempLocation.latitude.toFixed(4)}, ${tempLocation.longitude.toFixed(4)}`
        });
        onClose();
      }
    };

    const isValidLocation = tempLocation.latitude && tempLocation.longitude;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold">Select Location</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XIcon className="h-6 w-6" />
            </button>
          </div>
          
          {/* Mode Selection */}
          <div className="flex gap-2 mb-4">
            <button
              type="button"
              onClick={() => setInputMode('map')}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                inputMode === 'map'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              📍 Pick on Map
            </button>
            <button
              type="button"
              onClick={() => setInputMode('coordinates')}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                inputMode === 'coordinates'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              🧭 Enter Coordinates
            </button>
          </div>

          {inputMode === 'map' ? (
            /* Map Mode */
            <div className="space-y-4">
              <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                <div className="text-center text-gray-500">
                  <MapPinIcon className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p className="text-sm font-medium">Interactive Map</p>
                  <p className="text-xs mt-1">Google Maps will be integrated here</p>
                  <p className="text-xs mt-1">Click on map to select location</p>
                  {isValidLocation && (
                    <div className="mt-3 p-2 bg-emerald-50 rounded-lg">
                      <p className="text-xs text-emerald-700 font-medium">
                        📍 {tempLocation.latitude!.toFixed(6)}, {tempLocation.longitude!.toFixed(6)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Demo: Simulate map clicks */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleMapClick(-33.8688, 151.2093)}
                  className="px-3 py-2 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100"
                >
                  📍 Sydney Opera House
                </button>
                <button
                  type="button"
                  onClick={() => handleMapClick(-37.8136, 144.9631)}
                  className="px-3 py-2 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100"
                >
                  📍 Melbourne CBD
                </button>
              </div>
            </div>
          ) : (
            /* Coordinates Mode */
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Latitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={tempLocation.latitude || ''}
                    onChange={(e) => handleCoordinateChange('latitude', e.target.value)}
                    placeholder="e.g., -33.8688"
                    className="w-full px-3 py-3 bg-white text-gray-900 placeholder-gray-500 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Longitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={tempLocation.longitude || ''}
                    onChange={(e) => handleCoordinateChange('longitude', e.target.value)}
                    placeholder="e.g., 151.2093"
                    className="w-full px-3 py-3 bg-white text-gray-900 placeholder-gray-500 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>
              
                                {/* Actual Google Maps */}
                    <div className="h-64 bg-gray-100 rounded-lg overflow-hidden">
                    {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? (
                        <Wrapper apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}>
                        <GoogleMapComponent
                            onLocationSelect={(lat, lng) => {
                            setTempLocation(prev => ({
                                ...prev,
                                latitude: lat,
                                longitude: lng,
                                address: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
                                name: `Location: ${lat.toFixed(4)}, ${lng.toFixed(4)}`
                            }));
                            }}
                            selectedLocation={
                            tempLocation.latitude && tempLocation.longitude
                                ? {
                                    lat: tempLocation.latitude,
                                    lng: tempLocation.longitude
                                }
                                : null
                            }
                        />
                        </Wrapper>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100">
                        <div className="text-center text-gray-500">
                            <MapPinIcon className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                            <p className="text-sm">Google Maps API key required</p>
                            <p className="text-xs mt-1">Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to .env.local</p>
                        </div>
                        </div>
                    )}
                    </div>

              {/* Quick coordinate presets */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setTempLocation(prev => ({ 
                      ...prev, 
                      latitude: -33.8688, 
                      longitude: 151.2093,
                      address: '-33.8688, 151.2093',
                      name: 'Sydney, Australia'
                    }));
                  }}
                  className="px-3 py-2 text-xs bg-gray-50 text-gray-700 rounded hover:bg-gray-100"
                >
                  🌏 Sydney
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTempLocation(prev => ({ 
                      ...prev, 
                      latitude: -37.8136, 
                      longitude: 144.9631,
                      address: '-37.8136, 144.9631',
                      name: 'Melbourne, Australia'
                    }));
                  }}
                  className="px-3 py-2 text-xs bg-gray-50 text-gray-700 rounded hover:bg-gray-100"
                >
                  🌏 Melbourne
                </button>
              </div>



            </div>
          )}
          
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!isValidLocation}
              className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isValidLocation ? '📍 Save Location' : 'Select Location'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // URL Modal - FIXED as separate component outside render
  const UrlModalComponent: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onAdd: (url: { shortName: string; url: string }) => void;
  }> = ({ isOpen, onClose, onAdd }) => {
    const [tempUrl, setTempUrl] = useState({ shortName: '', url: '' });

    if (!isOpen) return null;

    const handleAdd = () => {
      if (tempUrl.shortName.trim() && tempUrl.url.trim()) {
        onAdd(tempUrl);
        setTempUrl({ shortName: '', url: '' });
        onClose();
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Add External URL</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XIcon className="h-6 w-6" />
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <input
                type="text"
                value={tempUrl.shortName}
                onChange={(e) => setTempUrl(prev => ({ ...prev, shortName: e.target.value }))}
                placeholder="e.g., Website, Instagram"
                className="w-full px-3 py-2 bg-white text-gray-900 placeholder-gray-500 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL
              </label>
              <input
                type="url"
                value={tempUrl.url}
                onChange={(e) => setTempUrl(prev => ({ ...prev, url: e.target.value }))}
                placeholder="https://example.com"
                className="w-full px-3 py-2 bg-white text-gray-900 placeholder-gray-500 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>
          
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAdd}
              disabled={!tempUrl.shortName.trim() || !tempUrl.url.trim()}
              className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add URL
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Navigation functions
  const nextStep = () => {
    if (validateCurrentStep() && currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Validation for current step
  const validateCurrentStep = () => {
    const newErrors: FormErrors = {};
    
    if (currentStep === 1) {
      if (!formData.activityname.trim()) {
        newErrors.activityname = 'Activity name is required';
      }
      if (!formData.location) {
        newErrors.location = 'Location is required';
      }
    } else if (currentStep === 2) {
      if (formData.types.length === 0) {
        newErrors.types = 'Please select at least one activity type';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Render current step - FIXED with stable component references
  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <BasicInfoStep
            formData={formData}
            errors={errors}
            onFormDataChange={handleFormDataChange}
            onShowLocationPicker={() => setShowLocationPicker(true)}
          />
        );
      case 2:
        return (
          <ActivityTypesStep
            activityTypes={activityTypes}
            formData={formData}
            errors={errors}
            onFormDataChange={handleFormDataChange}
          />
        );
      case 3:
        return (
          <EnhancedDetailsStep
            formData={formData}
            activityConfigurations={activityConfigurations}
            onFormDataChange={handleFormDataChange}
          />
        );
      case 4:
        return (
          <FinalSettingsStep
            formData={formData}
            onFormDataChange={handleFormDataChange}
            onShowUrlModal={() => setShowUrlModal(true)}
            onRemoveUrl={handleRemoveUrl}
          />
        );
      default:
        return (
          <BasicInfoStep
            formData={formData}
            errors={errors}
            onFormDataChange={handleFormDataChange}
            onShowLocationPicker={() => setShowLocationPicker(true)}
          />
        );
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
  if (!validateCurrentStep()) return;

  try {
    setSubmitting(true);

    // Use ActivityDataHandler to prepare data for saving
    const preparedData = ActivityDataHandler.prepareForSaving({
      activityname: formData.activityname.trim(),
      location: formData.location?.address || 
               `${formData.location?.latitude || -33.8688}, ${formData.location?.longitude || 151.2093}`,
      description: formData.description.trim(),
      latitude: formData.location?.latitude ? Number(formData.location.latitude) : -33.8688,
      longitude: formData.location?.longitude ? Number(formData.location.longitude) : 151.2093,
      type: formData.types[0] || null,
      types: formData.types,
      subTypes: formData.subTypes,
      typeSpecificData: formData.typeSpecificData, // This will be serialized by prepareForSaving
      isPrivate: formData.isPrivate,
      externalUrls: formData.externalUrls.length > 0 ? JSON.stringify(formData.externalUrls) : null,
      userId: user!.$id,
      createdBy: user!.$id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    console.log('🚀 Creating activity with prepared data:', preparedData);

    const newActivity = await databases.createDocument(
      DATABASE_ID,
      ACTIVITIES_COLLECTION_ID,
      ID.unique(),
      preparedData
    );

    console.log('✅ Activity created successfully:', newActivity.$id);
    router.push(`/activities/${newActivity.$id}`);
    
  } catch (error: any) {
    console.error('❌ Error creating activity:', error);
    setErrors({ general: 'Failed to create activity. Please try again.' });
  } finally {
    setSubmitting(false);
  }
};

  if (!user) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Authentication Required</h2>
            <p className="text-gray-600">Please sign in to create activities.</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="p-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeftIcon className="h-6 w-6" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create Activity</h1>
            <p className="text-gray-600 text-sm">Step {currentStep} of {totalSteps}</p>
          </div>
        </div>

        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex space-x-2">
              {[1, 2, 3, 4].map((step) => (
                <div
                  key={step}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step === currentStep
                      ? 'bg-emerald-600 text-white'
                      : step < currentStep
                      ? 'bg-emerald-100 text-emerald-600'
                      : 'bg-gray-200 text-gray-400'
                  }`}
                >
                  {step}
                </div>
              ))}
            </div>
            <span className="text-sm text-gray-500">
              {Math.round((currentStep / totalSteps) * 100)}% Complete
            </span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
          
          {/* Step labels */}
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <span>Basic Info</span>
            <span>Activity Types</span>
            <span>Enhanced Details</span>
            <span>Final Settings</span>
          </div>
        </div>

        {/* Step content */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6 min-h-[400px]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-2"></div>
                <p className="text-gray-600">Loading configurations...</p>
              </div>
            </div>
          ) : (
            renderCurrentStep()
          )}
        </div>

        {/* Navigation buttons */}
        <div className="flex justify-between">
          <button
            type="button"
            onClick={prevStep}
            disabled={currentStep === 1}
            className={`px-6 py-3 rounded-lg font-medium ${
              currentStep === 1
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Previous
          </button>

          {currentStep === totalSteps ? (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {submitting ? 'Creating...' : 'Create Activity'}
            </button>
          ) : (
            <button
              type="button"
              onClick={nextStep}
              className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium"
            >
              Next
            </button>
          )}
        </div>

        {/* Error message */}
        {errors.general && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{errors.general}</p>
          </div>
        )}

        {/* Modals - FIXED versions */}
        <ActivityLocationPicker
  isOpen={showLocationPicker}
  onClose={() => setShowLocationPicker(false)}
  onLocationSelect={(locationData) => {
    handleFormDataChange('location', locationData);
  }}
  onClear={() => {
    handleFormDataChange('location', null);
  }}
  currentLocation={
    formData.location && formData.location.latitude && formData.location.longitude
      ? {
          address: formData.location.address,
          latitude: formData.location.latitude,
          longitude: formData.location.longitude
        }
      : {
          address: 'Sydney CBD, NSW, Australia',
          latitude: -33.8688,
          longitude: 151.2093
        }
  }
/>
        <UrlModalComponent
          isOpen={showUrlModal}
          onClose={() => setShowUrlModal(false)}
          onAdd={handleAddUrlFromModal}
        />
      </div>
    </MainLayout>
  );
}