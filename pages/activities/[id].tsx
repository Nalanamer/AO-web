// pages/activities/[id].tsx - Complete Activity Detail Page with Enhanced Details
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import MainLayout from '../../components/layout/MainLayout';
import { useAuth } from '../../contexts/AuthContext';
import { databases, DATABASE_ID, ACTIVITIES_COLLECTION_ID, EVENTS_COLLECTION_ID, COMMENTS_COLLECTION_ID, Query, ID } from '../../lib/appwrite';
import ActivityDetailMap from '../../components/maps/ActivityDetailMap';
import { TrashIcon } from '@heroicons/react/24/outline';

// Add community updates collection ID
const COMMUNITY_UPDATES_COLLECTION_ID = '687b200d001560118a1c';


// Complete interfaces matching mobile app
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
  createdBy: string;
  rating: number;
  reviewCount: number;
  eventCount: number;
  participantCount: number;
  inclusive?: string[];
  externalUrls?: string[];
  typeSpecificData?: any;
  createdAt: string;
  updatedAt?: string;
}

interface Event {
  $id: string;
  eventName: string;
  activityId: string;
  date: string;
  meetupPoint: string;
  description: string;
  maxParticipants: number;
  participants: string[];
  organizerId: string;
  difficulty: string;
  requirements?: string[];
  equipment?: string[];
  tags?: string[];
}

interface Comment {
  $id: string;
  content: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  itemId: string;
  itemType: 'activity' | 'event';
  parentId?: string;
  createdAt: string;
  likes: number;
  likedBy: string[];
  replies?: Comment[];
}

interface CommunityUpdate {
  $id: string;
  content: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  activityId: string;
  createdAt: string;
  likes: number;
  likedBy: string[];
  thumbsUp?: string[];
}



// Automatic field detection - no configuration needed!
const getFieldDisplayInfo = (fieldKey: string, value: any) => {
  // Auto-detect field types and create nice labels
  const label = fieldKey
    .replace(/([A-Z])/g, ' $1') // camelCase to spaces
    .replace(/^./, str => str.toUpperCase()); // capitalize first letter
  
  // Auto-detect suffix based on field name
  let suffix = '';
  if (fieldKey.toLowerCase().includes('distance')) suffix = 'km';
  else if (fieldKey.toLowerCase().includes('elevation') || fieldKey.toLowerCase().includes('approach')) suffix = 'm';
  else if (fieldKey.toLowerCase().includes('temp')) suffix = '°C';
  else if (fieldKey.toLowerCase().includes('pitch') && typeof value === 'number') suffix = 'pitches';
  else if (fieldKey.toLowerCase().includes('speed')) suffix = 'km/h';
  else if (fieldKey.toLowerCase().includes('pace')) suffix = 'min/km';
  else if (fieldKey.toLowerCase().includes('time') && typeof value === 'number') suffix = 'minutes';
  
  return { label, suffix };
};

const formatAutoValue = (value: any, suffix: string) => {
  if (value === null || value === undefined) return '-';
  
  if (Array.isArray(value)) {
    return value.join(', ');
  }
  
  if (suffix) {
    return `${value} ${suffix}`;
  }
  
  return String(value);
};




// Helper functions
const mapDocumentToActivity = (doc: any): Activity => ({
  $id: doc.$id,
  activityname: doc.activityname || '',
  location: doc.location || '',
  description: doc.description || '',
  types: Array.isArray(doc.types) ? doc.types : [],
  subTypes: Array.isArray(doc.subTypes) ? doc.subTypes : [],
  difficulty: doc.difficulty || 'beginner',
  isPrivate: doc.isPrivate || false,
  userId: doc.userId || '',
  createdBy: doc.createdBy || doc.userId || '',
  rating: doc.rating || 0,
  reviewCount: doc.reviewCount || 0,
  eventCount: doc.eventCount || 0,
  participantCount: doc.participantCount || 0,
  inclusive: Array.isArray(doc.inclusive) ? doc.inclusive : [],
  externalUrls: Array.isArray(doc.externalUrls) ? doc.externalUrls : [],
  typeSpecificData: doc.typeSpecificData || null,
  createdAt: doc.createdAt || doc.$createdAt || '',
  updatedAt: doc.updatedAt || doc.$updatedAt
});

