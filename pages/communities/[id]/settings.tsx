// Create this file: pages/communities/[id]/settings.tsx
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import CommunityService from '@/services/useCommunities';
import MainLayout from '@/components/layout/MainLayout';
import { databases, DATABASE_ID, USER_PROFILES_COLLECTION_ID, Query } from '@/lib/appwrite';
import CommunityJoinRequestService from '@/services/useCommunityJoinRequests';



interface CommunitySettings {
  allowMemberEvents: boolean;
  requireEventApproval: boolean;
  defaultEventVisibility: 'public' | 'community_only';
}

interface AdminUser {
  $id: string;
  email: string;
  name?: string;
}

interface JoinRequest {
  $id: string;
  userId: string;
  requestedAt: string;
  message?: string;
  userProfile?: {
    name?: string;
    email?: string;
  };
}

const CommunitySettingsPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  const [community, setCommunity] = useState<any>(null);
  const [settings, setSettings] = useState<CommunitySettings>({
    allowMemberEvents: true,
    requireEventApproval: false,
    defaultEventVisibility: 'community_only'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pendingInvites, setPendingInvites] = useState<any[]>([]);
  const [pendingMembers, setPendingMembers] = useState<any[]>([]);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [currentAdmins, setCurrentAdmins] = useState<AdminUser[]>([]);
const [pendingJoinRequests, setPendingJoinRequests] = useState<JoinRequest[]>([]);const [joinRequestsLoading, setJoinRequestsLoading] = useState(false);



  useEffect(() => {
    if (id && user) {
      loadCommunitySettings();
       loadPendingJoinRequests();
    }
  }, [id, user]);

 const loadCommunitySettings = async () => {
  try {
    setLoading(true);
    const communityData = await CommunityService.getCommunityById(id as string);
    
    if (!communityData) {
      router.push('/communities');
      return;
    }
    
    // Check if user is owner or admin
    const isOwnerOrAdmin = communityData.creatorId === user?.$id || 
                    (user?.$id && communityData.admins?.includes(user.$id));

    if (!isOwnerOrAdmin) {
      router.push(`/communities/${id}`);
      return;
    }

    setCommunity(communityData);
    
    // Parse settings safely
    let parsedSettings: CommunitySettings = settings;
    if (communityData.settings) {
      try {
        if (typeof communityData.settings === 'string') {
          parsedSettings = JSON.parse(communityData.settings);
        } else {
          parsedSettings = communityData.settings as CommunitySettings;
        }
      } catch (error) {
        console.error('Error parsing community settings:', error);
        parsedSettings = settings;
      }
    }
    setSettings(parsedSettings);

    // Load pending invites and members - WRAPPED IN TRY-CATCH
    try {
      const invites = await CommunityService.getPendingInvites(id as string);
      setPendingInvites(invites);
    } catch (error) {
      console.warn('Could not load pending invites:', error);
      setPendingInvites([]);
    }
    
    try {
      const members = await CommunityService.getPendingMembers(id as string);
      setPendingMembers(members);
    } catch (error) {
      console.warn('Could not load pending members:', error);
      setPendingMembers([]);
    }

    // Load admin emails - MOVED OUTSIDE OF CATCH BLOCKS
    
if (communityData.admins?.length) {
 
  try {
    await loadAdminEmails(communityData.admins);
    
  } catch (error) {
    console.warn('Could not load admin emails:', error);
  }
} 
    
  } catch (error) {
    console.error('Error loading community settings:', error);
    router.push('/communities');
  } finally {
    setLoading(false);
  }
};

const handleJoinRequest = async (joinRequestId: string, action: string) => {
  try {
    await CommunityJoinRequestService.respondToJoinRequest(
      joinRequestId, 
      action, 
      user?.$id || ''
    );
    
    // Remove from pending list
            setPendingJoinRequests(prev => 
        prev.filter((request: any) => request.$id !== joinRequestId)
        );
    // Reload community data to update member count
    await loadCommunitySettings();
    
    alert(`Join request ${action} successfully!`);
    
  } catch (error) {
    console.error('Error handling join request:', error);
    alert(`Failed to ${action} join request`);
  }
};


const loadAdminEmails = async (adminIds: string[]) => {
  
    try {
    const adminUsers = await Promise.all(
      adminIds.map(async (adminId) => {
        try {
          // Get user profile using existing function
          const profiles = await databases.listDocuments(
            DATABASE_ID,
            USER_PROFILES_COLLECTION_ID,
            [Query.equal('userId', adminId)]
          );
          
          if (profiles.documents.length > 0) {
            const profile = profiles.documents[0];
            return {
              $id: adminId,
              email: profile.email,
              name: profile.name
            };
          } else {
            return {
              $id: adminId,
              email: `admin-${adminId.slice(-4)}@unknown.com`,
              name: `Admin ${adminId.slice(-4)}`
            };
          }
        } catch (error) {
          console.warn('Could not load profile for admin:', adminId);
          return {
            $id: adminId,
            email: `admin-${adminId.slice(-4)}@unknown.com`,
            name: `Admin ${adminId.slice(-4)}`
          };
        }
      })
    );
    
    setCurrentAdmins(adminUsers);
  } catch (error) {
    console.error('Error loading admin emails:', error);
    setCurrentAdmins([]);
  }
};

const handleCommunityTypeChange = async (newType: 'public' | 'private') => {
  if (!confirm(`Are you sure you want to change this community to ${newType}?`)) return;
  
  try {
    setLoading(true);
    
    // Use the updated service method
    await CommunityService.updateCommunityType(id as string, newType, user?.$id || '');
    
    setCommunity((currentCommunity: any) => ({ ...currentCommunity, type: newType }));
    
    // If changed to public, reload join requests (should be empty now)
    if (newType === 'public') {
      await loadPendingJoinRequests();
      alert(`Community changed to ${newType}. All pending join requests have been automatically approved.`);
    } else {
      alert(`Community type changed to ${newType}`);
    }
    
  } catch (error) {
    console.error('Error updating community type:', error);
    alert('Failed to update community type');
  } finally {
    setLoading(false);
  }
};

// Add this new function to load join requests
const loadPendingJoinRequests = async () => {
  try {
    setJoinRequestsLoading(true);
    const requests: any = await CommunityJoinRequestService.getPendingJoinRequests(id as string);
    setPendingJoinRequests(requests);
  } catch (error) {
    console.error('Error loading join requests:', error);
    setPendingJoinRequests([]);
  } finally {
    setJoinRequestsLoading(false);
  }
};

  const saveSettings = async () => {
    try {
      setSaving(true);
      await CommunityService.updateCommunitySettings(id as string, settings);
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const inviteAdmin = async () => {
    if (!newAdminEmail.trim()) return;
    
    try {
      setInviteLoading(true);
      
      await CommunityService.inviteAdmin(id as string, newAdminEmail, user?.$id || '');
      setNewAdminEmail('');
      alert('Admin invitation sent successfully!');
      
      // Reload pending invites
      const invites = await CommunityService.getPendingInvites(id as string);
      setPendingInvites(invites);
      
    } catch (error: any) {
      console.error('Error inviting admin:', error);
      alert(error.message || 'Failed to send invitation');
    } finally {
      setInviteLoading(false);
    }
  };

  const cancelInvite = async (inviteId: string) => {
    try {
      await CommunityService.cancelInvite(inviteId);
      setPendingInvites(prev => prev.filter(invite => invite.$id !== inviteId));
      alert('Invitation cancelled');
    } catch (error) {
      console.error('Error cancelling invite:', error);
      alert('Failed to cancel invitation');
    }
  };

 const removeAdmin = async (adminToRemove: string) => {
  if (!confirm('Are you sure you want to remove this admin?')) return;
  
  try {
    await CommunityService.removeAdmin(id as string, adminToRemove);
    // Simple update - just reload the data
    await loadCommunitySettings();
    alert('Admin removed successfully');
  } catch (error) {
    console.error('Error removing admin:', error);
    alert('Failed to remove admin');
  }
};


  const approveMember = async (userId: string) => {
    try {
      await CommunityService.approveMember(id as string, userId);
      setPendingMembers(prev => prev.filter(m => m.userId !== userId));
      alert('Member approved successfully');
    } catch (error) {
      console.error('Error approving member:', error);
      alert('Failed to approve member');
    }
  };

  const rejectMember = async (userId: string) => {
    try {
      await CommunityService.rejectMember(id as string, userId);
      setPendingMembers(prev => prev.filter(m => m.userId !== userId));
      alert('Member rejected');
    } catch (error) {
      console.error('Error rejecting member:', error);
      alert('Failed to reject member');
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Loading settings...</div>
        </div>
      </MainLayout>
    );
  }

  if (!community) {
    return null;
  }


   
  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center gap-4 mb-6">
          <button 
            onClick={() => router.back()}
            className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ← Back
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{community.name} Settings</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Community Settings */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Community Settings</h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="font-medium text-gray-900 dark:text-white">Allow member events</label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Let community members create events from linked activities
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.allowMemberEvents}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    allowMemberEvents: e.target.checked
                  }))}
