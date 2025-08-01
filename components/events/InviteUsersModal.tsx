// components/events/InviteUsersModal.tsx
import React, { useState, useEffect } from 'react';
import { databases, DATABASE_ID, EVENT_INVITES_COLLECTION_ID, Query } from '../../lib/appwrite';
import EventInviteService from '../../services/EventInviteService';

interface InviteUsersModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: any;
  user: any;
  onInviteSuccess: () => void;
}

interface ExistingInvite {
  $id: string;
  invitedEmail: string;
  invitedUserId: string;
  inviteToken: string;  // ✅ ADD THIS
  status: string;
  createdAt: string;
  userName?: string;
  eventId?: string;     // ✅ ADD THIS TOO (optional)
  expiresAt?: string;   // ✅ ADD THIS TOO (optional)
}

const InviteUsersModal: React.FC<InviteUsersModalProps> = ({
  isOpen,
  onClose,
  event,
  user,
  onInviteSuccess
}) => {
  const [emailInput, setEmailInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [existingInvites, setExistingInvites] = useState<ExistingInvite[]>([]);
  const [loadingInvites, setLoadingInvites] = useState(false);
  const [message, setMessage] = useState('');

  // Load existing invites when modal opens
  useEffect(() => {
    if (isOpen && event) {
      loadExistingInvites();
    }
  }, [isOpen, event]);

 const loadExistingInvites = async () => {
  try {
    setLoadingInvites(true);
    const response = await databases.listDocuments(
      DATABASE_ID,
      EVENT_INVITES_COLLECTION_ID,
      [
        Query.equal('eventId', event.$id),
        Query.orderDesc('$createdAt')
      ]
    );

    console.log('🔍 DEBUG: Raw invite documents from database:', response.documents);

    const invites = await Promise.all(
      response.documents.map(async (invite: any) => {
        console.log('🔍 DEBUG: Processing invite:', invite);
        console.log('🔍 DEBUG: invite.inviteToken:', invite.inviteToken);
        
        // Try to get the user's name
        let userName = 'Unknown User';
        if (invite.invitedUserId) {
          const foundUser = await EventInviteService.findUserByEmail(invite.invitedEmail);
          userName = foundUser?.name || 'Unknown User';
        }

        const mappedInvite = {
          $id: invite.$id,
          invitedEmail: invite.invitedEmail,
          invitedUserId: invite.invitedUserId,
          inviteToken: invite.inviteToken,
          status: invite.status,
          createdAt: invite.$createdAt,
          userName,
          eventId: invite.eventId,
          expiresAt: invite.expiresAt
        };

        console.log('🔍 DEBUG: Mapped invite:', mappedInvite);
        return mappedInvite;
      })
    );

    console.log('🔍 DEBUG: Final invites array:', invites);
    setExistingInvites(invites);
  } catch (error) {
    console.error('❌ Error loading existing invites:', error);
  } finally {
    setLoadingInvites(false);
  }
};
  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim() || loading) return;

    setLoading(true);
    setMessage('');

    try {
      // Look up the user
      const foundUser = await EventInviteService.findUserByEmail(emailInput.trim());
      
      if (!foundUser) {
        setMessage('❌ No user found with that email address. They need to create an account first.');
        return;
      }

      // Check if user is already a participant
      if (event.participants.includes(foundUser.userId)) {
        setMessage('⚠️ This user is already a participant in this event.');
        return;
      }

      // Check if invite already exists
      const existingInvite = await EventInviteService.findExistingInvite(event.$id, emailInput.trim());
      if (existingInvite) {
        setMessage('⚠️ This user has already been invited to this event.');
        return;
      }

      // Create the invite
      const inviteData = {
        eventId: event.$id,
        invitedEmail: emailInput.toLowerCase().trim(),
        invitedUserId: foundUser.userId,
        invitedBy: user.$id,
        inviteToken: EventInviteService.generateInviteToken(),
        status: 'pending',
        expiresAt: EventInviteService.getExpirationDate()
      };

      await databases.createDocument(
        DATABASE_ID,
        EVENT_INVITES_COLLECTION_ID,
        'unique()',
        inviteData
      );

      setMessage(`✅ Successfully invited ${foundUser.name}!`);
      setEmailInput('');
      loadExistingInvites(); // Refresh the list
      onInviteSuccess(); // Notify parent component

      // Clear success message after 3 seconds
      setTimeout(() => setMessage(''), 3000);

    } catch (error) {
      console.error('❌ Error creating invite:', error);
      setMessage('❌ Failed to invite user. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUnrevokeInvite = async (inviteId: string) => {
  if (!confirm('Are you sure you want to restore this invitation?')) return;

  try {
    setLoadingInvites(true);
    
    await databases.updateDocument(
      DATABASE_ID,
      EVENT_INVITES_COLLECTION_ID,
      inviteId,
      { status: 'pending' } // ✅ Change back to pending
    );
    
    // Refresh the invites list
    loadExistingInvites();
    
  } catch (error) {
    console.error('❌ Error un-revoking invite:', error);
    alert('Failed to restore invitation. Please try again.');
  } finally {
    setLoadingInvites(false);
  }
};

  const getStatusBadge = (status: string) => {
  switch (status) {
    case 'pending':
      return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">⏳ Pending</span>;
    case 'accepted':
      return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">✅ Accepted</span>;
    case 'expired':
      return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">❌ Expired</span>;
    case 'revoked':
      return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">🚫 Revoked</span>;
    default:
      return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">{status}</span>;
  }
};

  const handleRevokeInvite = async (inviteId: string) => {
  if (!confirm('Are you sure you want to revoke this invitation?')) return;

  try {
    setLoadingInvites(true);
    
    await databases.updateDocument(
      DATABASE_ID,
      EVENT_INVITES_COLLECTION_ID,
      inviteId,
      { status: 'revoked' }
    );
    
    // Refresh the invites list
    loadExistingInvites();
    
  } catch (error) {
    console.error('❌ Error revoking invite:', error);
    alert('Failed to revoke invitation. Please try again.');
  } finally {
    setLoadingInvites(false);
  }
};

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-600">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            📧 Invite People to Event
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Event Info */}
          <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 dark:text-white">{event.eventName}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              🔒 Private Event • {event.participants.length} participants
            </p>
          </div>

          {/* Invite Form */}
          <form onSubmit={handleInvite} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Address
              </label>
              <div className="flex gap-3">
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="Enter email address to invite..."
                  className="flex-1 p-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  disabled={loading}
                  required
                />
                <button
                  type="submit"
                  disabled={loading || !emailInput.trim()}
                  className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Inviting...' : 'Invite'}
                </button>
              </div>
            </div>

            {message && (
              <div className={`p-3 rounded-lg text-sm ${
                message.startsWith('✅') 
                  ? 'bg-green-100 text-green-800' 
                  : message.startsWith('⚠️')
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {message}
              </div>
            )}
          </form>

          {/* Existing Invites */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              📋 Invited Users ({existingInvites.length})
            </h3>
            
            {loadingInvites ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600 mx-auto"></div>
              </div>
            ) : existingInvites.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <p>No invitations sent yet.</p>
                <p className="text-sm">Start by inviting someone above!</p>
              </div>
            ) : (
              <div className="space-y-3">
  {existingInvites.map((invite) => {
    // Get the invite URL
    const inviteUrl = `${window.location.origin}/events/invite/${invite.inviteToken}`;
    
    const copyToClipboard = async (text: string) => {
      try {
        await navigator.clipboard.writeText(text);
        // You could add a toast notification here
        alert('Invite URL copied to clipboard!');
      } catch (err) {
        console.error('Failed to copy: ', err);
        // Fallback - select the text
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        alert('Invite URL copied to clipboard!');
      }
    };

    return (
      <div
        key={invite.$id}
        className="p-4 bg-gray-50 dark:bg-slate-700 rounded-lg space-y-3"
      >
        {/* User Info */}
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="font-medium text-gray-900 dark:text-white">
              {invite.userName}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {invite.invitedEmail}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Invited {new Date(invite.createdAt).toLocaleDateString()}
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {getStatusBadge(invite.status)}
            
            {/* ✅ ADD: Revoke button for pending invites */}
  {invite.status === 'pending' && (
    <button
      onClick={() => handleRevokeInvite(invite.$id)}
      className="px-2 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded text-xs transition-colors"
      title="Revoke this invitation"
    >
      Revoke
    </button>
  )}

  {/* ✅ NEW: Un-revoke button */}
  {invite.status === 'revoked' && (
    <button
      onClick={() => handleUnrevokeInvite(invite.$id)}
      className="px-2 py-1 bg-green-100 hover:bg-green-200 text-green-700 rounded text-xs transition-colors"
      title="Restore this invitation"
    >
      Un-revoke
    </button>
  )}

  {/* ✅ NEW: Un-revoke button after expiry*/}
  {invite.status === 'expired' && (
    <button
      onClick={() => handleUnrevokeInvite(invite.$id)}
      className="px-2 py-1 bg-green-100 hover:bg-green-200 text-green-700 rounded text-xs transition-colors"
      title="Restore this invitation"
    >
      Un-revoke
    </button>
  )}

          </div>
        </div>

        {/* Shareable URL */}
        <div className="border-t border-gray-200 dark:border-slate-600 pt-3">
          <div className="flex items-center space-x-2">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                🔗 Shareable Invite Link
              </label>
              <input
                type="text"
                value={inviteUrl}
                readOnly
                className="w-full text-xs p-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded text-gray-700 dark:text-gray-300 select-all"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
            </div>
            <button
              onClick={() => copyToClipboard(inviteUrl)}
              className="px-3 py-2 bg-emerald-600 text-white rounded text-xs hover:bg-emerald-700 transition-colors"
              title="Copy invite link"
            >
              📋 Copy
            </button>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Share this link with {invite.userName} to give them direct access to the event
          </p>
        </div>
      </div>
    );
  })}
</div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-slate-600">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default InviteUsersModal;