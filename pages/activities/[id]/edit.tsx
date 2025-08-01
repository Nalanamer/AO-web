//web/activityes/[id]/edit
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import MainLayout from '../../../components/layout/MainLayout';
import { useAuth } from '../../../contexts/AuthContext';
import { useActivities } from '../../../hooks/useActivities';
import { databases, DATABASE_ID, APP_CONFIG_COLLECTION_ID, Query } from '../../../lib/appwrite';
import ActivityLocationPicker from '../../../components/activities/ActivityLocationPicker';
import ActivityDataHandler from '@/utils/ActivityDataHandler';


// Types matching your existing schema
interface Activity {
  $id: string;
  activityname: string;
  location: string | { address: string; coordinates?: { lat: number; lng: number } };
  description: string;
  types: string[];
  subTypes?: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  isPrivate: boolean;
  userId: string;
  latitude?: number;
  longitude?: number;
  typeSpecificData?: any;
  externalUrls?: string[];
  inclusive?: string[];
  createdAt: string;
  updatedAt?: string;
}



interface ActivityType {
  key: string;
  label: string;
  icon: string;
  color: string;
  emoji?: string;
}

interface LocationData {
  address: string;
  latitude?: number;
  longitude?: number;
  coordinates?: { lat: number; lng: number };
}

interface FormErrors {
  [key: string]: string;
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

const ActivityEditPage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  const { updateActivity, getActivityById } = useActivities();

  // State
  const [activity, setActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activityTypes, setActivityTypes] = useState<ActivityType[]>([]);
const [activityConfigurations, setActivityConfigurations] = useState<ActivityConfiguration>({});  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
const [newUrl, setNewUrl] = useState('');
  const [newUrlName, setNewUrlName] = useState('');// pages/activities/[id]/edit.tsx - Complete Activity Edit Page


// Default activity types (Australian standards)
const DEFAULT_ACTIVITY_TYPES = [
  { key: 'hike', label: 'Hiking', icon: '🥾', color: 'bg-emerald-500' },
  { key: 'bike', label: 'Cycling', icon: '🚴‍♂️', color: 'bg-blue-500' },
  { key: 'run', label: 'Running', icon: '🏃‍♂️', color: 'bg-orange-500' },
  { key: 'climbing', label: 'Climbing', icon: '🧗‍♂️', color: 'bg-red-500' },
  { key: 'scuba', label: 'Scuba Diving', icon: '🤿', color: 'bg-cyan-500' },
  { key: 'swimming', label: 'Swimming', icon: '🏊‍♂️', color: 'bg-blue-400' },
  { key: 'kayaking', label: 'Kayaking', icon: '🛶', color: 'bg-teal-500' },
  { key: 'snow', label: 'Snow Sports', icon: '⛷️', color: 'bg-slate-500' },
  { key: 'surfing', label: 'Surfing', icon: '🏄‍♂️', color: 'bg-blue-600' },
  { key: 'camping', label: 'Camping', icon: '🏕️', color: 'bg-green-600' },
  { key: 'fishing', label: 'Fishing', icon: '🎣', color: 'bg-indigo-500' },
  { key: 'sailing', label: 'Sailing/Boating', icon: '⛵', color: 'bg-blue-700' },
  { key: 'fourwd', label: '4WD/Off-Road', icon: '🚙', color: 'bg-yellow-600' },
  { key: 'sup', label: 'Stand-Up Paddleboarding', icon: '🏄‍♀️', color: 'bg-purple-500' }
];

  // Form data state matching your existing structure
  const [formData, setFormData] = useState({
    activityname: '',
    location: null as LocationData | null,
    description: '',
    types: [] as string[],
    subTypes: [] as string[],
    difficulty: 'beginner' as 'beginner' | 'intermediate' | 'advanced',
    isPrivate: false,
    typeSpecificData: {} as any,
    externalUrls: [] as any[],
    inclusive: [] as string[]
  });

  // Load activity data
  /*useEffect(() => {
    if (id && typeof id === 'string') {
      loadActivity(id);
    }
  }, [id]);*/

