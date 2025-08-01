// hooks/useCommunities.ts - Complete Enhanced Version
import { useState, useEffect, useCallback } from 'react';
import CommunityService, { Community, CommunityMember, CommunityActivity } from '../services/useCommunities';
import { useAuth } from '../contexts/AuthContext';
import MembershipService from '../services/MembershipService';

interface CreateCommunityData {
  name: string;
  description: string;
  type: 'public' | 'private';
  location: {
    address: string;
    latitude: number;
    longitude: number;
    radius?: number;
  };
  activityTypes?: string[];
  avatar?: string;
  coverImage?: string;
  website?: string;
}

// Enhanced Community interface with metadata
interface EnhancedCommunity extends Community {
  hasLocationData?: boolean;
  distance?: number;
  upcomingEventCount?: number;
}

export const useCommunities = () => {
  const { user } = useAuth();
  const [communities, setCommunities] = useState<EnhancedCommunity[]>([]);
  const [userCommunities, setUserCommunities] = useState<EnhancedCommunity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper function: Calculate distance between two points
  const calculateDistance = useCallback((lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }, []);

  // Helper function: Enhance community with metadata
  const enhanceCommunityWithMetadata = useCallback(async (
    community: Community, 
    searchLocation?: { latitude: number; longitude: number }
  ): Promise<EnhancedCommunity> => {
    try {
      // Calculate upcoming events count
      let upcomingEventCount = 0;
      try {
        const events = await CommunityService.getCommunityEvents(community.$id!);
        const now = new Date();
        upcomingEventCount = events.filter(event => new Date(event.date) > now).length;
      } catch (error) {
        console.warn(`Failed to fetch events for community ${community.$id}:`, error);
      }

      // Determine if community has location data
      let hasLocationData = false;
      let distance = undefined;
      
      if (community.location?.latitude && community.location?.longitude) {
        hasLocationData = true;
        
        // Calculate distance from search location if provided
        if (searchLocation) {
          distance = calculateDistance(
            searchLocation.latitude,
            searchLocation.longitude,
            community.location.latitude,
            community.location.longitude
          );
        }
      }

      return {
        ...community,
        hasLocationData,
        distance,
        upcomingEventCount
      };
    } catch (error) {
      console.warn(`Failed to enhance community ${community.$id} with metadata:`, error);
      return {
        ...community,
        hasLocationData: false,
        upcomingEventCount: 0
      };
    }
  }, [calculateDistance]);

  // Fetch user's communities with location data
const fetchUserCommunities = useCallback(async (
  searchLocation?: { latitude: number; longitude: number }
) => {
  if (!user) {
    setUserCommunities([]);
    return;
  }

  try {
    setLoading(true);
    setError(null);
    
    const userComms = await MembershipService.getUserCommunities(user.$id);
    
    const enhancedUserCommunities = await Promise.all(
      userComms.map(community => enhanceCommunityWithMetadata(community, searchLocation))
    );
    
    setUserCommunities(enhancedUserCommunities);
    
  } catch (err) {
    console.error('Error fetching user communities:', err);
    setError('Failed to load your communities');
  } finally {
    setLoading(false);
  }
}, [user?.$id, enhanceCommunityWithMetadata]);

  // Search communities with enhanced metadata
  const searchCommunities = useCallback(async (
    query?: string,
    type?: 'public' | 'private',
    limit: number = 20,
    searchLocation?: { latitude: number; longitude: number }
  ) => {
    try {
      setLoading(true);
      setError(null);
      const results = await CommunityService.searchCommunities(query, type, limit);
      
      // Enhance with metadata (including distance calculation)
      const enhancedResults = await Promise.all(
        results.map(community => enhanceCommunityWithMetadata(community, searchLocation))
      );
      
      setCommunities(enhancedResults);
      return enhancedResults;
    } catch (err) {
      console.error('❌ Error searching communities:', err);
      setError('Failed to search communities');
      return [];
    } finally {
      setLoading(false);
    }
  }, [enhanceCommunityWithMetadata]);

  // Create community
  const createCommunity = useCallback(async (communityData: CreateCommunityData): Promise<Community | null> => {
    if (!user) {
      setError('You must be logged in to create a community');
      return null;
    }

    try {
      setLoading(true);
      setError(null);
      
      const newCommunity = await CommunityService.createCommunity(user.$id, communityData);
      
      // Refresh user communities
      await fetchUserCommunities();
      
      return newCommunity;
    } catch (err: any) {
      console.error('❌ Error creating community:', err);
      setError(err.message || 'Failed to create community');
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, fetchUserCommunities]);

  // Join community
  // Replace your existing joinCommunity method:
const joinCommunity = useCallback(async (communityId: string): Promise<{ success: boolean; status: string } | null> => {
  if (!user) {
    setError('You must be logged in to join a community');
    return null;
  }

  try {
    setLoading(true);
    setError(null);
    
    const result = await MembershipService.joinCommunity(communityId, user.$id);
    
    if (result.success && result.status === 'joined') {
      await fetchUserCommunities();
    }
    
    return result;
  } catch (err: any) {
    console.error('Error joining community:', err);
    setError(err.message || 'Failed to join community');
    return null;
  } finally {
    setLoading(false);
  }
}, [user?.$id, fetchUserCommunities]);


const leaveCommunity = useCallback(async (communityId: string): Promise<boolean> => {
  if (!user) {
    setError('You must be logged in to leave a community');
    return false;
  }

  try {
    setLoading(true);
    setError(null);
    
    await MembershipService.leaveCommunity(communityId, user.$id);
    await fetchUserCommunities();
    
    return true;
  } catch (err: any) {
    console.error('Error leaving community:', err);
    setError(err.message || 'Failed to leave community');
    return false;
  } finally {
    setLoading(false);
  }
}, [user?.$id, fetchUserCommunities]);

  // Link activity to community
  const linkActivityToCommunity = useCallback(async (
    communityId: string, 
    activityId: string, 
    notes?: string
  ): Promise<boolean> => {
    if (!user) {
      setError('You must be logged in');
      return false;
    }

    try {
      setLoading(true);
      setError(null);
      
      await CommunityService.linkActivityToCommunity(communityId, activityId, user.$id, notes);
      
      return true;
    } catch (err: any) {
      console.error('❌ Error linking activity:', err);
      setError(err.message || 'Failed to link activity to community');
      return false;
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Check community creation permission
  const checkCommunityCreationPermission = useCallback(async (): Promise<{ allowed: boolean; reason?: string }> => {
    if (!user) {
      return { allowed: false, reason: 'You must be logged in' };
    }

    try {
      return await CommunityService.checkCreatePermission(user.$id);
    } catch (err) {
      return { allowed: false, reason: 'Error checking permissions' };
    }
  }, [user]);

  // Auto-fetch user communities when user changes
  useEffect(() => {
    if (user) {
      fetchUserCommunities();
    } else {
      setUserCommunities([]);
    }
  }, [user, fetchUserCommunities]);

  return {
    // State
    communities,
    userCommunities,
    loading,
    error,
    
    // Actions
    fetchUserCommunities,
    searchCommunities,
    createCommunity,
    joinCommunity,
    linkActivityToCommunity,
    checkCommunityCreationPermission,
    leaveCommunity,
    
    // Utility
    clearError: () => setError(null)
  };
};