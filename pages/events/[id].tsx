// pages/events/[id].tsx - Event Detail Page (Mobile App Structure)
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import MainLayout from '../../components/layout/MainLayout';
import { useAuth } from '../../contexts/AuthContext';
import { databases, DATABASE_ID, EVENTS_COLLECTION_ID, ACTIVITIES_COLLECTION_ID, COMMENTS_COLLECTION_ID, Query, ID } from '../../lib/appwrite';
import EventDetailMap from '../../components/maps/EventDetailMap';
import { useFeatureAccess } from '../../hooks/useFeatureAccess';


// Mobile App Matching Options
const INCLUSIVE_OPTIONS = [
  { id: 'all_women', label: 'All Women', emoji: '👩', description: 'This event welcomes and focuses on women participants' },
  { id: 'lgbtiq', label: 'LGBTIQ+', emoji: '🏳️‍🌈', description: 'This event welcomes and focuses on LGBTIQ+ participants' },
  { id: 'physically_inclusive', label: 'Physically Inclusive', emoji: '♿', description: 'This event is accessible to people with physical disabilities' }
];

const DIFFICULTY_OPTIONS = [
  { id: 'skill_agnostic', label: 'Skill Agnostic', emoji: '🎲', description: 'No specific skill level required - suitable for everyone' },
  { id: 'easy', label: 'Easy', emoji: '🟢', description: 'Easy difficulty for beginners' },
  { id: 'medium', label: 'Medium', emoji: '🟡', description: 'Moderate difficulty requiring some experience or fitness' },
  { id: 'difficult', label: 'Difficult', emoji: '🔴', description: 'High difficulty requiring significant experience or fitness' }
];

// Interfaces
interface Event {
  $id: string;
  eventName: string;
  title: string;
  activityId: string;
  activityName?: string;
  date: string;
  meetupTime: string;
  meetupPoint: string;
  location: string;
  description: string;
  maxParticipants: number;
  participants: string[];
  organizerId: string;
  difficulty: string;
  inclusive: string[];
  isPublic: boolean;
  endDate?: string;
  endTime?: string;
  latitude?: number;
  longitude?: number;
  createdAt: string;
  updatedAt?: string;
}

interface Activity {
  $id: string;
  activityname: string;
  location: string;
  description: string;
  types: string[];
  difficulty: string;
  userId: string;
  latitude?: number;
  longitude?: number;
}

interface Comment {
  $id: string;
  content: string;
  userId: string;
  userName: string;
  itemId: string;
  itemType: string;
  createdAt: string;
}

// Icons
const CalendarIcon: React.FC<{ className?: string }> = ({ className = "h-5 w-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const ClockIcon: React.FC<{ className?: string }> = ({ className = "h-5 w-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const MapPinIcon: React.FC<{ className?: string }> = ({ className = "h-5 w-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const UsersIcon: React.FC<{ className?: string }> = ({ className = "h-5 w-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
  </svg>
);

const ArrowLeftIcon: React.FC<{ className?: string }> = ({ className = "h-5 w-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

const EditIcon: React.FC<{ className?: string }> = ({ className = "h-5 w-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const TrashIcon: React.FC<{ className?: string }> = ({ className = "h-5 w-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

// Helper functions
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const formatTime = (timeString: string) => {
  return timeString;
};

const calculateDuration = (startDate: string, startTime: string, endDate?: string, endTime?: string): string | null => {
  if (!endDate || !endTime) return null;

  try {
    const start = new Date(`${startDate}T${startTime}:00`);
    const end = new Date(`${endDate}T${endTime}:00`);
    
    const diffMs = end.getTime() - start.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m`;
    } else {
      return `${diffMinutes}m`;
    }
  } catch (error) {
    return null;
  }
};

// Map Component
const EventLocationMap: React.FC<{
  latitude: number;
  longitude: number;
  title: string;
}> = ({ latitude, longitude, title }) => {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
          <MapPinIcon className="h-5 w-5" />
          <span>Event Location</span>
        </h3>
        <button
          onClick={() => {
            const url = `https://www.google.com/maps?q=${latitude},${longitude}`;
            window.open(url, '_blank');
          }}
          className="px-3 py-1 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm"
        >
          🧭 Directions
        </button>
      </div>
      
      <div className="h-64 bg-gray-100 dark:bg-slate-700 rounded-lg flex items-center justify-center">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <MapPinIcon className="h-12 w-12 mx-auto mb-2" />
          <p className="font-medium">{title}</p>
          <p className="text-sm">📍 {latitude.toFixed(6)}, {longitude.toFixed(6)}</p>
          <p className="text-xs mt-2">(Interactive map would be displayed here)</p>
        </div>
      </div>
    </div>
  );
};

// Comments Component
const CommentsSection: React.FC<{
  eventId: string;
  comments: Comment[];
  onAddComment: (content: string) => void;
  currentUser?: any;
}> = ({ eventId, comments, onAddComment, currentUser }) => {
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || submitting) return;

    setSubmitting(true);
    try {
      await onAddComment(newComment.trim());
      setNewComment('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Comments ({comments.length})
      </h3>

      {/* Add Comment Form */}
      {currentUser && (
        <form onSubmit={handleSubmit} className="mb-6">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Share your thoughts about this event..."
            className="w-full p-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white resize-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            rows={3}
          />
          <div className="flex justify-end mt-2">
            <button
              type="submit"
              disabled={!newComment.trim() || submitting}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? 'Posting...' : 'Post Comment'}
            </button>
          </div>
        </form>
      )}

      {/* Comments List */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p>No comments yet.</p>
            {currentUser && <p className="text-sm">Be the first to share your thoughts!</p>}
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.$id} className="border-b border-gray-200 dark:border-slate-600 pb-4 last:border-b-0">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900 rounded-full flex items-center justify-center">
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium text-sm">
                    {comment.userName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-medium text-gray-900 dark:text-white text-sm">
                      {comment.userName}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(comment.createdAt)}
                    </span>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 text-sm">
                    {comment.content}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// Main Component
export default function EventDetail() {
  const router = useRouter();
  const { id: eventId } = router.query;
  const { user } = useAuth();
  const { canUseFeature, trackFeatureUsage, getUpgradeMessage } = useFeatureAccess();

  // State
  const [event, setEvent] = useState<Event | null>(null);
  const [activity, setActivity] = useState<Activity | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'comments'>('details');

  // Helper function to safely convert Appwrite document
  const mapDocumentToEvent = (doc: any): Event => {
    return {
      $id: doc.$id,
      eventName: doc.eventName || doc.title || '',
      title: doc.title || doc.eventName || '',
      activityId: doc.activityId || '',
      activityName: doc.activityName || '',
      date: doc.date || '',
      meetupTime: doc.meetupTime || '',
      meetupPoint: doc.meetupPoint || '',
      location: doc.location || '',
      description: doc.description || '',
      maxParticipants: doc.maxParticipants || 10,
      participants: Array.isArray(doc.participants) ? doc.participants : [],
      organizerId: doc.organizerId || doc.createdBy || '',
      difficulty: doc.difficulty || '',
      inclusive: Array.isArray(doc.inclusive) ? doc.inclusive : [],
      isPublic: doc.isPublic !== false,
      endDate: doc.endDate,
      endTime: doc.endTime,
      latitude: doc.latitude,
      longitude: doc.longitude,
      createdAt: doc.createdAt || doc.$createdAt || '',
      updatedAt: doc.updatedAt || doc.$updatedAt
    };
  };

  const mapDocumentToActivity = (doc: any): Activity => {
    return {
      $id: doc.$id,
      activityname: doc.activityname || '',
      location: doc.location || '',
      description: doc.description || '',
      types: Array.isArray(doc.types) ? doc.types : [],
      difficulty: doc.difficulty || '',
      userId: doc.userId || '',
      latitude: doc.latitude,
      longitude: doc.longitude
    };
  };

  const mapDocumentToComment = (doc: any): Comment => {
    return {
      $id: doc.$id,
      content: doc.content || '',
      userId: doc.userId || '',
      userName: doc.userName || 'Anonymous User',
      itemId: doc.itemId || '',
      itemType: doc.itemType || '',
      createdAt: doc.createdAt || doc.$createdAt || ''
    };
  };

  // Fetch event data
  const fetchEventData = async () => {
    if (!eventId || typeof eventId !== 'string') return;
    
    try {
      setLoading(true);
      
      // Fetch event
      const eventDoc = await databases.getDocument(
        DATABASE_ID,
        EVENTS_COLLECTION_ID,
        eventId
      );
      
      const eventData = mapDocumentToEvent(eventDoc);
      setEvent(eventData);
      
      // Fetch related activity
      if (eventData.activityId) {
        try {
          const activityDoc = await databases.getDocument(
            DATABASE_ID,
            ACTIVITIES_COLLECTION_ID,
            eventData.activityId
          );
          const activityData = mapDocumentToActivity(activityDoc);
          setActivity(activityData);
          
          // Update event with activity name
          eventData.activityName = activityData.activityname;
          setEvent(eventData);
        } catch (activityError) {
          console.warn('⚠️ Could not fetch activity details');
        }
      }
      
      // Fetch comments
      try {
        const commentsResponse = await databases.listDocuments(
          DATABASE_ID,
          COMMENTS_COLLECTION_ID,
          [
            Query.equal('itemId', eventId),
            Query.equal('itemType', 'event'),
            Query.orderDesc('createdAt')
          ]
        );
        
        const commentsData = commentsResponse.documents.map(mapDocumentToComment);
        setComments(commentsData);
      } catch (commentsError) {
        console.warn('⚠️ Could not fetch comments');
        setComments([]);
      }
      
    } catch (error) {
      console.error('❌ Error fetching event data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle join/leave event
  // Handle join/leave event
const handleJoinLeave = async () => {
  if (!user || !event) return;
  
  const isParticipant = event.participants.includes(user.$id);
  
  // ✅ Check limits BEFORE joining
  if (!isParticipant && !canUseFeature('eventsJoined')) {
    alert(getUpgradeMessage('eventsJoined'));
    return;
  }
  
  setActionLoading(true);
  try {
    let updatedParticipants: string[];
    
    if (isParticipant) {
      updatedParticipants = event.participants.filter(id => id !== user.$id);
    } else {
      updatedParticipants = [...event.participants, user.$id];
    }
    
    await databases.updateDocument(
      DATABASE_ID,
      EVENTS_COLLECTION_ID,
      event.$id,
      {
        participants: updatedParticipants
      }
    );
    
    // ✅ Track usage AFTER successful database update
    if (isParticipant) {
      await trackFeatureUsage('eventsJoined', -1); // Decrease counter when leaving
    } else {
      await trackFeatureUsage('eventsJoined', 1); // Increase counter when joining
    }
    
    // Update local state
    setEvent(prev => prev ? {
      ...prev,
      participants: updatedParticipants
    } : null);
    
    console.log(`✅ ${isParticipant ? 'Left' : 'Joined'} event successfully`);
  } catch (error) {
    console.error('❌ Error updating event participation:', error);
    alert(`Failed to ${isParticipant ? 'leave' : 'join'} event. Please try again.`);
  } finally {
    setActionLoading(false);
  }
};

  // Handle delete event
  const handleDeleteEvent = async () => {
    if (!event || !user || event.organizerId !== user.$id) return;

    const confirmed = confirm('Are you sure you want to delete this event? This action cannot be undone.');
    if (!confirmed) return;

    try {
      await databases.deleteDocument(
        DATABASE_ID,
        EVENTS_COLLECTION_ID,
        event.$id
      );
      
      console.log('✅ Event deleted successfully');
      router.push('/events');
    } catch (error) {
      console.error('❌ Error deleting event:', error);
      alert('Failed to delete event. Please try again.');
    }
  };

  // Handle add comment
  const handleAddComment = async (content: string) => {
    if (!user || !event) return;

    try {
      const commentData = {
        itemId: event.$id,
        itemType: 'event',
        content: content,
        userId: user.$id,
        userName: user.name || 'Anonymous User',
        createdAt: new Date().toISOString()
      };

      const newComment = await databases.createDocument(
        DATABASE_ID,
        COMMENTS_COLLECTION_ID,
        ID.unique(),
        commentData
      );

      // Add to local state
      setComments(prev => [mapDocumentToComment(newComment), ...prev]);
      
      console.log('✅ Comment added successfully');
    } catch (error) {
      console.error('❌ Error adding comment:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchEventData();
  }, [eventId]);

  if (loading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-600"></div>
        </div>
      </MainLayout>
    );
  }

  if (!event) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-screen">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Event Not Found</h1>
          <button
            onClick={() => router.push('/events')}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            Back to Events
          </button>
        </div>
      </MainLayout>
    );
  }

  const isOrganizer = user && event.organizerId === user.$id;
  const isParticipant = user && event.participants.includes(user.$id);
  const isUpcoming = new Date(event.date) > new Date();
  const isFull = event.participants.length >= event.maxParticipants;
  const duration = calculateDuration(event.date, event.meetupTime, event.endDate, event.endTime);

  const getDifficultyInfo = () => {
    const option = DIFFICULTY_OPTIONS.find(d => d.id === event.difficulty);
    return option || { emoji: '⚡', label: event.difficulty || 'Unknown', description: '' };
  };

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Back Navigation */}
        <button
          onClick={() => router.back()}
          className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400 hover:underline"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          <span>Back to Events</span>
        </button>

        {/* Event Header */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-600 p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {event.eventName || event.title}
              </h1>
              
              {/* Date and Time Header */}
              <div className="flex items-center space-x-4 text-gray-600 dark:text-gray-400 mb-4">
                <div className="flex items-center space-x-1">
                  <CalendarIcon className="h-5 w-5 text-red-500" />
                  <span>{formatDate(event.date)} • {formatTime(event.meetupTime)}</span>
                </div>
                {event.endDate && event.endTime && (
                  <div className="flex items-center space-x-1">
                    <span className="text-red-500">🏁</span>
                    <span>Ends: {formatDate(event.endDate)} at {formatTime(event.endTime)}</span>
                  </div>
                )}
              </div>

              {/* Duration */}
              {duration && (
                <div className="flex items-center space-x-1 text-gray-600 dark:text-gray-400 mb-4">
                  <ClockIcon className="h-5 w-5" />
                  <span>Duration: ⏱️ {duration}</span>
                </div>
              )}
            </div>

            {/* Action Buttons for Organizer */}
            {isOrganizer && (
              <div className="flex space-x-2">
                <button
                  onClick={() => router.push(`/events/${event.$id}/edit`)}
                  className="flex items-center space-x-1 px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  <EditIcon className="h-4 w-4" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={handleDeleteEvent}
                  className="flex items-center space-x-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <TrashIcon className="h-4 w-4" />
                  <span>Delete</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-600">
          <div className="border-b border-gray-200 dark:border-slate-600">
            <nav className="-mb-px flex">
              <button
                onClick={() => setActiveTab('details')}
                className={`flex-1 py-3 px-4 text-center font-medium transition-colors ${
                  activeTab === 'details'
                    ? 'bg-emerald-600 text-white'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                Event Details
              </button>
              <button
                onClick={() => setActiveTab('comments')}
                className={`flex-1 py-3 px-4 text-center font-medium transition-colors ${
                  activeTab === 'comments'
                    ? 'bg-emerald-600 text-white'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                Comments
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* Event Details Tab */}
            {activeTab === 'details' && (
              <div className="space-y-6">
                {/* Part of Activity */}
                {activity && (
                  <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                      Part of Activity
                    </h3>
                    <button
                      onClick={() => router.push(`/activities/${activity.$id}`)}
                      className="text-lg font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                    >
                      {activity.activityname}
                    </button>
                    <div className="flex items-center space-x-1 text-gray-600 dark:text-gray-400 mt-1">
                      <MapPinIcon className="h-4 w-4 text-red-500" />
                      <span>{activity.location}</span>
                      {event.latitude && event.longitude && (
                        <span className="text-sm">
                          • {event.latitude.toFixed(6)}, {event.longitude.toFixed(6)}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Event Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Event Name */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                      Event Name
                    </h3>
                    <p className="text-lg text-gray-900 dark:text-white">
                      {event.eventName || event.title}
                    </p>
                  </div>

                  {/* Start Date & Time */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                      Start Date & Time
                    </h3>
                    <p className="text-lg text-gray-900 dark:text-white">
                      {formatDate(event.date)} at {formatTime(event.meetupTime)}
                    </p>
                  </div>

                  {/* End Date & Time */}
                  {event.endDate && event.endTime && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                        End Date & Time
                      </h3>
                      <p className="text-lg text-gray-900 dark:text-white">
                        {formatDate(event.endDate)} at {formatTime(event.endTime)}
                      </p>
                    </div>
                  )}

                  {/* Duration */}
                  {duration && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                        Duration
                      </h3>
                      <p className="text-lg text-gray-900 dark:text-white">
                        ⏱️ {duration}
                      </p>
                    </div>
                  )}

                  {/* Meetup Point */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                      Meetup Point
                    </h3>
                    <p className="text-lg text-gray-900 dark:text-white">
                      {event.meetupPoint}
                      {event.latitude && event.longitude && (
                        <span className="block text-sm text-gray-500 dark:text-gray-400 mt-1">
                          📍 {event.latitude.toFixed(6)}, {event.longitude.toFixed(6)}
                        </span>
                      )}
                    </p>
                  </div>

                  {/* Participants */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                      Participants
                    </h3>
                    <p className="text-lg text-gray-900 dark:text-white">
                      {event.participants.length} participants
                      {event.maxParticipants && (
                        <span className="text-gray-500 dark:text-gray-400">
                          {' '}/ {event.maxParticipants} max
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Event Description */}
                {event.description && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                      Event Description
                    </h3>
                    <p className="text-gray-900 dark:text-white leading-relaxed">
                      {event.description}
                    </p>
                  </div>
                )}

                {/* Inclusive Event */}
                {event.inclusive && event.inclusive.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                      Inclusive Event
                    </h3>
                    <div className="space-y-2">
                      {event.inclusive.map((optionId) => {
                        const option = INCLUSIVE_OPTIONS.find(o => o.id === optionId);
                        return option ? (
                          <div
                            key={optionId}
                            className="inline-flex items-center space-x-2 px-3 py-2 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full mr-2 mb-2"
                          >
                            <span className="text-lg">{option.emoji}</span>
                            <span className="font-medium">{option.label}</span>
                          </div>
                        ) : null;
                      })}
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 italic">
                        {event.inclusive.map(optionId => {
                          const option = INCLUSIVE_OPTIONS.find(o => o.id === optionId);
                          return option?.description;
                        }).filter(Boolean).join(' • ')}
                      </p>
                    </div>
                  </div>
                )}

                {/* Event Difficulty */}
                {event.difficulty && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                      Event Difficulty
                    </h3>
                    <div className="inline-flex items-center space-x-2 px-4 py-2 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded-full">
                      <span className="text-lg">{getDifficultyInfo().emoji}</span>
                      <span className="font-medium">{getDifficultyInfo().label}</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 italic">
                      {getDifficultyInfo().description}
                    </p>
                  </div>
                )}

                {/* Created By */}
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                    Created By
                  </h3>
                  <p className="text-lg text-gray-900 dark:text-white">
                    {isOrganizer ? 'You' : 'Event Organizer'}
                  </p>
                </div>
              </div>
            )}

            {/* Comments Tab */}
            {activeTab === 'comments' && (
              <CommentsSection
                eventId={event.$id}
                comments={comments}
                onAddComment={handleAddComment}
                currentUser={user}
              />
            )}
          </div>
        </div>

       
<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
  <div className="flex items-center justify-between mb-4">
    <h2 className="text-xl font-semibold text-gray-900">Event Location</h2>
    <div className="text-sm text-gray-600">
      📍 {event.meetupPoint || event.location || 'Event Location'}
    </div>
  </div>
  
  <EventDetailMap 
    event={event}
    className="rounded-lg overflow-hidden border border-gray-200"
    height="400px"
  />
  
  {/* Additional location info */}
  {(event.latitude && event.longitude) && (
    <div className="mt-4 text-sm text-gray-500 text-center">
      Coordinates: {event.latitude}, {event.longitude}
    </div>
  )}
</div>
        {/* Participants List */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6">
          <h3 className="flex items-center space-x-2 text-lg font-semibold text-gray-900 dark:text-white mb-4">
            <UsersIcon className="h-5 w-5" />
            <span>Participants ({event.participants.length})</span>
          </h3>

          {event.participants.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <UsersIcon className="h-12 w-12 mx-auto mb-4" />
              <p>No participants yet</p>
              <p className="text-sm">Be the first to join this event!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {event.participants.map((participantId, index) => (
                <div key={participantId} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                  <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900 rounded-full flex items-center justify-center">
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                      {participantId === event.organizerId ? '👑' : `${index + 1}`}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-white">
                      {participantId === user?.$id 
                        ? 'You' 
                        : participantId === event.organizerId 
                          ? 'Event Organizer' 
                          : `Participant ${index + 1}`
                      }
                    </div>
                    {participantId === event.organizerId && (
                      <div className="text-xs text-emerald-600 dark:text-emerald-400">
                        ⭐ Event Organizer
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Join/Leave Event Button */}
        {user && !isOrganizer && isUpcoming && (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6">
            {isParticipant ? (
              <button
                onClick={handleJoinLeave}
                disabled={actionLoading}
                className="w-full py-3 px-6 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-lg hover:bg-red-200 dark:hover:bg-red-800 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading ? 'Leaving...' : 'Leave Event'}
              </button>
            ) : (
              <button
                onClick={handleJoinLeave}
                disabled={actionLoading || isFull}
                className={`w-full py-3 px-6 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  isFull
                    ? 'bg-gray-100 dark:bg-slate-700 text-gray-400 dark:text-gray-500'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
              >
                {actionLoading ? 'Joining...' : isFull ? 'Event Full' : 'Join Event'}
              </button>
            )}
          </div>
        )}

        {/* Login Prompt for Non-Users */}
        {!user && isUpcoming && (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6 text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Sign in to join this event and connect with other participants
            </p>
            <button
              onClick={() => router.push('/auth/login')}
              className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
            >
              Sign In to Join
            </button>
          </div>
        )}

        {/* Past Event Notice */}
        {!isUpcoming && (
          <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-6 text-center">
            <p className="text-gray-600 dark:text-gray-400">
              This event has already taken place
            </p>
          </div>
        )}
      </div>
    </MainLayout>
  );
}