  // Load activity types from database
 // Load activity types from database FIRST
// Load activity types from database
useEffect(() => {
  fetchActivityTypes();
}, []);

// Load activity data immediately when ID is available
useEffect(() => {
  if (id && typeof id === 'string') {
    loadActivity(id);
  }
}, [id]); // Remove activityConfigurations dependency


const loadActivity = async (activityId: string) => {
  console.log('🔍 Loading activity:', activityId);
  
  try {
    setLoading(true);
    setError(null);

    const activityData: any = await getActivityById(activityId);
    console.log('📊 Raw activity data:', activityData);
    
    if (!activityData) {
      setError('Activity not found');
      return;
    }

    if (activityData.userId !== user?.$id) {
      setError('You can only edit your own activities');
      return;
    }

    setActivity(activityData);

            // Parse type specific data using ActivityDataHandler
           
        // Temporary bypass - parse directly
let typeSpecificData = {};
if (activityData.typeSpecificData) {
  try {
    if (typeof activityData.typeSpecificData === 'string') {
      typeSpecificData = JSON.parse(activityData.typeSpecificData);
    } else {
      typeSpecificData = activityData.typeSpecificData;
    }
    console.log('🎯 Direct parsing result:', typeSpecificData);
  } catch (e) {
    console.error('❌ Direct parsing failed:', e);
  }
}
        
        
        
    // Parse location data
    let locationData: LocationData | null = null;
    if (typeof activityData.location === 'string') {
      locationData = {
        address: activityData.location,
        latitude: activityData.latitude || undefined,
        longitude: activityData.longitude || undefined
      };
    } else if (typeof activityData.location === 'object' && activityData.location) {
      locationData = {
        address: activityData.location.address || '',
        latitude: activityData.location.coordinates?.lat || activityData.latitude || undefined,
        longitude: activityData.location.coordinates?.lng || activityData.longitude || undefined
      };
    }

    // Generate subtypes if missing
    let subTypes = Array.isArray(activityData.subTypes) ? activityData.subTypes : [];


    // Set form data
    setFormData({
      activityname: activityData.activityname || '',
      location: locationData,
      description: activityData.description || '',
      types: Array.isArray(activityData.types) ? activityData.types : [],
      subTypes: subTypes,
      difficulty: (['beginner', 'intermediate', 'advanced'].includes(activityData.difficulty)) 
        ? activityData.difficulty 
        : 'beginner',
      isPrivate: Boolean(activityData.isPrivate),
      typeSpecificData: typeSpecificData,
      externalUrls: (() => {
        if (Array.isArray(activityData.externalUrls)) return activityData.externalUrls;
        if (typeof activityData.externalUrls === 'string') {
          try {
            return JSON.parse(activityData.externalUrls);
          } catch (e) {
            return [];
          }
        }
        return [];
      })(),
      inclusive: Array.isArray(activityData.inclusive) ? activityData.inclusive : []
    });

  } catch (err) {
    console.error('Error loading activity:', err);
    setError('Failed to load activity');
  } finally {
    setLoading(false);
  }
};

 const migrateOldFormatData = (typeSpecificData: any, types: string[], subTypes: string[]) => {
  if (!typeSpecificData || Object.keys(typeSpecificData).length === 0) return typeSpecificData;
  
  const migratedData = { ...typeSpecificData };
  
  // Check for flat format data (activityType.subType.field) and convert to nested format
  Object.keys(typeSpecificData).forEach(key => {
    const parts = key.split('.');
    if (parts.length === 3) { // activityType.subType.field format
      const [activityType, subType, field] = parts;
      const subTypeKey = `${activityType}.${subType}`;
      
      // Convert to nested format
      if (!migratedData[subTypeKey]) {
        migratedData[subTypeKey] = {};
      }
      migratedData[subTypeKey][field] = typeSpecificData[key];
      
      // Remove the old flat key
      delete migratedData[key];
    }
    // If it's already nested format (e.g., "snow.alpine": {...}), keep it as-is
  });
  
  return migratedData;
};

  const fetchActivityTypes = async () => {
  try {
    console.log('🔍 Fetching activity types and configurations...');
    
    // Fetch activity types
    const activityTypesQuery = await databases.listDocuments(
      DATABASE_ID,
      APP_CONFIG_COLLECTION_ID,
      [Query.equal('key', 'activity_types')]
    );

    if (activityTypesQuery.documents.length > 0) {
      const activityTypesDoc = activityTypesQuery.documents[0] as any;
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
      
      console.log('✅ Loaded activity configurations:', configs);
      setActivityConfigurations(configs);
    }

  } catch (err) {
    console.error('Error fetching activity types:', err);
    // Set fallback types from create.tsx
    setActivityTypes(DEFAULT_ACTIVITY_TYPES);
  }
};

    


