// hooks/useEvents.ts - Improved Real Appwrite Integration for Events
import { useState, useEffect, useCallback } from 'react';
import { databases, DATABASE_ID, EVENTS_COLLECTION_ID, Query } from '../lib/appwrite';
import { useAuth } from '../contexts/AuthContext';

export interface Event {
  $id: string;
  eventName: string;
  activityId: string;
  date: string; // Mobile uses 'date' not 'startDate'
  meetupPoint: string;
  description: string;
  maxParticipants: number;
  participants: string[]; // Array of user IDs
  organizerId: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  requirements?: string[];
  equipment?: string[];
  tags?: string[];
  createdAt: string;
  updatedAt?: string;
  // Additional fields that might be populated
  activityname?: string;
  location?: string;
  createdBy?: string; // Alias for organizerId
}

// Helper function to convert Appwrite document to Event
const convertAppwriteDocumentToEvent = (doc: any): Event => ({
  $id: doc.$id,
  eventName: doc.eventName || '',
  activityId: doc.activityId || '',
  date: doc.date || '',
  meetupPoint: doc.meetupPoint || '',
  description: doc.description || '',
  maxParticipants: doc.maxParticipants || 0,
  participants: doc.participants || [],
  organizerId: doc.organizerId || '',
  difficulty: doc.difficulty || 'beginner',
  requirements: doc.requirements || [],
  equipment: doc.equipment || [],
  tags: doc.tags || [],
  createdAt: doc.$createdAt || '',
  updatedAt: doc.$updatedAt || '',
  createdBy: doc.organizerId || ''
});