className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="font-medium text-gray-900 dark:text-white">Require event approval</label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Events need admin approval before being published
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.requireEventApproval}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    requireEventApproval: e.target.checked
                  }))}
className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                />
              </div>

              <div>
                <label className="block font-medium text-gray-900 dark:text-white mb-2">Default event visibility</label>
                <select
                  value={settings.defaultEventVisibility}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    defaultEventVisibility: e.target.value as 'public' | 'community_only'
                  }))}
className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                >
                  <option value="community_only">Community Only</option>
                  <option value="public">Public</option>
                </select>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Default visibility for new events created in this community
                </p>
              </div>
            </div>

                   {/* Community Type Setting - Owner Only */}
            {community.creatorId === user?.$id && (
              <div>
                <label className="block font-medium text-gray-900 dark:text-white mb-2">Community Type</label>
                <select
                  value={community.type}
                  onChange={(e) => handleCommunityTypeChange(e.target.value as 'public' | 'private')}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                >
                  <option value="public">Public - Anyone can join</option>
                  <option value="private">Private - Requires approval</option>
                </select>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Changing to private will require new members to request approval
                </p>
              </div>
            )}

            <button
              onClick={saveSettings}
              disabled={saving}
              className="mt-6 w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>

          {/* Admin Management - Owner Only */}
          {community.creatorId === user?.$id && (
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Admin Management</h2>
              
              {/* Add Admin */}
              <div className="mb-6">
                <label className="block font-medium mb-2 text-gray-900 dark:text-white">Invite Admin (up to 10)</label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                    placeholder="Enter email address"
                    className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white dark:placeholder-gray-400"
                  />
                  <button
                    onClick={inviteAdmin}
                    disabled={inviteLoading || community.admins?.length >= 10}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {inviteLoading ? 'Sending...' : 'Invite'}
                  </button>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Current admins: {community.admins?.length || 0}/10
                </p>
              </div>

              {/* Pending Invites */}
              {pendingInvites.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-medium mb-2 text-gray-900 dark:text-white">Pending Invitations</h3>
                  <div className="space-y-2">
                    {pendingInvites.map(invite => (
                      <div key={invite.$id} className="flex items-center justify-between p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-200 dark:border-yellow-800">
                        <span className="text-sm text-gray-900 dark:text-white">{invite.email}</span>
                        <button
                          onClick={() => cancelInvite(invite.$id)}
                          className="text-red-600 dark:text-red-400 text-sm hover:text-red-800 dark:hover:text-red-300"
                        >
                          Cancel
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

             {/* Current Admins */}
<div>
  <h3 className="font-medium mb-2 text-gray-900 dark:text-white">Current Admins</h3>
  
 
  <div className="space-y-2">
    {currentAdmins.map(admin => (
      <div key={admin.$id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
        <div>
          <span className="text-sm text-gray-900 font-medium">{admin.email}</span>
          {admin.name && <p className="text-xs text-gray-600">{admin.name}</p>}
        </div>
        {admin.$id !== community.creatorId && (
          <button
            onClick={() => removeAdmin(admin.$id)}
            className="text-red-600 text-sm hover:text-red-800"
          >
            Remove
          </button>
        )}
      </div>
    ))}
  </div>
</div>
              
            </div>
          )}

          
{/* Enhanced Member Management Section - For All Communities */}
{(community.creatorId === user?.$id || (user?.$id && community.admins?.includes(user.$id))) && (
  <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 lg:col-span-2">
    <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
      Member Management
    </h2>
    
    {/* Pending Join Requests - Only for Private Communities */}
    {community.type === 'private' && (
      <div className="mb-6">
        <h3 className="font-medium mb-3 text-gray-900 dark:text-white">
          Pending Join Requests ({pendingJoinRequests.length})
        </h3>
        
        {joinRequestsLoading ? (
          <div className="text-center py-4">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-3/4 mx-auto mb-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-1/2 mx-auto"></div>
            </div>
          </div>
        ) : pendingJoinRequests.length > 0 ? (
          <div className="space-y-3">
            {pendingJoinRequests.map(request => (
              <div key={request.$id} className="flex items-center justify-between p-4 border border-yellow-200 dark:border-yellow-800 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {request.userProfile?.name || 'Unknown User'}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {request.userProfile?.email || `User ID: ${request.userId}`}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                    Requested: {new Date(request.requestedAt).toLocaleDateString()}
                  </p>
                  {request.message && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 italic">
                      "{request.message}"
                    </p>
                  )}
                </div>
                
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => handleJoinRequest(request.$id, 'approved')}
                    className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleJoinRequest(request.$id, 'rejected')}
                    className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No pending join requests
          </div>
        )}
      </div>
    )}

    {/* Current Members Section */}
    <div>
      <h3 className="font-medium mb-3 text-gray-900 dark:text-white">
        Current Members ({community.memberCount || 0})
      </h3>
      
      {/* You can add member list here if needed */}
      <div className="text-center py-4 text-gray-500 dark:text-gray-400">
        <p>Member management features coming soon</p>
        <p className="text-xs mt-1">Currently {community.memberCount || 0} members in this community</p>
      </div>
    </div>
  </div>
)}
        </div>

        {/* Navigation Help */}
        <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <h3 className="font-medium text-blue-900 dark:text-blue-200 mb-2">Settings Access</h3>
          <p className="text-sm text-blue-800 dark:text-blue-300">
            Only community owners and admins can access these settings. Community owners can manage admins, 
            while both owners and admins can manage community settings and approve members.
          </p>
        </div>
      </div>
    </MainLayout>
  );
};

export default CommunitySettingsPage;