  /*const getActivityEmoji = (key: string): string => {
    const emojiMap: { [key: string]: string } = {
      'hiking': '🥾',
      'climbing': '🧗',
      'biking': '🚴',
      'running': '🏃',
      'swimming': '🏊',
      'yoga': '🧘',
      'skiing': '⛷️',
      'snowboarding': '🏂',
      'surfing': '🏄',
      'kayaking': '🚣',
      'camping': '🏕️',
      'fishing': '🎣'
    };
    return emojiMap[key] || '🎯';
  };*/

  const handleFormDataChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear errors for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleLocationSelect = (locationData: LocationData) => {
    setFormData(prev => ({
      ...prev,
      location: locationData
    }));
    setShowLocationPicker(false);
  };

  const handleTypeToggle = (typeKey: string) => {
  setFormData(prev => {
    const isCurrentlySelected = prev.types.includes(typeKey);
    
    if (isCurrentlySelected) {
      // Remove the type and all its subtypes
      return {
        ...prev,
        types: prev.types.filter(t => t !== typeKey),
        subTypes: prev.subTypes.filter(st => !st.startsWith(`${typeKey}.`)),
        // Also clean up typeSpecificData for this type
        typeSpecificData: Object.fromEntries(
          Object.entries(prev.typeSpecificData).filter(([key]) => !key.startsWith(`${typeKey}.`))
        )
      };
    } else {
      // Add only if under limit
      if (prev.types.length < 3) {
        return {
          ...prev,
          types: [...prev.types, typeKey]
        };
      }
      return prev; // Don't add if at limit
    }
  });
};
  
/*const getSubTypesForActivity = (activityType: string): string[] => {
    const subTypeMap: { [key: string]: string[] } = {
      hiking: ['Day Hiking', 'Multi-day Hiking', 'Bushwalking', 'Trekking'],
      climbing: ['Indoor Climbing', 'Outdoor Climbing', 'Bouldering', 'Sport Climbing'],
      biking: ['Road Cycling', 'Mountain Biking', 'BMX', 'Touring'],
      running: ['Road Running', 'Trail Running', 'Marathon', 'Sprint'],
      swimming: ['Pool Swimming', 'Open Water', 'Lap Swimming', 'Water Aerobics'],
      yoga: ['Hatha Yoga', 'Vinyasa', 'Bikram', 'Yin Yoga'],
      skiing: ['Alpine Skiing', 'Cross Country', 'Backcountry', 'Freestyle'],
      snowboarding: ['All Mountain', 'Freestyle', 'Backcountry', 'Racing'],
      surfing: ['Shortboard', 'Longboard', 'SUP', 'Bodyboarding'],
      kayaking: ['Sea Kayaking', 'River Kayaking', 'Recreational', 'Whitewater'],
      camping: ['Car Camping', 'Backpacking', 'Glamping', 'RV Camping'],
      fishing: ['Freshwater', 'Saltwater', 'Fly Fishing', 'Deep Sea']
    };
    return subTypeMap[activityType] || [];
  };*/

  /*const handleSubTypeToggle = (activityType: string, subType: string) => {
    const subTypeKey = `${activityType}.${subType}`;
    setFormData(prev => {
      const newSubTypes = prev.subTypes.includes(subTypeKey)
        ? prev.subTypes.filter(st => st !== subTypeKey)
        : [...prev.subTypes.filter(st => !st.startsWith(`${activityType}.`)), subTypeKey]; // Replace existing subtype for this activity
      
      return {
        ...prev,
        subTypes: newSubTypes
      };
    });
  };*/

