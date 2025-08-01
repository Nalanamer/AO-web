// components/LinkToCommunityButton.tsx (NEW FILE)
import React, { useState, useEffect } from 'react';
import { useCommunities } from '../hooks/useCommunities';
import { Community } from '../services/useCommunities';

interface LinkToCommunityButtonProps {
  activityId: string;
  activityName: string;
  currentUserId: string;
  className?: string;
}

export const LinkToCommunityButton: React.FC<LinkToCommunityButtonProps> = ({
  activityId,
  activityName,
  currentUserId,
  className = ""
}) => {
  const { userCommunities, linkActivityToCommunity, loading } = useCommunities();
  const [showModal, setShowModal] = useState(false);
  const [selectedCommunity, setSelectedCommunity] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [adminCommunities, setAdminCommunities] = useState<Community[]>([]);

  // Filter communities where user is admin/owner
  useEffect(() => {
    const filterAdminCommunities = async () => {
      // In a real implementation, you'd check the user's role in each community
      // For now, we'll assume user is admin of communities they created
      const adminComms = userCommunities.filter(community => 
        community.creatorId === currentUserId || 
        community.admins.includes(currentUserId)
      );
      setAdminCommunities(adminComms);
    };

    if (userCommunities.length > 0) {
      filterAdminCommunities();
    }
  }, [userCommunities, currentUserId]);

  const handleLinkActivity = async () => {
    if (!selectedCommunity) {
      alert('Please select a community');
      return;
    }

    try {
      const success = await linkActivityToCommunity(selectedCommunity, activityId, notes);
      
      if (success) {
        alert(`Successfully linked "${activityName}" to community!`);
        setShowModal(false);
        setSelectedCommunity('');
        setNotes('');
      }
    } catch (error) {
      console.error('Error linking activity:', error);
    }
  };

  // Don't show button if user has no admin communities
  if (adminCommunities.length === 0) {
    return null;
  }

  return (
    <>
      {/* Link to Community Button */}
      <button
        onClick={() => setShowModal(true)}
        className={`flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors ${className}`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        Link to Community
      </button>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Link Activity to Community</h3>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Linking <strong>{activityName}</strong> to a community
              </p>
            </div>

            {/* Community Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Community *
              </label>
              <select
                value={selectedCommunity}
                onChange={(e) => setSelectedCommunity(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
              >
                <option value="">Choose a community...</option>
                {adminCommunities.map(community => (
                  <option key={community.$id} value={community.$id}>
                    {community.name} ({community.type})
                  </option>
                ))}
              </select>
            </div>

            {/* Notes */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any community-specific notes about this activity..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleLinkActivity}
                disabled={loading || !selectedCommunity}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Linking...' : 'Link Activity'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};