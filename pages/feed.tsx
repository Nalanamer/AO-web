// pages/feed.tsx - Smart Suggestions Feed
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useActivities } from '@/hooks/useActivities';
import { useEvents } from '@/hooks/useEvents';
import MainLayout from '@/components/layout/MainLayout';
import { 
  databases, 
  DATABASE_ID, 
  ACTIVITIES_COLLECTION_ID,
  EVENTS_COLLECTION_ID,
  Query 
} from '@/lib/appwrite';
import LocationEditor from '../components/LocationEditor';
import FeedMap from '../components/feed/FeedMap';


// Enhanced interfaces for scored content
interface ScoredActivity extends FeedActivity {
  score: number;
  matchReasons: string[];
  distance?: number;
  relevanceFactors: {
    typeMatch: number;
    locationScore: number;
    difficultyMatch: number;
    availabilityMatch: number;
    freshnessScore: number;
  };
}

interface ScoredEvent extends FeedEvent {
  score: number;
  matchReasons: string[];
  distance?: number;
  relevanceFactors: {
    typeMatch: number;
    locationScore: number;
    difficultyMatch: number;
    availabilityMatch: number;
    freshnessScore: number;
  };
}

interface FeedActivity {
  $id: string;
  activityname: string;
  location: string;
  description: string;
  types: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  eventCount: number;
  participantCount: number;
  rating?: number;
  reviewCount?: number;
  inclusive: string[];
  createdAt: string;
  userId: string;
  isPrivate: boolean;
  latitude?: number;
  longitude?: number;
  [key: string]: any;
}

interface FeedEvent {
  $id: string;
  eventName: string;
  activityId: string;
  date: string;
  meetupPoint: string;
  description: string;
  maxParticipants: number;
  participants: string[];
  organizerId: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  createdAt: string;
  activityname?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  activityTypes?: string[];
  [key: string]: any;
}

interface FeedItem {
  id: string;
  type: 'activity' | 'event';
  timestamp: string;
  data: ScoredActivity | ScoredEvent;
  score: number;
  matchReasons: string[];
}

// Utility functions
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-AU', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const formatTime = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-AU', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatRelativeTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;
  
  return formatDate(dateString);
};

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case 'beginner': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'intermediate': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    case 'advanced': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
  }
};

// Geospatial utility functions
// Update parseLocation function to handle JSON string
const parseLocation = (location: string | any): { lat: number; lng: number } | null => {
  if (typeof location === 'object' && location?.latitude && location?.longitude) {
    return { lat: location.latitude, lng: location.longitude };
  }
  
  if (typeof location === 'string') {
    // Handle "Location: lat, lng" format (activities)
    if (location.includes('Location:')) {
      const coords = location.replace('Location:', '').trim().split(',');
      if (coords.length === 2) {
        const lat = parseFloat(coords[0].trim());
        const lng = parseFloat(coords[1].trim());
        if (!isNaN(lat) && !isNaN(lng)) {
          return { lat, lng };
        }
      }
    }
    
    // Handle "lat,lng" format (user locationCoords)
    else if (location.includes(',')) {
      const coords = location.split(',');
      if (coords.length === 2) {
        const lat = parseFloat(coords[0].trim());
        const lng = parseFloat(coords[1].trim());
        if (!isNaN(lat) && !isNaN(lng)) {
          return { lat, lng };
        }
      }
    }
  }
  
  return null;
};

