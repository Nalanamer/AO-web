
// services/useCommunities.ts sometimes refered to as CommunityService
import { 
  databases, 
  DATABASE_ID, 
  COMMUNITIES_COLLECTION_ID,
  COMMUNITY_MEMBERS_COLLECTION_ID,
  COMMUNITY_ACTIVITIES_COLLECTION_ID,
  COMMUNITY_POSTS_COLLECTION_ID, // Make sure this exists
  COMMENTS_COLLECTION_ID,         // Add this if missing
  USER_SUBSCRIPTIONS_COLLECTION_ID,
    USER_PROFILES_COLLECTION_ID, 
  EVENTS_COLLECTION_ID,
  Query,
  ID
} from '../lib/appwrite';
import { Permission, Role } from 'appwrite';
// Database interface (how data is stored in Appwrite)
export interface CommunityDocument {
  $id?: string;
  name: string;
  description: string;
  type: 'public' | 'private';
  location: string; // JSON string
  creatorId: string;
  admins: string; // JSON string
  members: string; // JSON string
  pendingMembers: string; // JSON string
  activityTypes: string; // JSON string
  avatar?: string;
  coverImage?: string;
  website?: string;
  isActive: boolean;
  memberCount: number;
  activityCount: number;
  eventCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CommunitySettings {
  allowMemberEvents: boolean; // If false, only admins can create events
  requireEventApproval: boolean; // Future feature
  defaultEventVisibility: 'public' | 'community_only';
}


// Application interface (parsed for use in components)
export interface Community {
  $id?: string;
  name: string;
  description: string;
  type: 'public' | 'private';
  location: {
    address: string;
    latitude: number;
    longitude: number;
    radius?: number;
  };
  creatorId: string;
  admins: string[];
  members: string[];
  pendingMembers: string[];
  activityTypes: string[];
  avatar?: string;
  coverImage?: string;
  website?: string;
  isActive: boolean;
  memberCount: number;
  activityCount: number;
  eventCount: number;
  createdAt: string;
  updatedAt: string;
  settings?: {
    allowMemberEvents?: boolean;
    onlyAdminsCanCreateEvents?: boolean; // Add this line
    requireEventApproval?: boolean;
    defaultEventVisibility?: 'public' | 'community_only';
  };
}

export interface CommunityMember {
  $id?: string;
  communityId: string;
  userId: string;
  role: 'owner' | 'admin' | 'member';
  status: 'active' | 'pending' | 'rejected';
  joinedAt: string;
  invitedBy?: string;
  lastActiveAt?: string;
  notifications: boolean;
}

export interface CommunityActivity {
  $id?: string;
  communityId: string;
  activityId: string;
  addedBy: string;
  isPinned: boolean;
  notes?: string;
  isVisible: boolean;
  createdAt: string;
  updatedAt: string;
}

// Add this interface with your other interfaces (near Community, CommunityActivity)
export interface CommunityPost {
  $id?: string;
  communityId: string;
  authorId: string;
  authorName: string;
  content: string;
  type: 'post' | 'announcement';
  isPinned?: boolean;
  likeCount: number;
  commentCount: number;
  
  images?: string;
  createdAt: string;
  updatedAt: string;
}

class CommunityService {

    

