// pages/events/[id]/edit.tsx - Event Edit Page
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import MainLayout from '../../../components/layout/MainLayout';
import { useAuth } from '../../../contexts/AuthContext';
import { databases, DATABASE_ID, EVENTS_COLLECTION_ID } from '../../../lib/appwrite';
import EventLocationPicker from '../../../components/events/EventLocationPicker';

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
}

interface FormData {
  eventName: string;
  title: string;
  date: string;
  meetupTime: string;
  endDate: string;
  endTime: string;
  meetupPoint: string;
  description: string;
  difficulty: string;
  inclusive: string[];
  isPublic: boolean;
  maxParticipants: number;
   latitude?: number;    // Add this
  longitude?: number;   // Add this
}

interface FormErrors {
  [key: string]: string;
}

// Icons
const ArrowLeftIcon: React.FC<{ className?: string }> = ({ className = "h-5 w-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

// Helper Components
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

// Main Component
export default function EditEvent() {
  const router = useRouter();
  const { id: eventId } = router.query;
  const { user } = useAuth();

  // State
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    eventName: '',
    title: '',
    date: '',
    meetupTime: '',
    endDate: '',
    endTime: '',
    meetupPoint: '',
    description: '',
    difficulty: '',
    inclusive: [],
    isPublic: true,
    maxParticipants: 10
  });

  // Helper function to safely convert Appwrite document
  const mapDocumentToEvent = (doc: any): Event => {
    return {
      $id: doc.$id,
      eventName: doc.eventName || doc.title || '',
      title: doc.title || doc.eventName || '',
      activityId: doc.activityId || '',
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
      longitude: doc.longitude
    };
  };

  // Format date for input (YYYY-MM-DD)
  const formatDateForInput = (dateString: string): string => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    } catch {
      return '';
    }
  };

  // Load event data
  const loadEvent = async () => {
    if (!eventId || typeof eventId !== 'string') return;

    try {
      setLoading(true);
      setErrors({});

      const eventDoc = await databases.getDocument(
        DATABASE_ID,
        EVENTS_COLLECTION_ID,
        eventId
      );

      if (!eventDoc) {
        setErrors({ general: 'Event not found' });
        return;
      }

      // Check if user owns this event
      if (eventDoc.organizerId !== user?.$id) {
        setErrors({ general: 'You can only edit your own events' });
        return;
      }

      const eventData = mapDocumentToEvent(eventDoc);
      setEvent(eventData);

      // Set form data
      setFormData({
        eventName: eventData.eventName,
        title: eventData.title,
        date: formatDateForInput(eventData.date),
        meetupTime: eventData.meetupTime,
        endDate: eventData.endDate ? formatDateForInput(eventData.endDate) : '',
        endTime: eventData.endTime || '',
        meetupPoint: eventData.meetupPoint,
        description: eventData.description,
        difficulty: eventData.difficulty,
        inclusive: eventData.inclusive,
        isPublic: eventData.isPublic,
        maxParticipants: eventData.maxParticipants,
         latitude: eventData.latitude,      // Add this
  longitude: eventData.longitude     // Add this
      });

    } catch (err) {
      console.error('Error loading event:', err);
      setErrors({ general: 'Failed to load event' });
    } finally {
      setLoading(false);
    }
  };

  // Handle input changes
  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    

    if (!formData.title.trim()) {
      newErrors.title = 'Event title is required';
    }

    if (!formData.date) {
      newErrors.date = 'Date is required';
    } else {
      const eventDate = new Date(formData.date);
      const now = new Date();
      now.setHours(0, 0, 0, 0); // Reset time for date-only comparison
      if (eventDate < now) {
        newErrors.date = 'Event must be scheduled for today or a future date';
      }
    }

    if (!formData.meetupTime) {
      newErrors.meetupTime = 'Meetup time is required';
    }

    if (!formData.meetupPoint.trim()) {
      newErrors.meetupPoint = 'Meetup point is required';
    }

    // Validate end date/time if provided
    if (formData.endDate && formData.endTime) {
      const startDateTime = new Date(`${formData.date}T${formData.meetupTime}`);
      const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`);
      
      if (endDateTime <= startDateTime) {
        newErrors.endDate = 'End date/time must be after start date/time';
      }
    }

    if (formData.maxParticipants < 1 || formData.maxParticipants > 100) {
      newErrors.maxParticipants = 'Max participants must be between 1 and 100';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLocationSelect = (locationData: { address: string; latitude: number; longitude: number }) => {
  setFormData(prev => ({
    ...prev,
    meetupPoint: locationData.address,
    latitude: locationData.latitude,
    longitude: locationData.longitude
  }));
  setShowLocationPicker(false);
};

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !event) return;

    try {
      setSaving(true);
      setErrors({});

      // Prepare update data
      const updateData: any = {
        eventName:formData.title.trim(),
        title: formData.title.trim(),
        date: formData.date,
        meetupTime: formData.meetupTime,
        meetupPoint: formData.meetupPoint.trim(),
        description: formData.description.trim(),
        difficulty: formData.difficulty,
        inclusive: formData.inclusive,
        isPublic: formData.isPublic,
        maxParticipants: formData.maxParticipants,
        updatedAt: new Date().toISOString()
      };

      // Add optional fields only if they have values
if (formData.endDate && formData.endTime) {
  updateData.endDate = formData.endDate;
  updateData.endTime = formData.endTime;
} else {
  updateData.endDate = null;
  updateData.endTime = null;
}

// Add location coordinates if available
if (formData.latitude && formData.longitude) {
  updateData.latitude = formData.latitude;
  updateData.longitude = formData.longitude;
}

      console.log('🔄 Updating event with data:', updateData);

      await databases.updateDocument(
        DATABASE_ID,
        EVENTS_COLLECTION_ID,
        event.$id,
        updateData
      );

      console.log('✅ Event updated successfully');

      // Redirect back to event detail page
      router.push(`/events/${event.$id}`);

    } catch (err) {
      console.error('❌ Error updating event:', err);
      setErrors({ general: 'Failed to update event. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    loadEvent();
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

  if (errors.general) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-screen">
          <h1 className="text-2xl font-bold text-red-600 mb-4">{errors.general}</h1>
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

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-6">
          <button
            onClick={() => router.back()}
            className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Edit Event</h1>
            <p className="text-gray-600 dark:text-gray-400">Update your event details</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6">
            
            {/* Event Name
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Event Name *
              </label>
              <input
                type="text"
                value={formData.eventName}
                onChange={(e) => handleInputChange('eventName', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white ${
                  errors.eventName ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-slate-600'
                }`}
                placeholder="Enter event name"
              />
              {errors.eventName && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.eventName}</p>
              )}
            </div> */}

            {/* Event Title */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Event Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white ${
                  errors.title ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-slate-600'
                }`}
                placeholder="Enter event title"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.title}</p>
              )}
            </div>

            {/* Date and Time Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {/* Start Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Start Date *
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white ${
                    errors.date ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-slate-600'
                  }`}
                />
                {errors.date && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.date}</p>
                )}
              </div>

              {/* Start Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Start Time *
                </label>
                <input
                  type="time"
                  value={formData.meetupTime}
                  onChange={(e) => handleInputChange('meetupTime', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white ${
                    errors.meetupTime ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-slate-600'
                  }`}
                />
                {errors.meetupTime && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.meetupTime}</p>
                )}
              </div>

              {/* End Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  End Date (Optional)
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => handleInputChange('endDate', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white ${
                    errors.endDate ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-slate-600'
                  }`}
                />
                {errors.endDate && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.endDate}</p>
                )}
              </div>

              {/* End Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  End Time (Optional)
                </label>
                <input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => handleInputChange('endTime', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            {/* Meetup Point */}