  /*const renderTypeSpecificFields = (activityType: string) => {
  // Find selected subtypes for this activity type
  
  
  const selectedSubTypes = formData.subTypes.filter(st => st.startsWith(`${activityType}.`));
  
  // If no subtypes selected, render basic fields for the activity type
  if (selectedSubTypes.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Distance (km)
          </label>
          <input
            type="number"
            step="0.1"
            value={getFieldValue(activityType, 'distance')}
            onChange={(e) => handleTypeSpecificChange(activityType, 'distance', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
            placeholder="5.0"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Duration
          </label>
          <input
            type="text"
            value={getFieldValue(activityType, 'duration')}
            onChange={(e) => handleTypeSpecificChange(activityType, 'duration', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
            placeholder="2 hours"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Elevation (m)
          </label>
          <input
            type="number"
            value={getFieldValue(activityType, 'elevation')}
            onChange={(e) => handleTypeSpecificChange(activityType, 'elevation', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
            placeholder="500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Grade/Difficulty
          </label>
          <input
            type="text"
            value={getFieldValue(activityType, 'grade')}
            onChange={(e) => handleTypeSpecificChange(activityType, 'grade', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
            placeholder="Easy/Medium/Hard"
          />
        </div>
      </div>
    );
  }

  // Render fields for each selected subtype
  return (
    <div className="space-y-6">
      {selectedSubTypes.map(selectedSubType => {
        const [, subTypeName] = selectedSubType.split('.');
        return (
          <div key={selectedSubType} className="border border-gray-200 dark:border-slate-600 rounded-lg p-4">
            <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4 capitalize">
              {subTypeName.replace('_', ' ')} Details
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Distance (km)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={getFieldValue(activityType, 'distance')}
                  onChange={(e) => handleTypeSpecificChange(activityType, 'distance', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                  placeholder="5.0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Duration
                </label>
                <input
                  type="text"
                  value={getFieldValue(activityType, 'duration')}
                  onChange={(e) => handleTypeSpecificChange(activityType, 'duration', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                  placeholder="2 hours"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Elevation (m)
                </label>
                <input
                  type="number"
                  value={getFieldValue(activityType, 'elevation')}
                  onChange={(e) => handleTypeSpecificChange(activityType, 'elevation', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                  placeholder="500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Grade/Difficulty
                </label>
                <input
                  type="text"
                  value={getFieldValue(activityType, 'grade')}
                  onChange={(e) => handleTypeSpecificChange(activityType, 'grade', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                  placeholder="Easy/Medium/Hard"
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};*/


/*const migrateTypeSpecificData = (typeSpecificData: any, types: string[], subTypes: string[]) => {
  if (!typeSpecificData || Object.keys(typeSpecificData).length === 0) return typeSpecificData;
  
  const migratedData = { ...typeSpecificData };
  
  // Check if data needs migration (old format: activityType.field)
  types.forEach(activityType => {
    const oldFormatKeys = Object.keys(typeSpecificData).filter(key => 
      key.startsWith(`${activityType}.`) && !key.includes('.', activityType.length + 1)
    );
    
    if (oldFormatKeys.length > 0) {
      // Find the selected subtype for this activity type
      const selectedSubType = subTypes.find(st => st.startsWith(`${activityType}.`));
      
      if (selectedSubType) {
        // Migrate old format to new format
        oldFormatKeys.forEach(oldKey => {
          const fieldName = oldKey.substring(activityType.length + 1);
          const newKey = `${selectedSubType}.${fieldName}`;
          migratedData[newKey] = typeSpecificData[oldKey];
          // Keep old key for backward compatibility
        });
      }
    }
  });
  
  return migratedData;
};*/

 /* const getFieldValue = (activityType: string, field: string) => {
  // Find the selected subtype for this activity
  const selectedSubType = formData.subTypes.find(st => st.startsWith(`${activityType}.`));
  
  if (selectedSubType && formData.typeSpecificData[selectedSubType]) {
    return formData.typeSpecificData[selectedSubType][field] || '';
  }
  
  // Try other possible subtypes
  const possibleSubTypes = [
    `${activityType}.general`,
    `${activityType}.sport`, // for climbing
    `${activityType}.day_hiking` // for hiking
  ];
  
  for (const subType of possibleSubTypes) {
    if (formData.typeSpecificData[subType] && formData.typeSpecificData[subType][field]) {
      return formData.typeSpecificData[subType][field];
    }
  }
  
  return '';
};*/

  /*const handleTypeSpecificChange = (activityType: string, field: string, value: string) => {
  // Find the selected subtype for this activity type
  const selectedSubType = formData.subTypes.find(st => st.startsWith(`${activityType}.`));
  
  if (selectedSubType) {
    setFormData(prev => ({
      ...prev,
      typeSpecificData: {
        ...prev.typeSpecificData,
        [selectedSubType]: {
          ...prev.typeSpecificData[selectedSubType],
          [field]: value
        }
      }
    }));
  } else {
    // Fallback to general subtype
    const defaultSubType = `${activityType}.general`;
    setFormData(prev => ({
      ...prev,
      typeSpecificData: {
        ...prev.typeSpecificData,
        [defaultSubType]: {
          ...prev.typeSpecificData[defaultSubType],
          [field]: value
        }
      }
    }));
  }
};*/

  const handleAddUrl = () => {
    if (newUrl.trim() && newUrlName.trim()) {
      const urlObject = {
        shortName: newUrlName.trim(),
        url: newUrl.trim()
      };
      
      setFormData(prev => ({
        ...prev,
        externalUrls: [...prev.externalUrls, urlObject]
      }));
      
      setNewUrl('');
      setNewUrlName('');
    }
  };

