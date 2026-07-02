import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { formatDistanceToNow, format } from 'date-fns';
import { MapPin, ChevronLeft, MessageCircle, CheckCircle, Clock, Trash2, Archive } from 'lucide-react';
import API from '../utils/api';
import { useAuth } from '../context/AuthContext';
import ResolveModal from '../components/posts/ResolveModal';
import toast from 'react-hot-toast';

const categoryColors = {
  electronics: 'bg-blue-400/10 text-blue-400 border-blue-400/20',
  stationary: 'bg-green-400/10 text-green-400 border-green-400/20',
  clothing: 'bg-purple-400/10 text-purple-400 border-purple-400/20',
  accessories: 'bg-pink-400/10 text-pink-400 border-pink-400/20',
  documents: 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20',
  others: 'bg-gray-400/10 text-gray-400 border-gray-400/20',
};

const PostDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [showResolveModal, setShowResolveModal] = useState(false);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const { data } = await API.get(`/posts/${id}`);
        setPost(data.post);
      } catch (error) {
        toast.error('Post not found');
        navigate('/posts');
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [id, navigate]);

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    try {
      await API.delete(`/posts/${id}`);
      toast.success('Post deleted');
      navigate('/posts');
    } catch {
      toast.error('Failed to delete post');
    }
  };

  const handleContact = () => {
    navigate(`/chat/${post.postedBy._id}?postId=${post._id}`);
  };

  if (loading) {
    return (
      <div className="p-6 max-w-3xl mx-auto animate-pulse space-y-6">
        <div className="h-8 bg-brand-border rounded w-1/2" />
        <div className="h-64 bg-brand-border rounded-xl" />
        <div className="h-4 bg-brand-border rounded w-full" />
        <div className="h-4 bg-brand-border rounded w-3/4" />
      </div>
    );
  }

  if (!post) return null;

  const isOwner = user?._id === post.postedBy?._id;
  const catColor = categoryColors[post.category] || categoryColors.others;
  const timeAgo = formatDistanceToNow(new Date(post.createdAt), { addSuffix: true });
  const daysLeft = post.expiresAt
    ? Math.ceil((new Date(post.expiresAt) - new Date()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Back + actions */}
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="btn-ghost p-2">
          <ChevronLeft className="w-5 h-5" />
        </button>
        {isOwner && post.status === 'active' && !post.isArchived && (
          <div className="flex gap-2">
            <button
              onClick={() => setShowResolveModal(true)}
              className="btn-secondary text-green-400 border-green-400/30 hover:bg-green-400/10"
            >
              <CheckCircle className="w-4 h-4" /> Mark Resolved
            </button>
            <button onClick={handleDelete} className="btn-ghost text-red-400">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Images */}
      {post.images?.length > 0 && (
        <div className="space-y-3">
          <div className="aspect-video rounded-xl overflow-hidden bg-brand-surface">
            <img
              src={post.images[activeImage].url}
              alt={post.title}
              className="w-full h-full object-contain"
            />
          </div>
          {post.images.length > 1 && (
            <div className="flex gap-2">
              {post.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                    i === activeImage ? 'border-brand-accent' : 'border-brand-border'
                  }`}
                >
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Post info */}
      <div className="card p-6 space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <span className={`badge border ${catColor} text-xs mb-2`}>
              {post.category}
            </span>
            <h1 className="font-display text-2xl font-bold text-white">
              {post.title}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {post.status === 'resolved' ? (
              <span className="badge bg-green-400/10 text-green-400 border border-green-400/20">
                <CheckCircle className="w-3 h-3" /> Resolved
              </span>
            ) : post.isArchived ? (
              <span className="badge bg-brand-surface text-brand-muted border border-brand-border">
                <Archive className="w-3 h-3" /> Archived
              </span>
            ) : (
              <span className="badge bg-brand-accent/10 text-brand-accent border border-brand-accent/20">
                <span className="w-2 h-2 rounded-full bg-brand-accent animate-pulse" />
                Active
              </span>
            )}
          </div>
        </div>

        <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
          {post.description}
        </p>

        {/* Info grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2 border-t border-brand-border text-sm">
          <div>
            <div className="text-brand-muted text-xs mb-1">Posted by</div>
            <div className="flex items-center gap-2">
              {post.postedBy?.avatar && (
                <img src={post.postedBy.avatar} alt="" className="w-5 h-5 rounded-full" />
              )}
              <span className="font-mono text-brand-accent font-medium">
                {post.rollNo}
              </span>
            </div>
          </div>

          {post.location && (
            <div>
              <div className="text-brand-muted text-xs mb-1">Found at</div>
              <div className="flex items-center gap-1.5 text-gray-200">
                <MapPin className="w-3.5 h-3.5 text-brand-muted" />
                {post.location}
              </div>
            </div>
          )}

          <div>
            <div className="text-brand-muted text-xs mb-1">Posted</div>
            <div className="text-gray-200">{timeAgo}</div>
          </div>
        </div>

        {/* Expiry */}
        {!post.isArchived && post.status === 'active' && daysLeft !== null && (
          <div
            className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
              daysLeft <= 0
                ? 'bg-red-900/20 border border-red-500/20 text-red-400'
                : daysLeft <= 2
                ? 'bg-orange-900/20 border border-orange-500/20 text-orange-400'
                : 'bg-brand-surface border border-brand-border text-brand-muted'
            }`}
          >
            <Clock className="w-4 h-4 flex-shrink-0" />
            {daysLeft <= 0
              ? 'This post has expired'
              : `This post will be archived in ${daysLeft} day${
                  daysLeft !== 1 ? 's' : ''
                }`}
          </div>
        )}

        {/* Resolved data */}
        {post.status === 'resolved' && post.resolvedData && (
          <div className="bg-green-900/20 border border-green-500/20 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-green-400 font-semibold mb-3">
              <CheckCircle className="w-4 h-4" />
              Resolution Details
            </div>
            {post.resolvedData.givenToRollNo && (
              <div className="text-sm text-gray-300">
                Given to:{' '}
                <span className="font-mono text-green-400">
                  {post.resolvedData.givenToRollNo}
                </span>
              </div>
            )}
            {post.resolvedData.resolvedAt && (
              <div className="text-sm text-gray-300">
                Resolved on:{' '}
                {format(new Date(post.resolvedData.resolvedAt), 'PPP')}
              </div>
            )}
            {post.resolvedData.notes && (
              <div className="text-sm text-gray-300">
                Note: {post.resolvedData.notes}
              </div>
            )}
          </div>
        )}

        {/* Action */}
        {!isOwner && post.status === 'active' && !post.isArchived && (
          <button
            onClick={handleContact}
            className="btn-primary w-full justify-center py-3 text-base"
          >
            <MessageCircle className="w-5 h-5" />
            Contact Finder — {post.postedBy?.name}
          </button>
        )}
      </div>

      {showResolveModal && (
        <ResolveModal
          post={post}
          onClose={() => setShowResolveModal(false)}
          onResolved={(updatedPost) => {
            setPost(updatedPost);
            setShowResolveModal(false);
          }}
        />
      )}
    </div>
  );
};

export default PostDetailPage;