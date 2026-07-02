import React, { useState, useEffect, useCallback } from 'react';
import { History, CheckCircle, Archive, Search, CreditCard } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import API from '../utils/api';
import toast from 'react-hot-toast';

const categoryColors = {
  electronics: 'bg-blue-400/10 text-blue-400',
  stationary: 'bg-green-400/10 text-green-400',
  clothing: 'bg-purple-400/10 text-purple-400',
  accessories: 'bg-pink-400/10 text-pink-400',
  documents: 'bg-yellow-400/10 text-yellow-400',
  others: 'bg-gray-400/10 text-gray-400',
};

const HistoryPage = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all | resolved | archived
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 15, status: filter === 'all' ? 'history' : filter });
      if (search) params.set('search', search);
      const { data } = await API.get(`/posts?${params}`);
      setPosts(data.posts);
      setTotal(data.total);
    } catch {
      toast.error('Failed to load history');
    } finally {
      setLoading(false);
    }
  }, [filter, search, page]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl font-bold text-white flex items-center gap-2">
          <History className="w-6 h-6 text-brand-accent" />
          Post History
        </h1>
        <p className="text-brand-muted text-sm mt-1">All archived and resolved posts — permanent record</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-2">
          {[
            { key: 'all', label: 'All' },
            { key: 'resolved', label: 'Resolved', icon: CheckCircle },
            { key: 'archived', label: 'Archived', icon: Archive },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => { setFilter(key); setPage(1); }}
              className={`category-pill flex items-center gap-1.5 ${filter === key ? 'active' : ''}`}
            >
              {Icon && <Icon className="w-3.5 h-3.5" />}
              {label}
            </button>
          ))}
        </div>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted" />
          <input
            className="input pl-9 text-sm"
            placeholder="Search history..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
      </div>

      <div className="text-sm text-brand-muted">{total} record{total !== 1 ? 's' : ''} found</div>

      {/* Table */}
      {loading ? (
        <div className="space-y-2">
          {Array(5).fill(0).map((_, i) => (
            <div key={i} className="card p-4 animate-pulse">
              <div className="flex gap-4">
                <div className="h-4 bg-brand-border rounded w-16" />
                <div className="h-4 bg-brand-border rounded w-32" />
                <div className="h-4 bg-brand-border rounded flex-1" />
                <div className="h-4 bg-brand-border rounded w-20" />
              </div>
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="card p-16 text-center">
          <History className="w-16 h-16 text-brand-border mx-auto mb-6" />
          <h3 className="font-display text-lg font-semibold text-white mb-2">No history yet</h3>
          <p className="text-brand-muted">Posts older than 7 days or resolved posts will appear here</p>
        </div>
      ) : (
        <div className="space-y-2">
          {posts.map(post => (
            <div
              key={post._id}
              onClick={() => navigate(`/posts/${post._id}`)}
              className="card p-4 cursor-pointer hover:border-brand-accent/30 transition-all flex flex-col sm:flex-row sm:items-center gap-3"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className={`badge text-xs ${categoryColors[post.category] || categoryColors.others}`}>
                  {post.category}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-white text-sm truncate">{post.title}</div>
                  <div className="text-xs text-brand-muted mt-0.5 font-mono">{post.rollNo}</div>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs text-brand-muted flex-shrink-0">
                {post.status === 'resolved' ? (
                  <span className="flex items-center gap-1 text-green-400">
                    <CheckCircle className="w-3 h-3" /> Resolved
                    {post.resolvedData?.resolvedAt && (
                      <span className="text-brand-muted ml-1">
                        {format(new Date(post.resolvedData.resolvedAt), 'MMM d, yyyy')}
                      </span>
                    )}
                    {post.resolvedData?.givenToRollNo && (
                      <span className="text-brand-muted ml-1">→ <span className="font-mono">{post.resolvedData.givenToRollNo}</span></span>
                    )}
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <Archive className="w-3 h-3" /> Archived
                    {post.archivedAt && (
                      <span className="ml-1">{format(new Date(post.archivedAt), 'MMM d, yyyy')}</span>
                    )}
                  </span>
                )}
                <span>Posted {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {total > 15 && (
        <div className="flex justify-center gap-2">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-secondary disabled:opacity-50">Previous</button>
          <span className="flex items-center px-4 text-brand-muted text-sm">Page {page} of {Math.ceil(total / 15)}</span>
          <button disabled={page >= Math.ceil(total / 15)} onClick={() => setPage(p => p + 1)} className="btn-secondary disabled:opacity-50">Next</button>
        </div>
      )}
    </div>
  );
};

export default HistoryPage;