const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Smart scoring algorithms
const calculateActivityScore = (
  activity: FeedActivity, 
  userProfile: any
): { score: number; matchReasons: string[]; relevanceFactors: any } => {
  let score = 0;
  const matchReasons: string[] = [];
  const relevanceFactors = {
    typeMatch: 0,
    locationScore: 0,
    difficultyMatch: 0,
    availabilityMatch: 0,
    freshnessScore: 0
  };

  // 1. Activity Type Match (40% weight) - FIXED
  const userDisciplines: string[] = Array.isArray(userProfile?.disciplines) ? userProfile.disciplines : [];
  const activityTypes: string[] = Array.isArray(activity?.types) ? activity.types : [];
  
  const typeMatches = activityTypes.filter((type: string) => 
    userDisciplines.some((discipline: string) => {
      // Safe string operations with null checks
      const disciplineStr = discipline ? String(discipline).toLowerCase() : '';
      const typeStr = type ? String(type).toLowerCase() : '';
      
      return disciplineStr.includes(typeStr) || typeStr.includes(disciplineStr);
    })
  );
  
  if (typeMatches.length > 0) {
    relevanceFactors.typeMatch = (typeMatches.length / Math.max(activityTypes.length, 1)) * 40;
    score += relevanceFactors.typeMatch;
    matchReasons.push(`Matches your interest in ${typeMatches.join(', ')}`);
  }

  // 2. Location Proximity (30% weight) - FIXED
const userLocation = parseLocation(userProfile?.locationCoords || userProfile?.location);
const activityLocation = parseLocation(activity?.location);




if (userLocation && activityLocation) {
  const distance = calculateDistance(
    userLocation.lat, userLocation.lng,
    activityLocation.lat, activityLocation.lng
  );
  
  const maxDistance = userProfile?.searchRadius || 50;
  
  
  
  if (distance <= maxDistance) {
    relevanceFactors.locationScore = Math.max(0, (1 - distance / maxDistance) * 30);
    score += relevanceFactors.locationScore;
    
    if (distance <= 5) {
      matchReasons.push('Very close to you');
    } else if (distance <= 15) {
      matchReasons.push('Near your location');
    } else {
      matchReasons.push(`${distance.toFixed(1)}km from you`);
    }
  } else {
    
  }
} else {
  
}

  // 3. Difficulty Match (15% weight) - FIXED
  const userExperienceLevels: Record<string, string> = userProfile?.experienceLevels || {};
  const activityDifficulty = activity?.difficulty;
  
  // Check if user has experience level set for this activity type
  for (const activityType of activityTypes) {
    const userLevel = userExperienceLevels[activityType?.toLowerCase()];
    if (userLevel) {
      if (userLevel === activityDifficulty) {
        relevanceFactors.difficultyMatch = 15; // Perfect match
        score += 15;
        matchReasons.push('Perfect difficulty match');
        break;
      } else if (
        (userLevel === 'beginner' && activityDifficulty === 'intermediate') ||
        (userLevel === 'intermediate' && activityDifficulty === 'advanced')
      ) {
        relevanceFactors.difficultyMatch = 10; // Growth opportunity
        score += 10;
        matchReasons.push('Growth opportunity');
        break;
      } else if (
        (userLevel === 'intermediate' && activityDifficulty === 'beginner') ||
        (userLevel === 'advanced' && activityDifficulty === 'intermediate')
      ) {
        relevanceFactors.difficultyMatch = 8; // Easier but still relevant
        score += 8;
        break;
      }
    }
  }

  // 4. Freshness Score (5% weight)
  const createdDate = new Date(activity?.createdAt);
  const now = new Date();
  const daysSinceCreated = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysSinceCreated <= 7) {
    relevanceFactors.freshnessScore = 5; // New this week
    score += 5;
    matchReasons.push('Recently added');
  } else if (daysSinceCreated <= 30) {
    relevanceFactors.freshnessScore = 3; // New this month
    score += 3;
  }

  // 5. Popularity bonus (small factor)
  if (activity?.participantCount > 5) {
    score += 2;
    matchReasons.push('Popular activity');
  }

  return { score, matchReasons, relevanceFactors };
};


