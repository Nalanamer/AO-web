// services/EventInviteService.ts
import { databases, DATABASE_ID, USER_PROFILES_COLLECTION_ID, EVENT_INVITES_COLLECTION_ID, Query, ID } from '../lib/appwrite';

export class EventInviteService {
  // Find user by email address
  static async findUserByEmail(email: string): Promise<{ userId: string; name: string } | null> {
    try {
      console.log('🔍 Looking up user by email:', email);
      
      const response = await databases.listDocuments(
        DATABASE_ID,
        USER_PROFILES_COLLECTION_ID,
        [
          Query.equal('email', email.toLowerCase().trim()),
          Query.limit(1)
        ]
      );

      if (response.documents.length === 0) {
        console.log('❌ No user found with email:', email);
        return null;
      }

      const user = response.documents[0];
      console.log('✅ User found:', user.name || 'Unknown');
      
      return {
        userId: user.userId,
        name: user.name || user.email || 'Unknown User'
      };
    } catch (error) {
      console.error('❌ Error looking up user by email:', error);
      return null;
    }
  }

  // Check if invite already exists for this event/email combination
static async findExistingInvite(eventId: string, email: string): Promise<any | null> {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      EVENT_INVITES_COLLECTION_ID,
      [
        Query.equal('eventId', eventId),
        Query.equal('invitedEmail', email.toLowerCase().trim()),
        Query.limit(1)
      ]
    );

    return response.documents.length > 0 ? response.documents[0] : null;
  } catch (error) {
    console.error('❌ Error checking existing invite:', error);
    return null;
  }
}

        // Check if user has a valid invite for this event
// Check if user has a valid invite for this event
static async checkUserInvite(eventId: string, userId: string): Promise<any | null> {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      EVENT_INVITES_COLLECTION_ID,
      [
        Query.equal('eventId', eventId),
        Query.equal('invitedUserId', userId),
        Query.limit(1)
      ]
    );

    if (response.documents.length === 0) {
      return null;
    }

    const invite = response.documents[0];
    
    // ✅ NEW: Check invite status and expiration
    if (invite.status === 'expired' || invite.status === 'revoked') {
      console.log('❌ Invite found but revoked/expired:', invite.status);
      return null;
    }

    // Check if expired by date
    const expirationDate = new Date(invite.expiresAt);
    const now = new Date();
    
    if (now > expirationDate) {
      console.log('❌ Invite found but expired by date');
      
      // Mark as expired in database
      await databases.updateDocument(
        DATABASE_ID,
        EVENT_INVITES_COLLECTION_ID,
        invite.$id,
        { status: 'expired' }
      );
      
      return null;
    }

    console.log('✅ Valid invite found');
    return invite;
  } catch (error) {
    console.error('❌ Error checking user invite:', error);
    return null;
  }
}

// Validate invite token and return invite if valid
// Validate invite token and return invite if valid
static async validateInviteToken(token: string): Promise<any | null> {
  try {
    console.log('🔍 Validating token:', token);
    
    const response = await databases.listDocuments(
      DATABASE_ID,
      EVENT_INVITES_COLLECTION_ID,
      [
        Query.equal('inviteToken', token),
        Query.limit(1)
      ]
    );

    if (response.documents.length === 0) {
      console.log('❌ No invite found with token');
      return null;
    }

    const invite = response.documents[0];
    console.log('📧 Found invite with status:', invite.status);
    
    // ✅ Check if revoked
    if (invite.status === 'revoked') {
      console.log('❌ Invite has been revoked');
      return { ...invite, status: 'revoked' };
    }
    
    // Check if expired by date
    const expirationDate = new Date(invite.expiresAt);
    const now = new Date();
    
    if (now > expirationDate || invite.status === 'expired') {
      console.log('❌ Invite expired');
      // Mark as expired if not already
      if (invite.status !== 'expired') {
        await databases.updateDocument(
          DATABASE_ID,
          EVENT_INVITES_COLLECTION_ID,
          invite.$id,
          { status: 'expired' }
        );
      }
      return { ...invite, status: 'expired' };
    }

    console.log('✅ Invite is valid');
    return invite;
  } catch (error) {
    console.error('❌ Error validating invite token:', error);
    return null;
  }
}
// Accept an invite (mark as accepted)
static async acceptInvite(inviteId: string): Promise<void> {
  try {
    await databases.updateDocument(
      DATABASE_ID,
      EVENT_INVITES_COLLECTION_ID,
      inviteId,
      { 
        status: 'accepted',
        respondedAt: new Date().toISOString()
      }
    );
  } catch (error) {
    console.error('❌ Error accepting invite:', error);
    throw error;
  }
}


  // Generate unique invite token
  static generateInviteToken(): string {
    return `invite_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  // Calculate expiration date (30 days from now)
  // Calculate expiration date (30 days from now) - More reliable method
// Calculate expiration date (30 days from now) - Fixed for month edge cases
static getExpirationDate(): string {
  const now = new Date();
  const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
  const expirationDate = new Date(now.getTime() + thirtyDaysInMs);
  
  console.log('📅 Current date:', now.toISOString());
  console.log('📅 Expiration date (+30 days):', expirationDate.toISOString());
  
  return expirationDate.toISOString();
}
}

export default EventInviteService;