    // Add this method to CommunityService class
static async searchCommunityPosts(communityId: string, searchTerm: string): Promise<any[]> {
  try {
    const result = await databases.listDocuments(
      DATABASE_ID,
      COMMUNITY_POSTS_COLLECTION_ID,
      [
        Query.equal('communityId', communityId),
        Query.search('content', searchTerm),
        Query.orderDesc('isPinned'),
        Query.orderDesc('createdAt')
      ]
    );
    return result.documents;
  } catch (error) {
    console.error('❌ Error searching community posts:', error);
    return [];
  }
}


// ADD these methods to your existing CommunityService class in useCommunities.ts

// === ADMIN MANAGEMENT METHODS ===

static async checkUserExists(email: string): Promise<boolean> {
  try {
    const users = await databases.listDocuments(
      DATABASE_ID,
      USER_PROFILES_COLLECTION_ID,
      [Query.equal('email', email)]
    );
    return users.documents.length > 0;
  } catch (error) {
    console.error('Error checking user existence:', error);
    return false;
  }
}

static async inviteAdmin(communityId: string, email: string, invitedBy: string): Promise<void> {
  try {
    // Check if community exists and user has permission
    const community = await this.getCommunityById(communityId);
    if (!community) throw new Error('Community not found');
    
    const isOwner = community.creatorId === invitedBy;
    if (!isOwner) throw new Error('Only community owners can invite admins');
    
    // Check admin limit (10 max)
    if (community.admins.length >= 10) {
      throw new Error('Maximum 10 admins allowed per community');
    }
    
    // Check if user exists
    const userExists = await this.checkUserExists(email);
    if (!userExists) throw new Error('User with this email does not exist');
    
    // Get user ID
    const users = await databases.listDocuments(
      DATABASE_ID,
      USER_PROFILES_COLLECTION_ID,
      [Query.equal('email', email)]
    );
    const targetUser = users.documents[0];
    
    // Check if already admin
    if (community.admins.includes(targetUser.userId)) {
      throw new Error('User is already an admin of this community');
    }
    
    // Generate invite token
    const inviteToken = ID.unique();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    // Create invite record (you'll need to create this collection)
    await databases.createDocument(
      DATABASE_ID,
      'community_invites', // Create this collection
      ID.unique(),
      {
        communityId,
        email,
        invitedBy,
        invitedUserId: targetUser.userId,
        role: 'admin',
        status: 'pending',
        inviteToken,
        expiresAt: expiresAt.toISOString(),
        createdAt: new Date().toISOString()
      }
    );

    // Create notification
    await databases.createDocument(
      DATABASE_ID,
      'notifications',
      ID.unique(),
      {
        recipientId: targetUser.userId,
        senderId: invitedBy,
        senderName: 'Community Admin',
        type: 'community_admin_invite',
        title: 'Community Admin Invitation',
        message: `You've been invited to be an admin of ${community.name}`,
        data: JSON.stringify({
          communityId,
          communityName: community.name,
          inviteToken,
          type: 'admin_invite'
        }),
        read: false,
        createdAt: new Date().toISOString()
      }
    );

    // Update user's pending invite count
    await databases.updateDocument(
      DATABASE_ID,
      USER_PROFILES_COLLECTION_ID,
      targetUser.$id,
      {
        pendingCommunityInvites: (targetUser.pendingCommunityInvites || 0) + 1
      }
    );
  } catch (error) {
    console.error('Error inviting admin:', error);
    throw error;
  }
}

static async getPendingInvites(communityId: string): Promise<any[]> {
  try {
    const invites = await databases.listDocuments(
      DATABASE_ID,
      'community_invites',
      [
        Query.equal('communityId', communityId),
        Query.equal('status', 'pending'),
        Query.orderDesc('createdAt')
      ]
    );
    return invites.documents;
  } catch (error) {
    console.error('Error fetching pending invites:', error);
    return [];
  }
}

static async cancelInvite(inviteId: string): Promise<void> {
  try {
    await databases.updateDocument(
      DATABASE_ID,
      'community_invites',
      inviteId,
      {
        status: 'cancelled',
        respondedAt: new Date().toISOString()
      }
    );
  } catch (error) {
    console.error('Error cancelling invite:', error);
    throw error;
  }
}

static async removeAdmin(communityId: string, adminId: string): Promise<void> {
  try {
    // Get current community
    const community = await this.getCommunityById(communityId);
    if (!community) throw new Error('Community not found');

    // Remove admin from admins array
    const updatedAdmins = community.admins.filter(existingAdminId => existingAdminId !== adminId);

    // Update community document
    await databases.updateDocument(
      DATABASE_ID,
      COMMUNITIES_COLLECTION_ID,
      communityId,
      {
        admins: JSON.stringify(updatedAdmins),
        updatedAt: new Date().toISOString()
      }
    );

    // Update user's admin communities list
    const userProfile = await databases.listDocuments(
      DATABASE_ID,
      USER_PROFILES_COLLECTION_ID,
      [Query.equal('userId', adminId)]
    );

    if (userProfile.documents.length > 0) {
      const profile = userProfile.documents[0];
    const updatedAdminCommunities = [];
const currentList = profile.adminOfCommunities || [];
for (let i = 0; i < currentList.length; i++) {
  if (currentList[i] !== communityId) {
    updatedAdminCommunities.push(currentList[i]);
  }
}
  
      await databases.updateDocument(
        DATABASE_ID,
        USER_PROFILES_COLLECTION_ID,
        profile.$id,
        {
          adminOfCommunities: updatedAdminCommunities
        }
      );
    }
  } catch (error) {
    console.error('Error removing admin:', error);
    throw error;
  }
}
// === NOTIFICATION METHODS ===

static async getUserNotifications(userId: string): Promise<any[]> {
  try {
    // Get general notifications
    const notifications = await databases.listDocuments(
      DATABASE_ID,
      'notifications',
      [
        Query.equal('recipientId', userId),
        Query.contains('type', 'community'),
        Query.orderDesc('createdAt'),
        Query.limit(50)
      ]
    );

    let allNotifications = [...notifications.documents];
    
    try {
      const invites = await databases.listDocuments(
        DATABASE_ID,
        'community_invites',
        [
          Query.equal('invitedUserId', userId),
          Query.equal('status', 'pending'),
          Query.orderDesc('createdAt')
        ]
      );
      
      // Simple approach: Add invites as-is and enhance later
      allNotifications = [...allNotifications, ...invites.documents];
    } catch (error) {
      console.warn('Could not load community invites:', error);
    }

    // Process all notifications and add community names
    const processedNotifications = [];
    for (const notification of allNotifications) {
      const data = notification.data ? JSON.parse(notification.data) : {};
      
      // If this is a community invite, get the community name
      let communityName = data.communityName || 'Unknown Community';
      if (notification.communityId) {
        try {
          const community = await this.getCommunityById(notification.communityId);
          communityName = community?.name || 'Unknown Community';
        } catch (error) {
          console.warn('Could not load community name');
        }
      }
      
      processedNotifications.push({
        ...notification,
        ...data,
        communityName: communityName,
        type: notification.inviteToken ? 'community_admin_invite' : notification.type
      });
    }

    return processedNotifications.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch (error) {
    console.error('Error fetching user notifications:', error);
    return [];
  }
}
static async leaveCommunity(communityId: string, userId: string): Promise<void> {
  try {
    // Remove user from community members
    const community = await this.getCommunityById(communityId);
    if (!community) throw new Error('Community not found');

    const updatedMembers = community.members.filter(memberId => memberId !== userId);

    // Update community document
    await databases.updateDocument(
      DATABASE_ID,
      COMMUNITIES_COLLECTION_ID,
      communityId,
      {
        members: JSON.stringify(updatedMembers),
        memberCount: Math.max(0, community.memberCount - 1),
        updatedAt: new Date().toISOString()
      }
    );

    // Remove membership record
    const memberships = await databases.listDocuments(
      DATABASE_ID,
      COMMUNITY_MEMBERS_COLLECTION_ID,
      [
        Query.equal('communityId', communityId),
        Query.equal('userId', userId)
      ]
    );

    if (memberships.documents.length > 0) {
      await databases.deleteDocument(
        DATABASE_ID,
        COMMUNITY_MEMBERS_COLLECTION_ID,
        memberships.documents[0].$id
      );
    }
  } catch (error) {
    console.error('Error leaving community:', error);
    throw error;
  }
}

static async getPendingNotificationCount(userId: string): Promise<number> {
  try {
    const notifications = await databases.listDocuments(
      DATABASE_ID,
      'notifications',
      [
        Query.equal('recipientId', userId),
        Query.contains('type', 'community'),
        Query.equal('read', false)
      ]
    );
    return notifications.documents.length;
  } catch (error) {
    console.error('Error fetching notification count:', error);
    return 0;
  }
}

static async respondToAdminInvite(inviteToken: string, action: 'accept' | 'reject'): Promise<void> {
  try {
    // Find the invite
    const invites = await databases.listDocuments(
      DATABASE_ID,
      'community_invites',
      [Query.equal('inviteToken', inviteToken)]
    );

    if (invites.documents.length === 0) {
      throw new Error('Invite not found');
    }

    const invite = invites.documents[0];

    // Update invite status
    await databases.updateDocument(
      DATABASE_ID,
      'community_invites',
      invite.$id,
      {
        status: action === 'accept' ? 'accepted' : 'rejected',
        respondedAt: new Date().toISOString()
      }
    );

    if (action === 'accept') {
      // Add user as admin to community
      const community = await this.getCommunityById(invite.communityId);
      if (community) {
        const updatedAdmins = [...community.admins, invite.invitedUserId];

        await databases.updateDocument(
          DATABASE_ID,
          COMMUNITIES_COLLECTION_ID,
          invite.communityId,
          {
            admins: JSON.stringify(updatedAdmins),
            updatedAt: new Date().toISOString()
          }
        );

        // Update user's admin communities list
        const userProfile = await databases.listDocuments(
          DATABASE_ID,
          USER_PROFILES_COLLECTION_ID,
          [Query.equal('userId', invite.invitedUserId)]
        );

        if (userProfile.documents.length > 0) {
          const profile = userProfile.documents[0];
          const updatedAdminCommunities = [
            ...(profile.adminOfCommunities || []),
            invite.communityId
          ];

          await databases.updateDocument(
            DATABASE_ID,
            USER_PROFILES_COLLECTION_ID,
            profile.$id,
            {
              adminOfCommunities: updatedAdminCommunities,
              pendingCommunityInvites: Math.max(0, (profile.pendingCommunityInvites || 1) - 1)
            }
          );
        }
      }
    }

    // Mark related notification as read
    const notifications = await databases.listDocuments(
      DATABASE_ID,
      'notifications',
      [
        Query.equal('recipientId', invite.invitedUserId),
        Query.contains('data', inviteToken)
      ]
    );

    if (notifications.documents.length > 0) {
      await databases.updateDocument(
        DATABASE_ID,
        'notifications',
        notifications.documents[0].$id,
        {
          read: true
        }
      );
    }
  } catch (error) {
    console.error('Error responding to admin invite:', error);
    throw error;
  }
}

static async markNotificationAsRead(notificationId: string): Promise<void> {
  try {
    await databases.updateDocument(
      DATABASE_ID,
      'notifications',
      notificationId,
      {
        read: true
      }
    );
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
}

// === COMMUNITY SETTINGS METHODS ===

static async updateCommunitySettings(communityId: string, settings: any): Promise<void> {
  try {
    await databases.updateDocument(
      DATABASE_ID,
      COMMUNITIES_COLLECTION_ID,
      communityId,
      {
        settings: JSON.stringify(settings),
        updatedAt: new Date().toISOString()
      }
    );
  } catch (error) {
    console.error('Error updating community settings:', error);
    throw error;
  }
}

// === MEMBERSHIP APPROVAL METHODS ===

static async getPendingMembers(communityId: string): Promise<any[]> {
  try {
    const members = await databases.listDocuments(
      DATABASE_ID,
      COMMUNITY_MEMBERS_COLLECTION_ID,
      [
        Query.equal('communityId', communityId),
        Query.equal('status', 'pending'),
        Query.orderDesc('joinedAt')
      ]
    );
    return members.documents;
  } catch (error) {
    console.error('Error fetching pending members:', error);
    return [];
  }
}

static async approveMember(communityId: string, userId: string): Promise<void> {
  try {
    // Update member status
    const members = await databases.listDocuments(
      DATABASE_ID,
      COMMUNITY_MEMBERS_COLLECTION_ID,
      [
        Query.equal('communityId', communityId),
        Query.equal('userId', userId)
      ]
    );

    if (members.documents.length > 0) {
      await databases.updateDocument(
        DATABASE_ID,
        COMMUNITY_MEMBERS_COLLECTION_ID,
        members.documents[0].$id,
        {
          status: 'active'
        }
      );
    }

    // Update community member count
    await this.updateMemberCount(communityId, 1);

    // Get community info for notification
    const community = await this.getCommunityById(communityId);

    // Send approval notification
    await databases.createDocument(
      DATABASE_ID,
      'notifications',
      ID.unique(),
      {
        recipientId: userId,
        senderId: 'system',
        senderName: 'System',
        type: 'community_join_approved',
        title: 'Community Join Request Approved',
        message: `Your request to join ${community?.name} has been approved!`,
        data: JSON.stringify({
          communityId,
          communityName: community?.name
        }),
        read: false,
        createdAt: new Date().toISOString()
      }
    );
  } catch (error) {
    console.error('Error approving member:', error);
    throw error;
  }
}

static async rejectMember(communityId: string, userId: string): Promise<void> {
  try {
    // Remove member record
    const members = await databases.listDocuments(
      DATABASE_ID,
      COMMUNITY_MEMBERS_COLLECTION_ID,
      [
        Query.equal('communityId', communityId),
        Query.equal('userId', userId)
      ]
    );

    if (members.documents.length > 0) {
      await databases.deleteDocument(
        DATABASE_ID,
        COMMUNITY_MEMBERS_COLLECTION_ID,
        members.documents[0].$id
      );
    }

    // Get community info for notification
    const community = await this.getCommunityById(communityId);

    // Send rejection notification
    await databases.createDocument(
      DATABASE_ID,
      'notifications',
      ID.unique(),
      {
        recipientId: userId,
        senderId: 'system',
        senderName: 'System',
        type: 'community_join_rejected',
        title: 'Community Join Request Rejected',
        message: `Your request to join ${community?.name} was not approved.`,
        data: JSON.stringify({
          communityId,
          communityName: community?.name
        }),
        read: false,
        createdAt: new Date().toISOString()
      }
    );
  } catch (error) {
    console.error('Error rejecting member:', error);
    throw error;
  }
}

// Add this method to CommunityService class
static async pinPost(postId: string, isPermanent: boolean = false, duration?: number): Promise<void> {
  try {
    const updateData: any = {
      isPinned: true,
      updatedAt: new Date().toISOString()
    };

    if (!isPermanent && duration) {
      // For temporary pins (e.g., 7 days)
      const pinnedUntil = new Date();
      pinnedUntil.setDate(pinnedUntil.getDate() + (duration || 7));
      updateData.pinnedUntil = pinnedUntil.toISOString();
    }

    await databases.updateDocument(
      DATABASE_ID,
      COMMUNITY_POSTS_COLLECTION_ID,
      postId,
      updateData
    );
  } catch (error) {
    console.error('❌ Error pinning post:', error);
    throw error;
  }
}


// Add this method to CommunityService class
static async unpinPost(postId: string): Promise<void> {
  try {
    await databases.updateDocument(
      DATABASE_ID,
      COMMUNITY_POSTS_COLLECTION_ID,
      postId,
      {
        isPinned: false,
        pinnedUntil: null,
        updatedAt: new Date().toISOString()
      }
    );
  } catch (error) {
    console.error('❌ Error unpinning post:', error);
    throw error;
  }
}

// Add this method to your CommunityService class
static async deletePost(postId: string): Promise<void> {
  try {
    await databases.deleteDocument(
      DATABASE_ID,
      COMMUNITY_POSTS_COLLECTION_ID,
      postId
    );
  } catch (error) {
    console.error('❌ Error deleting post:', error);
    throw error;
  }
}

  // Create community (Pro+ only)
  static async createCommunity(userId: string, communityData: Partial<Community>): Promise<Community> {
    try {
      // Check Pro+ subscription
      const canCreate = await this.checkCreatePermission(userId);
      if (!canCreate.allowed) {
        throw new Error(canCreate.reason);
      }

      // Validate data
      this.validateCommunityData(communityData);

      // Check unique name
      const nameExists = await this.checkNameExists(communityData.name!);
      if (nameExists) {
        throw new Error('A community with this name already exists');
      }

      const now = new Date().toISOString();
      
      const communityDocument: Omit<CommunityDocument, '$id'> = {
        name: communityData.name!,
        description: communityData.description!,
        type: communityData.type!,
        location: JSON.stringify(communityData.location!),
        creatorId: userId,
        admins: JSON.stringify([userId]),
        members: JSON.stringify([userId]),
        pendingMembers: JSON.stringify([]),
        activityTypes: JSON.stringify(communityData.activityTypes || []),
        avatar: communityData.avatar || '',
        coverImage: communityData.coverImage || '',
        website: communityData.website || '',
        isActive: true,
        memberCount: 1,
        activityCount: 0,
        eventCount: 0,
        createdAt: now,
        updatedAt: now
      };

      const created = await databases.createDocument(
        DATABASE_ID,
        COMMUNITIES_COLLECTION_ID,
        ID.unique(),
        communityDocument
      );

      // Create membership record
      await this.createMembershipRecord({
        communityId: created.$id,
        userId: userId,
        role: 'owner',
        status: 'active',
        joinedAt: now,
        notifications: true
      });

      return this.parseCommunity(created);
    } catch (error) {
      console.error('❌ Error creating community:', error);
      throw error;
    }
  }

  // Get community by ID
  static async getCommunityById(communityId: string): Promise<Community | null> {
    try {
      const community = await databases.getDocument(
        DATABASE_ID,
        COMMUNITIES_COLLECTION_ID,
        communityId
      );
      return this.parseCommunity(community);
    } catch (error) {
      console.error('❌ Error fetching community:', error);
      return null;
    }
  }

  // Search communities
  static async searchCommunities(
    query?: string,
    type?: 'public' | 'private',
    limit: number = 20
  ): Promise<Community[]> {
    try {
      const queries = [
        Query.equal('isActive', true),
        Query.orderDesc('memberCount'),
        Query.limit(limit)
      ];

      if (type) {
        queries.push(Query.equal('type', type));
      }

      if (query) {
        queries.push(Query.search('name', query));
      }

      const result = await databases.listDocuments(
        DATABASE_ID,
        COMMUNITIES_COLLECTION_ID,
        queries
      );

      return result.documents.map(this.parseCommunity);
    } catch (error) {
      console.error('❌ Error searching communities:', error);
      return [];
    }
  }

  
 // Get user's communities
// Remove these debug lines from getUserCommunities:
static async getUserCommunities(userId: string): Promise<Community[]> {
  try {
    // ❌ Remove: console.log('🔍 Getting communities for user:', userId);
    
    const memberships = await databases.listDocuments(
      DATABASE_ID,
      COMMUNITY_MEMBERS_COLLECTION_ID,
      [
        Query.equal('userId', userId),
        Query.equal('status', 'active')
      ]
    );

    const membershipCommunityIds = memberships.documents.map(m => m.communityId);
    // ❌ Remove: console.log('📋 Found membership records for communities:', membershipCommunityIds);

    const allCommunities = await databases.listDocuments(
      DATABASE_ID,
      COMMUNITIES_COLLECTION_ID,
      [
        Query.equal('isActive', true),
        Query.limit(100)
      ]
    );

    // ❌ Remove: console.log('🏘️ Checking', allCommunities.documents.length, 'communities for direct membership');

    const directMemberCommunities = allCommunities.documents.filter(community => {
      let members: string[] = [];
      
      try {
        if (community.members) {
          if (Array.isArray(community.members)) {
            members = community.members.map(member => {
              if (member && typeof member === 'string') {
                return member.replace(/["\[\]]/g, '');
              }
              return String(member || '').replace(/["\[\]]/g, '');
            }).filter(member => member.length > 0);
          } else if (typeof community.members === 'string') {
            const parsed = JSON.parse(community.members);
            if (Array.isArray(parsed)) {
              members = parsed.map(member => String(member || '').replace(/["\[\]]/g, ''));
            }
          }
        }
      } catch (e) {
        console.warn('Error parsing members for community:', community.$id, e);
        members = [];
      }

      const isMember = members.includes(userId);
      // ❌ Remove: if (isMember) { console.log('✅ Found direct membership in:', community.name); }
      return isMember;
    });

    const allUserCommunityIds = new Set([
      ...membershipCommunityIds,
      ...directMemberCommunities.map(c => c.$id)
    ]);

    const communityPromises = Array.from(allUserCommunityIds).map(id => {
      const directCommunity = directMemberCommunities.find(c => c.$id === id);
      return directCommunity ? this.parseCommunity(directCommunity) : this.getCommunityById(id);
    });

    const communities = await Promise.all(communityPromises);
    const validCommunities = communities.filter(Boolean) as Community[];
    
    // ❌ Remove: console.log('✅ Total user communities found:', validCommunities.length);
    return validCommunities;
    
  } catch (error) {
    console.error('Error fetching user communities:', error);
    return [];
  }
}

  // Join community
  static async joinCommunity(communityId: string, userId: string): Promise<{ success: boolean; status: string }> {
    try {
      const community = await this.getCommunityById(communityId);
      if (!community) {
        throw new Error('Community not found');
      }

      // Check if already member
      const existingMember = await this.getUserMembership(communityId, userId);
      if (existingMember) {
        if (existingMember.status === 'active') {
          return { success: false, status: 'already_member' };
        }
        if (existingMember.status === 'pending') {
          return { success: false, status: 'request_pending' };
        }
      }

      const now = new Date().toISOString();
      
      if (community.type === 'public') {
        // Auto-approve for public communities
        await this.createMembershipRecord({
          communityId,
          userId,
          role: 'member',
          status: 'active',
          joinedAt: now,
          notifications: true
        });

        await this.updateMemberCount(communityId, 1);
        return { success: true, status: 'joined' };
      } else {
        // Request approval for private communities
        await this.createMembershipRecord({
          communityId,
          userId,
          role: 'member',
          status: 'pending',
          joinedAt: now,
          notifications: true
        });

        return { success: true, status: 'request_sent' };
      }
    } catch (error) {
      console.error('❌ Error joining community:', error);
      throw error;
    }
  }

  // Add this method to your CommunityService class
static async getUserAdminCommunities(userId: string) {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      COMMUNITIES_COLLECTION_ID,
      [
        Query.or([
          Query.equal('creatorId', userId),
          Query.contains('admins', userId)
        ]),
        Query.equal('isActive', true),
        Query.orderDesc('$createdAt')
      ]
    );
    
    return response.documents;
  } catch (error) {
    console.error('Error fetching user admin communities:', error);
    throw error;
  }
}

  // Link activity to community (Admin only)
  static async linkActivityToCommunity(
    communityId: string, 
    activityId: string, 
    userId: string,
    notes?: string
  ): Promise<CommunityActivity> {
    try {
      // Check if user is admin
      const isAdmin = await this.isUserCommunityAdmin(communityId, userId);
      if (!isAdmin) {
        throw new Error('Only community admins can link activities');
      }

      // Check if already linked
      const existingLink = await this.getActivityLink(communityId, activityId);
      if (existingLink) {
        throw new Error('Activity is already linked to this community');
      }

      const now = new Date().toISOString();
      
      const linkData: Omit<CommunityActivity, '$id'> = {
        communityId,
        activityId,
        addedBy: userId,
        isPinned: false,
        notes: notes || '',
        isVisible: true,
        createdAt: now,
        updatedAt: now
      };

      const createdLink = await databases.createDocument(
        DATABASE_ID,
        COMMUNITY_ACTIVITIES_COLLECTION_ID,
        ID.unique(),
        linkData
      );

      await this.updateActivityCount(communityId, 1);
      return createdLink as any; // Appwrite document will have proper structure
    } catch (error) {
      console.error('❌ Error linking activity:', error);
      throw error;
    }
  }

  // Helper methods
  static async checkCreatePermission(userId: string): Promise<{ allowed: boolean; reason?: string }> {
    try {
      const subscription = await databases.listDocuments(
        DATABASE_ID,
        USER_SUBSCRIPTIONS_COLLECTION_ID,
        [Query.equal('userId', userId)]
      );

      if (subscription.documents.length === 0) {
        return { allowed: false, reason: 'Pro+ subscription required to create communities' };
      }

      const userSub = subscription.documents[0];
      
      if (userSub.subscriptionTier !== 'pro_plus') {
        return { allowed: false, reason: 'Pro+ subscription required to create communities' };
      }

      // Check creation limit (max 10 for Pro+)
      const userCommunities = await databases.listDocuments(
        DATABASE_ID,
        COMMUNITIES_COLLECTION_ID,
        [Query.equal('creatorId', userId)]
      );

      if (userCommunities.documents.length >= 10) {
        return { allowed: false, reason: 'Pro+ users can create up to 10 communities' };
      }

      return { allowed: true };
    } catch (error) {
      return { allowed: false, reason: 'Error validating subscription' };
    }
  }

  static validateCommunityData(data: Partial<Community>): void {
    if (!data.name || data.name.length < 3) {
      throw new Error('Community name must be at least 3 characters');
    }
    if (!data.description || data.description.length < 10) {
      throw new Error('Description must be at least 10 characters');
    }
    if (!data.location || !data.location.address) {
      throw new Error('Community location is required');
    }
    if (!data.type || !['public', 'private'].includes(data.type)) {
      throw new Error('Valid community type is required');
    }
  }

  static async checkNameExists(name: string): Promise<boolean> {
    try {
      const result = await databases.listDocuments(
        DATABASE_ID,
        COMMUNITIES_COLLECTION_ID,
        [Query.equal('name', name)]
      );
      return result.documents.length > 0;
    } catch (error) {
      return false;
    }
  }

  static async createMembershipRecord(memberData: Omit<CommunityMember, '$id'>): Promise<CommunityMember> {
    const created = await databases.createDocument(
      DATABASE_ID,
      COMMUNITY_MEMBERS_COLLECTION_ID,
      ID.unique(),
      memberData
    );
    return created as any; // Appwrite document will have proper structure
  }

  static async getUserMembership(communityId: string, userId: string): Promise<CommunityMember | null> {
    try {
      const result = await databases.listDocuments(
        DATABASE_ID,
        COMMUNITY_MEMBERS_COLLECTION_ID,
        [
          Query.equal('communityId', communityId),
          Query.equal('userId', userId)
        ]
      );
      return result.documents.length > 0 ? result.documents[0] as any : null;
    } catch (error) {
      return null;
    }
  }

  static async isUserCommunityAdmin(communityId: string, userId: string): Promise<boolean> {
  
  try {
    const community = await this.getCommunityById(communityId);
    
    if (!community) {
      console.log('🔍 DEBUG: No community found');
      return false;
    }
    
    const isCreator = community.creatorId === userId;
    const isAdmin = community.admins?.includes(userId);
    
   
    return isCreator || isAdmin;
  } catch (error) {
    console.error('🔍 DEBUG: Error checking admin status:', error);
    return false;
  }
}

  static async getActivityLink(communityId: string, activityId: string): Promise<CommunityActivity | null> {
    try {
      const result = await databases.listDocuments(
        DATABASE_ID,
        COMMUNITY_ACTIVITIES_COLLECTION_ID,
        [
          Query.equal('communityId', communityId),
          Query.equal('activityId', activityId)
        ]
      );
      return result.documents.length > 0 ? result.documents[0] as any : null;
    } catch (error) {
      return null;
    }
  }

  static async updateMemberCount(communityId: string, change: number): Promise<void> {
    try {
      const community = await this.getCommunityById(communityId);
      if (community) {
        await databases.updateDocument(
          DATABASE_ID,
          COMMUNITIES_COLLECTION_ID,
          communityId,
          {
            memberCount: Math.max(0, community.memberCount + change),
            updatedAt: new Date().toISOString()
          }
        );
      }
    } catch (error) {
      console.error('❌ Error updating member count:', error);
    }
  }

  static async updateActivityCount(communityId: string, change: number): Promise<void> {
    try {
      const community = await this.getCommunityById(communityId);
      if (community) {
        await databases.updateDocument(
          DATABASE_ID,
          COMMUNITIES_COLLECTION_ID,
          communityId,
          {
            activityCount: Math.max(0, community.activityCount + change),
            updatedAt: new Date().toISOString()
          }
        );
      }
    } catch (error) {
      console.error('❌ Error updating activity count:', error);
    }
  }


  // Get activities linked to a community
  static async getCommunityActivities(communityId: string): Promise<CommunityActivity[]> {
    try {
      const result = await databases.listDocuments(
        DATABASE_ID,
        COMMUNITY_ACTIVITIES_COLLECTION_ID,
        [
          Query.equal('communityId', communityId),
          Query.equal('isVisible', true),
          Query.orderDesc('createdAt')
        ]
      );

      return result.documents as any;
    } catch (error) {
      console.error('❌ Error fetching community activities:', error);
      return [];
    }
  }

  // Add this method to filter community events properly
static async getPublicCommunityEvents(): Promise<any[]> {
  try {
    const result = await databases.listDocuments(
      DATABASE_ID,
      EVENTS_COLLECTION_ID,
      [
        Query.equal('eventVisibility', 'public'), // Only public events
        Query.isNotNull('communityId'), // ✅ Use this instead
        Query.orderDesc('createdAt')
      ]
    );

    return result.documents;
  } catch (error) {
    console.error('❌ Error fetching public community events:', error);
    return [];
  }
}

  

  // Get events created in a community
// Add this method to your CommunityService class
static async getCommunityEvents(communityId: string): Promise<any[]> {
  try {
    const result = await databases.listDocuments(
      DATABASE_ID,
      EVENTS_COLLECTION_ID,
      [
        Query.equal('communityId', communityId),
        Query.orderDesc('createdAt')
      ]
    );

    return result.documents;
  } catch (error) {
    console.error('❌ Error fetching community events:', error);
    return [];
  }
}
  // Add this method to your CommunityService class:
static async unlinkActivityFromCommunity(
  communityId: string, 
  activityId: string, 
  userId: string
): Promise<boolean> {
  try {
    // Check if user is admin
    const isAdmin = await this.isUserCommunityAdmin(communityId, userId);
    if (!isAdmin) {
      throw new Error('Only community admins can unlink activities');
    }

   const link = await this.getActivityLink(communityId, activityId);
if (!link || !link.$id) {  // ← Add null check for link.$id
  return false;
}

await databases.deleteDocument(
  DATABASE_ID,
  COMMUNITY_ACTIVITIES_COLLECTION_ID,
  link.$id  // ← Now TypeScript knows link.$id exists
);

    await this.updateActivityCount(communityId, -1);
    return true;
  } catch (error) {
    console.error('❌ Error unlinking activity from community:', error);
    throw error;
  }
}

// Check if user can edit community event
static async canUserEditCommunityEvent(
  eventId: string, 
  userId: string, 
  communityId?: string
): Promise<boolean> {
  try {
    // Get event details
    const event = await databases.getDocument(DATABASE_ID, EVENTS_COLLECTION_ID, eventId);
    
    // Event creator can always edit
    if (event.organizerId === userId) {
      return true;
    }
    
    // Community admin can edit if it's a community event
    if (communityId || event.communityId) {
      const targetCommunityId = communityId || event.communityId;
      return await this.isUserCommunityAdmin(targetCommunityId, userId);
    }
    
    return false;
  } catch (error) {
    console.error('❌ Error checking edit permissions:', error);
    return false;
  }
}

  static parseCommunity(doc: any): Community {
  // Parse members with the same robust logic
  let members: string[] = [];
  try {
    if (doc.members) {
      if (Array.isArray(doc.members)) {
        members = doc.members.map((member: any) => {
          if (member && typeof member === 'string') {
            return member.replace(/["\[\]]/g, '');
          }
          return String(member || '').replace(/["\[\]]/g, '');
        }).filter((member: string) => member.length > 0);
      } else if (typeof doc.members === 'string') {
        const parsed = JSON.parse(doc.members);
        if (Array.isArray(parsed)) {
          members = parsed.map((member: any) => String(member || '').replace(/["\[\]]/g, ''));
        }
      }
    }
  } catch (e) {
    console.warn('Error parsing members:', e);
    members = [];
  }

  // Parse admins with the same robust logic
  let admins: string[] = [];
  try {
    if (doc.admins) {
      if (Array.isArray(doc.admins)) {
        admins = doc.admins.map((admin: any) => {
          if (admin && typeof admin === 'string') {
            return admin.replace(/["\[\]]/g, '');
          }
          return String(admin || '').replace(/["\[\]]/g, '');
        }).filter((admin: string) => admin.length > 0);
      } else if (typeof doc.admins === 'string') {
        const parsed = JSON.parse(doc.admins);
        if (Array.isArray(parsed)) {
          admins = parsed.map((admin: any) => String(admin || '').replace(/["\[\]]/g, ''));
        }
      }
    }
  } catch (e) {
    console.warn('Error parsing admins:', e);
    admins = [];
  }

  return {
    $id: doc.$id,
    name: doc.name,
    description: doc.description,
    type: doc.type,
    location: typeof doc.location === 'string' ? JSON.parse(doc.location) : doc.location,
    creatorId: doc.creatorId,
    admins: admins,
    members: members,
    pendingMembers: typeof doc.pendingMembers === 'string' ? JSON.parse(doc.pendingMembers || '[]') : doc.pendingMembers || [],
    activityTypes: typeof doc.activityTypes === 'string' ? JSON.parse(doc.activityTypes || '[]') : doc.activityTypes || [],
    avatar: doc.avatar || '',
    coverImage: doc.coverImage || '',
    website: doc.website || '',
    isActive: doc.isActive,
    memberCount: doc.memberCount,
    activityCount: doc.activityCount,
    eventCount: doc.eventCount,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt
  };
}



  // Update event count
// Add this method to your CommunityService class
static async updateEventCount(communityId: string, change: number): Promise<void> {
  try {
    const community = await this.getCommunityById(communityId);
    if (community) {
      await databases.updateDocument(
        DATABASE_ID,
        COMMUNITIES_COLLECTION_ID,
        communityId,
        {
          eventCount: Math.max(0, (community.eventCount || 0) + change),
          updatedAt: new Date().toISOString()
        }
      );
    }
  } catch (error) {
    console.error('❌ Error updating event count:', error);
  }
}


// Add these methods to your CommunityService class
static async getUserProfile(userId: string): Promise<any> {
  // Simple placeholder that returns admin ID as email for now
  return {
    $id: userId,
    email: `admin-${userId.slice(-4)}@community.com`,
    name: `Admin ${userId.slice(-4)}`
  };
}

static async updateCommunityType(communityId: string, newType: 'public' | 'private', userId: string): Promise<boolean> {
  try {
    // Get current community
    const community = await databases.getDocument(
      DATABASE_ID,
      COMMUNITIES_COLLECTION_ID,
      communityId
    );

    // Verify permissions
    const isOwner = community.creatorId === userId;
    if (!isOwner) {
      throw new Error('Only community owner can change community type');
    }

    // Update community type
    await databases.updateDocument(
      DATABASE_ID,
      COMMUNITIES_COLLECTION_ID,
      communityId,
      {
        type: newType,
        updatedAt: new Date().toISOString()
      }
    );

    // If changing from private to public, auto-approve all pending requests
    if (community.type === 'private' && newType === 'public') {
      const CommunityJoinRequestService = await import('./useCommunityJoinRequests');
      const autoApprovedCount = await CommunityJoinRequestService.default.autoApproveAllPendingRequests(communityId);
      console.log(`Auto-approved ${autoApprovedCount} pending join requests`);
    }

    return true;

  } catch (error) {
    console.error('Error updating community type:', error);
    throw error;
  }
}

// Check if user can create events in community
// Update your existing canUserCreateEvents method in CommunityService.ts
static async canUserCreateEvents(communityId: string, userId: string): Promise<boolean> {
  try {
    const community = await this.getCommunityById(communityId);
    if (!community) return false;
    
    // Check if user is member
    const isMember = community.members.includes(userId);
    if (!isMember) return false;
    
    // Check community settings (if only admins can create events)
    if (community.settings?.onlyAdminsCanCreateEvents) {
      return this.isUserCommunityAdmin(communityId, userId);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error checking event creation permissions:', error);
    return false;
  }
}

// Replace your existing getCommunityPosts method with this enhanced version:
static async getCommunityPosts(
  communityId: string, 
  sortBy?: 'newest' | 'oldest' | 'likes'
): Promise<any[]> {
  try {
    const queries = [
      Query.equal('communityId', communityId),
      Query.orderDesc('isPinned') // Pinned posts always come first
    ];
    
    // Add sorting
    if (sortBy === 'oldest') {
      queries.push(Query.orderAsc('createdAt'));
    } else if (sortBy === 'likes') {
      queries.push(Query.orderDesc('likeCount'));
    } else {
      queries.push(Query.orderDesc('createdAt')); // newest first (default)
    }

    const result = await databases.listDocuments(
      DATABASE_ID,
      COMMUNITY_POSTS_COLLECTION_ID,
      queries
    );
    return result.documents;
  } catch (error) {
    console.error('❌ Error fetching community posts:', error);
    return [];
  }
}
// Add likePost method
// Update your likePost method in CommunityService:
static async likePost(postId: string, userId: string): Promise<void> {
  try {
    // Get the current post
    const post = await databases.getDocument(
      DATABASE_ID,
      COMMUNITY_POSTS_COLLECTION_ID,
      postId
    );

    // Parse current likes from likedBy field
    let currentLikes = [];
    if (typeof post.likedBy === 'string') {
      try {
        currentLikes = JSON.parse(post.likedBy) || [];
      } catch (e) {
        currentLikes = [];
      }
    } else if (Array.isArray(post.likedBy)) {
      currentLikes = post.likedBy;
    }

    // Toggle like status - use userId parameter instead of user?.$id
    const isLiked = currentLikes.includes(userId); // ← Fixed: use userId directly
    let updatedLikes;
    let newLikeCount;

    // Ensure currentLikes is always an array
    const likesArray = Array.isArray(currentLikes) ? currentLikes : [];

    if (isLiked) {
      // Remove like
      updatedLikes = likesArray.filter((userIdInArray) => userIdInArray !== userId);
      newLikeCount = Math.max(0, post.likeCount - 1);
    } else {
      // Add like
      updatedLikes = [...likesArray, userId];
      newLikeCount = post.likeCount + 1;
    }

    // Update the post
    await databases.updateDocument(
      DATABASE_ID,
      COMMUNITY_POSTS_COLLECTION_ID,
      postId,
      {
        likedBy: updatedLikes,
        likeCount: newLikeCount,
        updatedAt: new Date().toISOString()
      }
    );
  } catch (error) {
    console.error('❌ Error toggling like:', error);
    throw error;
  }
}

static async deleteComment(commentId: string, postId: string, userId: string): Promise<void> {
  try {
    // Get the comment to check ownership
    const comment = await databases.getDocument(
      DATABASE_ID,
      COMMENTS_COLLECTION_ID,
      commentId
    );
    
    // Get the post to find the community
    const post = await databases.getDocument(
      DATABASE_ID, 
      COMMUNITY_POSTS_COLLECTION_ID, 
      postId
    );
    
    // Get community to check admin status
    const community = await databases.getDocument(
      DATABASE_ID,
      COMMUNITIES_COLLECTION_ID,
      post.communityId
    );
    
    // Server-side validation
    const isCommentAuthor = comment.userId === userId;
    const isCommunityCreator = community.creatorId === userId;
    const isCommunityAdmin = community.admins?.includes(userId);
    
    if (!isCommentAuthor && !isCommunityCreator && !isCommunityAdmin) {
      throw new Error('You do not have permission to delete this comment');
    }
    
    // Delete the comment
    await databases.deleteDocument(
      DATABASE_ID,
      COMMENTS_COLLECTION_ID,
      commentId
    );
    
    // Update comment count
    const newCommentCount = Math.max((post.commentCount || 1) - 1, 0);
    await databases.updateDocument(DATABASE_ID, COMMUNITY_POSTS_COLLECTION_ID, postId, {
      commentCount: newCommentCount,
      updatedAt: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('Error deleting comment:', error);
    throw new Error('Failed to delete comment: ' + (error?.message || error));
  }
}


// Add addComment method
// Fixed addComment method in CommunityService
static async addComment(postId: string, userId: string, content: string): Promise<void> {
  try {
    // Get user profile to get the real name
    const userProfileQuery = await databases.listDocuments(
      DATABASE_ID,
      USER_PROFILES_COLLECTION_ID,
      [Query.equal('userId', userId)]
    );

    let userName = 'Anonymous User';
    if (userProfileQuery.documents.length > 0) {
      const userProfile = userProfileQuery.documents[0];
      userName = userProfile.name || userProfile.email || 'Anonymous User';
    }

    // Create comment data
    const commentData = {
      itemId: postId,
      itemType: 'community_post',
      content: content,
      userId: userId,
      userName: userName,
      userAvatar: '',
      parentId: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Universal permissions - anyone can delete, but UI will control who sees the button
    const permissions = [
      Permission.read(Role.any()),
      Permission.update(Role.user(userId)),
      Permission.delete(Role.any())
    ];
    
    // Create comment with permissions
    const createdComment = await databases.createDocument(
      DATABASE_ID,
      COMMENTS_COLLECTION_ID,
      ID.unique(),
      commentData,
      permissions
    );

    // Update post comment count
    const post = await databases.getDocument(DATABASE_ID, COMMUNITY_POSTS_COLLECTION_ID, postId);
    const newCommentCount = (post.commentCount || 0) + 1;
    
    await databases.updateDocument(DATABASE_ID, COMMUNITY_POSTS_COLLECTION_ID, postId, {
      commentCount: newCommentCount,
      updatedAt: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('Error adding comment:', error);
    throw error;
  }
}


// Replace this section in your createPost method:
static async createPost(communityId: string, authorId: string, content: string): Promise<CommunityPost> {
  try {
    // Instead of getting by document ID, search by userId field
    const userProfileQuery = await databases.listDocuments(
      DATABASE_ID,
      USER_PROFILES_COLLECTION_ID,
      [Query.equal('userId', authorId)] // Search by userId field
    );

    let authorName = 'Anonymous User';
    if (userProfileQuery.documents.length > 0) {
      const userProfile = userProfileQuery.documents[0];
      authorName = userProfile.name || userProfile.email || 'Anonymous User';
    }

    const post = await databases.createDocument(
      DATABASE_ID,
      COMMUNITY_POSTS_COLLECTION_ID,
      ID.unique(),
      {
        communityId,
        authorId,
        authorName, // Use the found name
        content,
        type: 'post',
        isPinned: false,
        likeCount: 0,
        commentCount: 0,
        images: '', 
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    );

    return post as any;
  } catch (error) {
    console.error('❌ Error creating post:', error);
    throw error;
  }
}

}

export default CommunityService;