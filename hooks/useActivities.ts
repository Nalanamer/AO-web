// hooks/useActivities.ts - Real Appwrite database integration
import { useState, useEffect } from 'react';
import { databases, DATABASE_ID, ACTIVITIES_COLLECTION_ID, Query, ID } from '../lib/appwrite';
import { useAuth } from '../contexts/AuthContext';

interface Activity {
  $id: string;
  activityname: string;
  location: string | { 
    address: string; 
    latitude: number; 
    longitude: number; 
  };
  description?: string;
  types?: string[];
  eventCount?: number;
  participantCount?: number;
  difficulty?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  isPrivate?: boolean;
  userId: string;
  createdAt: string;
  updatedAt?: string;
  rating?: number;
  reviewCount?: number;
  externalUrls?: string[];
  inclusive?: string[];
  subTypes?: string[];
  typeSpecificData?: Record<string, any>;
}

interface ActivityFilters {
  query?: string;
  types?: string[];
  difficulty?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
  location?: {
    address: string;
    radius: number;
  };
  maxParticipants?: number;
  inclusive?: string[];
  nearMe?: boolean;
  hasEvents?: boolean;
  privacy?: 'public' | 'private' | 'all';
  radius?: number;
}

export const useActivities = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [publicActivities, setPublicActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
  
}, []);
  const { user } = useAuth();

  // Fetch all activities from Appwrite
  const fetchActivities = async () => {
  const ACTIVITIES_COLLECTION_ID = process.env.NEXT_PUBLIC_ACTIVITIES_COLLECTION_ID;
  
  
  setLoading(true);
  setError(null);

  try {
    // Import Appwrite at the top of your file if not already there:
    // import { databases, DATABASE_ID, Query } from '../lib/appwrite';
    
    if (!ACTIVITIES_COLLECTION_ID || ACTIVITIES_COLLECTION_ID === 'activities') {
  console.log('⚠️ No real collection ID, using mock data');
  setActivities(getMockActivities());
  setLoading(false);
  return;
}

    console.log('📡 Making Appwrite request...');
    
    const response = await databases.listDocuments(
      process.env.NEXT_PUBLIC_DATABASE_ID || 'main',
      ACTIVITIES_COLLECTION_ID,
      [
        Query.orderDesc('$createdAt'),
        Query.limit(50)
      ]
    );

    
    // Map the real data to your format
    const realActivities = response.documents.map((doc: any) => ({
      $id: doc.$id,
      activityname: doc.activityname || doc.name || 'Unnamed Activity',
      location: doc.location || 'Location TBD',
      description: doc.description || '',
      types: Array.isArray(doc.types) ? doc.types : (doc.types ? [doc.types] : []),
      eventCount: doc.eventCount || 0,
      participantCount: doc.participantCount || 0,
      difficulty: doc.difficulty || 'beginner',
      isPrivate: doc.isPrivate || false,
      userId: doc.userId || doc.$createdBy || '',
      createdAt: doc.$createdAt || doc.createdAt || new Date().toISOString(),
      updatedAt: doc.$updatedAt || doc.updatedAt,
      rating: doc.rating || 0,
      reviewCount: doc.reviewCount || 0,
      externalUrls: Array.isArray(doc.externalUrls) ? doc.externalUrls : [],
      inclusive: Array.isArray(doc.inclusive) ? doc.inclusive : []
    }));

    setActivities(realActivities);
    setPublicActivities(realActivities.filter(a => !a.isPrivate));
    
  } catch (err: any) {
    console.error('❌ FETCH ERROR:', err);
    console.error('Error code:', err.code);
    setError('Failed to load activities: ' + err.message);
    
    // Fallback to mock data
    setActivities(getMockActivities());
  } finally {
    setLoading(false);
  }
};

  // Fetch public activities
  const fetchPublicActivities = async () => {
    if (!ACTIVITIES_COLLECTION_ID) {
      setPublicActivities(getMockActivities());
      return;
    }

    try {
      
      const response = await databases.listDocuments(
        DATABASE_ID,
        ACTIVITIES_COLLECTION_ID,
        [
          Query.equal('isPrivate', false),
          Query.orderDesc('$createdAt'),
          Query.limit(50)
        ]
      );

      const publicData = response.documents.map((doc: any) => ({
        $id: doc.$id,
        activityname: doc.activityname || doc.name || 'Unnamed Activity',
        location: doc.location || 'Location TBD',
        description: doc.description || '',
        types: Array.isArray(doc.types) ? doc.types : [],
        eventCount: doc.eventCount || 0,
        participantCount: doc.participantCount || 0,
        difficulty: doc.difficulty || 'beginner',
        isPrivate: false,
        userId: doc.userId || '',
        createdAt: doc.$createdAt || new Date().toISOString(),
        rating: doc.rating || 0,
        reviewCount: doc.reviewCount || 0,
        inclusive: Array.isArray(doc.inclusive) ? doc.inclusive : []
      }));

      setPublicActivities(publicData);
      console.log(`✅ Fetched ${publicData.length} public activities`);
      
    } catch (err) {
      console.error('❌ Error fetching public activities:', err);
      setPublicActivities(getMockActivities());
    }
  };

  // Search activities
  const searchActivities = async (query: string, filters?: ActivityFilters) => {
    if (!ACTIVITIES_COLLECTION_ID) {
      const filtered = getMockActivities().filter(activity =>
        activity.activityname.toLowerCase().includes(query.toLowerCase())
      );
      setActivities(filtered);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      
      const queries = [Query.orderDesc('$createdAt')];
      
      // Add search query if provided
      if (query.trim()) {
        queries.push(Query.search('activityname', query));
      }
      
      // Add difficulty filter
      if (filters?.difficulty && filters.difficulty.length > 0) {
        queries.push(Query.equal('difficulty', filters.difficulty));
      }
      
      // Add privacy filter
      if (filters?.privacy && filters.privacy !== 'all') {
        queries.push(Query.equal('isPrivate', filters.privacy === 'private'));
      }

      const response = await databases.listDocuments(
        DATABASE_ID,
        ACTIVITIES_COLLECTION_ID,
        queries
      );

      const searchResults = response.documents.map((doc: any) => ({
        $id: doc.$id,
        activityname: doc.activityname || 'Unnamed Activity',
        location: doc.location || 'Location TBD',
        description: doc.description || '',
        types: Array.isArray(doc.types) ? doc.types : [],
        difficulty: doc.difficulty || 'beginner',
        isPrivate: doc.isPrivate || false,
        userId: doc.userId || '',
        createdAt: doc.$createdAt || new Date().toISOString(),
        eventCount: doc.eventCount || 0,
        participantCount: doc.participantCount || 0,
        rating: doc.rating || 0,
        reviewCount: doc.reviewCount || 0
      }));

      setActivities(searchResults);
      
    } catch (err) {
      console.error('❌ Error searching activities:', err);
      setError('Search failed');
    } finally {
      setLoading(false);
    }
  };

  // Create new activity
  const createActivity = async (activityData: Partial<Activity>): Promise<Activity> => {
    if (!ACTIVITIES_COLLECTION_ID) {
      throw new Error('Activities collection not configured');
    }

    if (!user) {
      throw new Error('Must be logged in to create activities');
    }

    try {
      
      const newActivityData = {
        activityname: activityData.activityname || 'New Activity',
        location: activityData.location || 'Location TBD',
        description: activityData.description || '',
        types: activityData.types || [],
        difficulty: activityData.difficulty || 'beginner',
        isPrivate: activityData.isPrivate || false,
        userId: user.$id,
        eventCount: 0,
        participantCount: 0,
        rating: 0,
        reviewCount: 0,
        externalUrls: activityData.externalUrls || [],
        inclusive: activityData.inclusive || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const response = await databases.createDocument(
        DATABASE_ID,
        ACTIVITIES_COLLECTION_ID,
        ID.unique(),
        newActivityData
      );

      const newActivity: Activity = {
        $id: response.$id,
        activityname: response.activityname,
        location: response.location,
        description: response.description,
        types: response.types,
        difficulty: response.difficulty,
        isPrivate: response.isPrivate,
        userId: response.userId,
        createdAt: response.$createdAt,
        eventCount: 0,
        participantCount: 0,
        rating: 0,
        reviewCount: 0,
        externalUrls: response.externalUrls,
        inclusive: response.inclusive
      };

      // Update local state
      setActivities(prev => [newActivity, ...prev]);
      
      console.log('✅ Activity created successfully');
      return newActivity;
      
    } catch (err) {
      console.error('❌ Error creating activity:', err);
      throw new Error('Failed to create activity');
    }
  };

  // Update activity
  const updateActivity = async (id: string, activityData: Partial<Activity>): Promise<Activity> => {
    if (!ACTIVITIES_COLLECTION_ID) {
      throw new Error('Activities collection not configured');
    }

    try {
      console.log('📝 Updating activity:', id);
      
      const updateData = {
        ...activityData,
        updatedAt: new Date().toISOString()
      };

      const response = await databases.updateDocument(
        DATABASE_ID,
        ACTIVITIES_COLLECTION_ID,
        id,
        updateData
      );

      const updatedActivity: Activity = {
        $id: response.$id,
        activityname: response.activityname,
        location: response.location,
        description: response.description,
        types: response.types,
        difficulty: response.difficulty,
        isPrivate: response.isPrivate,
        userId: response.userId,
        createdAt: response.$createdAt,
        updatedAt: response.$updatedAt,
        eventCount: response.eventCount,
        participantCount: response.participantCount,
        rating: response.rating,
        reviewCount: response.reviewCount,
        externalUrls: response.externalUrls,
        inclusive: response.inclusive
      };

      // Update local state
      setActivities(prev => 
        prev.map(activity => 
          activity.$id === id ? updatedActivity : activity
        )
      );

      console.log('✅ Activity updated successfully');
      return updatedActivity;
      
    } catch (err) {
      console.error('❌ Error updating activity:', err);
      throw new Error('Failed to update activity');
    }
  };

  // Delete activity
  const deleteActivity = async (id: string): Promise<void> => {
    if (!ACTIVITIES_COLLECTION_ID) {
      throw new Error('Activities collection not configured');
    }

    try {
      console.log('🗑️ Deleting activity:', id);
      
      await databases.deleteDocument(
        DATABASE_ID,
        ACTIVITIES_COLLECTION_ID,
        id
      );

      // Update local state
      setActivities(prev => prev.filter(activity => activity.$id !== id));
      setPublicActivities(prev => prev.filter(activity => activity.$id !== id));

      console.log('✅ Activity deleted successfully');
      
    } catch (err) {
      console.error('❌ Error deleting activity:', err);
      throw new Error('Failed to delete activity');
    }
  };

  // Get activity by ID
  const getActivityById = async (id: string): Promise<Activity | null> => {
    if (!ACTIVITIES_COLLECTION_ID) {
      return getMockActivities().find(a => a.$id === id) || null;
    }

    try {
      console.log('🔍 Fetching activity by ID:', id);
      
      const response = await databases.getDocument(
        DATABASE_ID,
        ACTIVITIES_COLLECTION_ID,
        id
      );

      const activity: Activity = {
  $id: response.$id,
  activityname: response.activityname,
  location: response.location,
  description: response.description,
  types: response.types,
  subTypes: response.subTypes, // ✅ ADD THIS
  typeSpecificData: response.typeSpecificData, // ✅ ADD THIS
  difficulty: response.difficulty,
  isPrivate: response.isPrivate,
  userId: response.userId,
  createdAt: response.$createdAt,
  updatedAt: response.$updatedAt,
  eventCount: response.eventCount,
  participantCount: response.participantCount,
  rating: response.rating,
  reviewCount: response.reviewCount,
  externalUrls: response.externalUrls,
  inclusive: response.inclusive
};

      console.log('✅ Activity found:', activity.activityname);
      return activity;
      
    } catch (err) {
      console.error('❌ Error fetching activity:', err);
      return null;
    }
  };

  // Mock data fallback
  const getMockActivities = () => [
  {
    $id: 'mock-1',
    activityname: '⚠️ MOCK: Blue Mountains Hiking',
    location: 'Blue Mountains National Park, NSW',
    description: 'This is mock data - real activities not loading properly',
    types: ['hiking', 'mock-data'],
    eventCount: 8,
    participantCount: 156,
    difficulty: 'intermediate' as const,
    isPrivate: false,
    userId: 'mock-user',
    createdAt: '2025-07-10T09:00:00Z',
    rating: 4.8,
    reviewCount: 47,
    inclusive: ['Mock Data Warning'],
    externalUrls: []
  }
];

  // Auto-fetch activities on mount
  useEffect(() => {
    fetchActivities();
    fetchPublicActivities();
  }, [user]);

  return {
    activities,
    publicActivities,
    loading,
    error,
    fetchActivities,
    fetchPublicActivities,
    searchActivities,
    createActivity,
    updateActivity,
    deleteActivity,
    getActivityById
  };
};