const calculateEventScore = (
  event: FeedEvent,
  userProfile: any
): { score: number; matchReasons: string[]; relevanceFactors: any } => {
  let score = 0;
  const matchReasons: string[] = [];
  const relevanceFactors = {
    typeMatch: 0,
    locationScore: 0,
    difficultyMatch: 0,
    availabilityMatch: 0,
    freshnessScore: 0
  };

  // Similar scoring logic as activities but with event-specific factors - FIXED
  const userDisciplines: string[] = Array.isArray(userProfile?.disciplines) ? userProfile.disciplines : [];
  const eventTypes: string[] = Array.isArray(event?.activityTypes) ? event.activityTypes : [];
  
  if (eventTypes.length > 0) {
    const typeMatches = eventTypes.filter((type: string) => 
      userDisciplines.some((discipline: string) => {
        // Safe string operations with null checks
        const disciplineStr = discipline ? String(discipline).toLowerCase() : '';
        const typeStr = type ? String(type).toLowerCase() : '';
        
        return disciplineStr.includes(typeStr) || typeStr.includes(disciplineStr);
      })
    );
    
    if (typeMatches.length > 0) {
      relevanceFactors.typeMatch = (typeMatches.length / eventTypes.length) * 40;
      score += relevanceFactors.typeMatch;
      matchReasons.push(`Matches your interest in ${typeMatches.join(', ')}`);
    }
  }

  // Location scoring (similar to activities)
const userLocation = parseLocation(userProfile?.locationCoords || userProfile?.location);
 // Try multiple location sources for events
const eventLocation = parseLocation(event?.location) || 
                     parseLocation(event?.meetupPoint) || 
                     (event?.latitude && event?.longitude ? 
                       { lat: event.latitude, lng: event.longitude } : null);

  
  
  if (userLocation && eventLocation) {
    const distance = calculateDistance(
      userLocation.lat, userLocation.lng,
      eventLocation.lat, eventLocation.lng
    );
    
    const maxDistance = userProfile?.searchRadius || 50;
    if (distance <= maxDistance) {
      relevanceFactors.locationScore = Math.max(0, (1 - distance / maxDistance) * 30);
      score += relevanceFactors.locationScore;
      matchReasons.push(`${distance.toFixed(1)}km from you`);
    }
  }

  // Timing relevance for events
  const eventDate = new Date(event?.date);
  const now = new Date();
  const hoursUntilEvent = (eventDate.getTime() - now.getTime()) / (1000 * 60 * 60);
  
  if (hoursUntilEvent > 0 && hoursUntilEvent <= 168) { // Within a week
    relevanceFactors.availabilityMatch = 10;
    score += 10;
    
    if (hoursUntilEvent <= 24) {
      matchReasons.push('Happening soon');
    } else if (hoursUntilEvent <= 48) {
      matchReasons.push('This weekend');
    } else {
      matchReasons.push('This week');
    }
  }

  // Availability check
  if (event?.participants && event.participants.length < event?.maxParticipants) {
    score += 5;
    matchReasons.push('Spots available');
  }

  return { score, matchReasons, relevanceFactors };
};


