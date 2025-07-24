// components/events/EventCard.tsx - Fixed with proper user prop typing
import React from 'react';

// Define interfaces locally to avoid import issues
interface Event {
  $id: string;
  eventName: string;
  activityName?: string;
  activityId?: string;
  startDate: string;
  startTime?: string;
  endDate?: string;
  endTime?: string;
  location?: string | { 
    address: string; 
    latitude: number; 
    longitude: number; 
  };
  description?: string;
  maxParticipants?: number;
  currentParticipants?: number;
  participants?: Array<{ 
    userId: string; 
    joinedAt: string; 
    name?: string; 
  }>;
  organizerId: string;
  organizer?: { name: string; avatar?: string; };
  difficulty?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  inclusive?: string[];
  isPrivate?: boolean;
  createdAt: string;
  updatedAt?: string;
  tags?: string[];
  requirements?: string[];
  equipment?: string[];
}

interface User {
  $id: string;
  name?: string;
  email: string;
  location?: {
    address: string;
    latitude: number;
    longitude: number;
  } | string;
  searchRadius?: number;
  disciplines?: string[];
  emailVerification?: boolean;
  phoneVerification?: boolean;
  createdAt?: string;
  avatar?: string;
  bio?: string;
}

interface EventCardProps {
  event: Event;
  onPress?: () => void;
  onJoin?: () => void;
  onLeave?: () => void;
  user?: User | null; // ✅ Properly typed user prop
  isGrid?: boolean;
  showActions?: boolean;
}

const EventCard: React.FC<EventCardProps> = ({ 
  event, 
  onPress, 
  onJoin, 
  onLeave, 
  user, 
  isGrid = false,
  showActions = true 
}) => {
  const isOrganizer = user && event.organizerId === user.$id;
  const isParticipant = user && event.participants?.some(p => p.userId === user.$id);
  const isFull = event.maxParticipants && event.currentParticipants && 
                 event.currentParticipants >= event.maxParticipants;

  // Get difficulty info
  const getDifficultyInfo = (difficulty?: string) => {
    switch (difficulty) {
      case 'beginner':
        return { emoji: '🟢', color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900', label: 'Beginner' };
      case 'intermediate':
        return { emoji: '🟡', color: 'text-yellow-600', bg: 'bg-yellow-100 dark:bg-yellow-900', label: 'Intermediate' };
      case 'advanced':
        return { emoji: '🔴', color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900', label: 'Advanced' };
      case 'expert':
        return { emoji: '🟣', color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900', label: 'Expert' };
      default:
        return { emoji: '⚪', color: 'text-gray-600', bg: 'bg-gray-100 dark:bg-gray-900', label: 'Unknown' };
    }
  };

  const difficultyInfo = getDifficultyInfo(event.difficulty);

  // Format location
  const formatLocation = (location?: string | { address: string; latitude: number; longitude: number }) => {
    if (!location) return 'Location TBD';
    if (typeof location === 'string') return location;
    return location.address;
  };

  // Format date and time
  const formatDateTime = () => {
    try {
      const eventDate = new Date(event.startDate);
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);

      let dateStr = '';
      if (eventDate.toDateString() === today.toDateString()) {
        dateStr = 'Today';
      } else if (eventDate.toDateString() === tomorrow.toDateString()) {
        dateStr = 'Tomorrow';
      } else {
        dateStr = eventDate.toLocaleDateString('en-US', { 
          weekday: isGrid ? 'short' : 'long', 
          month: 'short', 
          day: 'numeric' 
        });
      }

      const timeStr = event.startTime || 'All day';
      return `${dateStr} • ${timeStr}`;
    } catch {
      return 'Date TBD';
    }
  };

  // Handle join/leave
  const handleJoinLeave = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isParticipant && onLeave) {
      onLeave();
    } else if (!isParticipant && onJoin) {
      onJoin();
    }
  };

  return (
    <div 
      className={`
        bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 
        hover:shadow-md transition-all duration-200 cursor-pointer
        ${isGrid ? 'p-4' : 'p-6'}
      `}
      onClick={onPress}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className={`font-semibold text-gray-900 dark:text-white line-clamp-2 ${isGrid ? 'text-base' : 'text-lg'}`}>
            {event.eventName}
          </h3>
          
          {event.activityName && (
            <p className={`text-emerald-600 dark:text-emerald-400 ${isGrid ? 'text-xs' : 'text-sm'} mt-1`}>
              🏃 {event.activityName}
            </p>
          )}
          
          <p className={`text-gray-600 dark:text-gray-300 flex items-center mt-1 ${isGrid ? 'text-xs' : 'text-sm'}`}>
            📅 {formatDateTime()}
          </p>
          
          <p className={`text-gray-600 dark:text-gray-300 flex items-center mt-1 ${isGrid ? 'text-xs' : 'text-sm'}`}>
            📍 {formatLocation(event.location)}
          </p>
        </div>

        {/* Status indicators */}
        <div className="flex flex-col items-end space-y-1 ml-2">
          {event.isPrivate && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300">
              🔒 Private
            </span>
          )}
          
          {isOrganizer && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200">
              👑 Host
            </span>
          )}
          
          {isParticipant && !isOrganizer && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
              ✓ Joined
            </span>
          )}
        </div>
      </div>

      {/* Description */}
      {event.description && !isGrid && (
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
          {event.description}
        </p>
      )}

      {/* Event Details */}
      <div className={`flex items-center justify-between ${isGrid ? 'text-xs' : 'text-sm'}`}>
        <div className="flex items-center space-x-3 text-gray-600 dark:text-gray-300">
          {/* Difficulty */}
          <div className="flex items-center space-x-1">
            <span>{difficultyInfo.emoji}</span>
            {!isGrid && <span>{difficultyInfo.label}</span>}
          </div>

          {/* Participants */}
          <div className="flex items-center space-x-1">
            <span>👥</span>
            <span>
              {event.currentParticipants || 0}
              {event.maxParticipants && `/${event.maxParticipants}`}
            </span>
          </div>

          {/* Full indicator */}
          {isFull && (
            <span className="text-red-600 dark:text-red-400 font-medium">
              Full
            </span>
          )}
        </div>

        {/* Organizer */}
        {event.organizer && !isGrid && (
          <div className="text-right">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              by {event.organizer.name}
            </p>
          </div>
        )}
      </div>

      {/* Inclusive features */}
      {event.inclusive && event.inclusive.length > 0 && !isGrid && (
        <div className="flex flex-wrap gap-1 mt-3">
          {event.inclusive.slice(0, 3).map((feature: string, index: number) => {
            const getInclusiveEmoji = (feature: string) => {
              if (feature.includes('wheelchair')) return '♿';
              if (feature.includes('beginner')) return '👶';
              if (feature.includes('family')) return '👨‍👩‍👧‍👦';
              if (feature.includes('pet')) return '🐕';
              if (feature.includes('lgbtq')) return '🏳️‍🌈';
              if (feature.includes('senior')) return '👴';
              if (feature.includes('youth')) return '👦';
              return '✨';
            };

            return (
              <span
                key={index}
                className="inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
              >
                <span>{getInclusiveEmoji(feature)}</span>
                <span className="capitalize">{feature.replace('-', ' ')}</span>
              </span>
            );
          })}
          {event.inclusive.length > 3 && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300">
              +{event.inclusive.length - 3} more
            </span>
          )}
        </div>
      )}

      {/* Action buttons */}
      {showActions && user && !isOrganizer && (
        <div className="flex items-center justify-between pt-3 mt-3 border-t border-gray-200 dark:border-slate-600">
          <span className={`text-gray-500 dark:text-gray-400 ${isGrid ? 'text-xs' : 'text-sm'}`}>
            {new Date(event.createdAt).toLocaleDateString()}
          </span>
          
          <button
            onClick={handleJoinLeave}
           disabled={!isParticipant && (isFull || false)}
            className={`
              px-4 py-2 rounded-lg transition-colors text-sm font-medium
              ${isParticipant 
                ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 hover:bg-red-200 dark:hover:bg-red-800' 
                : isFull
                ? 'bg-gray-100 dark:bg-slate-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }
            `}
          >
            {isParticipant ? 'Leave Event' : isFull ? 'Event Full' : 'Join Event'}
          </button>
        </div>
      )}

      {/* Organizer actions */}
      {showActions && isOrganizer && (
        <div className="flex items-center justify-between pt-3 mt-3 border-t border-gray-200 dark:border-slate-600">
          <span className={`text-gray-500 dark:text-gray-400 ${isGrid ? 'text-xs' : 'text-sm'}`}>
            You're hosting this event
          </span>
          
          <div className="flex space-x-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                // Handle edit
              }}
              className="px-3 py-1 text-sm text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900 rounded transition-colors"
            >
              Edit
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                // Handle manage participants
              }}
              className="px-3 py-1 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900 rounded transition-colors"
            >
              Manage
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventCard;