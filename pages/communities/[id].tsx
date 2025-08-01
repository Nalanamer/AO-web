// pages/communities/[id].tsx (UPDATED - Mobile-Friendly Create Event Button)
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useCommunities } from '../../hooks/useCommunities';
import CommunityService, { Community, CommunityActivity } from '../../services/useCommunities';
import { databases, DATABASE_ID, ACTIVITIES_COLLECTION_ID,EVENTS_COLLECTION_ID, COMMUNITIES_COLLECTION_ID  } from '../../lib/appwrite';
import { useAuth } from '../../contexts/AuthContext';
import MainLayout from '@/components/layout/MainLayout';
// Add this import at the top of pages/communities/[id].tsx
import CommunityPostCard from '../../components/CommunityPostCard';
import MembershipService from '../../services/MembershipService';
import PostComposer from '../../components/PostComposer';

export default function CommunityDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { joinCommunity, loading } = useCommunities();
  
  const [community, setCommunity] = useState<Community | null>(null);
  const [communityActivities, setCommunityActivities] = useState<CommunityActivity[]>([]);
  const [communityEvents, setCommunityEvents] = useState<any[]>([]);

  const [activeTab, setActiveTab] = useState<'posts' | 'activities' | 'events'>('posts');
  const [pageLoading, setPageLoading] = useState(true);
    const [isUserAdmin, setIsUserAdmin] = useState(false);
    const { user } = useAuth(); // Add this line
const [communityPosts, setCommunityPosts] = useState<any[]>([]);
    const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'likes'>('newest');
    const [isJoined, setIsJoined] = useState(false);
   

  useEffect(() => {
  if (id && typeof id === 'string' && user) {
    loadCommunityData(id);
  }
}, [id, user]); // Add user dependency

// Add this useEffect in your community detail page:
useEffect(() => {
  if (activeTab === 'posts' && community) {
    const loadPosts = async () => {
      try {
        const posts = await CommunityService.getCommunityPosts(community.$id!, sortBy);
        setCommunityPosts(posts);
      } catch (error) {
        console.error('Error loading posts:', error);
      }
    };
    loadPosts();
  }
}, [activeTab, community, sortBy]);

  // Add this useEffect after your existing ones:
useEffect(() => {
  const checkAdminStatus = async () => {
    if (community && user) {
      // Check if user is creator OR in admins array
      const isCreator = community.creatorId === user.$id;
      const isInAdmins = community.admins.includes(user.$id);
      setIsUserAdmin(isCreator || isInAdmins);
      
      console.log('Admin check:', { 
        isCreator, 
        isInAdmins, 
        userId: user.$id, 
        creatorId: community.creatorId, 
        admins: community.admins 
      });
    }
  };
  
  if (community && user) {
    checkAdminStatus();
  }
}, [community, user]);

// Clean version of the membership check useEffect:
useEffect(() => {
  const checkMembershipStatus = async () => {
    if (community && user?.$id) {
      const isMember = await MembershipService.checkMembership(community.$id!, user.$id);
      const isAdmin = await MembershipService.isUserCommunityAdmin(community.$id!, user.$id);
      
      if (isAdmin) {
        setIsUserAdmin(true);
        setIsJoined(true);
      } else if (isMember) {
        setIsUserAdmin(false);
        setIsJoined(true);
      } else {
        setIsUserAdmin(false);
        setIsJoined(false);
      }
    }
  };

  if (community && user) {
    checkMembershipStatus();
  }
}, [community?.$id, user?.$id]);

useEffect(() => {
  if (community && user && community.type === 'private') {
    const isMember = (() => {
      if (!community.members) return false;
      
      if (typeof community.members === 'string') {
        const membersString = community.members as string;
        const membersList = membersString.split(',').filter((id: string) => id.trim());
        return membersList.includes(user.$id);
      } else if (Array.isArray(community.members)) {
        return community.members.includes(user.$id);
      }
      
      return false;
    })();
    
    const isAdmin = community.admins?.includes(user.$id);
    const isCreator = community.creatorId === user.$id;
    const hasAccess = isMember || isAdmin || isCreator;
    
    if (!hasAccess) {
      alert('This is a private community. You must be a member to view its content.');
      router.push('/communities');
      return;
    }
  }
}, [community, user, router]);

// Add handleToggleEventVisibility function
const handleToggleEventVisibility = async (eventId: string, makePublic: boolean) => {
  try {
    const newVisibility = makePublic ? 'public' : 'community_only';
    
    await databases.updateDocument(
      DATABASE_ID,
      EVENTS_COLLECTION_ID,
      eventId,
      { eventVisibility: newVisibility }
    );
    
    // Refresh events
    if (community?.$id) {
    loadCommunityData(community.$id);
    }
    alert(`Event ${makePublic ? 'made public' : 'made private to community'}`);
  } catch (error) {
    alert('Failed to update event visibility');
  }
};

const loadCommunityPosts = async () => {
  if (!community) return;
  try {
    const posts = await CommunityService.getCommunityPosts(community.$id!, sortBy);
    setCommunityPosts(posts);
  } catch (error) {
    console.error('Error loading posts:', error);
  }
};

const handleLeaveCommunity = async () => {
  if (!community || !community.$id || !user) return;
  
  if (!confirm('Are you sure you want to leave this community?')) return;
  
  try {
    console.log('🚀 [Community Detail] Attempting to leave community');
    
    // Use our unified service
    await MembershipService.leaveCommunity(community.$id, user.$id);
    
    setIsJoined(false);
    setIsUserAdmin(false);
    
    // Reload community data to get updated member count
    await loadCommunityData(community.$id);
    
    alert('Left community successfully');
  } catch (error) {
    console.error('❌ [Community Detail] Error leaving community:', error);
    alert('Failed to leave community');
  }
};

const handleLikePost = async (postId: string) => {
  try {
    await CommunityService.likePost(postId, user?.$id || ''); // ← This should be correct
    loadCommunityPosts(); // Refresh posts
  } catch (error) {
    console.error('Error liking post:', error);
  }
};

// In your community detail page ([id].tsx), update handleAddComment:
// Fixed handleAddComment in [id].tsx
const handleAddComment = async (postId: string, comment: string) => {
  try {
    await CommunityService.addComment(postId, user?.$id || '', comment);
    await loadCommunityPosts();
  } catch (error: any) {
    console.error('Error adding comment:', error);
    alert('Failed to add comment: ' + (error?.message || error));
  }
};

const handleDeleteComment = async (commentId: string, postId: string) => {
  try {
    await CommunityService.deleteComment(commentId, postId, user?.$id || '');
    await loadCommunityPosts();
  } catch (error: any) {
    console.error('Error deleting comment:', error);
    alert('Failed to delete comment: ' + (error?.message || error));
  }
};

  const loadCommunityData = async (communityId: string) => {
  try {
    setPageLoading(true);
    
    // Load community details
    const communityData = await CommunityService.getCommunityById(communityId);
    setCommunity(communityData);

    // Check if user has access (member, admin, or creator)
    if (user && communityData) {
      const isMember = communityData.members?.includes(user.$id);
      const isAdmin = communityData.admins?.includes(user.$id);
      const isCreator = communityData.creatorId === user.$id;
      
      // User has access if they're a member, admin, or creator
      const hasAccess = isMember || isAdmin || isCreator;
      setIsJoined(hasAccess);
      
      // ADD THESE DEBUG LOGS:
      console.log('Community loaded, user is member:', hasAccess);

    }

    // Load community activities
    const activities = await CommunityService.getCommunityActivities(communityId);
    setCommunityActivities(activities);
    
    // Load community events
    const events = await CommunityService.getCommunityEvents(communityId);
    setCommunityEvents(events);
    
  } catch (error) {
    console.error('Error loading community data:', error);
  } finally {
    setPageLoading(false);
  }
};

// Add these functions to your community detail page:
const handlePinPost = async (postId: string) => {
  try {
    await CommunityService.pinPost(postId, false, 7); // 7-day pin
    loadCommunityPosts(); // Refresh posts
  } catch (error) {
    console.error('Error pinning post:', error);
  }
};

const handleUnpinPost = async (postId: string) => {
  try {
    await CommunityService.unpinPost(postId);
    loadCommunityPosts(); // Refresh posts
  } catch (error) {
    console.error('Error unpinning post:', error);
  }
};

