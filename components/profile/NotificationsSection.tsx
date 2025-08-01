// components/profile/NotificationsSection.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import  CommunityService from '@/services/useCommunities';
import CommunityJoinRequestService from '@/services/useCommunityJoinRequests';


interface CommunityNotification {
  $id: string;
  type: 'admin_invite' | 'join_request_approved' | 'join_request_rejected' | 'community_join_request'; // ✅ Add community_join_request
  communityId: string;
  communityName: string;
  message: string;
  createdAt: string;
  status: 'pending' | 'accepted' | 'rejected';
  inviteToken?: string;
  data?: string; // ✅ ADD THIS LINE
}

const NotificationsSection: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<CommunityNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadNotifications();
    }
  }, [user]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const userNotifications = await CommunityService.getUserNotifications(user?.$id || '');
      setNotifications(userNotifications);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdminInviteResponse = async (notificationId: string, action: 'accept' | 'reject') => {
    try {
      setActionLoading(notificationId);
      
      const notification = notifications.find(n => n.$id === notificationId);
      if (!notification) return;

      await CommunityService.respondToAdminInvite(
        notification.inviteToken || '',
        action
      );

      // Update notification status locally
      setNotifications(prev => 
        prev.map(n => 
          n.$id === notificationId 
            ? { ...n, status: action === 'accept' ? 'accepted' : 'rejected' }
            : n
        )
      );

      alert(`Admin invitation ${action}ed successfully!`);
      
    } catch (error) {
      console.error(`Error ${action}ing invitation:`, error);
      alert(`Failed to ${action} invitation`);
    } finally {
      setActionLoading(null);
    }
  };

   const handleJoinRequestResponse = async (notificationId: string, action: 'approve' | 'reject') => {
    console.log('🟠 NOTIFICATIONSECTION.TSX - handleJoinRequestResponse called with:', { notificationId, action });

    try {
    setActionLoading(notificationId);
    
    const notification = notifications.find(n => n.$id === notificationId);
    if (!notification) return;

    const data = notification.data ? JSON.parse(notification.data) : {};
    const joinRequestId = data.joinRequestId;

    if (!joinRequestId) {
      alert('Invalid join request data');
      return;
    }
    
    console.log(`🎯 ${action}ing join request:`, joinRequestId);
    
    await CommunityJoinRequestService.respondToJoinRequest(
      joinRequestId, 
      action, 
      user?.$id || '' // ✅ FIXED: Use user?.$id instead of userId
    );

    setNotifications(prev => prev.filter(n => n.$id !== notificationId));
    
    alert(`Join request ${action}d successfully!`);
    await loadNotifications();
    
  } catch (error: any) {
    console.error(`Error ${action}ing join request:`, error);
    alert(error.message || `Failed to ${action} join request`);
  } finally {
    setActionLoading(null);
  }
};

  const markAsRead = async (notificationId: string) => {
    try {
      await CommunityService.markNotificationAsRead(notificationId);
      setNotifications(prev => prev.filter(n => n.$id !== notificationId));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const pendingNotifications = notifications.filter(n => n.status === 'pending');
  const processedNotifications = notifications.filter(n => n.status !== 'pending');

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Community Notifications</h2>
        <div className="text-center py-4">Loading notifications...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">Community Notifications</h2>
      
      {/* Pending Actions */}
      {pendingNotifications.length > 0 && (
        <div className="mb-6">
          <h3 className="font-medium text-red-600 mb-3">
            Pending Actions ({pendingNotifications.length})
          </h3>
          <div className="space-y-3">
            {pendingNotifications.map(notification => (
              <div key={notification.$id} className="border border-red-200 rounded-lg p-4 bg-red-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">
                      {notification.type === 'admin_invite' 
                        ? `Admin Invitation - ${notification.communityName}`
                        : notification.message}
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(notification.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  
                  {notification.type === 'admin_invite' && (
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleAdminInviteResponse(notification.$id, 'accept')}
                        disabled={actionLoading === notification.$id}
                        className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50"
                      >
                        {actionLoading === notification.$id ? 'Loading...' : 'Accept'}
                      </button>
                      <button
                        onClick={() => handleAdminInviteResponse(notification.$id, 'reject')}
                        disabled={actionLoading === notification.$id}
                        className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                                    {/* ✅ ADD THIS NEW SECTION FOR JOIN REQUESTS */}
                {notification.type === 'community_join_request' && (
                <div className="flex gap-2 ml-4">
                    <button
                    onClick={() => handleJoinRequestResponse(notification.$id, 'approve')}
                    disabled={actionLoading === notification.$id}
                    className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50"
                    >
                    {actionLoading === notification.$id ? 'Loading...' : 'Approve'}
                    </button>
                    <button
                    onClick={() => handleJoinRequestResponse(notification.$id, 'reject')}
                    disabled={actionLoading === notification.$id}
                    className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50"
                    >
                    Reject
                    </button>
                </div>
                )}


                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Notifications */}
      {processedNotifications.length > 0 && (
        <div>
          <h3 className="font-medium text-gray-700 mb-3">Recent Activity</h3>
          <div className="space-y-3">
            {processedNotifications.map(notification => (
              <div key={notification.$id} className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">
                      {notification.communityName}
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {notification.message}
                    </p>
                    <div className="flex items-center gap-4 mt-2">
                      <span className={`text-xs px-2 py-1 rounded ${
                        notification.status === 'accepted' 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {notification.status === 'accepted' ? 'Accepted' : 'Rejected'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(notification.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => markAsRead(notification.$id)}
                    className="text-gray-400 hover:text-gray-600 text-sm"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {notifications.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No community notifications yet
        </div>
      )}
    </div>
  );
};

export default NotificationsSection;