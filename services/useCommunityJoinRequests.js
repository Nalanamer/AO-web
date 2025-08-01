// services/useCommunityJoinRequests.js
import { 
  databases, 
  DATABASE_ID, 
  COMMUNITIES_COLLECTION_ID,
  COMMUNITY_JOIN_REQUESTS_COLLECTION_ID, 
  COMMUNITY_NOTIFICATIONS_COLLECTION_ID, 
  COMMUNITY_MEMBERS_COLLECTION_ID,  // ✅ ADD THIS
  USER_PROFILES_COLLECTION_ID, 
  Query 
} from '@/lib/appwrite';
import { ID } from 'appwrite';

//const COMMUNITY_JOIN_REQUESTS_COLLECTION_ID = 'community_join_requests'; // You'll need to create this collection
//const COMMUNITY_NOTIFICATIONS_COLLECTION_ID = 'community_notifications'; // You'll need to create this collection

class CommunityJoinRequestService {
  
  // Submit a join request for private community
 async submitJoinRequest(communityId, userId) {
  try {
    // Check if request already exists
    const existingRequests = await databases.listDocuments(
      DATABASE_ID,
      COMMUNITY_JOIN_REQUESTS_COLLECTION_ID,
      [
        Query.equal('communityId', communityId),
        Query.equal('userId', userId),
        Query.equal('status', 'pending') // ✅ Only check for pending requests
      ]
    );

    if (existingRequests.documents.length > 0) {
      throw new Error('Join request already pending');
    }

    // ✅ Also check for recent rejected requests (optional cooldown)
    const recentRejected = await databases.listDocuments(
      DATABASE_ID,
      COMMUNITY_JOIN_REQUESTS_COLLECTION_ID,
      [
        Query.equal('communityId', communityId),
        Query.equal('userId', userId),
        Query.equal('status', 'rejected'),
        Query.orderDesc('respondedAt'),
        Query.limit(1)
      ]
    );

    if (recentRejected.documents.length > 0) {
      const lastRejection = recentRejected.documents[0];
      const rejectedDate = new Date(lastRejection.respondedAt);
      const daysSinceRejection = (Date.now() - rejectedDate.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysSinceRejection < 1) { // 1-day cooldown
        throw new Error('You must wait 24 hours before requesting to join again after rejection');
      }
    }

    // Create join request (this will create a new request even if previous ones were rejected)
    const joinRequest = await databases.createDocument(
      DATABASE_ID,
      COMMUNITY_JOIN_REQUESTS_COLLECTION_ID,
      ID.unique(),
      {
        communityId,
        userId,
        status: 'pending',
        requestedAt: new Date().toISOString(),
        message: '' // Optional message from user
      }
    );

    // Get community details for notification
    const community = await databases.getDocument(
      DATABASE_ID,
      COMMUNITIES_COLLECTION_ID,
      communityId
    );

    // Get user profile
    const userProfiles = await databases.listDocuments(
      DATABASE_ID,
      USER_PROFILES_COLLECTION_ID,
      [Query.equal('userId', userId)]
    );

    const userProfile = userProfiles.documents[0];

    // Create notifications for all admins
    const adminIds = [community.creatorId, ...(community.admins || [])];
    const uniqueAdminIds = [...new Set(adminIds)];

    for (const adminId of uniqueAdminIds) {
      await databases.createDocument(
        DATABASE_ID,
        COMMUNITY_NOTIFICATIONS_COLLECTION_ID,
        ID.unique(),
        {
          recipientId: adminId,  // ✅ FIXED: Use recipientId instead of userId
          senderId: userId,      // ✅ ADDED: Required field
          senderName: userProfile?.name || 'Unknown User', // ✅ ADDED: Required field
          type: 'community_join_request',
          title: `Join Request - ${community.name}`, // ✅ ADDED: Required field
          message: `${userProfile?.name || 'A user'} has requested to join your community "${community.name}"`,
          data: JSON.stringify({
            communityId,
            requesterId: userId,
            requesterName: userProfile?.name,
            requesterEmail: userProfile?.email,
            joinRequestId: joinRequest.$id
          }),
          read: false,
          createdAt: new Date().toISOString()
        }
      );
    }

    return joinRequest;

  } catch (error) {
    console.error('Error submitting join request:', error);
    throw error;
  }
}

  // Cancel a join request (by the user who made it)
  async cancelJoinRequest(communityId, userId) {
    try {
      const requests = await databases.listDocuments(
        DATABASE_ID,
        COMMUNITY_JOIN_REQUESTS_COLLECTION_ID,
        [
          Query.equal('communityId', communityId),
          Query.equal('userId', userId),
          Query.equal('status', 'pending')
        ]
      );

      if (requests.documents.length === 0) {
        throw new Error('No pending join request found');
      }

      // Update request status to cancelled
      await databases.updateDocument(
        DATABASE_ID,
        COMMUNITY_JOIN_REQUESTS_COLLECTION_ID,
        requests.documents[0].$id,
        {
          status: 'cancelled',
          respondedAt: new Date().toISOString()
        }
      );

      return true;
    } catch (error) {
      console.error('Error cancelling join request:', error);
      throw error;
    }
  }

  // Approve/reject join request (by admin)
 async respondToJoinRequest(joinRequestId, action, adminId) {
  console.log('🏢 === COMMUNITY JOIN REQUEST SERVICE DEBUG ===');
  console.log('📋 Join Request ID:', joinRequestId);
  console.log('🎯 Action received:', action);
  console.log('👤 Admin ID:', adminId);
  
  try {
    // Get the join request
    const joinRequest = await databases.getDocument(
      DATABASE_ID,
      COMMUNITY_JOIN_REQUESTS_COLLECTION_ID,
      joinRequestId
    );

    // Get the community
    const community = await databases.getDocument(
      DATABASE_ID,
      COMMUNITIES_COLLECTION_ID,
      joinRequest.communityId
    );

    // Get user profile for notifications
    const userProfiles = await databases.listDocuments(
      DATABASE_ID,
      USER_PROFILES_COLLECTION_ID,
      [Query.equal('userId', joinRequest.userId)]
    );
    const userProfile = userProfiles.documents[0];

    // ✅ FIXED: Check for 'approved' instead of 'approve'
   if (action === 'approved') {
  // Handle members array conversion
  let currentMembers = [];
  try {
    currentMembers = typeof community.members === 'string' 
      ? JSON.parse(community.members) 
      : (Array.isArray(community.members) ? community.members : []);
  } catch (e) {
    console.warn('Failed to parse members, using empty array');
    currentMembers = [];
  }

  // ✅ FIXED: If user is already a member, just update the request status
  if (currentMembers.includes(joinRequest.userId)) {
    console.log('ℹ️ User is already a member, just updating request status');
    // Don't throw error, just skip the member addition and continue to update request status
  } else {
    // Add new member only if not already a member
    const updatedMembers = [...currentMembers, joinRequest.userId];

    // Update community with JSON string AND member count
    await databases.updateDocument(
      DATABASE_ID,
      COMMUNITIES_COLLECTION_ID,
      joinRequest.communityId,
      {
        members: JSON.stringify(updatedMembers),
        memberCount: updatedMembers.length,
        updatedAt: new Date().toISOString()
      }
    );

    // Create member record in community_members collection
    await databases.createDocument(
      DATABASE_ID,
      COMMUNITY_MEMBERS_COLLECTION_ID,
      ID.unique(),
      {
        communityId: joinRequest.communityId,
        userId: joinRequest.userId,
        role: 'member',
        status: 'active',
        joinedAt: new Date().toISOString(),
        notifications: true
      }
    );
  }
}

    // ✅ FIXED: Use 'approved' instead of 'approve'
    const newStatus = action === 'approved' ? 'approved' : 'rejected';
    console.log('🔄 About to update status to:', newStatus);
    
    await databases.updateDocument(
      DATABASE_ID,
      COMMUNITY_JOIN_REQUESTS_COLLECTION_ID,
      joinRequestId,
      {
        status: newStatus,
        respondedAt: new Date().toISOString(),
        respondedBy: adminId
      }
    );

    // ✅ FIXED: Use 'approved' in notification logic
    await databases.createDocument(
      DATABASE_ID,
      COMMUNITY_NOTIFICATIONS_COLLECTION_ID,
      ID.unique(),
      {
        recipientId: joinRequest.userId,
        senderId: adminId,
        senderName: 'Community Admin',
        type: action === 'approved' ? 'community_join_approved' : 'community_join_rejected',
        title: `Join Request ${action === 'approved' ? 'Approved' : 'Rejected'}`,
        message: `Your request to join "${community.name}" has been ${action === 'approved' ? 'approved' : 'rejected'}.`,
        data: JSON.stringify({
          communityId: joinRequest.communityId,
          communityName: community.name
        }),
        read: false,
        createdAt: new Date().toISOString()
      }
    );

    console.log('✅ Join request processed successfully!');

    return {
      success: true,
      action,
      communityName: community.name,
      userName: userProfile?.name || 'Unknown User'
    };

  } catch (error) {
    console.error('💥 Error in respondToJoinRequest:', error);
    throw error;
  }
}