const handleDeletePost = async (postId: string) => {
  try {
    await CommunityService.deletePost(postId); // You'll need to create this method
    loadCommunityPosts(); // Refresh posts
  } catch (error) {
    console.error('Error deleting post:', error);
  }
};

  // Add this function with your other functions:
const handleUnlinkActivity = async (activityId: string) => {
  if (!community) return;
  
  try {
    const success = await CommunityService.unlinkActivityFromCommunity(
      community.$id!, 
      activityId, 
      user?.$id || ''
    );
    
    if (success) {
      // Refresh the community data
      loadCommunityData(community.$id!);
      alert('Activity removed from community');
    }
  } catch (error) {
    alert('Failed to remove activity from community');
  }
};

 // STEP 3: Find your handleJoinCommunity function (around line 200-250) and REPLACE it with this fixed version:

const handleJoinCommunity = async () => {
  if (!community || !user) return;
 
  try {
    console.log('🚀 [Community Detail] Attempting to join community');
    
    // Use our unified service
    const result = await MembershipService.joinCommunity(community.$id!, user.$id);
    
    if (result?.success) {
      console.log('✅ [Community Detail] Successfully joined');
      setIsJoined(true);
      
      // Reload community data to get updated member count
      await loadCommunityData(community.$id!);
      
      alert('Successfully joined community!');
    } else {
      console.log('⚠️ [Community Detail] Join result:', result);
      alert(result?.status || 'Failed to join community');
    }
    
  } catch (error: any) {
    console.error('❌ [Community Detail] Error joining community:', error);
    alert('Failed to join community: ' + (error?.message || error));
  }
};
  if (pageLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!community) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900">Community not found</h1>
        <button 
          onClick={() => router.push('/communities')}
          className="mt-4 text-blue-600 hover:text-blue-700"
        >
          ← Back to Communities
        </button>
      </div>
    );
  }

  return (
    <MainLayout>
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{community.name}</h1>
            <p className="text-gray-600 mb-4">{community.description}</p>
            
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <span>{community.memberCount} members</span>
              <span>{community.activityCount} activities</span>
              <span className={`px-2 py-1 rounded-full text-xs ${
                community.type === 'public' 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-blue-100 text-blue-700'
              }`}>
                {community.type === 'public' ? 'Public' : 'Private'}
              </span>
            </div>
            
            <div className="mt-2 text-sm text-gray-500">
              📍 {community.location.address}
            </div>
          </div>
          
          {!isUserAdmin && !isJoined && (
  <button
    onClick={handleJoinCommunity}
    disabled={loading}
    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
  >
    {loading ? 'Joining...' : community.type === 'private' ? 'Request to Join' : 'Join Community'}
  </button>
)}

{isUserAdmin && (
  <div className="text-sm text-green-600 font-medium">
    ✓ Community Admin
  </div>
)}
        </div>

        
{/* Community Actions */}
<div className="bg-white rounded-lg shadow-md p-4 mt-4">
  <div className="flex justify-between items-center">
    <div className="flex gap-6">
      <div>
        <span className="text-2xl font-bold">{community.memberCount}</span>
        <span className="text-gray-600 ml-2">Members</span>
      </div>
      <div>
        <span className="text-2xl font-bold">{community.eventCount}</span>
        <span className="text-gray-600 ml-2">Events</span>
      </div>
    </div>

    <div className="flex gap-2">
      {!isJoined ? (
        <button
          onClick={handleJoinCommunity}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          {community.type === 'private' ? 'Request to Join' : 'Join Community'}
        </button>
      ) : (
        <>
          <button className="px-6 py-2 bg-green-600 text-white rounded-lg cursor-default">
  ✓ Joined Community
</button>
          
          {/* ADD THIS: Settings button for admins/owners */}
         {user?.$id && (community.creatorId === user.$id || community.admins?.includes(user.$id)) && (

            <button
              onClick={() => router.push(`/communities/${community.$id}/settings`)}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Settings
            </button>
          )}
          
          <button
  onClick={handleLeaveCommunity}  // ← Use your existing function
  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
>
            Leave
          </button>
        </>
      )}
    </div>
  </div>
</div>

      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-8 bg-gray-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('activities')}
          className={`px-6 py-2 rounded-md font-medium transition-colors ${
            activeTab === 'activities' 
              ? 'bg-white text-blue-600 shadow-sm' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Activities ({community.activityCount})
        </button>
        <button
          onClick={() => setActiveTab('events')}
          className={`px-6 py-2 rounded-md font-medium transition-colors ${
            activeTab === 'events' 
              ? 'bg-white text-blue-600 shadow-sm' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Events
        </button>
        
        <button
          onClick={() => setActiveTab('posts')}
          className={`px-6 py-2 rounded-md font-medium transition-colors ${
            activeTab === 'posts' 
              ? 'bg-white text-blue-600 shadow-sm' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Posts
        </button> 
      </div>

      {/* Tab Content */}
      <div className="min-h-96">
        {activeTab === 'activities' && (
          <div>
            {communityActivities.length > 0 ? (
              <div className="grid gap-4">
                {communityActivities.map(activity => (
  <CommunityActivityCard 
    key={activity.$id} 
    communityActivity={activity}
    onActivityClick={(activityId) => router.push(`/activities/${activityId}`)}
    isAdmin={isUserAdmin}
    onUnlink={handleUnlinkActivity}
    router={router}
    isJoined={isJoined} // Add this prop
  />
))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <p className="text-gray-500 text-lg">No activities linked yet</p>
                <p className="text-gray-400">Community admins can link activities to share with members</p>
              </div>
            )}
          </div>
        )}

       {activeTab === 'events' && (
  <div>
    {/* Create Event Button */}
{community && user?.$id && isJoined && (

      <div className="mb-6">
        <button
          //onClick={() => router.push(`/communities/${community.$id}/create-event`)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Create events via the activities in this community
        </button>
      </div>
    )}

    {communityEvents.length > 0 ? (
      <div className="grid gap-4">
        {communityEvents.map(event => (
  <CommunityEventCard 
    key={event.$id} 
    event={event}
    community={community}
    onEventClick={(eventId) => router.push(`/events/${eventId}`)}
    onToggleVisibility={isUserAdmin ? handleToggleEventVisibility : undefined}
    isAdmin={isUserAdmin}  // Add this line
    user={user}           // Add this line
    router={router}       // Add this line
  />
))}
      </div>
    ) : (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </div>
        <p className="text-gray-500 text-lg">No events scheduled yet</p>
        <p className="text-gray-400">Create events from community activities or start fresh</p>
      </div>
    )}
  </div>
)}
       {  activeTab === 'posts' && (
 <div>
   
   {/* ADD SORT CONTROLS HERE - RIGHT AFTER THE OPENING DIV */}
   {/* Sort Controls */}
   {/* Sort Controls - Updated styling */}
<div className="mb-4 flex justify-between items-center bg-white border rounded-lg p-3">
  <div className="text-sm text-gray-600">
    {communityPosts.length} posts
  </div>
  <div className="flex items-center gap-2">
    <span className="text-sm text-gray-600">Sort by:</span>
    <select
      value={sortBy}
      onChange={(e) => {
        setSortBy(e.target.value as 'newest' | 'oldest' | 'likes');
      }}
      className="bg-white border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" // ← Updated styling
    >
      <option value="newest">Newest</option>
      <option value="oldest">Oldest</option>
      <option value="likes">Most Liked</option>
    </select>
  </div>
</div>
   {/* END SORT CONTROLS */}
   
{community && user?.$id && isJoined && (
     <div className="mb-6 bg-white border rounded-lg p-4">
       <PostComposer 
       communityId={community.$id!}
       onPostCreated={loadCommunityPosts}
       />
     </div>
   )}

   
   <div className="space-y-4">
               {communityPosts.map(post => (
           <CommunityPostCard 
               key={post.$id}
               post={post}
               onLike={handleLikePost}
               onComment={handleAddComment}
               onDeleteComment={handleDeleteComment} 
               isAdmin={isUserAdmin}
               communityAdmins={community?.admins || []}    
  communityCreatorId={community?.creatorId}     
               onPin={handlePinPost}
               onUnpin={handleUnpinPost}
               onDelete={handleDeletePost}
           />
           ))}
   </div>
 </div>

) }

      </div>
    </div>
    </MainLayout>
  );
}

interface CommunityActivityCardProps {
  communityActivity: CommunityActivity;
  onActivityClick: (activityId: string) => void;
  isAdmin?: boolean; // Add this prop
  onUnlink?: (activityId: string) => void; // Add this prop
  router?: any;
  isJoined?: boolean; // Add this new prop to control Create Event button visibility
}

const CommunityActivityCard: React.FC<CommunityActivityCardProps> = ({ 
  communityActivity, 
  onActivityClick,
  isAdmin = false,
  onUnlink,
  router,
  isJoined = false // Default to false
}) => {
  const [activityData, setActivityData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  // Remove showActions state - no longer needed
  const [communityEvents, setCommunityEvents] = useState<any[]>([]);

  useEffect(() => {
    fetchActivityData();
  }, []);

  const fetchActivityData = async () => {
    try {
      const activity = await databases.getDocument(
        DATABASE_ID,
        ACTIVITIES_COLLECTION_ID,
        communityActivity.activityId
      );
      setActivityData(activity);
    } catch (error) {
      console.error('Error fetching activity:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (router) {
      router.push(`/communities/${communityActivity.communityId}/create-event?activityId=${communityActivity.activityId}`);
    }
  };

  const handleUnlink = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onUnlink && confirm('Remove this activity from the community?')) {
      onUnlink(communityActivity.activityId);
    }
  };

  const handleViewActivity = (e: React.MouseEvent) => {
    e.stopPropagation();
    onActivityClick(communityActivity.activityId);
  };

  if (loading) {
    return (
      <div className="border rounded-lg p-4 bg-white animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
      </div>
    );
  }

  if (!activityData) {
    return (
      <div className="border rounded-lg p-4 bg-white border-red-200">
        <p className="text-red-600">Activity not found</p>
      </div>
    );
  }

  // Parse activity types if they're stored as JSON
  const activityTypes = Array.isArray(activityData.types) 
    ? activityData.types 
    : (activityData.types ? JSON.parse(activityData.types) : []);

  return (
    <div 
      className="border rounded-lg p-4 bg-white hover:shadow-md transition-shadow cursor-pointer relative"
      onClick={handleViewActivity}
      // Remove hover event handlers
    >
      {/* Always Visible Action Buttons Section - Mobile Friendly */}
      <div className="mb-3 flex justify-between items-start">
        <div className="flex-1">
          {/* Activity Header */}
          <h3 className="font-semibold text-lg text-gray-900 hover:text-blue-600 mb-1">
            {activityData.activityname}
          </h3>
          
          {/* Activity Types */}
          {activityTypes.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {activityTypes.slice(0, 3).map((type: string, index: number) => (
                <span 
                  key={index}
                  className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                >
                  {type}
                </span>
              ))}
              {activityTypes.length > 3 && (
                <span className="text-xs text-gray-500">+{activityTypes.length - 3} more</span>
              )}
            </div>
          )}
        </div>

        {/* Always Visible Action Buttons */}
        <div className="flex flex-col gap-2 ml-4">
          {/* Create Event Button - Always visible for joined members */}
          {isJoined && (
            <button
              onClick={handleCreateEvent}
              className="bg-green-600 text-white px-3 py-2 rounded-md hover:bg-green-700 transition-colors shadow-sm text-sm font-medium flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              Create Event
            </button>
          )}
          
          {/* Admin Unlink Button - Always visible for admins */}
          {isAdmin && (
            <button
              onClick={handleUnlink}
              className="bg-red-600 text-white p-2 rounded-md hover:bg-red-700 transition-colors shadow-sm"
              title="Remove from Community"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}

          {/* Pinned Badge */}
          {communityActivity.isPinned && (
            <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
              📌 Pinned
            </span>
          )}
        </div>
      </div>

      {/* Activity Description */}
      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
        {activityData.description}
      </p>

      {/* Community Notes */}
      {communityActivity.notes && (
        <div className="mb-3 p-2 bg-purple-50 rounded text-sm border border-purple-200">
          <span className="font-medium text-purple-900">Community Note: </span>
          <span className="text-purple-700">{communityActivity.notes}</span>
        </div>
      )}

      {/* Activity Details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3 text-sm">
        <div className="flex items-center gap-2 text-gray-600">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          </svg>
          <span className="truncate">{activityData.location}</span>
        </div>
      </div>

      {/* Privacy and Metadata */}
      <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
        <div className="flex items-center gap-3">
          <span className={`px-2 py-1 rounded-full ${
            activityData.isPrivate 
              ? 'bg-orange-100 text-orange-700' 
              : 'bg-green-100 text-green-700'
          }`}>
            {activityData.isPrivate ? '🔒 Private' : '🌍 Public'}
          </span>
                        <span>Added {new Date(communityActivity.createdAt).toLocaleDateString('en-GB', { 
                day: '2-digit', 
                month: 'short', 
                year: 'numeric' 
                })}</span>
        </div>
        
        <div className="flex items-center gap-1 text-gray-400">
          <span>View Details</span>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </div>
  );
};

interface CommunityEventCardProps {
  event: any;
  community: Community;
  onEventClick: (eventId: string) => void;
  onToggleVisibility?: (eventId: string, isPublic: boolean) => void;
  isAdmin?: boolean;
  user?: any;
  router?: any;
}

const CommunityEventCard: React.FC<CommunityEventCardProps> = ({ 
  event, 
  community,
  onEventClick,
  onToggleVisibility,
  isAdmin = false,
  user,
  router
}) => {
  const isPublic = event.eventVisibility === 'public';

  console.log('🔍 COMMUNITY DETAIL DEBUG:', {
    user: user?.$id,
    community: community,
    isAdmin: community?.admins?.includes(user?.$id),
    isCreator: community?.creatorId === user?.$id,
    isJoined: community?.members?.includes(user?.$id)
  });

  return (
    <div 
      className="border rounded-lg p-4 bg-white hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onEventClick(event.$id)}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-lg text-gray-900 mb-1">
            {event.eventName}
          </h3>
          
          {/* Visibility Badge */}
          <div className="flex items-center gap-2 mb-2">
            {isPublic ? (
              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                🌍 Public Event
              </span>
            ) : (
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                🔒 Community Only
              </span>
            )}
            
            {event.isFromCommunity && (
              <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
                Community Event
              </span>
            )}
          </div>
        </div>

        {/* Right side buttons */}
        <div className="flex flex-col gap-2 ml-4">
          {/* Edit Event Button */}
          {community && user && router && (isAdmin || event.organizerId === user.$id) && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/communities/${community.$id}/edit-event/${event.$id}`);
              }}
              className="bg-green-600 text-white px-3 py-1 rounded-md hover:bg-green-700 transition-colors shadow-sm text-xs font-medium"
            >
              Edit Event
            </button>
          )}

          {/* Admin Toggle Button - Only show for public communities */}
          {onToggleVisibility && community?.type === 'public' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleVisibility(event.$id, !isPublic);
              }}
              className={`text-xs px-3 py-1 rounded-md ${
                isPublic 
                  ? 'bg-orange-100 text-orange-700 hover:bg-orange-200' 
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
            >
              {isPublic ? 'Make Private' : 'Make Public'}
            </button>
          )}
        </div>
      </div>

      {/* Event Description */}
      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
        {event.description}
      </p>

      {/* Event Details Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-500">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          <span>{new Date(event.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} at {event.meetupTime || event.time}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          </svg>
          <span className="truncate">{event.meetupPoint}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-.5a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
          </svg>
          <span>{event.currentParticipants || 0}/{event.maxParticipants || '∞'} participants</span>
        </div>

        {/* Display difficulty if available */}
        {event.difficulty && (
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span className="capitalize">{event.difficulty} level</span>
          </div>
        )}
      </div>

      {/* Display inclusive options if available */}
      {event.inclusive && event.inclusive.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex flex-wrap gap-1">
            <span className="text-xs text-gray-500 mr-2">Inclusive:</span>
            {event.inclusive.map((option: string, index: number) => (
              <span 
                key={index}
                className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full"
              >
                {option.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};