export const useEvents = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [publicEvents, setPublicEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch user's events (created by user or user is participant)
  const fetchEvents = useCallback(async () => {
    if (!user || !EVENTS_COLLECTION_ID) {
      console.log('⚠️ No user or events collection not configured');
      setEvents([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log('📅 Fetching user events...');

      // Get events where user is organizer OR participant
      const [organizedEvents, participatingEvents] = await Promise.all([
        // Events organized by user
        databases.listDocuments(
          DATABASE_ID,
          EVENTS_COLLECTION_ID,
          [Query.equal('organizerId', user.$id)]
        ),
        // Events where user is a participant (this might need adjustment based on your schema)
        databases.listDocuments(
          DATABASE_ID,
          EVENTS_COLLECTION_ID,
          [Query.search('participants', user.$id)]
        )
      ]);

      // Combine and deduplicate events
      const allUserEvents = new Map();
      
      organizedEvents.documents.forEach((doc: any) => {
        const event = convertAppwriteDocumentToEvent(doc);
        allUserEvents.set(event.$id, event);
      });

      participatingEvents.documents.forEach((doc: any) => {
        if (!allUserEvents.has(doc.$id)) {
          const event = convertAppwriteDocumentToEvent(doc);
          allUserEvents.set(event.$id, event);
        }
      });

      const userEventsList = Array.from(allUserEvents.values()) as Event[];
      console.log('✅ User events loaded:', userEventsList.length);
      setEvents(userEventsList);

    } catch (err) {
      console.error('❌ Error fetching user events:', err);
      setError('Failed to load your events');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch all public events
  const fetchPublicEvents = useCallback(async () => {
    if (!EVENTS_COLLECTION_ID) {
      console.log('⚠️ Events collection not configured');
      setPublicEvents([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log('🌍 Fetching public events...');

      const response = await databases.listDocuments(
        DATABASE_ID,
        EVENTS_COLLECTION_ID,
        [
          Query.equal('isPublic', true), 
          Query.orderDesc('$createdAt'),
          Query.limit(100) // Adjust limit as needed
        ]
      );

      const publicEventsList = response.documents.map((doc: any) => 
        convertAppwriteDocumentToEvent(doc)
      );

      console.log('✅ Public events loaded:', publicEventsList.length);
      setPublicEvents(publicEventsList);

    } catch (err) {
      console.error('❌ Error fetching public events:', err);
      setError('Failed to load public events');
      setPublicEvents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Create new event
  const createEvent = useCallback(async (eventData: Omit<Event, '$id' | 'createdAt' | 'updatedAt' | 'createdBy'>): Promise<Event> => {
    if (!user || !EVENTS_COLLECTION_ID) {
      throw new Error('Cannot create event: User not authenticated or events collection not configured');
    }

    try {
      setLoading(true);
      console.log('📝 Creating new event...');

      const newEventData = {
        ...eventData,
        organizerId: user.$id,
        participants: eventData.participants?.includes(user.$id) 
    ? eventData.participants 
    : [user.$id, ...(eventData.participants || [])],
        requirements: eventData.requirements || [],
        equipment: eventData.equipment || [],
        tags: eventData.tags || []
      };

      const response = await databases.createDocument(
        DATABASE_ID,
        EVENTS_COLLECTION_ID,
        'unique()',
        newEventData
      );

      const newEvent = convertAppwriteDocumentToEvent(response);

      // Update local state
      setEvents(prev => [newEvent, ...prev]);
      setPublicEvents(prev => [newEvent, ...prev]);

      console.log('✅ Event created successfully:', newEvent.eventName);
      return newEvent;

    } catch (err) {
      console.error('❌ Error creating event:', err);
      throw new Error('Failed to create event');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Update event
  const updateEvent = useCallback(async (eventId: string, updateData: Partial<Event>): Promise<Event> => {
    if (!EVENTS_COLLECTION_ID) {
      throw new Error('Events collection not configured');
    }

    try {
      setLoading(true);
      console.log('📝 Updating event:', eventId);

      const response = await databases.updateDocument(
        DATABASE_ID,
        EVENTS_COLLECTION_ID,
        eventId,
        updateData
      );

      const updatedEvent = convertAppwriteDocumentToEvent(response);

      // Update local state
      setEvents(prev => 
        prev.map(event => event.$id === eventId ? updatedEvent : event)
      );
      setPublicEvents(prev => 
        prev.map(event => event.$id === eventId ? updatedEvent : event)
      );

      console.log('✅ Event updated successfully');
      return updatedEvent;

    } catch (err) {
      console.error('❌ Error updating event:', err);
      throw new Error('Failed to update event');
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete event
  const deleteEvent = useCallback(async (eventId: string): Promise<void> => {
    if (!EVENTS_COLLECTION_ID) {
      throw new Error('Events collection not configured');
    }

    try {
      setLoading(true);
      console.log('🗑️ Deleting event:', eventId);

      await databases.deleteDocument(
        DATABASE_ID,
        EVENTS_COLLECTION_ID,
        eventId
      );

      // Update local state
      setEvents(prev => prev.filter(event => event.$id !== eventId));
      setPublicEvents(prev => prev.filter(event => event.$id !== eventId));

      console.log('✅ Event deleted successfully');

    } catch (err) {
      console.error('❌ Error deleting event:', err);
      throw new Error('Failed to delete event');
    } finally {
      setLoading(false);
    }
  }, []);

  // Join event
  const joinEvent = useCallback(async (eventId: string): Promise<void> => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      setLoading(true);
      console.log('🎯 Joining event:', eventId);

      // Find the event
      const event = [...events, ...publicEvents].find(e => e.$id === eventId);
      if (!event) {
        throw new Error('Event not found');
      }

      // Check if user is already a participant
      if (event.participants.includes(user.$id)) {
        throw new Error('Already joined this event');
      }

      // Check if event is full
      if (event.participants.length >= event.maxParticipants) {
        throw new Error('Event is full');
      }

      // Add user to participants
      const updatedParticipants = [...event.participants, user.$id];
      
      await updateEvent(eventId, {
        participants: updatedParticipants
      });

      console.log('✅ Successfully joined event');

    } catch (err) {
      console.error('❌ Error joining event:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user, events, publicEvents, updateEvent]);

  // Leave event
  const leaveEvent = useCallback(async (eventId: string): Promise<void> => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      setLoading(true);
      console.log('🚪 Leaving event:', eventId);

      // Find the event
      const event = [...events, ...publicEvents].find(e => e.$id === eventId);
      if (!event) {
        throw new Error('Event not found');
      }

      // Check if user is a participant
      if (!event.participants.includes(user.$id)) {
        throw new Error('Not a participant in this event');
      }

      // Remove user from participants
      const updatedParticipants = event.participants.filter(id => id !== user.$id);
      
      await updateEvent(eventId, {
        participants: updatedParticipants
      });

      console.log('✅ Successfully left event');

    } catch (err) {
      console.error('❌ Error leaving event:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user, events, publicEvents, updateEvent]);

  // Get event by ID
  const getEventById = useCallback(async (eventId: string): Promise<Event | null> => {
    if (!EVENTS_COLLECTION_ID) {
      return null;
    }

    try {
      console.log('🔍 Fetching event by ID:', eventId);

      const response = await databases.getDocument(
        DATABASE_ID,
        EVENTS_COLLECTION_ID,
        eventId
      );

      const event = convertAppwriteDocumentToEvent(response);

      console.log('✅ Event found:', event.eventName);
      return event;

    } catch (err) {
      console.error('❌ Error fetching event by ID:', err);
      return null;
    }
  }, []);

  // Search events
  const searchEvents = useCallback(async (query: string): Promise<Event[]> => {
    if (!EVENTS_COLLECTION_ID || !query.trim()) {
      return [];
    }

    try {
      setLoading(true);
      console.log('🔍 Searching events:', query);

      const response = await databases.listDocuments(
        DATABASE_ID,
        EVENTS_COLLECTION_ID,
        [
          Query.equal('isPublic', true),
          Query.search('eventName', query),
          Query.orderDesc('$createdAt')
        ]
      );

      const searchResults = response.documents.map((doc: any) => 
        convertAppwriteDocumentToEvent(doc)
      );

      console.log('✅ Event search completed:', searchResults.length, 'results');
      return searchResults;

    } catch (err) {
      console.error('❌ Error searching events:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Get events by activity ID
  const getEventsByActivity = useCallback(async (activityId: string): Promise<Event[]> => {
    if (!EVENTS_COLLECTION_ID || !activityId) {
      return [];
    }

    try {
      console.log('🔍 Fetching events for activity:', activityId);

      const response = await databases.listDocuments(
        DATABASE_ID,
        EVENTS_COLLECTION_ID,
        [
          Query.equal('activityId', activityId),
          Query.orderDesc('$createdAt')
        ]
      );

      const activityEvents = response.documents.map((doc: any) => 
        convertAppwriteDocumentToEvent(doc)
      );

      console.log('✅ Activity events found:', activityEvents.length);
      return activityEvents;

    } catch (err) {
      console.error('❌ Error fetching events by activity:', err);
      return [];
    }
  }, []);

  // Auto-fetch on mount and when user changes
  useEffect(() => {
    if (user) {
      fetchEvents();
    }
  }, [user, fetchEvents]);

  useEffect(() => {
    fetchPublicEvents();
  }, [fetchPublicEvents]);

  return {
    // Data
    events,
    publicEvents,
    loading,
    error,
    
    // Functions
    fetchEvents,
    fetchPublicEvents,
    createEvent,
    updateEvent,
    deleteEvent,
    joinEvent,
    leaveEvent,
    getEventById,
    searchEvents,
    getEventsByActivity,
    
    // Utility functions
    refreshEvents: () => {
      fetchEvents();
      fetchPublicEvents();
    }
  };
};