// components/CommunityCard.tsx
import React, { useState, useEffect } from 'react';
import { Community } from '../services/useCommunities';
import { useCommunities } from '../hooks/useCommunities';
import { useAuth } from '../contexts/AuthContext';
import CommunityJoinRequestService from '../services/useCommunityJoinRequests';
import MembershipService from '../services/MembershipService';

interface CommunityCardProps {
  community: Community;
  showJoinButton?: boolean;
  onClick?: () => void;
  onJoinUpdate?: () => void;
}

export const CommunityCard: React.FC<CommunityCardProps> = ({
  community,
  showJoinButton = true,
  onClick,
  onJoinUpdate
}) => {
  const { joinCommunity, loading } = useCommunities();
  const { user } = useAuth();
  
  const [joinStatus, setJoinStatus] = useState<string | null>(null);
  const [joinRequest, setJoinRequest] = useState<any>(null);
  const [statusLoading, setStatusLoading] = useState(false);

  useEffect(() => {
    if (user && community && !statusLoading) {
      checkUserStatus();
    }
  }, [user?.$id, community.$id]);

  const checkUserStatus = async () => {
    try {
      setStatusLoading(true);

      if (!user?.$id) {
        setJoinStatus(null);
        return;
      }

      const isMember = await MembershipService.checkMembership(community.$id!, user.$id);
      
      if (isMember) {
        setJoinStatus('member');
        return;
      }

      if (community.creatorId === user.$id || community.admins?.includes(user.$id)) {
        setJoinStatus('admin');
        return;
      }

      if (community.type === 'private') {
        const request = await CommunityJoinRequestService.getUserJoinRequestStatus(
          community.$id!, 
          user.$id
        );
        if (request) {
          setJoinRequest(request);
          setJoinStatus(request.status);
        } else {
          setJoinStatus(null);
        }
      } else {
        setJoinStatus(null);
      }

    } catch (error) {
      console.error('Error checking user status:', error);
      setJoinStatus(null);
    } finally {
      setStatusLoading(false);
    }
  };

  const handleJoin = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!user) {
      alert('Please log in to join communities');
      return;
    }

    try {
      if (joinStatus === 'rejected' && joinRequest?.respondedAt) {
        const rejectedDate = new Date(joinRequest.respondedAt);
        const daysSinceRejection = (Date.now() - rejectedDate.getTime()) / (1000 * 60 * 60 * 24);
        
        if (daysSinceRejection < 1) {
          alert('You must wait 24 hours before requesting to join again after rejection');
          return;
        }
      }

      if (joinStatus === 'pending') {
        if (!confirm('Are you sure you want to cancel your join request?')) return;
        
        await CommunityJoinRequestService.cancelJoinRequest(community.$id!, user.$id);
        setJoinStatus(null);
        setJoinRequest(null);
        alert('Join request cancelled');
        onJoinUpdate && onJoinUpdate();
        return;
      }

      if (community.type === 'public') {
        const result = await joinCommunity(community.$id!);
        if (result?.success) {
          setJoinStatus('member');
          alert('Successfully joined the community!');
          onJoinUpdate && onJoinUpdate();
        }
      } else {
        await CommunityJoinRequestService.submitJoinRequest(community.$id!, user.$id);
        setJoinStatus('pending');
        alert('Join request submitted! Admins will review your request.');
        onJoinUpdate && onJoinUpdate();
      }

    } catch (error: any) {
      console.error('Error joining community:', error);
      alert(error.message || 'Failed to join community');
    }
  };

  const handleLeaveCommunity = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!confirm('Are you sure you want to leave this community?')) return;

    try {
      await MembershipService.leaveCommunity(community.$id!, user!.$id);
      MembershipService.clearCache(community.$id!, user!.$id);
      
      setJoinStatus(null);
      setJoinRequest(null);
      onJoinUpdate && onJoinUpdate();
      
      alert('Left community successfully');
    } catch (error) {
      console.error('Error leaving community:', error);
      alert('Failed to leave community');
    }
  };

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      console.log('Navigate to community:', community.$id);
    }
  };

  const getJoinButton = () => {
    if (!user) {
      return (
        <button
          onClick={(e) => {
            e.stopPropagation();
            alert('Please log in to join communities');
          }}
          className="w-full bg-gray-400 text-white py-2 px-4 rounded-md text-sm font-medium cursor-not-allowed"
        >
          Login to Join
        </button>
      );
    }

    if (loading || statusLoading) {
      return (
        <button
          disabled
          className="w-full bg-gray-400 text-white py-2 px-4 rounded-md text-sm font-medium cursor-not-allowed"
        >
          Loading...
        </button>
      );
    }

    switch (joinStatus) {
      case 'admin':
        return (
          <button
            onClick={(e) => {
              e.stopPropagation();
              console.log('Navigate to community admin:', community.$id);
            }}
            className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 text-sm font-medium"
          >
            Manage Community
          </button>
        );

      case 'member':
        return (
          <div className="space-y-2">
            <button
              onClick={handleClick}
              className="w-full bg-emerald-600 text-white py-2 px-4 rounded-md hover:bg-emerald-700 text-sm font-medium"
            >
              View Community
            </button>
            <button
              onClick={handleLeaveCommunity}
              className="w-full bg-red-500 text-white py-1 px-2 text-xs rounded hover:bg-red-600"
            >
              Leave
            </button>
          </div>
        );

      case 'pending':
        return (
          <div className="space-y-2">
            <div className="w-full bg-yellow-100 text-yellow-800 py-2 px-4 rounded-md text-center border border-yellow-300 text-sm font-medium">
              Request Pending
            </div>
            <button
              onClick={handleJoin}
              className="w-full bg-gray-500 text-white py-1 px-2 text-xs rounded hover:bg-gray-600"
            >
              Cancel Request
            </button>
            {joinRequest && joinRequest.requestedAt && (
              <p className="text-xs text-gray-500 text-center">
                Requested: {new Date(joinRequest.requestedAt).toLocaleDateString()}
              </p>
            )}
          </div>
        );

      case 'rejected':
        return (
          <div className="space-y-2">
            <div className="w-full bg-red-100 text-red-800 py-2 px-4 rounded-md text-center border border-red-300 text-sm font-medium">
              Request Rejected
            </div>
            <button
              onClick={handleJoin}
              className="w-full bg-orange-600 text-white py-1 px-2 text-xs rounded hover:bg-orange-700"
            >
              Request Again
            </button>
            {joinRequest && joinRequest.respondedAt && (
              <p className="text-xs text-gray-500 text-center">
                Rejected: {new Date(joinRequest.respondedAt).toLocaleDateString()}
              </p>
            )}
          </div>
        );

      case 'cancelled':
        return (
          <button
            onClick={handleJoin}
            className={`w-full py-2 px-4 rounded-md text-white text-sm font-medium ${
             community.type === 'private' 
               ? 'bg-orange-600 hover:bg-orange-700' 
               : 'bg-blue-600 hover:bg-blue-700'
           }`}
         >
           {community.type === 'private' ? 'Request to Join' : 'Join Community'}
         </button>
       );

     default:
       return (
         <button
           onClick={handleJoin}
           className={`w-full py-2 px-4 rounded-md text-white text-sm font-medium ${
             community.type === 'private' 
               ? 'bg-orange-600 hover:bg-orange-700' 
               : 'bg-blue-600 hover:bg-blue-700'
           }`}
         >
           {community.type === 'private' ? 'Request to Join' : 'Join Community'}
         </button>
       );
   }
 };

 return (
   <div 
     className="border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer bg-white"
     onClick={handleClick}
   >
     {community.avatar && (
       <img 
         src={community.avatar}
         alt={community.name}
         className="w-16 h-16 rounded-full mb-3 object-cover"
       />
     )}
     
     <h3 className="font-semibold text-lg mb-2 text-gray-900">{community.name}</h3>
     <p className="text-gray-600 text-sm mb-3 line-clamp-2">{community.description}</p>
     
     <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
       <span>{community.memberCount} members</span>
       <span className={`px-2 py-1 rounded-full text-xs ${
         community.type === 'public' 
           ? 'bg-green-100 text-green-700'
           : 'bg-orange-100 text-orange-700'
       }`}>
         {community.type === 'public' ? 'Public' : 'Private'}
       </span>
     </div>
     
     <div className="text-xs text-gray-400 mb-3">
       📍 {community.location?.address || 'Location not specified'}
     </div>
     
     {community.activityCount > 0 && (
       <div className="text-xs text-gray-500 mb-3">
         {community.activityCount} activities
       </div>
     )}
     
     {showJoinButton && getJoinButton()}
   </div>
 );
};