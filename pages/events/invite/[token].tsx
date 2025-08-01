// pages/events/invite/[token].tsx
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import EventInviteService from '../../../services/EventInviteService';
import MainLayout from '../../../components/layout/MainLayout';
import { databases, DATABASE_ID, EVENTS_COLLECTION_ID } from '../../../lib/appwrite'; // ✅ ADD THIS

export default function EventInvite() {
  const router = useRouter();
  const { token } = router.query;
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (token && typeof token === 'string') {
      processInvite(token);
    }
  }, [token, user]);

  const processInvite = async (inviteToken: string) => {
    try {
      setLoading(true);
      
      if (!user) {
        setMessage('Please log in to accept this event invitation.');
        setError('login_required');
        return;
      }

      // Validate the invite token
      const invite = await EventInviteService.validateInviteToken(inviteToken);
      
      if (!invite) {
        setError('Invalid or expired invitation link.');
        return;
      }

      if (invite.status === 'expired') {
        setError('This invitation has expired.');
        return;
      }

      if (invite.status === 'revoked') {
  setError('This invitation has been revoked by the event organizer.');
  return;
}

      // Check if user is the intended recipient
      if (invite.invitedUserId !== user.$id) {
        setError('This invitation is not for your account.');
        return;
      }

      // Mark invite as accepted and redirect to event
      // Mark invite as accepted AND add user to event participants
await EventInviteService.acceptInvite(invite.$id);

// ✅ ADD: Also add user to event participants
try {
  // Fetch current event
  const eventDoc = await databases.getDocument(
    DATABASE_ID,
    EVENTS_COLLECTION_ID,
    invite.eventId
  );

  // Add user to participants if not already there
  const currentParticipants = Array.isArray(eventDoc.participants) ? eventDoc.participants : [];
  if (!currentParticipants.includes(user.$id)) {
    const updatedParticipants = [...currentParticipants, user.$id];
    
    await databases.updateDocument(
      DATABASE_ID,
      EVENTS_COLLECTION_ID,
      invite.eventId,
      {
        participants: updatedParticipants
      }
    );
    
    console.log('✅ Added user to event participants');
  }
} catch (participantError) {
  console.error('⚠️ Failed to add user to participants:', participantError);
  // Don't fail the whole process if this fails
}
      
      
      setMessage('Invitation accepted! Redirecting to event...');

            setTimeout(() => {
            router.replace(`/events/${invite.eventId}`); // ✅ Use replace instead of push
            }, 1500); // ✅ Reduce delay
    } catch (error) {
      console.error('Error processing invite:', error);
      setError('Failed to process invitation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Processing invitation...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-md mx-auto mt-16 p-6">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-8 text-center">
          {error === 'login_required' ? (
            <>
              <div className="text-4xl mb-4">📧</div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Event Invitation
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {message}
              </p>
              <button
                onClick={() => router.push('/auth/login')}
                className="w-full bg-emerald-600 text-white py-3 px-4 rounded-lg hover:bg-emerald-700 transition-colors"
              >
                Log In
              </button>
            </>
          ) : error ? (
            <>
              <div className="text-4xl mb-4">❌</div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Invalid Invitation
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {error}
              </p>
              <button
                onClick={() => router.push('/events')}
                className="w-full bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Browse Events
              </button>
            </>
          ) : (
            <>
              <div className="text-4xl mb-4">✅</div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Invitation Accepted!
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {message}
              </p>
            </>
          )}
        </div>
      </div>
    </MainLayout>
  );
}