const generateSmartSuggestions = async (
  user: any,
  publicActivities: any[],
  publicEvents: any[],
  setSuggestedActivities: (activities: ScoredActivity[]) => void,
  setSuggestedEvents: (events: ScoredEvent[]) => void
) => {
  if (!user) return;

  const extendedUser = {
    ...user,
    experienceLevels: user.experienceLevels || {},
    locationCoords: user.locationCoords || null
  };

  try {

    // Score and filter activities
    const scoredActivities = publicActivities

      .filter(activity => activity.userId !== extendedUser.$id)
      .map(activity => {
        const scoring = calculateActivityScore(activity, extendedUser as any);
        
        return {
          ...activity,
          score: scoring.score,
          matchReasons: scoring.matchReasons,
          relevanceFactors: scoring.relevanceFactors
        } as ScoredActivity;
      })
      .filter(activity => {
        // Only show activities within search radius (with location score) or minimum score
        const hasLocationScore = activity.relevanceFactors?.locationScore > 0;
        const hasMinimumScore = activity.score > 10;
        
        // If user has location, require activities to be within radius
        if (extendedUser.locationCoords) {
          return hasLocationScore && hasMinimumScore;
        }
        
        // If user has no location, just use minimum score
        return hasMinimumScore;
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 20);

    // Score and filter events
    const scoredEvents = publicEvents
      .filter(event => event.organizerId !== extendedUser.$id)
      .filter(event => new Date(event.date) > new Date())
      .map(event => {
        const scoring = calculateEventScore(event, extendedUser as any);
        
        return {
          ...event,
          score: scoring.score,
          matchReasons: scoring.matchReasons,
          relevanceFactors: scoring.relevanceFactors
        } as ScoredEvent;
      })
      .filter(event => {
        // Same filtering logic for events
        const hasLocationScore = event.relevanceFactors?.locationScore > 0;
        const hasMinimumScore = event.score > 10;
        
        if (extendedUser.locationCoords) {
          return hasLocationScore && hasMinimumScore;
        }
        
        return hasMinimumScore;
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 20);

    setSuggestedActivities(scoredActivities);
    setSuggestedEvents(scoredEvents);

  } catch (error) {
    console.error('❌ Error generating suggestions:', error);
  }
};

const parseLocationForMap = (location: string | any): { lat: number; lng: number } | null => {
  if (typeof location === 'object' && location?.latitude && location?.longitude) {
    return { lat: location.latitude, lng: location.longitude };
  }
  
  if (typeof location === 'string') {
    // Handle "Location: lat, lng" format (activities)
    if (location.includes('Location:')) {
      const coords = location.replace('Location:', '').trim().split(',');
      if (coords.length === 2) {
        const lat = parseFloat(coords[0].trim());
        const lng = parseFloat(coords[1].trim());
        if (!isNaN(lat) && !isNaN(lng)) {
          return { lat, lng };
        }
      }
    }
    
    // Handle "lat,lng" format (user locationCoords)
    else if (location.includes(',')) {
      const coords = location.split(',');
      if (coords.length === 2) {
        const lat = parseFloat(coords[0].trim());
        const lng = parseFloat(coords[1].trim());
        if (!isNaN(lat) && !isNaN(lng)) {
          return { lat, lng };
        }
      }
    }
  }
  
  return null;
};

// Add this function to convert your feed items to map locations

const convertFeedItemsToMapLocations = (
  feedItems: FeedItem[], 
  activeTab: string
): Array<{
  lat: number;
  lng: number;
  title: string;
  type: 'activity' | 'event';
  difficulty: string;
  description?: string;
  id: string;
}> => {
  const mapLocations: Array<{
    lat: number;
    lng: number;
    title: string;
    type: 'activity' | 'event';
    difficulty: string;
    description?: string;
    id: string;
  }> = [];

  feedItems.forEach(item => {
    let location = null;
    
    if (item.type === 'activity') {
      const activity = item.data as ScoredActivity;
      location = parseLocationForMap(activity.location);
      
      if (location) {
        mapLocations.push({
          lat: location.lat,
          lng: location.lng,
          title: activity.activityname,
          type: 'activity',
          difficulty: activity.difficulty,
          description: activity.description,
          id: activity.$id
        });
      }
    } else if (item.type === 'event') {
      const event = item.data as ScoredEvent;
      // Try multiple location sources for events
      location = parseLocationForMap(event.location) || 
                parseLocationForMap(event.meetupPoint) || 
                (event.latitude && event.longitude ? 
                  { lat: event.latitude, lng: event.longitude } : null);
      
      if (location) {
        mapLocations.push({
          lat: location.lat,
          lng: location.lng,
          title: event.eventName || 'Event',
          type: 'event',
          difficulty: event.difficulty || 'beginner',
          description: event.description,
          id: event.$id
        });
      }
    }
  });

  return mapLocations;
};



const Feed: React.FC = () => {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  const { 
    activities, 
    publicActivities, 
    loading: activitiesLoading, 
    fetchActivities, 
    fetchPublicActivities 
  } = useActivities();
  
  const { 
    events, 
    publicEvents, 
    loading: eventsLoading, 
    fetchEvents, 
    fetchPublicEvents 
  } = useEvents();

  // State
  const [activeTab, setActiveTab] = useState<'involved' | 'suggested'>('involved');
  const [contentFilter, setContentFilter] = useState<'all' | 'activities' | 'events'>('all');
  const [viewMode, setViewMode] = useState<'list' | 'grid' | 'map'>('list');

  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [suggestedActivities, setSuggestedActivities] = useState<ScoredActivity[]>([]);
  const [suggestedEvents, setSuggestedEvents] = useState<ScoredEvent[]>([]);

  // Load data on mount
  useEffect(() => {
    if (user && !authLoading) {
      loadFeedData();
    }
  }, [user, authLoading]);

  // Process feed data when dependencies change
  useEffect(() => {
    processFeedData();
  }, [
    activities, 
    publicActivities, 
    events, 
    publicEvents, 
    activeTab, 
    contentFilter,
    suggestedActivities,
    suggestedEvents
  ]);

  // In your Feed component, add this useEffect after your existing ones:
useEffect(() => {
  // Regenerate suggestions when data is available and user exists
  if (user && publicActivities.length > 0 && suggestedActivities.length === 0) {
    generateSmartSuggestions(
      user,
      publicActivities,
      publicEvents,
      setSuggestedActivities,
      setSuggestedEvents
    );
  }
}, [user, publicActivities, publicEvents, suggestedActivities.length]);

 const loadFeedData = async () => {
  console.log('🔄 Loading feed data...');
  setRefreshing(true);
  
  try {
    // Load basic data first
    await Promise.all([
      fetchActivities().catch(err => console.error('❌ Error loading activities:', err)),
      fetchEvents().catch(err => console.error('❌ Error loading events:', err)),
      fetchPublicActivities().catch(err => console.error('❌ Error loading public activities:', err)),
      fetchPublicEvents().catch(err => console.error('❌ Error loading public events:', err))
    ]);

    // Wait a bit for state to update, then generate suggestions
    setTimeout(() => {
      if (user) {
        generateSmartSuggestions(
          user,
          publicActivities,
          publicEvents,
          setSuggestedActivities,
          setSuggestedEvents
        );
      }
    }, 100);

  } catch (error) {
    console.error('❌ Error loading feed data:', error);
  } finally {
    setRefreshing(false);
  }
};

 


const processFeedData = () => {
    let items: FeedItem[] = [];

    if (activeTab === 'involved') {
      if (!user) {
        setFeedItems([]);
        return;
      }

      // Show user's own activities and events they're involved in
      const userActivities = activities.filter(activity => activity.userId === user.$id);
      const userEvents = events.filter(event => 
        event.organizerId === user.$id || 
        event.participants.includes(user.$id || '')
      );

      // Add activities
      if (contentFilter === 'all' || contentFilter === 'activities') {
        userActivities.forEach(activity => {
          items.push({
            id: `activity-${activity.$id}`,
            type: 'activity',
            timestamp: activity.createdAt,
            data: activity as ScoredActivity,
            score: 100, // User's own content always scores highest
            matchReasons: ['Your activity']
          });
        });
      }

      // Add events
      if (contentFilter === 'all' || contentFilter === 'events') {
        userEvents.forEach(event => {
          const activity = [...activities, ...publicActivities].find(a => a.$id === event.activityId);
          const eventWithActivity = {
            ...event,
            activityname: activity?.activityname || 'Unknown Activity',
            location: event.meetupPoint || activity?.location || 'Location not set'
          };
          
          items.push({
            id: `event-${event.$id}`,
            type: 'event',
            timestamp: event.createdAt,
            data: eventWithActivity as ScoredEvent,
            score: 100,
            matchReasons: event.organizerId === user.$id ? ['Your event'] : ['Joined event']
          });
        });
      }

    } else if (activeTab === 'suggested') {
      // Show smart suggestions based on user profile

      // Add suggested activities
      if (contentFilter === 'all' || contentFilter === 'activities') {
        suggestedActivities.forEach(activity => {
          items.push({
            id: `suggested-activity-${activity.$id}`,
            type: 'activity',
            timestamp: activity.createdAt,
            data: activity,
            score: activity.score,
            matchReasons: activity.matchReasons
          });
        });
      }

      // Add suggested events
      if (contentFilter === 'all' || contentFilter === 'events') {
        suggestedEvents.forEach(event => {
          items.push({
            id: `suggested-event-${event.$id}`,
            type: 'event',
            timestamp: event.createdAt,
            data: event,
            score: event.score,
            matchReasons: event.matchReasons
          });
        });
      }
    }

    // Sort by score then by timestamp
    items.sort((a, b) => {
      if (a.score !== b.score) {
        return b.score - a.score; // Higher score first
      }
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(); // Newer first
    });

    setFeedItems(items);
  };

  const getTabCount = (tab: string) => {
    switch (tab) {
      case 'involved':
        const userActivitiesCount = activities.filter(a => a.userId === user?.$id).length;
        const userEventsCount = events.filter(e => 
          e.organizerId === user?.$id || e.participants.includes(user?.$id || '')
        ).length;
        return userActivitiesCount + userEventsCount;
      case 'suggested':
        return suggestedActivities.length + suggestedEvents.length;
      default:
        return 0;
    }
  };

  const loading = activitiesLoading || eventsLoading;

  // Show loading during initial auth check
  if (authLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading your adventure feed...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!user) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Authentication Required
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Please log in to view your feed
            </p>
            <Link 
              href="/auth/login"
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg"
            >
              Log In
            </Link>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
        {/* Header */}
        <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
          <div className="px-4 py-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Feed
                </h1>
                <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">
                  {activeTab === 'suggested' 
                    ? 'Personalized recommendations based on your interests' 
                    : 'Your activities and events'
                  }
                </p>
              </div>
              <button
                onClick={loadFeedData}
                disabled={refreshing}
                className="p-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50"
              >
                {refreshing ? (
                  <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                )}
              </button>
            </div>

            {/* Tab Navigation */}
            <div className="flex space-x-1 bg-gray-100 dark:bg-slate-700 p-1 rounded-lg mb-4">
              {(['involved', 'suggested'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === tab
                      ? 'bg-white dark:bg-slate-600 text-emerald-600 dark:text-emerald-400 shadow-sm'
                      : 'text-gray-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)} ({getTabCount(tab)})
                </button>
              ))}
            </div>

            {/* Filters */}
            <div className="flex items-center justify-between">
              <div className="flex space-x-2">
                {['all', 'activities', 'events'].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setContentFilter(filter as any)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      contentFilter === filter
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gray-200 dark:bg-slate-600 text-gray-700 dark:text-slate-300 hover:bg-emerald-100 dark:hover:bg-slate-500'
                    }`}
                  >
                    {filter.charAt(0).toUpperCase() + filter.slice(1)}
                  </button>
                ))}
              </div>

             {/* Enhanced View Mode Toggle with Map */}
<div className="flex space-x-2">
  <button
    onClick={() => setViewMode('list')}
    className={`p-2 rounded-lg transition-colors ${
      viewMode === 'list'
        ? 'bg-emerald-600 text-white'
        : 'bg-gray-200 dark:bg-slate-600 text-gray-700 dark:text-slate-300 hover:bg-emerald-100 dark:hover:bg-slate-500'
    }`}
    title="List View"
  >
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
    </svg>
  </button>
  <button
    onClick={() => setViewMode('grid')}
    className={`p-2 rounded-lg transition-colors ${
      viewMode === 'grid'
        ? 'bg-emerald-600 text-white'
        : 'bg-gray-200 dark:bg-slate-600 text-gray-700 dark:text-slate-300 hover:bg-emerald-100 dark:hover:bg-slate-500'
    }`}
    title="Grid View"
  >
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  </button>
  <button
    onClick={() => setViewMode('map')}
    className={`p-2 rounded-lg transition-colors ${
      viewMode === 'map'
        ? 'bg-emerald-600 text-white'
        : 'bg-gray-200 dark:bg-slate-600 text-gray-700 dark:text-slate-300 hover:bg-emerald-100 dark:hover:bg-slate-500'
    }`}
    title="Map View"
  >
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
    </svg>
  </button>
</div>

            </div>
          </div>
        </div>

        {/* Content */}
        {/* Content */}
<div className="px-4 py-6">
  {loading ? (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
    </div>
  ) : feedItems.length === 0 ? (
    <div className="text-center py-12">
      <div className="mx-auto h-24 w-24 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center mb-4">
        <svg className="h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
        {activeTab === 'suggested' 
          ? 'No suggestions available'
          : `No ${contentFilter === 'all' ? 'content' : contentFilter} found`
        }
      </h3>
      <p className="text-gray-600 dark:text-slate-400 mb-6">
        {activeTab === 'involved'
          ? "You haven't created any activities or joined any events yet. Start building your adventure community!"
          : activeTab === 'suggested'
          ? "We're working on finding perfect matches for you. Try updating your profile interests or check back later."
          : "No content available right now."
        }
      </p>
      <div className="flex justify-center space-x-4">
        {activeTab === 'suggested' ? (
          <>
            <button
              onClick={() => router.push('/profile')}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg transition-colors font-medium"
            >
              Update Profile
            </button>
            <button
              onClick={() => router.push('/activities')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors font-medium"
            >
              Browse Activities
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => router.push('/activities/create')}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg transition-colors font-medium"
            >
              Create Activity
            </button>
            <button
              onClick={() => router.push('/events/create')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors font-medium"
            >
              Create Event
            </button>
          </>
        )}
      </div>
    </div>
  ) : viewMode === 'map' ? (
    /* Map View */
    <div className="space-y-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-gray-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {activeTab === 'suggested' ? 'Suggested for You' : 'Your Activities & Events'}
            </h3>
            <p className="text-sm text-gray-600 dark:text-slate-400">
              {feedItems.length} {feedItems.length === 1 ? 'item' : 'items'} shown on map
            </p>
          </div>
          <div className="flex space-x-2 text-sm">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-gray-600 dark:text-slate-400">Your Location</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 rounded-full bg-purple-500"></div>
              <span className="text-gray-600 dark:text-slate-400">Activities</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 rounded-full bg-gray-500"></div>
              <span className="text-gray-600 dark:text-slate-400">Events</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-gray-600 dark:text-slate-400">Beginner Events</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 rounded-full bg-orange-500"></div>
              <span className="text-gray-600 dark:text-slate-400">Intermediate Events</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-gray-600 dark:text-slate-400">Advanced Events</span>
            </div>
          </div>
        </div>
        
        <FeedMap
          locations={convertFeedItemsToMapLocations(feedItems, activeTab)}
          userLocation={user?.locationCoords ? parseLocationForMap(user.locationCoords) : null}
          onLocationClick={(id, type) => {
            // Navigate to the clicked activity or event
            if (type === 'activity') {
              router.push(`/activities/${id}`);
            } else {
              router.push(`/events/${id}`);
            }
          }}
          height="500px"
          className="rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden"
        />
      </div>
    </div>
  ) : (
    /* List/Grid View */
    <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
      {feedItems.map((item) => (
        <div
          key={item.id}
          className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden hover:shadow-md transition-shadow"
        >
          {item.type === 'activity' ? (
            <SmartActivityCard 
              activity={item.data as ScoredActivity} 
              matchReasons={item.matchReasons}
              isPersonalized={activeTab === 'suggested'}
            />
          ) : (
            <SmartEventCard 
              event={item.data as ScoredEvent} 
              matchReasons={item.matchReasons}
              isPersonalized={activeTab === 'suggested'}
            />
          )}
        </div>
      ))}
    </div>
  )}
</div>
      </div>
    </MainLayout>
  );
};

// Enhanced Activity Card with Smart Features
const SmartActivityCard: React.FC<{ 
  activity: ScoredActivity; 
  matchReasons: string[];
  isPersonalized: boolean;
}> = ({ activity, matchReasons, isPersonalized }) => {
  const router = useRouter();

  return (
    <div 
      className="p-6 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
      onClick={() => router.push(`/activities/${activity.$id}`)}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 text-xs font-medium rounded-full">
              Activity
            </span>
            {isPersonalized && (
              <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 text-xs font-medium rounded-full">
                ⭐ Suggested for you
              </span>
            )}
            {isPersonalized && activity.score && (
              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-medium rounded-full">
                {Math.round(activity.score)}% match
              </span>
            )}
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
            {activity.activityname}
          </h3>
          <p className="text-sm text-gray-600 dark:text-slate-400 flex items-center">
            <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {activity.location}
            {activity.distance && (
              <span className="ml-2 text-xs bg-gray-100 dark:bg-slate-600 px-1 rounded">
                {activity.distance.toFixed(1)}km
              </span>
            )}
          </p>
        </div>
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getDifficultyColor(activity.difficulty)}`}>
          {activity.difficulty}
        </span>
      </div>

      <p className="text-gray-700 dark:text-slate-300 text-sm mb-4 line-clamp-2">
        {activity.description}
      </p>

      {/* Match Reasons for Personalized Feed */}
      {isPersonalized && matchReasons.length > 0 && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-1">
            {matchReasons.slice(0, 3).map((reason, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 text-xs rounded-full"
              >
                {reason}
              </span>
            ))}
            {matchReasons.length > 3 && (
              <span className="px-2 py-1 bg-gray-100 dark:bg-slate-600 text-gray-600 dark:text-slate-400 text-xs rounded-full">
                +{matchReasons.length - 3} more reasons
              </span>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-1 mb-4">
        {activity.types && activity.types.slice(0, 3).map((type, index) => (
          <span
            key={index}
            className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 text-xs rounded-full"
          >
            {type}
          </span>
        ))}
        {activity.types && activity.types.length > 3 && (
          <span className="px-2 py-1 bg-gray-100 dark:bg-slate-600 text-gray-600 dark:text-slate-400 text-xs rounded-full">
            +{activity.types.length - 3} more
          </span>
        )}
      </div>

      <div className="flex items-center justify-between text-sm text-gray-600 dark:text-slate-400">
        <div className="flex items-center space-x-4">
          <span className="flex items-center">
            <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {activity.eventCount || 0} events
          </span>
          <span className="flex items-center">
            <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
            {activity.participantCount || 0} participants
          </span>
          {activity.rating && (
            <span className="flex items-center">
              <svg className="h-4 w-4 mr-1 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              {activity.rating.toFixed(1)}
            </span>
          )}
        </div>
        <span className="text-xs">
          {formatRelativeTime(activity.createdAt)}
        </span>
      </div>
    </div>
  );
};

// Enhanced Event Card with Smart Features
const SmartEventCard: React.FC<{ 
  event: ScoredEvent; 
  matchReasons: string[];
  isPersonalized: boolean;
}> = ({ event, matchReasons, isPersonalized }) => {
  const router = useRouter();
  const eventDate = new Date(event.date);
  const isUpcoming = eventDate > new Date();

  return (
    <div 
      className="p-6 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
      onClick={() => router.push(`/events/${event.$id}`)}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-medium rounded-full">
              Event
            </span>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
              isUpcoming 
                ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' 
                : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
            }`}>
              {isUpcoming ? 'Upcoming' : 'Past'}
            </span>
            {isPersonalized && (
              <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 text-xs font-medium rounded-full">
                ⭐ Suggested for you
              </span>
            )}
            {isPersonalized && event.score && (
              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-medium rounded-full">
                {Math.round(event.score)}% match
              </span>
            )}
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
            {event.eventName}
          </h3>
          <p className="text-sm text-emerald-600 dark:text-emerald-400 mb-1">
            Part of: {event.activityname}
          </p>
          <p className="text-sm text-gray-600 dark:text-slate-400 flex items-center">
            <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {event.location}
            {event.distance && (
              <span className="ml-2 text-xs bg-gray-100 dark:bg-slate-600 px-1 rounded">
                {event.distance.toFixed(1)}km
              </span>
            )}
          </p>
        </div>
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getDifficultyColor(event.difficulty)}`}>
          {event.difficulty}
        </span>
      </div>

      <p className="text-gray-700 dark:text-slate-300 text-sm mb-4 line-clamp-2">
        {event.description}
      </p>

      {/* Match Reasons for Personalized Feed */}
      {isPersonalized && matchReasons.length > 0 && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-1">
            {matchReasons.slice(0, 3).map((reason, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 text-xs rounded-full"
              >
                {reason}
              </span>
            ))}
            {matchReasons.length > 3 && (
              <span className="px-2 py-1 bg-gray-100 dark:bg-slate-600 text-gray-600 dark:text-slate-400 text-xs rounded-full">
                +{matchReasons.length - 3} more reasons
              </span>
            )}
          </div>
        </div>
      )}

      <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-3 mb-4">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center text-gray-600 dark:text-slate-400">
            <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {formatDate(event.date)} at {formatTime(event.date)}
          </div>
          <div className="flex items-center text-gray-600 dark:text-slate-400">
            <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
            {event.participants ? event.participants.length : 0}/{event.maxParticipants}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-gray-600 dark:text-slate-400">
        <span className="text-xs">
          Created {formatRelativeTime(event.createdAt)}
        </span>
        {event.participants && event.participants.length < event.maxParticipants && isUpcoming && (
          <span className="text-emerald-600 dark:text-emerald-400 font-medium">
            Spots available
          </span>
        )}
      </div>
    </div>
  );
};

export default Feed;