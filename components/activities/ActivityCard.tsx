// components/activities/ActivityCard.tsx - Fixed with compact prop
import React from 'react';

// Define interfaces locally to avoid import issues
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

interface User {
  $id: string;
  name?: string;
  email: string;
  location?: {
    address: string;
    latitude: number;
    longitude: number;
  } | string;
}

interface ActivityCardProps {
  activity: Activity;
  onPress?: () => void;
  user?: User | null;
  showActions?: boolean;
  compact?: boolean; // ✅ Added compact prop
}

const ActivityCard: React.FC<ActivityCardProps> = ({ 
  activity, 
  onPress, 
  user, 
  showActions = true,
  compact = false // ✅ Default value for compact
}) => {
  const isOwner = user && activity.userId === user.$id;

  // Get difficulty emoji and color
  const getDifficultyInfo = (difficulty?: string) => {
    switch (difficulty) {
      case 'beginner':
        return { emoji: '🟢', color: 'text-green-600', label: 'Beginner' };
      case 'intermediate':
        return { emoji: '🟡', color: 'text-yellow-600', label: 'Intermediate' };
      case 'advanced':
        return { emoji: '🔴', color: 'text-red-600', label: 'Advanced' };
      case 'expert':
        return { emoji: '🟣', color: 'text-purple-600', label: 'Expert' };
      default:
        return { emoji: '⚪', color: 'text-gray-600', label: 'Unknown' };
    }
  };

  const difficultyInfo = getDifficultyInfo(activity.difficulty);

  // Format location string
  const formatLocation = (location: string | { address: string; latitude: number; longitude: number }) => {
    if (typeof location === 'string') return location;
    return location.address;
  };

  // Format date
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return 'Unknown date';
    }
  };

  return (
    <div 
      className={`
        bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 
        hover:shadow-md transition-all duration-200 cursor-pointer
        ${compact ? 'p-4' : 'p-6'}
      `}
      onClick={onPress}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className={`font-semibold text-gray-900 dark:text-white line-clamp-2 ${compact ? 'text-base' : 'text-lg'}`}>
            {activity.activityname}
          </h3>
          <p className={`text-gray-600 dark:text-gray-300 flex items-center mt-1 ${compact ? 'text-xs' : 'text-sm'}`}>
            📍 {formatLocation(activity.location)}
          </p>
        </div>

        {/* Privacy indicator */}
        {activity.isPrivate && (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300">
            🔒 Private
          </span>
        )}

        {/* Owner actions menu */}
        {showActions && isOwner && (
          <div className="relative ml-2">
            <button className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700">
              <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Description */}
      {activity.description && !compact && (
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
          {activity.description}
        </p>
      )}

      {/* Activity Types */}
      {activity.types && activity.types.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {activity.types.slice(0, compact ? 2 : 3).map((type: string, index: number) => (
            <span
              key={index}
              className={`inline-flex items-center px-2 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 ${compact ? 'text-xs' : 'text-sm'}`}
            >
              {type}
            </span>
          ))}
          {activity.types.length > (compact ? 2 : 3) && (
            <span className={`inline-flex items-center px-2 py-1 rounded-full bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 ${compact ? 'text-xs' : 'text-sm'}`}>
              +{activity.types.length - (compact ? 2 : 3)}
            </span>
          )}
        </div>
      )}

      {/* Stats Row */}
      <div className={`flex items-center justify-between ${compact ? 'text-xs' : 'text-sm'}`}>
        <div className="flex items-center space-x-4 text-gray-600 dark:text-gray-300">
          {/* Difficulty */}
          <div className="flex items-center space-x-1">
            <span>{difficultyInfo.emoji}</span>
            <span className={compact ? 'hidden' : 'block'}>{difficultyInfo.label}</span>
          </div>

          {/* Event count */}
          {activity.eventCount !== undefined && (
            <div className="flex items-center space-x-1">
              <span>📅</span>
              <span>{activity.eventCount} event{activity.eventCount !== 1 ? 's' : ''}</span>
            </div>
          )}

          {/* Participant count */}
          {activity.participantCount !== undefined && (
            <div className="flex items-center space-x-1">
              <span>👥</span>
              <span>{activity.participantCount}</span>
            </div>
          )}
        </div>

        {/* Rating */}
        {activity.rating && activity.reviewCount && !compact && (
          <div className="flex items-center space-x-1 text-yellow-500">
            <span>⭐</span>
            <span className="text-gray-600 dark:text-gray-300">
              {activity.rating.toFixed(1)} ({activity.reviewCount})
            </span>
          </div>
        )}
      </div>

      {/* Inclusive features */}
      {activity.inclusive && activity.inclusive.length > 0 && !compact && (
        <div className="flex flex-wrap gap-1 mt-3">
          {activity.inclusive.slice(0, 3).map((feature: string, index: number) => {
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
          {activity.inclusive.length > 3 && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300">
              +{activity.inclusive.length - 3} more
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className={`flex items-center justify-between pt-3 mt-3 border-t border-gray-200 dark:border-slate-600 ${compact ? 'text-xs' : 'text-sm'}`}>
        <span className="text-gray-500 dark:text-gray-400">
          Created {formatDate(activity.createdAt)}
        </span>
        
        {/* External links */}
        {activity.externalUrls && activity.externalUrls.length > 0 && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              window.open(activity.externalUrls![0], '_blank');
            }}
            className="text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            🔗 Learn More
          </button>
        )}
      </div>
    </div>
  );
};

export default ActivityCard;