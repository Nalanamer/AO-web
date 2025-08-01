// Enhanced Activity Data Handler
// This handles the saving, loading, and editing of activity types, subtypes, and enhanced details
import { Query , databases, DATABASE_ID, APP_CONFIG_COLLECTION_ID, ACTIVITIES_COLLECTION_ID, EVENTS_COLLECTION_ID, ID } from '../lib/appwrite';


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

interface TypeSpecificData {
  [subtypeKey: string]: {
    [fieldKey: string]: any;
  };
}

class ActivityDataHandler {
  
  /**
   * Parse typeSpecificData from the database
   * Handles both old flat format and new nested format
   */
  static parseTypeSpecificData(rawData: any): TypeSpecificData {
    if (!rawData) return {};
    
    let parsed: any = {};
    
    // If it's a string, parse it as JSON
    if (typeof rawData === 'string') {
      try {
        parsed = JSON.parse(rawData);
      } catch (e) {
        console.warn('Failed to parse typeSpecificData as JSON:', e);
        return {};
      }
    } else if (typeof rawData === 'object') {
      parsed = rawData;
    } else {
      return {};
    }
    
    // Convert flat format to nested format if needed
    return this.normalizeTypeSpecificData(parsed);
  }
  
  /**
   * Normalize typeSpecificData to consistent nested format
   * Converts: { "hike.day.distance": "5" } 
   * To: { "hike.day": { "distance": "5" } }
   */
  static normalizeTypeSpecificData(data: any): TypeSpecificData {
    const normalized: TypeSpecificData = {};
    
    Object.entries(data).forEach(([key, value]) => {
      const parts = key.split('.');
      
      if (parts.length === 3) {
        // Old flat format: activityType.subType.field
        const [activityType, subType, field] = parts;
        const subtypeKey = `${activityType}.${subType}`;
        
        if (!normalized[subtypeKey]) {
          normalized[subtypeKey] = {};
        }
        normalized[subtypeKey][field] = value;
        
      } else if (parts.length === 2) {
        // New nested format: already correct
        const subtypeKey = key;
        if (typeof value === 'object' && value !== null) {
          normalized[subtypeKey] = { ...value };
        } else {
          // Handle case where it's not an object
          normalized[subtypeKey] = { value };
        }
      } else {
        // Single level - might be legacy data
        console.warn(`Unexpected typeSpecificData key format: ${key}`);
      }
    });
    
    return normalized;
  }
  
  /**
   * Serialize typeSpecificData for saving to database
   */
  static serializeTypeSpecificData(data: TypeSpecificData): string {
    // Clean empty values
    const cleaned: TypeSpecificData = {};
    
    Object.entries(data).forEach(([subtypeKey, fields]) => {
      const cleanedFields: any = {};
      
      Object.entries(fields).forEach(([fieldKey, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          cleanedFields[fieldKey] = value;
        }
      });
      
      if (Object.keys(cleanedFields).length > 0) {
        cleaned[subtypeKey] = cleanedFields;
      }
    });
    
    return JSON.stringify(cleaned);
  }
  
  /**
   * Generate default subtypes from selected activity types
   * If no subtypes are explicitly selected, create default ones
   */
  static generateDefaultSubtypes(
    activityTypes: string[], 
    configurations: ActivityConfiguration
  ): string[] {
    const defaultSubtypes: string[] = [];
    
    activityTypes.forEach(typeKey => {
      const typeConfig = configurations[typeKey];
      if (typeConfig) {
        // Get the first available subtype as default
        const firstSubtype = Object.keys(typeConfig.subTypes)[0];
        if (firstSubtype) {
          defaultSubtypes.push(`${typeKey}.${firstSubtype}`);
        }
      } else {
        // No configuration available, create a general subtype
        defaultSubtypes.push(`${typeKey}.general`);
      }
    });
    
    return defaultSubtypes;
  }
  
  /**
   * Migrate legacy activity data to new format
   */
  static migrateActivityData(activityDoc: any, configurations: ActivityConfiguration): any {
    const migrated = { ...activityDoc };
    
    // Ensure types is an array
    if (!Array.isArray(migrated.types)) {
      if (migrated.type) {
        migrated.types = [migrated.type];
      } else {
        migrated.types = [];
      }
    }
    
    // Generate subtypes if missing
    if (!migrated.subTypes || !Array.isArray(migrated.subTypes) || migrated.subTypes.length === 0) {
      migrated.subTypes = this.generateDefaultSubtypes(migrated.types, configurations);
    }
    
    // Normalize typeSpecificData
    if (migrated.typeSpecificData) {
      const parsed = this.parseTypeSpecificData(migrated.typeSpecificData);
      migrated.typeSpecificData = parsed;
    } else {
      migrated.typeSpecificData = {};
    }
    
    return migrated;
  }
  
  /**
   * Prepare activity data for saving to database
   */
  static prepareForSaving(formData: any): any {
    const prepared = { ...formData };
    
    // Serialize typeSpecificData
    if (prepared.typeSpecificData && Object.keys(prepared.typeSpecificData).length > 0) {
      prepared.typeSpecificData = this.serializeTypeSpecificData(prepared.typeSpecificData);
    } else {
      prepared.typeSpecificData = null;
    }
    
    // Ensure we have at least one subtype for each type
    if (prepared.types && prepared.types.length > 0) {
      if (!prepared.subTypes || prepared.subTypes.length === 0) {
        // This shouldn't happen in the UI, but as a safety measure
        prepared.subTypes = prepared.types.map((type: string) => `${type}.general`);
      }
    }
    
    return prepared;
  }
  
  /**
   * Load activity configurations from Appwrite
   */
  static async loadConfigurations(): Promise<{
    activityTypes: any[];
    configurations: ActivityConfiguration;
  }> {
    try {
      // Load activity types
      const activityTypesQuery = await databases.listDocuments(
        DATABASE_ID,
        APP_CONFIG_COLLECTION_ID,
        [Query.equal('key', 'activity_types')]
      );

      let activityTypes: any[] = [];
      let displayLabels: Record<string, string> = {};

      if (activityTypesQuery.documents.length > 0) {
        const doc = activityTypesQuery.documents[0] as any;
        
        // Parse values - handle different formats
        if (Array.isArray(doc.values)) {
          activityTypes = doc.values;
        } else if (typeof doc.values === 'string') {
          try {
            const parsed = JSON.parse(doc.values);
            activityTypes = Array.isArray(parsed) ? parsed : [];
          } catch (e) {
            console.warn('Failed to parse activity types values');
          }
        }
        
        // Parse display labels
        if (doc.display_labels) {
          try {
            displayLabels = typeof doc.display_labels === 'string' 
              ? JSON.parse(doc.display_labels) 
              : doc.display_labels;
          } catch (e) {
            console.warn('Failed to parse display labels');
          }
        }
      }

      // Load activity configurations
      const configurationsQuery = await databases.listDocuments(
        DATABASE_ID,
        APP_CONFIG_COLLECTION_ID,
        [Query.equal('key', 'activity_configurations')]
      );

      let configurations: ActivityConfiguration = {};

      if (configurationsQuery.documents.length > 0) {
        const doc = configurationsQuery.documents[0] as any;
        
        if (doc.values) {
          if (Array.isArray(doc.values) && doc.values.length > 0) {
            try {
              configurations = JSON.parse(doc.values[0]);
            } catch (e) {
              console.warn('Failed to parse configurations from array format');
            }
          } else if (typeof doc.values === 'string') {
            try {
              configurations = JSON.parse(doc.values);
            } catch (e) {
              console.warn('Failed to parse configurations from string format');
            }
          } else if (typeof doc.values === 'object') {
            configurations = doc.values;
          }
        }
      }

      // Map activity types with display labels and defaults
      const mappedTypes = activityTypes.map((type: string) => {
        const defaultType = DEFAULT_ACTIVITY_TYPES.find(dt => dt.key === type);
        return {
          key: type,
          label: displayLabels[type] || defaultType?.label || type,
          icon: defaultType?.icon || '🎯',
          color: defaultType?.color || 'bg-gray-500'
        };
      });

      return {
        activityTypes: mappedTypes,
        configurations
      };
      
    } catch (error) {
      console.error('Error loading configurations:', error);
      return {
        activityTypes: DEFAULT_ACTIVITY_TYPES,
        configurations: {}
      };
    }
  }
  
  /**
   * Update typeSpecificData field value
   */
  static updateTypeSpecificField(
    currentData: TypeSpecificData,
    subtypeKey: string,
    fieldKey: string,
    value: any
  ): TypeSpecificData {
    return {
      ...currentData,
      [subtypeKey]: {
        ...(currentData[subtypeKey] || {}),
        [fieldKey]: value
      }
    };
  }
  
  /**
   * Remove subtype data when subtype is deselected
   */
  static removeSubtypeData(
    currentData: TypeSpecificData,
    subtypeKey: string
  ): TypeSpecificData {
    const updated = { ...currentData };
    delete updated[subtypeKey];
    return updated;
  }
  
  /**
   * Clean up typeSpecificData when activity types change
   * Removes data for subtypes that are no longer selected
   */
  static cleanupTypeSpecificData(
    currentData: TypeSpecificData,
    selectedSubtypes: string[]
  ): TypeSpecificData {
    const cleaned: TypeSpecificData = {};
    
    selectedSubtypes.forEach(subtypeKey => {
      if (currentData[subtypeKey]) {
        cleaned[subtypeKey] = currentData[subtypeKey];
      }
    });
    
    return cleaned;
  }
}

// Default activity types (fallback)
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

export default ActivityDataHandler;