<div className="mb-6">
  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
    Meetup Point *
  </label>
  <div className="flex space-x-2">
    <input
      type="text"
      value={formData.meetupPoint}
      onChange={(e) => handleInputChange('meetupPoint', e.target.value)}
      className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white ${
        errors.meetupPoint ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-slate-600'
      }`}
      placeholder="Where should participants meet?"
    />
    <button
      type="button"
      onClick={() => setShowLocationPicker(true)}
      className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
    >
      📍 Map
    </button>
  </div>
  {formData.latitude && formData.longitude && (
    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
      📍 {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
    </p>
  )}
  {errors.meetupPoint && (
    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.meetupPoint}</p>
  )}
</div>
            {/* Description */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Event Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white resize-none"
                placeholder="Describe your event..."
              />
            </div>

            {/* Max Participants */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Maximum Participants *
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={formData.maxParticipants}
                onChange={(e) => handleInputChange('maxParticipants', parseInt(e.target.value) || 1)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white ${
                  errors.maxParticipants ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-slate-600'
                }`}
              />
              {errors.maxParticipants && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.maxParticipants}</p>
              )}
            </div>
          </div>

          {/* Event Settings */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Event Settings</h3>

            {/* Inclusive Options */}
            <div className="mb-6">
              <InclusiveOptionsSelector
                selectedOptions={formData.inclusive}
                onChange={(options) => handleInputChange('inclusive', options)}
              />
            </div>

            {/* Difficulty */}
            <div className="mb-6">
              <DifficultySelector
                selectedDifficulty={formData.difficulty}
                onChange={(difficulty) => handleInputChange('difficulty', difficulty)}
              />
            </div>

            {/* Privacy Setting */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                🔒 Privacy Settings
              </label>
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={formData.isPublic}
                  onChange={(e) => handleInputChange('isPublic', e.target.checked)}
                  className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="isPublic" className="text-sm text-gray-700 dark:text-gray-300">
                  Make this event public (anyone can join)
                </label>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Private events are only visible to people you invite
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              {saving ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Saving Changes...</span>
                </>
              ) : (
                <span>Save Changes</span>
              )}
            </button>
          </div>
        </form>


              {/* Location Picker Modal */}
<EventLocationPicker
  isOpen={showLocationPicker}
  onClose={() => setShowLocationPicker(false)}
  onLocationSelect={handleLocationSelect}
  onClear={() => {
    setFormData(prev => ({
      ...prev,
      meetupPoint: '',
      latitude: undefined,
      longitude: undefined
    }));
  }}
  currentLocation={
    formData.latitude && formData.longitude
      ? {
          address: formData.meetupPoint,
          latitude: formData.latitude,
          longitude: formData.longitude
        }
      : null
  }
/>

      </div>

              

    </MainLayout>
  );
}