const mapDocumentToEvent = (doc: any): Event => ({
  $id: doc.$id,
  eventName: doc.eventName || '',
  activityId: doc.activityId || '',
  date: doc.date || '',
  meetupPoint: doc.meetupPoint || '',
  description: doc.description || '',
  maxParticipants: doc.maxParticipants || 10,
  participants: Array.isArray(doc.participants) ? doc.participants : [],
  organizerId: doc.organizerId || '',
  difficulty: doc.difficulty || '',
  requirements: Array.isArray(doc.requirements) ? doc.requirements : [],
  equipment: Array.isArray(doc.equipment) ? doc.equipment : [],
  tags: Array.isArray(doc.tags) ? doc.tags : []
});

const mapDocumentToComment = (doc: any): Comment => ({
  $id: doc.$id,
  content: doc.content || '',
  userId: doc.userId || '',
  userName: doc.userName || 'Anonymous User',
  userAvatar: doc.userAvatar,
  itemId: doc.itemId || '',
  itemType: doc.itemType || 'activity',
  parentId: doc.parentId,
  createdAt: doc.createdAt || doc.$createdAt || '',
  likes: doc.likes || 0,
  likedBy: Array.isArray(doc.likedBy) ? doc.likedBy : [],
  replies: []
});

// Parse typeSpecificData safely
const parseTypeSpecificData = (data: any) => {
  if (!data) return {};
  
  if (typeof data === 'string') {
    try {
      return JSON.parse(data);
    } catch {
      return {};
    }
  }
  
  return typeof data === 'object' ? data : {};
};

// Format field value based on configuration
const formatFieldValue = (value: any, config: any) => {
  if (value === null || value === undefined) return '-';
  
  if (config.type === 'array' && Array.isArray(value)) {
    return value.join(', ');
  }
  
  if (config.type === 'number' && config.suffix) {
    return `${value} ${config.suffix}`;
  }
  
  return String(value);
};

// Generate user avatar initials
const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};


// Sort community updates function
const sortCommunityUpdates = (updates: CommunityUpdate[], sortBy: string) => {
  const sorted = [...updates];
  
  switch (sortBy) {
    case 'oldest':
      return sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    case 'newest':
      return sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    case 'most_liked':
      return sorted.sort((a, b) => b.likes - a.likes);
    default:
      return sorted;
  }
};