  // Get pending join requests for a community (for admins)
  async getPendingJoinRequests(communityId) {
    try {
      const requests = await databases.listDocuments(
        DATABASE_ID,
        COMMUNITY_JOIN_REQUESTS_COLLECTION_ID,
        [
          Query.equal('communityId', communityId),
          Query.equal('status', 'pending'),
          Query.orderDesc('requestedAt')
        ]
      );

      // Get user profiles for each request
      const requestsWithProfiles = await Promise.all(
        requests.documents.map(async (request) => {
          try {
            const userProfiles = await databases.listDocuments(
              DATABASE_ID,
              USER_PROFILES_COLLECTION_ID,
              [Query.equal('userId', request.userId)]
            );

            return {
              ...request,
              userProfile: userProfiles.documents[0] || null
            };
          } catch (error) {
            console.warn('Could not load profile for user:', request.userId);
            return {
              ...request,
              userProfile: null
            };
          }
        })
      );

      return requestsWithProfiles;

    } catch (error) {
      console.error('Error getting pending join requests:', error);
      return [];
    }
  }

  // Get user's join request status for a community
  async getUserJoinRequestStatus(communityId, userId) {
    try {
      const requests = await databases.listDocuments(
        DATABASE_ID,
        COMMUNITY_JOIN_REQUESTS_COLLECTION_ID,
        [
          Query.equal('communityId', communityId),
          Query.equal('userId', userId),
          Query.orderDesc('requestedAt'),
          Query.limit(1)
        ]
      );

      return requests.documents[0] || null;
    } catch (error) {
      console.error('Error getting user join request status:', error);
      return null;
    }
  }

  // Auto-approve all pending requests when community becomes public
  async autoApproveAllPendingRequests(communityId) {
    try {
      const pendingRequests = await databases.listDocuments(
        DATABASE_ID,
        COMMUNITY_JOIN_REQUESTS_COLLECTION_ID,
        [
          Query.equal('communityId', communityId),
          Query.equal('status', 'pending')
        ]
      );

      const community = await databases.getDocument(
        DATABASE_ID,
        COMMUNITIES_COLLECTION_ID,
        communityId
      );

      for (const request of pendingRequests.documents) {
        // Approve the request
        await databases.updateDocument(
          DATABASE_ID,
          COMMUNITY_JOIN_REQUESTS_COLLECTION_ID,
          request.$id,
          {
            status: 'approved',
            respondedAt: new Date().toISOString(),
            respondedBy: 'system_auto_approval'
          }
        );

        // Add user to community
        const currentMembers = community.members || [];
        if (!currentMembers.includes(request.userId)) {
          await databases.updateDocument(
            DATABASE_ID,
            COMMUNITIES_COLLECTION_ID,
            communityId,
            {
              members: [...currentMembers, request.userId],
              memberCount: (community.memberCount || 0) + 1
            }
          );
        }

        // Notify user of auto-approval
        await databases.createDocument(
          DATABASE_ID,
          COMMUNITY_NOTIFICATIONS_COLLECTION_ID,
          ID.unique(),
          {
            type: 'community_join_approved',
            communityId,
            communityName: community.name,
            userId: request.userId,
            message: `Your request to join "${community.name}" has been automatically approved as the community is now public`,
            read: false,
            createdAt: new Date().toISOString(),
            data: JSON.stringify({
              action: 'approved',
              reason: 'community_made_public'
            })
          }
        );
      }

      return pendingRequests.documents.length;

    } catch (error) {
      console.error('Error auto-approving requests:', error);
      throw error;
    }
  }
}

export default new CommunityJoinRequestService();