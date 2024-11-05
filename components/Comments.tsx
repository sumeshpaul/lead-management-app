// File: app/components/Comments.tsx

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

interface Comment {
  id: string;
  text: string;
  author: string;
  createdAt: string;
}

interface CommentsProps {
  leadId: string;
  currentUser: string;
}

export default function Comments({ leadId, currentUser }: CommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchComments();
  }, [leadId]);

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/leads/${leadId}/comments`);
      if (response.ok) {
        const data = await response.json();
        setComments(data.comments);
      } else {
        throw new Error('Failed to fetch comments');
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
      setError('Failed to load comments. Please try again.');
    }
  };

  const addComment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/leads/${leadId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: newComment,
          author: currentUser,
        }),
      });

      if (response.ok) {
        const { comment } = await response.json();
        setComments([comment, ...comments]);
        setNewComment('');
      } else {
        throw new Error('Failed to add comment');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      setError('Failed to add comment. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Comments</h2>
      
      <form onSubmit={addComment} className="space-y-2">
        <Textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          required
        />
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Adding...' : 'Add Comment'}
        </Button>
      </form>

      {error && <p className="text-red-500">{error}</p>}

      <div className="space-y-4">
        {comments.map((comment) => (
          <div key={comment.id} className="bg-gray-100 p-4 rounded-lg">
            <p className="font-semibold">{comment.author}</p>
            <p>{comment.text}</p>
            <p className="text-sm text-gray-500">
              {new Date(comment.createdAt).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}