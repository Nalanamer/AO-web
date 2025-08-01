// components/CommunityPostCard.tsx
import React, { useState , useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { databases, DATABASE_ID, COMMENTS_COLLECTION_ID, Query } from '../lib/appwrite';

interface CommunityPostCardProps {
  post: any;
  onLike: (postId: string) => void;
  onComment: (postId: string, comment: string) => void;
  onDeleteComment?: (commentId: string, postId: string) => void;  // ← ADD THIS LINE
  isAdmin?: boolean;
  onPin?: (postId: string) => void;
  onUnpin?: (postId: string) => void;
  onDelete?: (postId: string) => void;
   communityAdmins?: string[]; // ← ADD THIS: List of admin user IDs
  communityCreatorId?: string; // ← ADD THIS: Community creator ID
}

const CommunityPostCard: React.FC<CommunityPostCardProps> = ({ 
  post, 
  onLike, 
  onComment,
  onDeleteComment,  
  communityAdmins = [], 
  communityCreatorId,  
  isAdmin = false,
  onPin,
  onUnpin,
  onDelete
}) => {
  const { user } = useAuth();
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [showActionsMenu, setShowActionsMenu] = useState(false);
    const [comments, setComments] = useState<any[]>([]);
const [loadingComments, setLoadingComments] = useState(false);

  // Check if current user liked this post
  const isLiked = post.likedBy?.includes(user?.$id) || false;
  
  // Check if current user is the author
  const isAuthor = post.authorId === user?.$id;

    useEffect(() => {
    loadComments();
  }, [post.$id]);
   


 const handleSubmitComment = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!newComment.trim()) return;
  
  try {
    await onComment(post.$id, newComment);
    setNewComment('');
    
    // Reload comments after submission
    setTimeout(() => {
      loadComments();
    }, 1000);
    
  } catch (error) {
    console.error('Error submitting comment:', error);
  }
};

    
// Add this function inside your CommunityPostCard component
// Fixed handleDeleteComment function for CommunityPostCard.tsx

// Fixed handleDeleteComment function for CommunityPostCard.tsx

const handleDeleteComment = async (commentId: string) => {
  if (!confirm('Are you sure you want to delete this comment?')) return;
  
  try {
    if (onDeleteComment) {
      await onDeleteComment(commentId, post.$id);
      setTimeout(() => {
        loadComments();
      }, 500);
    }
  } catch (error: any) {
    console.error('Error deleting comment:', error);
    alert('Failed to delete comment');
  }
};
// Check if user can delete a comment (author or admin)
const canDeleteComment = (comment: any) => {
  return isAdmin || comment.userId === user?.$id;
};


  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return date.toLocaleDateString();
  };

  const loadComments = async () => {
  setLoadingComments(true);
  try {
    const result = await databases.listDocuments(
      DATABASE_ID,
      COMMENTS_COLLECTION_ID,
      [
        Query.equal('itemId', post.$id),
        Query.equal('itemType', 'community_post'),
        Query.orderDesc('createdAt')
      ]
    );
    setComments(result.documents);
  } catch (error) {
    console.error('Error loading comments:', error);
    setComments([]);
  } finally {
    setLoadingComments(false);
  }
};


 const toggleComments = () => {
    setShowCommentForm(!showCommentForm);
    if (!showCommentForm) {
      loadComments(); // Load comments when opening
    }
  };

const isCommentAuthorAdmin = (comment: any) => {
  // Check if the comment author is a community admin
  return communityAdmins?.includes(comment.userId) || 
         communityCreatorId === comment.userId;
};


  return (
    <div className="bg-white border rounded-lg p-4 hover:shadow-sm transition-shadow">
      {/* Post Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {/* Author Avatar Placeholder */}
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
            {post.authorName?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          
          <div>
            <h3 className="font-semibold text-gray-900">{post.authorName || 'Anonymous'}</h3>
            <p className="text-sm text-gray-500">{formatDate(post.createdAt)}</p>
          </div>
        </div>

        {/* Pin Badge */}
        {post.isPinned && (
          <div className="flex items-center gap-2">
            <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full flex items-center gap-1">
              📌 Pinned
            </span>
          </div>
        )}

        {/* Actions Menu */}
        {(isAdmin || isAuthor) && (
          <div className="relative">
            <button
              onClick={() => setShowActionsMenu(!showActionsMenu)}
              className="text-gray-400 hover:text-gray-600 p-1 rounded"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </button>

            {showActionsMenu && (
              <div className="absolute right-0 top-8 bg-white border rounded-lg shadow-lg py-1 z-10 min-w-[150px]">
                {isAdmin && (
                  <>
                    {post.isPinned ? (
                      <button
                        onClick={() => {
                          onUnpin?.(post.$id);
                          setShowActionsMenu(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        📌 Unpin Post
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          onPin?.(post.$id);
                          setShowActionsMenu(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        📌 Pin Post
                      </button>
                    )}
                  </>
                )}
                
                {(isAdmin || isAuthor) && (
                  <button
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this post?')) {
                        onDelete?.(post.$id);
                      }
                      setShowActionsMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    🗑️ Delete Post
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Post Content */}
      <div className="mb-4">
        <p className="text-gray-800 whitespace-pre-wrap">{post.content}</p>
        
        {/* Images if any */}
        {post.images && post.images.length > 0 && (
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {post.images.slice(0, 4).map((image: string, index: number) => (
              <img
                key={index}
                src={image}
                alt={`Post image ${index + 1}`}
                className="rounded-lg object-cover w-full h-48"
              />
            ))}
          </div>
        )}
      </div>

      {/* Post Stats */}
      <div className="flex items-center justify-between text-sm text-gray-500 mb-3 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-4">
          <button
            onClick={() => onLike(post.$id)}
            className={`flex items-center gap-1 hover:text-blue-600 transition-colors ${
              isLiked ? 'text-blue-600' : ''
            }`}
          >
            <span className={isLiked ? '👍' : '👍🏻'}></span>
            <span>{post.likeCount || 0}</span>
            <span>likes</span>
          </button>
          
          <button
  onClick={toggleComments}
  className="flex items-center gap-1 hover:text-blue-600 transition-colors"
>
            💬 {post.commentCount || 0} comments
          </button>
        </div>

        {/* Post Type Badge */}
        {post.type && (
          <span className={`px-2 py-1 rounded-full text-xs ${
            post.type === 'announcement' 
              ? 'bg-orange-100 text-orange-700' 
              : 'bg-gray-100 text-gray-600'
          }`}>
            {post.type === 'announcement' ? '📢 Announcement' : '💬 Post'}
          </span>
        )}
      </div>

      {/* Comment Form */}
      {showCommentForm && (
        <form onSubmit={handleSubmitComment} className="border-t border-gray-100 pt-3">
          <div className="flex gap-3">
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-white text-sm">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment..."
  className="w-full p-2 bg-white border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500" // ← Updated styling
                rows={2}
              />
              <div className="flex justify-end gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCommentForm(false);
                    setNewComment('');
                  }}
                  className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newComment.trim()}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Comment
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

       {/* Enhanced Comments Display with Delete Button */}
{showCommentForm && (
  <div className="mt-4 border-t border-gray-100 pt-3">
    {loadingComments ? (
      <div className="text-center py-2 text-gray-500">Loading comments...</div>
    ) : comments.length > 0 ? (
      <div className="space-y-3">
        {comments.map((comment) => (
          <div key={comment.$id} className="flex gap-3">
            <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center text-white text-xs">
              {comment.userName?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1">
              <div className="bg-gray-50 rounded-lg p-2 relative group">
                {/* Delete button - only show on hover and if user can delete */}
                {canDeleteComment(comment) && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteComment(comment.$id);
                    }}
                    className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                    title="Delete comment"
                  >
                    ×
                  </button>
                )}
                
                <div className="font-semibold text-sm text-gray-900 pr-6">
                  {comment.userName}
                  {/* Show admin badge only if the COMMENT AUTHOR is an admin */}
                        {(communityAdmins?.includes(comment.userId) || communityCreatorId === comment.userId) && (
                            <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-1 rounded">Admin</span>
                        )}
                </div>
                <div className="text-gray-700">{comment.content}</div>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {new Date(comment.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        ))}
      </div>
    ) : (
      <div className="text-center py-2 text-gray-500">No comments yet</div>
    )}
  </div>
)}


      {/* Click outside to close actions menu */}
      {showActionsMenu && (
        <div
          className="fixed inset-0 z-5"
          onClick={() => setShowActionsMenu(false)}
        />
      )}
    </div>
  );
};

export default CommunityPostCard;