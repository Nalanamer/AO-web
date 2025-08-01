// pages/communities/[id]/create-event.tsx - Complete Implementation

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import MainLayout from '../../../components/layout/MainLayout';
import CommunityService from '@/services/useCommunities';
import { useAuth } from '../../../contexts/AuthContext';
import { databases, DATABASE_ID, ACTIVITIES_COLLECTION_ID, EVENTS_COLLECTION_ID, ID } from '../../../lib/appwrite';
import EventLocationPicker from   '@/components/events/EventLocationPicker';


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

// Add after your imports and constants, before the main CreateCommunityEventPage component

// Inclusive Options Selector
const InclusiveOptionsSelector: React.FC<{
  selectedOptions: string[];
  onChange: (options: string[]) => void;
}> = ({ selectedOptions, onChange }) => {
  const toggleOption = (optionId: string) => {
    if (selectedOptions.includes(optionId)) {
      onChange(selectedOptions.filter(id => id !== optionId));
    } else {
      onChange([...selectedOptions, optionId]);
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
        🤝 Inclusive Event Options
      </label>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Select if your event is specifically designed for certain communities
      </p>
      <div className="space-y-3">
        {INCLUSIVE_OPTIONS.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => toggleOption(option.id)}
            className={`w-full p-4 text-left border rounded-lg transition-all ${
              selectedOptions.includes(option.id)
                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'
                : 'border-gray-200 dark:border-slate-600 hover:border-emerald-300 dark:hover:border-emerald-600 bg-white dark:bg-slate-700'
            }`}
          >
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{option.emoji}</span>
              <div className="flex-1">
                <div className="font-medium text-gray-900 dark:text-white">{option.label}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{option.description}</div>
              </div>
              {selectedOptions.includes(option.id) && (
                <span className="text-emerald-600 dark:text-emerald-400">✓</span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

// Difficulty Selector
const DifficultySelector: React.FC<{
  selectedDifficulty: string;
  onChange: (difficulty: string) => void;
}> = ({ selectedDifficulty, onChange }) => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
        ⚡ Event Difficulty
      </label>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Help participants understand the skill level required
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {DIFFICULTY_OPTIONS.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            className={`p-4 text-left border rounded-lg transition-all ${
              selectedDifficulty === option.id
                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'
                : 'border-gray-200 dark:border-slate-600 hover:border-emerald-300 dark:hover:border-emerald-600 bg-white dark:bg-slate-700'
            }`}
          >
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{option.emoji}</span>
              <div className="flex-1">
                <div className="font-medium text-gray-900 dark:text-white">{option.label}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{option.description}</div>
              </div>
              {selectedDifficulty === option.id && (
                <span className="text-emerald-600 dark:text-emerald-400">✓</span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};



export default function CreateCommunityEventPage() {
  const router = useRouter();
  const { id: communityId, activityId } = router.query;
  const { user } = useAuth();
  const [community, setCommunity] = useState<any>(null);
    const [activity, setActivity] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  // Event form data
  const [eventData, setEventData] = useState({
    eventName: '',
    description: '',
    date: '',
    time: '',
     meetupTime: '',
    meetupPoint: '',
    maxParticipants: '',
    isPrivateEvent: false,
    eventVisibility: 'public', // 'public' or 'community_only'
    allowedParticipants: 'all_members' ,// 'all_members' or 'invite_only'
     latitude: 0,  // Add this
  longitude: 0  , // Add this
  difficulty: '', // Add this
  inclusive: [] as string[], // Add this
  });

  useEffect(() => {
    if (communityId && typeof communityId === 'string') {
      loadData();
    }
  }, [communityId, activityId]);

  const loadData = async () => {
    try {
      setLoading(true);
      // Load community
     const communityData: any = await CommunityService.getCommunityById(communityId as string);
const activityData = await databases.getDocument(
  DATABASE_ID,
  ACTIVITIES_COLLECTION_ID,
  activityId as string
);
      setCommunity(communityData);
      
      // Set default visibility based on community type
      if (communityData?.type === 'private') {
        setEventData(prev => ({ ...prev, eventVisibility: 'community_only' }));
      }
      
      // Load activity if specified
      if (activityId) {
        const activityData: any = await databases.getDocument(
            DATABASE_ID,
            ACTIVITIES_COLLECTION_ID,
            activityId as string
            );
            setActivity(activityData);
        
        // Pre-populate form with activity data
        setEventData(prev => ({
          ...prev,
          eventName: `${activityData.activityname} - ${communityData.name}`,
          description: activityData.description,
          meetupPoint: activityData.location
        }));
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!eventData.meetupTime && !eventData.time) {
    alert('Please select a time for the event');
    return;
  }

    try {
      setLoading(true);
      
      const eventPayload = {
  // Required fields
  activityId: activityId as string || '',
  date: eventData.date,
  meetupTime: eventData.meetupTime || eventData.time, // Use meetupTime or fallback to time
  meetupPoint: eventData.meetupPoint,
  createdBy: user?.$id || '',
  organizerId: user?.$id || '',
  location: eventData.meetupPoint, // Use meetupPoint as location
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  
  // Optional fields
  eventName: eventData.eventName,
  description: eventData.description,
  maxParticipants: eventData.maxParticipants ? parseInt(eventData.maxParticipants) : undefined,
  communityId: communityId as string,
  isFromCommunity: true,
  eventVisibility: eventData.eventVisibility,
  currentParticipants: 1,
  participants: [user?.$id || ''],
participantIds: [user?.$id || ''],
difficulty: eventData.difficulty || undefined,
  inclusive: eventData.inclusive || [],
};
      
      // Create event using your existing event service
      const newEvent = await databases.createDocument(
        DATABASE_ID,
        EVENTS_COLLECTION_ID,
        ID.unique(),
        eventPayload
      );
      
      // Update community event count
await CommunityService.updateEventCount(communityId as string, 1);      
      alert('Community event created successfully!');
      router.push(`/communities/${communityId}?tab=events`);
      
    } catch (error) {
      console.error('Error creating event:', error);
      alert('Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button 
            onClick={() => router.back()}
            className="text-blue-600 hover:text-blue-800 mb-4"
          >
            ← Back to Community
          </button>
         <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Create Event for {community?.name || 'Community'}
            </h1>
          {activity && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-700">
                📍 Creating event for activity: <strong>{activity?.activityname}</strong>
              </p>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Event Visibility Options */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-yellow-800 mb-3">Event Visibility</h3>
            
            {community?.type === 'public' ? (
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="eventVisibility"
                    value="public"
                    checked={eventData.eventVisibility === 'public'}
                    onChange={(e) => setEventData({...eventData, eventVisibility: e.target.value})}
                    className="mr-3"
                  />
                  <div>
                    <div className="font-medium">🌍 Public Event</div>
                    <div className="text-sm text-gray-600">Visible to everyone in main events feed</div>
                  </div>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="eventVisibility"
                    value="community_only"
                    checked={eventData.eventVisibility === 'community_only'}
                    onChange={(e) => setEventData({...eventData, eventVisibility: e.target.value})}
                    className="mr-3"
                  />
                  <div>
                    <div className="font-medium">🔒 Community Only</div>
                    <div className="text-sm text-gray-600">Only visible to community members</div>
                  </div>
                </label>
              </div>
            ) : (
              <div className="text-sm text-gray-600">
                🔒 This event will be private to community members only (Private Community)
              </div>
            )}
          </div>

          {/* Event Details Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Event Name *</label>
              <input
                type="text"
                required
                value={eventData.eventName}
                onChange={(e) => setEventData({...eventData, eventName: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                placeholder="e.g., Weekend Climbing Session"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
              <textarea
                required
                rows={4}
                value={eventData.description}
                onChange={(e) => setEventData({...eventData, description: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                placeholder="Describe the event, what to bring, skill level, etc."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date *</label>
                <input
                type="date"
                required
                value={eventData.date}
                onChange={(e) => setEventData({...eventData, date: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                />
            </div>
            
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Time *</label>
                <input
                type="time"
                required
                value={eventData.time}
                onChange={(e) => setEventData({...eventData, time: e.target.value, meetupTime: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                />
            </div>
            </div>

            <div>
  <label className="block text-sm font-medium text-gray-700 mb-2">Meetup Point *</label>
  
  {!eventData.meetupPoint ? (
    <button
      type="button"
      onClick={() => setShowLocationPicker(true)}
      className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors"
    >
      📍 Click to set meetup location
    </button>
  ) : (
    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
      <div className="flex justify-between items-start">
        <div>
          <p className="font-medium text-green-800">Selected Location:</p>
          <p className="text-green-700">{eventData.meetupPoint}</p>
        </div>
        <button
          type="button"
          onClick={() => setShowLocationPicker(true)}
          className="text-green-600 hover:text-green-800 text-sm"
        >
          Change
        </button>
      </div>
    </div>
  )}
</div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Max Participants</label>
              <input
                type="number"
                min="1"
                value={eventData.maxParticipants}
                onChange={(e) => setEventData({...eventData, maxParticipants: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                placeholder="Leave empty for unlimited"
              />
            </div>

                {/* Difficulty Selector */}
                <DifficultySelector
                selectedDifficulty={eventData.difficulty || ''}
                onChange={(difficulty) => setEventData({...eventData, difficulty})}
                />

                {/* Inclusive Options */}
                <InclusiveOptionsSelector
                selectedOptions={eventData.inclusive || []}
                onChange={(inclusive) => setEventData({...eventData, inclusive})}
                />



          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4 pt-6">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Event'}
            </button>
          </div>
        </form>


        

      {/* ADD EVENTLOCATIONPICKER HERE */}
    
<EventLocationPicker
  isOpen={showLocationPicker}
  onClose={() => setShowLocationPicker(false)}
  onLocationSelect={(location) => {
    setEventData(prev => ({
      ...prev,
      meetupPoint: location.address,
      latitude: location.latitude,
      longitude: location.longitude
    }));
  }}
  onClear={() => {
    setEventData(prev => ({
      ...prev,
      meetupPoint: '',
      latitude: 0,
      longitude: 0
    }));
  }}
  currentLocation={eventData.meetupPoint ? {
    address: eventData.meetupPoint,
    latitude: 0,
    longitude: 0
  } : null}
/>
      </div>





    </MainLayout>

    
  );

  
}