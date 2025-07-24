// pages/feed.tsx - Improved Feed Page matching mobile app with real Appwrite data
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useActivities } from '@/hooks/useActivities';
import { useEvents } from '@/hooks/useEvents';
import MainLayout from '@/components/layout/MainLayout';

// Types matching your Appwrite schema
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

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case 'beginner': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'intermediate': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    case 'advanced': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
  }
};

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
  activityname?: string; // Populated from activity
  location?: string; // Populated from activity or meetupPoint
  requirements?: string[];
  equipment?: string[];
  tags?: string[];
  updatedAt?: string;
  createdBy?: string;
}

interface FeedItem {
  id: string;
  type: 'activity' | 'event';
  timestamp: string;
  data: FeedActivity | FeedEvent;
}

const Feed: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();
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

  // State matching mobile app
  const [activeTab, setActiveTab] = useState<'involved' | 'suggested' | 'nearby'>('involved');
  const [contentFilter, setContentFilter] = useState<'all' | 'activities' | 'events'>('all');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Load data on mount
  useEffect(() => {
    if (user) {
      loadFeedData();
    }
  }, [user]);

  // Update feed items when data changes
  useEffect(() => {
    processFeedData();
  }, [activities, publicActivities, events, publicEvents, activeTab, contentFilter]);

  const loadFeedData = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchActivities(),
        fetchPublicActivities(),
        fetchEvents(),
        fetchPublicEvents()
      ]);
    } catch (error) {
      console.error('Error loading feed data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const processFeedData = () => {
    let items: FeedItem[] = [];

    if (activeTab === 'involved') {
      // Show user's own activities and events they're involved in
      const userActivities = activities.filter(activity => activity.userId === user?.$id);
      const userEvents = events.filter(event => 
        event.organizerId === user?.$id || 
        event.participants.includes(user?.$id || '')
      );

      // Add activities
      if (contentFilter === 'all' || contentFilter === 'activities') {
        userActivities.forEach(activity => {
          items.push({
            id: `activity-${activity.$id}`,
            type: 'activity',
            timestamp: activity.createdAt,
            data: activity  as FeedActivity
          });
        });
      }

      // Add events with populated activity data
      if (contentFilter === 'all' || contentFilter === 'events') {
        userEvents.forEach(event => {
          const activity = [...activities, ...publicActivities].find(a => a.$id === event.activityId);
          const eventWithActivity = {
            ...event,
            activityname: activity?.activityname || 'Unknown Activity',
            location: event.meetupPoint || activity?.location || 'Location not set'
          } as FeedEvent;
          
          items.push({
            id: `event-${event.$id}`,
            type: 'event',
            timestamp: event.createdAt,
            data: eventWithActivity
          });
        });
      }
    } else if (activeTab === 'suggested') {
      // Match user's disciplines/interests
      const userDisciplines = user?.disciplines || [];
      const suggestedActivities = publicActivities.filter(activity => {
        if (activity.userId === user?.$id) return false; // Don't suggest user's own activities
        
        // Match user's disciplines/interests
        const hasMatchingType = activity.types && activity.types.some(type => 
          userDisciplines.includes(type)
        );
        
        return hasMatchingType;
      });

      if (contentFilter === 'all' || contentFilter === 'activities') {
        suggestedActivities.forEach(activity => {
          items.push({
            id: `suggested-activity-${activity.$id}`,
            type: 'activity',
            timestamp: activity.createdAt,
            data: activity as FeedActivity
          });
        });
      }

      // Also suggest events from suggested activities
      if (contentFilter === 'all' || contentFilter === 'events') {
        const suggestedEvents = publicEvents.filter(event => {
          const activity = suggestedActivities.find(a => a.$id === event.activityId);
          return activity && event.organizerId !== user?.$id;
        });

        suggestedEvents.forEach(event => {
          const activity = suggestedActivities.find(a => a.$id === event.activityId);
          const eventWithActivity = {
            ...event,
            activityname: activity?.activityname || 'Unknown Activity',
            location: event.meetupPoint || activity?.location || 'Location not set'
          } as FeedEvent;
          
          items.push({
            id: `suggested-event-${event.$id}`,
            type: 'event',
            timestamp: event.createdAt,
            data: eventWithActivity
          });
        });
      }
    } else if (activeTab === 'nearby') {
      // Show all public activities and events (simplified - you can add location filtering later)
      if (contentFilter === 'all' || contentFilter === 'activities') {
        publicActivities.forEach(activity => {
          items.push({
            id: `nearby-activity-${activity.$id}`,
            type: 'activity',
            timestamp: activity.createdAt,
            data: activity as FeedActivity
          });
        });
      }

      if (contentFilter === 'all' || contentFilter === 'events') {
        publicEvents.forEach(event => {
          const activity = publicActivities.find(a => a.$id === event.activityId);
          const eventWithActivity = {
            ...event,
            activityname: activity?.activityname || 'Unknown Activity',
            location: event.meetupPoint || activity?.location || 'Location not set'
          } as FeedEvent;
          
          items.push({
            id: `nearby-event-${event.$id}`,
            type: 'event',
            timestamp: event.createdAt,
            data: eventWithActivity
          });
        });
      }
    }

    // Sort by timestamp (newest first)
    items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    setFeedItems(items);
  };

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

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
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
        const userDisciplines = user?.disciplines || [];
        return publicActivities.filter(a => 
          a.userId !== user?.$id && 
          a.types && a.types.some(type => userDisciplines.includes(type))
        ).length;
      case 'nearby':
        return publicActivities.length + publicEvents.length;
      default:
        return 0;
    }
  };

  const loading = activitiesLoading || eventsLoading;

  if (!user) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-gray-600 mb-4">Please log in to view your feed</p>
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
                  Stay updated with your adventure community
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
              {(['involved', 'suggested', 'nearby'] as const).map((tab) => (
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
                {(['all', 'activities', 'events'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setContentFilter(filter)}
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

              <div className="flex space-x-2">
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg ${
                    viewMode === 'list'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-200 dark:bg-slate-600 text-gray-700 dark:text-slate-300'
                  }`}
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg ${
                    viewMode === 'grid'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-200 dark:bg-slate-600 text-gray-700 dark:text-slate-300'
                  }`}
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

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
                No {contentFilter === 'all' ? 'content' : contentFilter} found
              </h3>
              <p className="text-gray-600 dark:text-slate-400 mb-6">
                {activeTab === 'involved'
                  ? "You haven't created any activities or joined any events yet. Start building your adventure community!"
                  : activeTab === 'suggested'
                  ? "No suggestions available right now. Try updating your profile interests or exploring activities."
                  : "No nearby activities found. Try expanding your search radius."}
              </p>
              <div className="flex justify-center space-x-4">
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
              </div>
            </div>
          ) : (
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
              {feedItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden hover:shadow-md transition-shadow"
                >
                  {item.type === 'activity' ? (
                    <ActivityFeedCard activity={item.data as FeedActivity} />
                  ) : (
                    <EventFeedCard event={item.data as FeedEvent} />
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

// Activity Feed Card Component
const ActivityFeedCard: React.FC<{ activity: FeedActivity }> = ({ activity }) => {
  const router = useRouter();

  return (
    <div 
      className="p-6 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
      onClick={() => router.push(`/activities/${activity.$id}`)}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
            {activity.activityname}
          </h3>
          <p className="text-sm text-gray-600 dark:text-slate-400 flex items-center">
            <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {activity.location}
          </p>
        </div>
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getDifficultyColor(activity.difficulty)}`}>
          {activity.difficulty}
        </span>
      </div>

      <p className="text-gray-700 dark:text-slate-300 text-sm mb-4 line-clamp-2">
        {activity.description}
      </p>

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
            {activity.eventCount} events
          </span>
          <span className="flex items-center">
            <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
            {activity.participantCount} participants
          </span>
        </div>
        <span className="text-xs">
          {formatDate(activity.createdAt)}
        </span>
      </div>
    </div>
  );
};

// Event Feed Card Component
const EventFeedCard: React.FC<{ event: FeedEvent }> = ({ event }) => {
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
          </p>
        </div>
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getDifficultyColor(event.difficulty)}`}>
          {event.difficulty}
        </span>
      </div>

      <p className="text-gray-700 dark:text-slate-300 text-sm mb-4 line-clamp-2">
        {event.description}
      </p>

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
          Created {formatDate(event.createdAt)}
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