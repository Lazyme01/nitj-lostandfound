import React from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { MapPin, User, CheckCircle, Clock } from 'lucide-react';

const categoryColors = {
  electronics: 'bg-blue-400/10 text-blue-400 border-blue-400/20',
  stationary: 'bg-green-400/10 text-green-400 border-green-400/20',
  clothing: 'bg-purple-400/10 text-purple-400 border-purple-400/20',
  accessories: 'bg-pink-400/10 text-pink-400 border-pink-400/20',
  documents: 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20',
  others: 'bg-gray-400/10 text-gray-400 border-gray-400/20',
};

const PostCard = ({ post }) => {
  const navigate = useNavigate();
  const timeAgo = formatDistanceToNow(new Date(post.createdAt), { addSuffix: true });
  const catColor = categoryColors[post.category] || categoryColors.others;
  const isResolved = post.status === 'resolved';
  const isArchived = post.isArchived;

  return (
    <div
      className={`card p-5 cursor-pointer hover:border-brand-accent/40 transition-all duration-300 hover:-translate-y-0.5 group ${isResolved ? 'opacity-75' : ''}`}
      onClick={() => navigate(`/posts/${post._id}`)}
    >
      {/* Image */}
      {post.images?.[0] && (
        <div className="mb-4 rounded-lg overflow-hidden h-36 bg-brand-surface">
          <img
            src={post.images[0].url}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <span className={`badge border ${catColor} text-xs mb-2`}>
            {post.category}
            <span
              className={`badge text-xs ${
                post.postType === 'lost'
                  ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                  : 'bg-green-500/10 text-green-400 border border-green-500/20'
              }`}
            >
              {post.postType === 'lost' ? 'Lost' : 'Found'}
            </span>
          </span>

          <h3 className="font-display font-semibold text-white group-hover:text-brand-accent transition-colors line-clamp-1">
            {post.title}
          </h3>
        </div>

        {isResolved ? (
          <span className="flex items-center gap-1 text-xs text-green-400 bg-green-400/10 px-2 py-1 rounded-full flex-shrink-0">
            <CheckCircle className="w-3 h-3" /> Resolved
          </span>
        ) : isArchived ? (
          <span className="flex items-center gap-1 text-xs text-brand-muted bg-brand-surface px-2 py-1 rounded-full flex-shrink-0">
            Archived
          </span>
        ) : (
          <span className="flex items-center gap-1 text-xs text-brand-accent bg-brand-accent/10 px-2 py-1 rounded-full flex-shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-accent animate-pulse" />
            Active
          </span>
        )}
      </div>

      {/* Description */}
      <p className="text-brand-muted text-sm line-clamp-2 mb-4 leading-relaxed">
        {post.description}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-brand-muted border-t border-brand-border pt-3">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            {post.postedBy?.avatar ? (
              <img src={post.postedBy.avatar} alt="" className="w-4 h-4 rounded-full" />
            ) : (
              <User className="w-3 h-3" />
            )}
            <span className="font-mono">{post.rollNo}</span>
          </span>

          {post.location && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" /> {post.location}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Views removed */}

          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" /> {timeAgo}
          </span>
        </div>
      </div>

      {/* Expiry warning */}
      {!isResolved && !isArchived && post.expiresAt && (
        (() => {
          const daysLeft = Math.ceil(
            (new Date(post.expiresAt) - new Date()) / (1000 * 60 * 60 * 24)
          );

          return daysLeft <= 2 && daysLeft > 0 ? (
            <div className="mt-3 text-xs text-orange-400 bg-orange-400/10 border border-orange-400/20 rounded-lg px-3 py-1.5 flex items-center gap-1.5">
              <Clock className="w-3 h-3" />
              Expires in {daysLeft} day{daysLeft !== 1 ? 's' : ''}
            </div>
          ) : null;
        })()
      )}
    </div>
  );
};

export default PostCard;