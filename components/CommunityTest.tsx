
// components/CommunityTest.tsx - Create this file to test functionality
import React, { useState } from 'react';
import { useCommunities } from '../hooks/useCommunities';

export const CommunityTest: React.FC = () => {
  const { 
    checkCommunityCreationPermission, 
    searchCommunities, 
    communities,
    loading, 
    error 
  } = useCommunities();
  
  const [permissionResult, setPermissionResult] = useState<string>('');

  const testPermissions = async () => {
    const result = await checkCommunityCreationPermission();
    setPermissionResult(JSON.stringify(result, null, 2));
  };

  const testSearch = async () => {
    await searchCommunities();
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Community Feature Test</h2>
      
      {/* Permission Test */}
      <div className="mb-6 p-4 border rounded-lg">
        <h3 className="font-semibold mb-3">1. Test Community Creation Permission</h3>
        <button 
          onClick={testPermissions}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Check Permission
        </button>
        {permissionResult && (
          <pre className="mt-3 p-3 bg-gray-100 rounded text-sm overflow-auto">
            {permissionResult}
          </pre>
        )}
      </div>

      {/* Search Test */}
      <div className="mb-6 p-4 border rounded-lg">
        <h3 className="font-semibold mb-3">2. Test Community Search</h3>
        <button 
          onClick={testSearch}
          disabled={loading}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? 'Searching...' : 'Search Communities'}
        </button>
        <div className="mt-3">
          <p>Found {communities.length} communities</p>
          {communities.map(community => (
            <div key={community.$id} className="p-2 bg-gray-50 rounded mt-2">
              <strong>{community.name}</strong> - {community.type} - {community.memberCount} members
            </div>
          ))}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          <strong>Error:</strong> {error}
        </div>
      )}
    </div>
  );
};