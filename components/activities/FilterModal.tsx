// components/activities/FilterModal.tsx - Simple, safe implementation
import React from 'react';

// Define interfaces locally to avoid import issues
interface ActivityFilters {
  query?: string;
  types?: string[];
  difficulty?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
  location?: {
    address: string;
    radius: number;
  };
  maxParticipants?: number;
  inclusive?: string[];
  nearMe?: boolean;
  hasEvents?: boolean;
  privacy?: 'public' | 'private' | 'all';
  radius?: number;
}

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: ActivityFilters;
  onFiltersChange: (filters: ActivityFilters) => void;
  onApply: () => void;
}

const FilterModal: React.FC<FilterModalProps> = ({ 
  isOpen, 
  onClose, 
  filters, 
  onFiltersChange, 
  onApply 
}) => {
  if (!isOpen) return null;

  const handleClose = () => {
    onClose();
  };

  const handleApply = () => {
    onApply();
  };

  const handleClear = () => {
    onFiltersChange({
      types: [],
      difficulty: [],
      nearMe: false,
      hasEvents: undefined,
      privacy: 'all',
      radius: 50
    });
  };

  const updateFilter = (key: keyof ActivityFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg max-w-md w-full max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-600">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Filters</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Difficulty */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Difficulty
            </label>
            <div className="space-y-2">
              {['beginner', 'intermediate', 'advanced', 'expert'].map((level) => (
                <label key={level} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.difficulty?.includes(level) || false}
                    onChange={(e) => {
                      const current = filters.difficulty || [];
                      const updated = e.target.checked
                        ? [...current, level]
                        : current.filter(d => d !== level);
                      updateFilter('difficulty', updated);
                    }}
                    className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300 capitalize">
                    {level}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Activity Types */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Activity Types
            </label>
            <div className="space-y-2">
              {['hiking', 'climbing', 'cycling', 'water-sports', 'winter-sports'].map((type) => (
                <label key={type} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.types?.includes(type) || false}
                    onChange={(e) => {
                      const current = filters.types || [];
                      const updated = e.target.checked
                        ? [...current, type]
                        : current.filter(t => t !== type);
                      updateFilter('types', updated);
                    }}
                    className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300 capitalize">
                    {type.replace('-', ' ')}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Near Me */}
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filters.nearMe || false}
                onChange={(e) => updateFilter('nearMe', e.target.checked)}
                className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Near my location
              </span>
            </label>
          </div>

          {/* Search Radius */}
          {filters.nearMe && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Search Radius: {filters.radius || 50} km
              </label>
              <input
                type="range"
                min="5"
                max="200"
                value={filters.radius || 50}
                onChange={(e) => updateFilter('radius', parseInt(e.target.value))}
                className="w-full"
              />
            </div>
          )}

          {/* Privacy */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Privacy
            </label>
            <select
              value={filters.privacy || 'all'}
              onChange={(e) => updateFilter('privacy', e.target.value)}
              className="w-full rounded-md border-gray-300 dark:border-slate-600 dark:bg-slate-700 text-sm"
            >
              <option value="all">All Activities</option>
              <option value="public">Public Only</option>
              <option value="private">Private Only</option>
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-slate-600">
          <button
            onClick={handleClear}
            className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100"
          >
            Clear All
          </button>
          <div className="flex space-x-3">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm transition-colors"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterModal;