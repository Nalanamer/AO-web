// components/profile/UserStatsCard.tsx - Fixed typing errors
import React from 'react';

// Define interfaces locally to avoid import issues
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
  stats?: {
    activitiesCreated: number;
    eventsHosted: number;
    eventsJoined: number;
  };
}

interface UserStatsCardProps {
  user: User;
  stats?: {
    activitiesCreated: number;
    eventsHosted: number;
    eventsJoined: number;
    totalParticipants: number;
  };
}

const UserStatsCard: React.FC<UserStatsCardProps> = ({ user, stats }) => {
  const defaultStats = {
    activitiesCreated: 0,
    eventsHosted: 0,
    eventsJoined: 0,
    totalParticipants: 0,
    ...stats
  };

  // Fix: Properly type the disciplines array
  const userDisciplines: string[] = user.disciplines || [];

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-6">
      {/* User Info Section */}
      <div className="flex items-center space-x-4 mb-6">
        {/* Avatar */}
        <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900 rounded-full flex items-center justify-center">
          {user.avatar ? (
            <img 
              src={user.avatar} 
              alt={user.name || 'User'} 
              className="w-16 h-16 rounded-full object-cover"
            />
          ) : (
            <span className="text-2xl font-semibold text-emerald-600 dark:text-emerald-400">
              {(user.name || user.email || 'U').charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        {/* User Details */}
        <div className="flex-1">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {user.name || 'Adventure Enthusiast'}
          </h2>
          <p className="text-gray-600 dark:text-gray-300">{user.email}</p>
          {user.location && (
            <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center mt-1">
              📍 {typeof user.location === 'string' ? user.location : user.location.address}
            </p>
          )}
        </div>

        {/* Verification Badges */}
        <div className="flex flex-col space-y-1">
          {user.emailVerification && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
              ✓ Email
            </span>
          )}
          {user.phoneVerification && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
              ✓ Phone
            </span>
          )}
        </div>
      </div>

      {/* Bio Section */}
      {user.bio && (
        <div className="mb-6">
          <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
            {user.bio}
          </p>
        </div>
      )}

      {/* Disciplines/Interests - Fixed typing */}
      {userDisciplines.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
            Interests
          </h3>
          <div className="flex flex-wrap gap-2">
            {userDisciplines.slice(0, 6).map((discipline: string, index: number) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200"
              >
                {discipline}
              </span>
            ))}
            {userDisciplines.length > 6 && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300">
                +{userDisciplines.length - 6} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Statistics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="text-center p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {defaultStats.activitiesCreated}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-300 mt-1">
            Activities Created
          </div>
        </div>

        <div className="text-center p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {defaultStats.eventsHosted}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-300 mt-1">
            Events Hosted
          </div>
        </div>

        <div className="text-center p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {defaultStats.eventsJoined}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-300 mt-1">
            Events Joined
          </div>
        </div>

        <div className="text-center p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
            {defaultStats.totalParticipants}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-300 mt-1">
            Total Participants
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-3 mt-6">
        <button className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium">
          Edit Profile
        </button>
        <button className="flex-1 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-600 px-4 py-2 rounded-lg transition-colors text-sm font-medium">
          Settings
        </button>
      </div>

      {/* Quick Stats Bar */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-slate-600">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-300">Adventure Level</span>
          <div className="flex items-center space-x-2">
            <div className="w-24 bg-gray-200 dark:bg-slate-600 rounded-full h-2">
              <div 
                className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${Math.min(100, (defaultStats.activitiesCreated + defaultStats.eventsHosted) * 10)}%` 
                }}
              ></div>
            </div>
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">
              {defaultStats.activitiesCreated + defaultStats.eventsHosted < 3 ? 'Beginner' :
               defaultStats.activitiesCreated + defaultStats.eventsHosted < 10 ? 'Explorer' :
               defaultStats.activitiesCreated + defaultStats.eventsHosted < 25 ? 'Adventurer' : 'Expert'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserStatsCard;