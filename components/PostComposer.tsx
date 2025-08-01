import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import CommunityService from '@/services/useCommunities';

interface PostComposerProps {
  communityId: string;
  onPostCreated: () => void;
}

const PostComposer: React.FC<PostComposerProps> = ({ communityId, onPostCreated }) => {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    
    try {
      setLoading(true);
      await CommunityService.createPost(communityId, user?.$id || '', content);
      setContent('');
      onPostCreated();
    } catch (error) {
      alert('Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Share something with the community..."
        className="w-full p-3 border rounded-lg resize-none bg-white"
        rows={3}
      />
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-500">
          {content.length}/500 characters
        </span>
        <button
          type="submit"
          disabled={!content.trim() || loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
        >
          {loading ? 'Posting...' : 'Post'}
        </button>
      </div>
    </form>
  );
};

export default PostComposer;