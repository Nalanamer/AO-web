// hooks/useUserProfiles.ts
import { useState, useEffect } from 'react';
import { databases, DATABASE_ID, USER_PROFILES_COLLECTION_ID, Query } from '../lib/appwrite';

interface UserProfile {
  $id: string;
  userId: string;
  name: string;
  displayName?: string;
  profileImageUrl?: string; // Ready for future implementation
}

interface UseUserProfilesResult {
  profiles: { [userId: string]: UserProfile };
  loading: boolean;
  error: string | null;
}

export const useUserProfiles = (userIds: string[]): UseUserProfilesResult => {
  const [profiles, setProfiles] = useState<{ [userId: string]: UserProfile }>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userIds || userIds.length === 0) {
      setProfiles({});
      setLoading(false);
      return;
    }

    const fetchProfiles = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Batch fetch user profiles
        const response = await databases.listDocuments(
          DATABASE_ID,
          USER_PROFILES_COLLECTION_ID,
          [
            Query.equal('userId', userIds),
            Query.limit(100) // Reasonable limit for event participants
          ]
        );

        // Convert to lookup object
        const profilesMap: { [userId: string]: UserProfile } = {};
        
        response.documents.forEach((doc: any) => {
          profilesMap[doc.userId] = {
            $id: doc.$id,
            userId: doc.userId,
            name: doc.name || 'Unknown User',
            displayName: doc.displayName,
            profileImageUrl: doc.profileImageUrl // Will be undefined for now
          };
        });

        setProfiles(profilesMap);
        console.log(`✅ Fetched ${response.documents.length} user profiles`);
      } catch (err) {
        console.error('❌ Error fetching user profiles:', err);
        setError('Failed to load participant information');
        
        // Create fallback profiles for error case
        const fallbackProfiles: { [userId: string]: UserProfile } = {};
        userIds.forEach((userId, index) => {
          fallbackProfiles[userId] = {
            $id: userId,
            userId: userId,
            name: `Participant ${index + 1}`
          };
        });
        setProfiles(fallbackProfiles);
      } finally {
        setLoading(false);
      }
    };

    fetchProfiles();
  }, [JSON.stringify(userIds)]); // Re-run when userIds array changes

  return { profiles, loading, error };
};

// Helper function to get display name with priority: displayName > name > fallback
export const getDisplayName = (profile: UserProfile | undefined, fallback: string = 'Unknown User'): string => {
  if (!profile) return fallback;
  return profile.displayName || profile.name || fallback;
};

// Helper function to get initials for avatar (when profileImageUrl is implemented)
export const getInitials = (profile: UserProfile | undefined): string => {
  if (!profile) return '?';
  const name = profile.displayName || profile.name || '';
  return name.split(' ').map(word => word.charAt(0)).join('').toUpperCase().slice(0, 2) || '?';
};