// Icons
const icons = {
  Calendar: ({ className = "h-5 w-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  MapPin: ({ className = "h-5 w-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  Users: ({ className = "h-5 w-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
    </svg>
  ),
  Heart: ({ className = "h-5 w-5", filled = false }) => (
    <svg className={className} fill={filled ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  ),
  Plus: ({ className = "h-5 w-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  ),
  ChevronDown: ({ className = "h-5 w-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  ),
  Reply: ({ className = "h-4 w-4" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
    </svg>
  )
};

export default function ActivityDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  
  const [activity, setActivity] = useState<Activity | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
const [communityUpdates, setCommunityUpdates] = useState<CommunityUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'events' | 'comments' | 'reviews'>('details');
  const [communityExpanded, setCommunityExpanded] = useState(false);
  const [newComment, setNewComment] = useState(''); // For community updates
const [newCommentText, setNewCommentText] = useState(''); // For comments tab
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [updatesSortBy, setUpdatesSortBy] = useState<'newest' | 'oldest' | 'most_liked'>('newest');

  // Fetch activity data
  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch activity
        const activityDoc = await databases.getDocument(
          DATABASE_ID,
          ACTIVITIES_COLLECTION_ID,
          id as string
        );
        
        setActivity(mapDocumentToActivity(activityDoc));

        // Fetch related events
        const eventsResponse = await databases.listDocuments(
          DATABASE_ID,
          EVENTS_COLLECTION_ID,
          [
            Query.equal('activityId', id as string),
            Query.orderDesc('$createdAt'),
            Query.limit(10)
          ]
        );
        
        setEvents(eventsResponse.documents.map(mapDocumentToEvent));

        // Fetch comments
        const commentsResponse = await databases.listDocuments(
          DATABASE_ID,
          COMMENTS_COLLECTION_ID,
          [
            Query.equal('itemId', id as string),
            Query.equal('itemType', 'activity'),
            Query.orderDesc('$createdAt'),
            Query.limit(50)
          ]
        );

        // Fetch community updates (separate from comments)
const communityResponse = await databases.listDocuments(
  DATABASE_ID,
  COMMUNITY_UPDATES_COLLECTION_ID,
  [
    Query.equal('activityId', id as string),  // Use activityId, not itemId
    Query.orderAsc('$createdAt'),
    Query.limit(50)
  ]
);


const mappedUpdates: CommunityUpdate[] = communityResponse.documents.map(doc => ({
  $id: doc.$id,
  content: doc.content || '',
  userId: doc.userId || '',
  userName: doc.userName || 'Anonymous User',
  userAvatar: doc.userAvatar,
  activityId: doc.activityId || '',
  createdAt: doc.createdAt || doc.$createdAt || '',
  likes: (doc.thumbsUp || []).length,
  likedBy: Array.isArray(doc.thumbsUp) ? doc.thumbsUp : [],
  thumbsUp: Array.isArray(doc.thumbsUp) ? doc.thumbsUp : []
}));

setCommunityUpdates(mappedUpdates);
        
        const mappedComments = commentsResponse.documents.map(mapDocumentToComment);
        
        // Build comment tree
        const commentMap = new Map();
        mappedComments.forEach(comment => {
          commentMap.set(comment.$id, { ...comment, replies: [] });
        });
        
        const rootComments: Comment[] = [];
        mappedComments.forEach(comment => {
          if (comment.parentId && commentMap.has(comment.parentId)) {
            commentMap.get(comment.parentId).replies.push(commentMap.get(comment.$id));
          } else {
            rootComments.push(commentMap.get(comment.$id));
          }
        });
        
        setComments(rootComments);

      } catch (err) {
        console.error('Error fetching activity data:', err);
        setError('Failed to load activity data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

 


  // Comment component
  const CommentItem = ({ comment, depth = 0 }: { comment: Comment; depth?: number }) => {
    const [showReplyForm, setShowReplyForm] = useState(false);
    const [liked, setLiked] = useState(comment.likedBy.includes(user?.$id || ''));

    const handleLike = async () => {
  if (!user) return;
  
  try {
    // Detect if this is a community update or regular comment
    const isUpdate = comment.itemType === 'activity' && !comment.parentId;
    const collectionId = isUpdate ? COMMUNITY_UPDATES_COLLECTION_ID : COMMENTS_COLLECTION_ID;
    
    if (isUpdate) {
      // For community updates, use thumbsUp array
      const currentThumbsUp = comment.likedBy || [];
      const newThumbsUp = liked 
        ? currentThumbsUp.filter(id => id !== user.$id)
        : [...currentThumbsUp, user.$id];
      
      await databases.updateDocument(
        DATABASE_ID,
        collectionId,
        comment.$id,
        {
          thumbsUp: newThumbsUp
        }
      );
      
      // Update local state
      comment.likes = newThumbsUp.length;
      comment.likedBy = newThumbsUp;
    } else {
      // For regular comments, use likes/likedBy
      const newLikedBy = liked 
        ? comment.likedBy.filter(id => id !== user.$id)
        : [...comment.likedBy, user.$id];
      
      await databases.updateDocument(
        DATABASE_ID,
        collectionId,
        comment.$id,
        {
          likes: newLikedBy.length,
          likedBy: newLikedBy
          }
        );
        
        comment.likes = newLikedBy.length;
        comment.likedBy = newLikedBy;
      }
      
      setLiked(!liked);
    } catch (err) {
      console.error('Error liking item:', err);
    }
  };

    const handleReply = async (content: string) => {
      if (!user || !content.trim()) return;
      
      try {
        const newReply = await databases.createDocument(
          DATABASE_ID,
          COMMENTS_COLLECTION_ID,
          ID.unique(),
          {
            content: content.trim(),
            userId: user.$id,
            userName: user.name || user.email || 'Anonymous',
            itemId: activity?.$id,
            itemType: 'activity',
            createdAt: new Date().toISOString(),
            parentId: comment.$id,
            likes: 0,
            likedBy: []
          }
        );
        
        const mappedReply = mapDocumentToComment(newReply);
        comment.replies = [...(comment.replies || []), mappedReply];
        setShowReplyForm(false);
      } catch (err) {
        console.error('Error posting reply:', err);
      }
    };

    return (
      <div className={`${depth > 0 ? 'ml-8 border-l-2 border-gray-100 pl-4' : ''}`}>
        <div className="flex gap-3 mb-3">
          <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
            {getInitials(comment.userName)}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-gray-900">{comment.userName}</span>
              <span className="text-sm text-gray-500">
                {new Date(comment.createdAt).toLocaleDateString()}
              </span>
            </div>
            <p className="text-gray-700 mb-2">{comment.content}</p>
            <div className="flex items-center gap-4">
              <button
                onClick={handleLike}
                className={`flex items-center gap-1 text-sm ${
                  liked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
                }`}
              >
                <icons.Heart className="h-4 w-4" filled={liked} />
                {comment.likes}
              </button>
              {user && (
                <button
                  onClick={() => setShowReplyForm(!showReplyForm)}
                  className="flex items-center gap-1 text-sm text-gray-500 hover:text-emerald-600"
                >
                  <icons.Reply />
                  Reply
                </button>
              )}
            </div>
            
            {showReplyForm && (
              <div className="mt-3">
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Write a reply..."
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                  rows={3}
                />
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => handleReply(replyContent)}
                    className="px-3 py-1 bg-emerald-600 text-white text-sm rounded-md hover:bg-emerald-700"
                  >
                    Reply
                  </button>
                  <button
                    onClick={() => {
                      setShowReplyForm(false);
                      setReplyContent('');
                    }}
                    className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {comment.replies?.map(reply => (
          <CommentItem key={reply.$id} comment={reply} depth={depth + 1} />
        ))}
      </div>
    );
  };

  
  const deleteActivity = async (activityId: string): Promise<void> => {
  try {
    console.log('🗑️ Deleting activity:', activityId);
    
    await databases.deleteDocument(
      DATABASE_ID,
      ACTIVITIES_COLLECTION_ID,
      activityId
    );

    console.log('✅ Activity deleted successfully');
    
  } catch (err) {
    console.error('❌ Error deleting activity:', err);
    throw new Error('Failed to delete activity');
  }
};

const isActivityCreator = (): boolean => {
  if (!user || !activity) return false;
  
  // Check both userId and createdBy fields for compatibility
  return activity.createdBy === user.$id || 
         (activity as any).createdBy === user.$id;
};

const handleDeleteActivity = async (): Promise<void> => {
  // Early return if no activity or user is not creator
  if (!activity || !isActivityCreator()) {
    alert('You can only delete activities you created.');
    return;
  }

  const confirmed = window.confirm(
    `Are you sure you want to delete "${activity.activityname}"? This action cannot be undone.`
  );

  if (!confirmed) return;

  try {
    await deleteActivity(activity.$id);
    alert('Activity deleted successfully');
    router.push('/activities'); // Redirect to activities list
  } catch (error) {
    console.error('Failed to delete activity:', error);
    alert('Failed to delete activity. Please try again.');
  }
};


  // Handle community update submission
const handleCommunityUpdateSubmit = async () => {
  if (!user || !newComment.trim()) return;
  
  try {
    const update = await databases.createDocument(
      DATABASE_ID,
      COMMUNITY_UPDATES_COLLECTION_ID,
      ID.unique(),
      {
        content: newComment.trim(),
        userId: user.$id,
        userName: user.name || user.email || 'Anonymous',
        userEmail: user.email || '',
        activityId: activity?.$id,  // Use activityId, not itemId
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        thumbsUp: []  // Empty array for new updates
      }
    );
    
    const mappedUpdate: CommunityUpdate = {
  $id: update.$id,
  content: update.content,
  userId: update.userId,
  userName: update.userName,
  activityId: update.activityId,
  createdAt: update.createdAt,
  likes: 0,
  likedBy: [],
  thumbsUp: []
};
    
    setCommunityUpdates(prev => [...prev, mappedUpdate]);
    setNewComment('');
  } catch (err) {
    console.error('Error posting community update:', err);
  }
};

// Handle regular comment submission (for Comments tab)
const handleRegularCommentSubmit = async () => {
  if (!user || !newCommentText.trim()) return;
  
  try {
    const comment = await databases.createDocument(
      DATABASE_ID,
      COMMENTS_COLLECTION_ID,
      ID.unique(),
      {
        // Required fields from schema
        itemId: activity?.$id,
        itemType: 'activity', 
        content: newCommentText.trim(),
        userId: user.$id,
        userName: user.name || user.email || 'Anonymous',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        
        // Optional fields
        userAvatar: null,
        parentId: null // null for top-level comments
      }
    );
    
    const mappedComment = mapDocumentToComment(comment);
    setComments(prev => [mappedComment, ...prev]);
    setNewCommentText(''); // Clear the comment text field
  } catch (err) {
    console.error('Error posting comment:', err);
  }
};


  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading activity details...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error || !activity) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error || 'Activity not found'}</p>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
            >
              Go Back
            </button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between py-4">
              <button
                onClick={() => router.back()}
                className="text-gray-600 hover:text-gray-900"
              >
                ← Back
              </button>
              <div className="text-lg font-semibold text-gray-900">
                {activity.activityname}
              </div>
              <div className="text-sm">
  {activity.createdBy === user?.$id ? (
    <span className="text-orange-500"> Your Activity</span>
  ) : (
    <span className="text-gray-500">👥 Community Activity</span>
  )}
</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white border-b">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex space-x-8">
              {[
                { key: 'details', label: 'Details' },
                { key: 'events', label: `Events (${events.length})` },
                { key: 'comments', label: 'Comments' },
                { key: 'reviews', label: 'Reviews' }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.key
                      ? 'border-emerald-500 text-emerald-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {activeTab === 'details' && (
            <div className="space-y-6">
              <ActivityDetailMap 
  activity={activity}
  className="mb-6"
  height="300px"
/>


              {/* Activity Info */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{activity.activityname}</h1>
{activity.createdBy === user?.$id ? (
  <p className="text-orange-500 text-sm mb-4"> Your Activity</p>
) : (
  <p className="text-gray-500 text-sm mb-4">👥 Community Activity</p>
)}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <icons.MapPin className="h-5 w-5 text-gray-500" />
                    <span className="text-gray-700">
                      {typeof activity.location === 'string' ? activity.location : activity.location.address}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-emerald-100 rounded flex items-center justify-center">
                      <span className="text-emerald-600 text-xs">🏃</span>
                    </div>
                    <div className="flex gap-2">
                      {activity.types.map(type => (
                        <span key={type} className="px-2 py-1 bg-emerald-100 text-emerald-700 text-sm rounded">
                          {type}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {activity.description && (
                  <div className="mt-6">
                    <p className="text-gray-700">{activity.description}</p>
                  </div>
                )}
              </div>


                {/* Enhanced Details - Automatic */}
                {activity?.subTypes?.length && activity.typeSpecificData && (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">Enhanced Details</h3>
                    </div>
                    
                    {(() => {
                      const typeSpecificData = parseTypeSpecificData(activity.typeSpecificData);
                      
                      return activity.subTypes.map(subTypeKey => {
                        const [activityType, subType] = subTypeKey.split('.');
                        const data = typeSpecificData[subTypeKey] || {};
                        
                        // Skip if no data
                        if (!data || Object.keys(data).length === 0) return null;
                        
                        return (
                          <div key={subTypeKey} className="mb-6 last:mb-0">
                            <div className="text-sm text-emerald-600 font-medium mb-3 capitalize">
                              {activityType}.{subType}
                            </div>
                            
                            <div className="space-y-1">
                              {Object.entries(data).map(([fieldKey, value]) => {
                                if (value === null || value === undefined) return null;
                                
                                const { label, suffix } = getFieldDisplayInfo(fieldKey, value);
                                
                                return (
                                  <div key={fieldKey} className="flex justify-between py-2 border-b border-gray-100 last:border-0">
                                    <span className="text-gray-600">{label}:</span>
                                    <span className="font-medium text-gray-900">
                                      {formatAutoValue(value, suffix)}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                )}
            

              {/* Activity Status */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-blue-100 rounded flex items-center justify-center">
                      <span className="text-blue-600 text-xs">🌍</span>
                    </div>
                    <span className="text-gray-700">Public Activity</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-green-100 rounded flex items-center justify-center">
                      <span className="text-green-600 text-xs">👤</span>
                    </div>
                    <span className="text-gray-700">Created by You</span>
                  </div>
                </div>
              </div>

              {/* Community Updates */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <button
                  onClick={() => setCommunityExpanded(!communityExpanded)}
                  className="w-full flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <icons.Users className="h-5 w-5 text-emerald-600" />
                    <span className="font-semibold text-gray-900">Community Updates</span>
                    {comments.length > 0 && (
                      <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-1 rounded-full">
                        {communityUpdates.length}


                      </span>
                    )}
                  </div>
                  <icons.ChevronDown className={`h-5 w-5 text-gray-500 transform transition-transform ${communityExpanded ? 'rotate-180' : ''}`} />
                </button>

                {communityExpanded && (
                  <div className="mt-6">
                    <div className="flex justify-between items-center mb-4">
  <div className="text-sm text-gray-600">
    Share an update with the community
  </div>
  
  <div className="flex gap-2">
    <span className="text-sm text-gray-500">Sort by:</span>
    <button
      onClick={() => setUpdatesSortBy('newest')}
      className={`text-sm px-2 py-1 rounded ${updatesSortBy === 'newest' ? 'bg-emerald-100 text-emerald-700' : 'text-gray-500 hover:text-gray-700'}`}
    >
      Newest
    </button>
    <button
      onClick={() => setUpdatesSortBy('oldest')}
      className={`text-sm px-2 py-1 rounded ${updatesSortBy === 'oldest' ? 'bg-emerald-100 text-emerald-700' : 'text-gray-500 hover:text-gray-700'}`}
    >
      Oldest
    </button>
    <button
      onClick={() => setUpdatesSortBy('most_liked')}
      className={`text-sm px-2 py-1 rounded ${updatesSortBy === 'most_liked' ? 'bg-emerald-100 text-emerald-700' : 'text-gray-500 hover:text-gray-700'}`}
    >
      Most Liked
    </button>
  </div>
</div>
                    
                    {user && (
                      <div className="mb-6">
                        <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="What's happening with this activity? Share tips, conditions, or any helpful info..."
                        className="w-full p-3 border border-gray-300 rounded-md text-sm"
                        rows={4}
                      />
                        <div className="flex justify-between items-center mt-3">
                          <span className="text-sm text-gray-500">0/500</span>
                          <button
                            onClick={handleCommunityUpdateSubmit}
                            className="px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-900"
                          >
                            Post Update
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="space-y-4">
                                    {sortCommunityUpdates(communityUpdates, updatesSortBy).map(update => (
                  <CommentItem key={update.$id} comment={{
                    $id: update.$id,
                    content: update.content,
                    userId: update.userId,
                    userName: update.userName,
                    userAvatar: update.userAvatar,
                    itemId: update.activityId,
                    itemType: 'activity' as const,
                    parentId: undefined,
                    createdAt: update.createdAt,
                    likes: update.likes,
                    likedBy: update.likedBy,
                    replies: []
                  }} />
                ))}

{communityUpdates.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          No community updates yet. Be the first to share!
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={() => router.push(`/activities/${activity.$id}/edit`)}
                    className="flex items-center justify-center gap-2 bg-emerald-600 text-white py-3 px-6 rounded-md hover:bg-emerald-700 transition-colors"
                  >
                    ✏️ Edit Activity
                  </button>
                  <button
                    onClick={() => router.push(`/events/create?activityId=${activity.$id}`)}
                    className="flex items-center justify-center gap-2 bg-green-500 text-white py-3 px-6 rounded-md hover:bg-green-600 transition-colors"
                  >
                    📅 Create Event
                  </button>
                  {isActivityCreator() && (
                    <button
                      onClick={handleDeleteActivity}
                      className="flex items-center justify-center gap-2 bg-red-600 text-white py-3 px-6 rounded-md hover:bg-red-700 transition-colors"
                    >
                      <TrashIcon className="h-5 w-5" />
                      Delete Activity
                    </button>
                  )}

                </div>
              </div>
            </div>
          )}

          {activeTab === 'events' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">Events for this Activity</h2>
                <button
                  onClick={() => router.push(`/events/create?activityId=${activity.$id}`)}
                  className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700"
                >
                  <icons.Plus className="h-4 w-4" />
                  Create Event
                </button>
              </div>

              

              {events.length > 0 ? (
                <div className="space-y-4">
                  {events.map(event => (
                    <div
                      key={event.$id}
                      className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => router.push(`/events/${event.$id}`)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">{event.eventName}</h3>
                          <div className="space-y-2 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <icons.Calendar className="h-4 w-4" />
                              {new Date(event.date).toLocaleDateString()}
                            </div>
                            <div className="flex items-center gap-2">
                              <icons.MapPin className="h-4 w-4" />
                              {event.meetupPoint}
                            </div>
                            <div className="flex items-center gap-2">
                              <icons.Users className="h-4 w-4" />
                              {event.participants.length}/{event.maxParticipants} participants
                            </div>
                          </div>
                        </div>
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full">
                          {event.difficulty}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <icons.Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No events yet</h3>
                  <p className="text-gray-600 mb-4">Create the first event for this activity!</p>
                  <button
                    onClick={() => router.push(`/events/create?activityId=${activity.$id}`)}
                    className="bg-emerald-600 text-white px-6 py-2 rounded-md hover:bg-emerald-700"
                  >
                    Create Event
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'comments' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Comments</h2>
              
              {user && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <textarea
  value={newCommentText}
  onChange={(e) => setNewCommentText(e.target.value)}
  placeholder="Share your thoughts about this activity..."
  className="w-full p-3 border border-gray-300 rounded-md text-sm"
  rows={4}
/>
                  <div className="flex justify-end mt-3">
                   <button
                  onClick={handleRegularCommentSubmit}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
                >
                  Post Comment
                </button>
                  </div>
                </div>
              )}

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                {comments.length > 0 ? (
                  <div className="space-y-6">
                    {comments.map(comment => (
                      <CommentItem key={comment.$id} comment={comment} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No comments yet. Be the first to share your thoughts!
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">⭐</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Reviews Coming Soon</h3>
              <p className="text-gray-600">Activity reviews will be available in a future update.</p>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}