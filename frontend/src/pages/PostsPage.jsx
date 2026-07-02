import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Search, Laptop, Pencil, Shirt, Package, CreditCard, MoreHorizontal, Filter, AlertCircle } from 'lucide-react';
import API from '../utils/api';
import PostCard from '../components/posts/PostCard';
import toast from 'react-hot-toast';

const CATEGORIES = [
  { key: 'all', label: 'All', icon: Filter },
  { key: 'electronics', label: 'Electronics', icon: Laptop },
  { key: 'stationary', label: 'Stationary', icon: Pencil },
  { key: 'clothing', label: 'Clothing', icon: Shirt },
  { key: 'accessories', label: 'Accessories', icon: Package },
  { key: 'documents', label: 'Documents', icon: CreditCard },
  { key: 'others', label: 'Others', icon: MoreHorizontal },
];

const PostsPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [postType, setPostType] = useState('found'); // 'found' or 'lost'

  const category = searchParams.get('category') || 'all';

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 12, status: 'active', postType });
      if (category !== 'all') params.set('category', category);
      if (search) params.set('search', search);
      const { data } = await API.get(`/posts?${params}`);
      setPosts(data.posts);
      setTotal(data.total);
    } catch {
      toast.error('Failed to load posts');
    } finally {
      setLoading(false);
    }
  }, [category, page, search, postType]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const setCategory = (cat) => {
    setSearchParams(cat === 'all' ? {} : { category: cat });
    setPage(1);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 animate-fade-in">
        <div className="flex-1">
          <h1 className="font-display text-2xl font-bold text-white">Browse Posts</h1>
          <p className="text-brand-muted text-sm mt-1">{total} post{total !== 1 ? 's' : ''} found</p>
        </div>
        <button onClick={() => navigate('/posts/create')} className="btn-primary">
          <Plus className="w-4 h-4" /> Create Post
        </button>
      </div>

      {/* Lost / Found Tabs */}
      <div className="flex gap-1 p-1 bg-brand-surface rounded-xl border border-brand-border w-fit">
        <button
          onClick={() => { setPostType('found'); setPage(1); }}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            postType === 'found'
              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
              : 'text-brand-muted hover:text-gray-300'
          }`}
        >
          <Search className="w-4 h-4" />
          Found Items
        </button>
        <button
          onClick={() => { setPostType('lost'); setPage(1); }}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            postType === 'lost'
              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
              : 'text-brand-muted hover:text-gray-300'
          }`}
        >
          <AlertCircle className="w-4 h-4" />
          Lost Items
        </button>
      </div>

      {/* Info banner */}
      <div className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
        postType === 'found'
          ? 'bg-green-500/10 border-green-500/20 text-green-300'
          : 'bg-red-500/10 border-red-500/20 text-red-300'
      }`}>
        {postType === 'found' ? (
          <><Search className="w-3.5 h-3.5 flex-shrink-0" /> These are items that students <strong>found</strong> on campus. If you lost something, check here and contact the finder.</>
        ) : (
          <><AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> These are items that students <strong>lost</strong> on campus. If you found something, check here and help them out!</>
        )}
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted" />
          <input
            className="input pl-10"
            placeholder="Search by title or description..."
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
          />
        </div>
        <button type="submit" className="btn-primary">Search</button>
        {search && (
          <button type="button" className="btn-secondary" onClick={() => { setSearch(''); setSearchInput(''); }}>
            Clear
          </button>
        )}
      </form>

      {/* Category pills */}
      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setCategory(key)}
            className={`category-pill flex items-center gap-1.5 ${category === key ? 'active' : ''}`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Posts grid */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="h-36 bg-brand-border rounded-lg mb-4" />
              <div className="h-4 bg-brand-border rounded w-1/3 mb-3" />
              <div className="h-5 bg-brand-border rounded w-3/4 mb-3" />
              <div className="h-3 bg-brand-border rounded w-full mb-2" />
              <div className="h-3 bg-brand-border rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="card p-16 text-center animate-fade-in">
          {postType === 'found' ? (
            <Search className="w-16 h-16 text-brand-border mx-auto mb-6" />
          ) : (
            <AlertCircle className="w-16 h-16 text-brand-border mx-auto mb-6" />
          )}
          <h3 className="font-display text-lg font-semibold text-white mb-2">
            {search ? 'No results found' : `No ${postType} item posts yet`}
          </h3>
          <p className="text-brand-muted mb-6">
            {search
              ? `No posts match "${search}"`
              : postType === 'found'
              ? 'No one has posted a found item yet in this category.'
              : 'No one has posted a lost item yet in this category.'}
          </p>
          <button onClick={() => navigate('/posts/create')} className="btn-primary">
            <Plus className="w-4 h-4" /> Create Post
          </button>
        </div>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
            {posts.map(post => (
              <PostCard key={post._id} post={post} />
            ))}
          </div>
          {total > 12 && (
            <div className="flex justify-center gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-secondary disabled:opacity-50">Previous</button>
              <span className="flex items-center px-4 text-brand-muted text-sm">Page {page} of {Math.ceil(total / 12)}</span>
              <button disabled={page >= Math.ceil(total / 12)} onClick={() => setPage(p => p + 1)} className="btn-secondary disabled:opacity-50">Next</button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PostsPage;