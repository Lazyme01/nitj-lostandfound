import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Package, Laptop, Pencil, Shirt, CreditCard, MoreHorizontal, Plus, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';
import PostCard from '../components/posts/PostCard';
import toast from 'react-hot-toast';

const categories = [
  { key: 'electronics', label: 'Electronics', icon: Laptop, color: 'text-blue-400', bg: 'bg-blue-400/10' },
  { key: 'stationary', label: 'Stationary', icon: Pencil, color: 'text-green-400', bg: 'bg-green-400/10' },
  { key: 'clothing', label: 'Clothing', icon: Shirt, color: 'text-purple-400', bg: 'bg-purple-400/10' },
  { key: 'accessories', label: 'Accessories', icon: Package, color: 'text-pink-400', bg: 'bg-pink-400/10' },
  { key: 'documents', label: 'Documents', icon: CreditCard, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
  { key: 'others', label: 'Others', icon: MoreHorizontal, color: 'text-gray-400', bg: 'bg-gray-400/10' },
];

const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [recentPosts, setRecentPosts] = useState([]);
  const [stats, setStats] = useState({ active: 0, resolved: 0, total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      const results = await Promise.allSettled([
        API.get('/posts?limit=4&status=active'), // recent posts
        API.get('/posts?limit=1&status=active'), // active total
        API.get('/posts?limit=1&status=resolved'), // resolved total
      ]);

      const [recentRes, activeRes, resolvedRes] = results;

      const recentPostsData =
        recentRes.status === 'fulfilled' ? (recentRes.value.data.posts || []) : [];
      const activeTotal = activeRes.status === 'fulfilled' ? activeRes.value.data.total : 0;
      const resolvedTotal = resolvedRes.status === 'fulfilled' ? resolvedRes.value.data.total : 0;

      setRecentPosts(recentPostsData);
      setStats({
        active: activeTotal,
        resolved: resolvedTotal,
        total: activeTotal + resolvedTotal,
      });

      // Only show the generic toast if *all* calls failed.
      if (recentRes.status === 'rejected' && activeRes.status === 'rejected' && resolvedRes.status === 'rejected') {
        toast.error('Failed to load dashboard data');
      }

      setLoading(false);
    };
    fetchData();
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">
            {greeting}, {user?.name?.split(' ')[0]} 
          </h1>
          <p className="text-brand-muted mt-1">
            <span className="font-mono text-brand-accent text-sm">{user?.rollNo || user?.email?.split('@')[0].toUpperCase()}</span>
            {' · '}NIT Jalandhar
          </p>
        </div>
        <button onClick={() => navigate('/posts/create')} className="btn-primary">
          <Plus className="w-4 h-4" />
          Report Found Item
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 animate-slide-up">
        {[
          { icon: Search, label: 'Active Posts', value: stats.active, color: 'text-brand-accent', bg: 'bg-brand-accent/10' },
          { icon: CheckCircle, label: 'Resolved', value: stats.resolved, color: 'text-green-400', bg: 'bg-green-400/10' },
          { icon: TrendingUp, label: 'Total Posts', value: stats.total, color: 'text-blue-400', bg: 'bg-blue-400/10' },
        ].map(({ icon: Icon, label, value, color, bg }) => (
          <div key={label} className="card p-5">
            <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-3`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <div className="font-display text-2xl font-bold text-white">{loading ? '—' : value}</div>
            <div className="text-brand-muted text-sm mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Categories */}
      <div className="animate-slide-up">
        <h2 className="font-display font-semibold text-white mb-4">Browse by Category</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {categories.map(({ key, label, icon: Icon, color, bg }) => (
            <button
              key={key}
              onClick={() => navigate(`/posts?category=${key}`)}
              className="card p-4 flex flex-col items-center gap-2.5 hover:border-brand-accent/40 hover:glow transition-all duration-300 group"
            >
              <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <span className="text-xs font-medium text-gray-300 group-hover:text-white transition-colors">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Posts */}
      <div className="animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-semibold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-brand-accent" />
            Recent Found Items
          </h2>
          <button onClick={() => navigate('/posts')} className="text-sm text-brand-accent hover:text-brand-accent-light transition-colors">
            View all →
          </button>
        </div>
        {loading ? (
          <div className="grid sm:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="card p-5 animate-pulse">
                <div className="h-4 bg-brand-border rounded w-3/4 mb-3" />
                <div className="h-3 bg-brand-border rounded w-full mb-2" />
                <div className="h-3 bg-brand-border rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : recentPosts.length === 0 ? (
          <div className="card p-12 text-center">
            <Search className="w-12 h-12 text-brand-border mx-auto mb-4" />
            <p className="text-brand-muted">No posts yet. Be the first to report a found item!</p>
            <button onClick={() => navigate('/posts/create')} className="btn-primary mt-4">
              <Plus className="w-4 h-4" /> Create Post
            </button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {recentPosts.map(post => (
              <PostCard key={post._id} post={post} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
