// services/MembershipService.ts
import CommunityService from './useCommunities';
import { databases, DATABASE_ID, COMMUNITY_MEMBERS_COLLECTION_ID, Query, ID } from '@/lib/appwrite';

class MembershipService {
  private static cache = new Map<string, { result: boolean; timestamp: number }>();
  private static CACHE_DURATION = 30000; // 30 seconds

  static async checkMembership(communityId: string, userId: string): Promise<boolean> {
    const cacheKey = `${communityId}-${userId}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < this.CACHE_DURATION) {
      return cached.result;
    }

    try {
      // Check community_members collection first
      const membershipRecords = await databases.listDocuments(
        DATABASE_ID,
        COMMUNITY_MEMBERS_COLLECTION_ID,
        [
          Query.equal('communityId', communityId),
          Query.equal('userId', userId),
          Query.equal('status', 'active')
        ]
      );

      if (membershipRecords.documents.length > 0) {
        this.cache.set(cacheKey, { result: true, timestamp: Date.now() });
        return true;
      }

      // Fallback: Check community.members field for legacy data
      const community = await CommunityService.getCommunityById(communityId);
      if (community && community.members.includes(userId)) {
        // Repair: Create missing membership record
        await this.repairMembershipRecord(communityId, userId);
        this.cache.set(cacheKey, { result: true, timestamp: Date.now() });
        return true;
      }

      this.cache.set(cacheKey, { result: false, timestamp: Date.now() });
      return false;
    } catch (error) {
      console.error('Error checking membership:', error);
      return false;
    }
  }

  private static async repairMembershipRecord(communityId: string, userId: string): Promise<void> {
    try {
      await databases.createDocument(
        DATABASE_ID,
        COMMUNITY_MEMBERS_COLLECTION_ID,
        ID.unique(),
        {
          communityId,
          userId,
          role: 'member',
          status: 'active',
          joinedAt: new Date().toISOString(),
          notifications: true
        }
      );
    } catch (error) {
      // Silently fail - record might already exist
    }
  }

  static async getUserCommunities(userId: string): Promise<any[]> {
    try {
      return await CommunityService.getUserCommunities(userId);
    } catch (error) {
      console.error('Error getting user communities:', error);
      return [];
    }
  }

  static async joinCommunity(communityId: string, userId: string): Promise<any> {
    try {
      const result = await CommunityService.joinCommunity(communityId, userId);
      this.clearCache(communityId, userId);
      return result;
    } catch (error) {
      console.error('Error joining community:', error);
      throw error;
    }
  }

  static async leaveCommunity(communityId: string, userId: string): Promise<void> {
    try {
      await CommunityService.leaveCommunity(communityId, userId);
      this.clearCache(communityId, userId);
    } catch (error) {
      console.error('Error leaving community:', error);
      throw error;
    }
  }

  static async isUserCommunityAdmin(communityId: string, userId: string): Promise<boolean> {
    try {
      const community = await CommunityService.getCommunityById(communityId);
      if (!community) return false;
      
      return community.creatorId === userId || community.admins?.includes(userId);
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  }

  static async getMembershipRecord(communityId: string, userId: string): Promise<any | null> {
    try {
      const records = await databases.listDocuments(
        DATABASE_ID,
        COMMUNITY_MEMBERS_COLLECTION_ID,
        [
          Query.equal('communityId', communityId),
          Query.equal('userId', userId)
        ]
      );
      
      return records.documents[0] || null;
    } catch (error) {
      console.error('Error getting membership record:', error);
      return null;
    }
  }

  static clearCache(communityId?: string, userId?: string): void {
    if (communityId && userId) {
      this.cache.delete(`${communityId}-${userId}`);
    } else {
      this.cache.clear();
    }
  }

  static async refreshMembership(communityId: string, userId: string): Promise<boolean> {
    this.clearCache(communityId, userId);
    return await this.checkMembership(communityId, userId);
  }
}

export default MembershipService;