  const handleRemoveUrl = (index: number) => {
    setFormData(prev => ({
      ...prev,
      externalUrls: prev.externalUrls.filter((_, i) => i !== index)
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.activityname.trim()) {
      newErrors.activityname = 'Activity name is required';
    }

    if (!formData.location) {
      newErrors.location = 'Location is required';
    }

    if (formData.types.length === 0) {
      newErrors.types = 'Please select at least one activity type';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  if (!validateForm() || !activity) return;

  try {
    setSaving(true);
    setError(null);

    // Use ActivityDataHandler to prepare data for saving
   const preparedData = ActivityDataHandler.prepareForSaving({
  activityname: formData.activityname.trim(),
  location: formData.location?.address || '',
  description: formData.description.trim(),
  types: formData.types,
  subTypes: formData.subTypes,
  difficulty: formData.difficulty,
  isPrivate: formData.isPrivate,
  typeSpecificData: formData.typeSpecificData,
  externalUrls: formData.externalUrls,
  // Remove this line: inclusive: formData.inclusive,
  updatedAt: new Date().toISOString()
});
    // Add coordinates if available
    if (formData.location?.latitude && formData.location?.longitude) {
      preparedData.latitude = Number(formData.location.latitude);
      preparedData.longitude = Number(formData.location.longitude);
    }

    // Add legacy type field
    if (formData.types.length > 0) {
      preparedData.type = formData.types[0];
    }

    console.log('🔄 Updating activity with prepared data:', preparedData);
    
    await updateActivity(activity.$id, preparedData);
    
    console.log('✅ Activity updated successfully');
    router.push(`/activities/${activity.$id}`);
    
  } catch (err) {
    console.error('❌ Error updating activity:', err);
    setError('Failed to update activity. Please try again.');
  } finally {
    setSaving(false);
  }
};


  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
        </div>
      </MainLayout>
    );
  }

  if (error || !activity) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              {error || 'Activity not found'}
            </h1>
            <button
              onClick={() => router.back()}
              className="text-emerald-600 hover:text-emerald-700 font-medium"
            >
              ← Go back
            </button>
          </div>
        </div>
      </MainLayout>
    );
  }

 return (
  <MainLayout>
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
       


        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-white dark:bg-slate-800 shadow-sm border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Edit Activity</h1>
            <p className="text-gray-600 dark:text-gray-400">Update your activity details</p>
          </div>
        </div>

        {/* Form - Always show */}
           <form key={formData.activityname} onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Basic Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Activity Name */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Activity Name *
                  </label>
                  <input
                    type="text"
                    value={formData.activityname}
                    onChange={(e) => handleFormDataChange('activityname', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white ${
                      errors.activityname ? 'border-red-300' : 'border-gray-300 dark:border-slate-600'
                    }`}
                    placeholder="Enter activity name"
                  />
                  {errors.activityname && (
                    <p className="mt-1 text-sm text-red-600">{errors.activityname}</p>
                  )}
                </div>

                {/* Location */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Location *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.location?.address || ''}
                      readOnly
                      className={`flex-1 px-3 py-2 border rounded-lg bg-gray-50 dark:bg-slate-600 text-gray-900 dark:text-white ${
                        errors.location ? 'border-red-300' : 'border-gray-300 dark:border-slate-600'
                      }`}
                      placeholder="Select location"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLocationPicker(true)}
                      className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                    >
                      {formData.location ? 'Change' : 'Select'}
                    </button>
                  </div>
                  {errors.location && (
                    <p className="mt-1 text-sm text-red-600">{errors.location}</p>
                  )}
                </div>

                {/* Description */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleFormDataChange('description', e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                    placeholder="Describe your activity..."
                  />
                </div>
              </div>
            </div>

           {/* Activity Types */}
<div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
  <div className="flex items-center justify-between mb-6">
    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Activity Types *</h3>
    <span className="text-sm text-gray-500 dark:text-gray-400">
      {formData.types.length}/3 selected
    </span>
  </div>
  
  {/* Activity Type Selection Grid */}
  <div  key={`types-${formData.types.join('-')}`}  className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
    {activityTypes.map((type) => {
      const isSelected = formData.types.includes(type.key);
      const isDisabled = !isSelected && formData.types.length >= 3;
      
      return (
        <button
          key={type.key}
          type="button"
          onClick={() => handleTypeToggle(type.key)}
          disabled={isDisabled}
          className={`p-3 text-center rounded-lg border transition-all ${
            isSelected
              ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
              : isDisabled
              ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'border-gray-200 hover:border-gray-300 bg-white text-gray-700'
          }`}
        >
          <div className={`w-12 h-12 rounded-full ${type.color} flex items-center justify-center mx-auto mb-2 text-white text-2xl`}>
            {type.icon}
          </div>
          <div className="font-medium text-sm">{type.label}</div>
        </button>
      );
    })}
  </div>
  
  {errors.types && (
    <p className="mt-2 text-sm text-red-600">{errors.types}</p>
  )}
</div>
              
              {/* Enhanced Details Section */}
{formData.types.length > 0 && (
  <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Enhanced Details</h3>
    



    {formData.types.map(typeKey => {
      const typeConfig = activityConfigurations[typeKey];
      
      if (!typeConfig) {
        return (
          <div key={typeKey} className="border border-gray-200 rounded-lg p-4 mb-4">
            <h4 className="text-lg font-semibold mb-2 capitalize">{typeKey} Details</h4>
            <p className="text-gray-500 text-sm">
              Enhanced details for {typeKey} will be available soon. 
              You can still edit the activity and add details later.
            </p>
          </div>
        );
      }

      return (
        <div key={typeKey} className="border border-gray-200 rounded-lg p-6 mb-4">
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
                        setFormData(prev => ({
                          ...prev,
                          subTypes: prev.subTypes.filter(st => st !== fullSubtypeKey)
                        }));
                      } else {
                        setFormData(prev => ({
                          ...prev,
                          subTypes: [...prev.subTypes, fullSubtypeKey]
                        }));
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
  setFormData(prev => ({
    ...prev,
    typeSpecificData: {
      ...prev.typeSpecificData,
      [fullSubtypeKey]: {  
        ...prev.typeSpecificData[fullSubtypeKey],
        [fieldConfig.key]: e.target.value
      }
    }
  }));
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
  setFormData(prev => ({
    ...prev,
    typeSpecificData: {
      ...prev.typeSpecificData,
      [fullSubtypeKey]: { 
        ...(prev.typeSpecificData[fullSubtypeKey] || {}), 
        [fieldConfig.key]: e.target.value
      }
    }
  }));
}}
                              placeholder={fieldConfig.placeholder}
                              className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
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
  </div>
)}
              
             {/* Settings */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Settings</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Privacy */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isPrivate"
                    checked={formData.isPrivate}
                    onChange={(e) => handleFormDataChange('isPrivate', e.target.checked)}
                    className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isPrivate" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                    Make this activity private
                  </label>
                </div>
              </div>
            </div>

            {/* External URLs */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">External Links</h3>
              
              <div className="space-y-3">
                {formData.externalUrls.map((urlObj: any, index) => (
                  <div key={index} className="flex gap-2 items-center p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium text-sm text-gray-900 dark:text-white">
                        {typeof urlObj === 'object' ? urlObj.shortName : 'Link'}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 truncate">
                        {typeof urlObj === 'object' ? urlObj.url : urlObj}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveUrl(index)}
                      className="px-3 py-1 text-red-600 hover:text-red-700 border border-red-300 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                
                <div className="border-t pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                    <input
                      type="text"
                      value={newUrlName}
                      onChange={(e) => setNewUrlName(e.target.value)}
                      placeholder="Link name (e.g., AllTrails)"
                      className="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                    />
                    <input
                      type="url"
                      value={newUrl}
                      onChange={(e) => setNewUrl(e.target.value)}
                      placeholder="https://example.com"
                      className="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddUrl}
                    disabled={!newUrl.trim() || !newUrlName.trim()}
                    className="w-full px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Add URL
                  </button>
                </div>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end gap-4 pt-6">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {saving && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                )}
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
           
        </div>
      </div>

     {/* Location Picker Modal */}
    {showLocationPicker && (
      <ActivityLocationPicker
        isOpen={showLocationPicker}
        onClose={() => setShowLocationPicker(false)}
        onLocationSelect={handleLocationSelect}
        onClear={() => {
          setFormData(prev => ({ ...prev, location: null }));
          setShowLocationPicker(false);
        }}
        currentLocation={formData.location ? {
          address: formData.location.address,
          latitude: formData.location.latitude || -33.8688,
          longitude: formData.location.longitude || 151.2093
        } : null}
      />
    )}
  </MainLayout>
  );
};
export default ActivityEditPage;
