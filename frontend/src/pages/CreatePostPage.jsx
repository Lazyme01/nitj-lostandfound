import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import {
  Upload, X, MapPin, Laptop, Pencil, Shirt,
  Package, CreditCard, MoreHorizontal, ChevronLeft,
  Image, Search, AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import API from '../utils/api';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = [
  { key: 'electronics', label: 'Electronics', icon: Laptop },
  { key: 'stationary', label: 'Stationary', icon: Pencil },
  { key: 'clothing', label: 'Clothing', icon: Shirt },
  { key: 'accessories', label: 'Accessories', icon: Package },
  { key: 'documents', label: 'Documents', icon: CreditCard },
  { key: 'others', label: 'Others', icon: MoreHorizontal },
];

const CreatePostPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [postType, setPostType] = useState('found');
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    location: '',
  });
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(false);

  const onDrop = useCallback((acceptedFiles) => {
    if (images.length + acceptedFiles.length > 5) {
      toast.error('Maximum 5 images allowed');
      return;
    }
    setImages(prev => [...prev, ...acceptedFiles]);
    const newPreviews = acceptedFiles.map(file => URL.createObjectURL(file));
    setPreviews(prev => [...prev, ...newPreviews]);
  }, [images]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    maxSize: 5 * 1024 * 1024,
  });

  const removeImage = (idx) => {
    URL.revokeObjectURL(previews[idx]);
    setImages(prev => prev.filter((_, i) => i !== idx));
    setPreviews(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.title.trim()) {
      toast.error('Please enter a title');
      return;
    }
    if (!form.description.trim()) {
      toast.error('Please enter a description');
      return;
    }
    if (!form.category) {
      toast.error('Please select a category');
      return;
    }
    if (!postType) {
      toast.error('Please select Lost or Found');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', form.title.trim());
      formData.append('description', form.description.trim());
      formData.append('category', form.category);
      formData.append('location', form.location.trim());
      formData.append('postType', postType); // ← sending postType

      images.forEach(img => formData.append('images', img));

      // Debug log
      console.log('Submitting post with type:', postType);

      const { data } = await API.post('/posts', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success(
        postType === 'found'
          ? 'Found item posted! All NITJ students notified'
          : 'Lost item posted! Hope you find it soon'
      );
      navigate(`/posts/${data.post._id}`);
    } catch (error) {
      console.error('Create post error:', error.response?.data);
      toast.error(error.response?.data?.message || 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  const isLost = postType === 'lost';

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="btn-ghost p-2">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Create Post</h1>
          <p className="text-brand-muted text-sm">Report a lost or found item on campus</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* ── Lost or Found toggle ── */}
        <div className="card p-5">
          <label className="block text-sm font-semibold text-gray-200 mb-3">
            Post Type <span className="text-red-400">*</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setPostType('found')}
              className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                postType === 'found'
                  ? 'border-green-500 bg-green-500/10 text-green-400'
                  : 'border-brand-border bg-brand-surface text-brand-muted hover:border-gray-500'
              }`}
            >
              <Search className="w-6 h-6" />
              <span className="font-semibold text-sm">I Found Something</span>
              <span className="text-xs opacity-70 text-center leading-relaxed">
                I found an item and want to return it to the owner
              </span>
            </button>

            <button
              type="button"
              onClick={() => setPostType('lost')}
              className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                postType === 'lost'
                  ? 'border-red-500 bg-red-500/10 text-red-400'
                  : 'border-brand-border bg-brand-surface text-brand-muted hover:border-gray-500'
              }`}
            >
              <AlertCircle className="w-6 h-6" />
              <span className="font-semibold text-sm">I Lost Something</span>
              <span className="text-xs opacity-70 text-center leading-relaxed">
                I lost an item and need help finding it
              </span>
            </button>
          </div>

          {/* Info banner */}
          <div className={`mt-3 p-3 rounded-lg text-xs flex items-start gap-2 border ${
            isLost
              ? 'bg-red-500/10 border-red-500/20 text-red-300'
              : 'bg-green-500/10 border-green-500/20 text-green-300'
          }`}>
            {isLost ? (
              <>
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                Your post appears in <strong>Lost Items</strong>. Students who found something can contact you.
              </>
            ) : (
              <>
                <Search className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                Your post appears in <strong>Found Items</strong>. The owner can contact you to claim it.
              </>
            )}
          </div>
        </div>

        {/* ── Category ── */}
        <div className="card p-5">
          <label className="block text-sm font-semibold text-gray-200 mb-3">
            Category <span className="text-red-400">*</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {CATEGORIES.map(({ key, label, icon: Icon }) => (
              <button
                type="button"
                key={key}
                onClick={() => setForm(f => ({ ...f, category: key }))}
                className={`p-3 rounded-xl border text-sm font-medium flex items-center gap-2 transition-all ${
                  form.category === key
                    ? 'bg-brand-accent/10 border-brand-accent text-brand-accent'
                    : 'bg-brand-surface border-brand-border text-brand-muted hover:border-gray-500'
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Details ── */}
        <div className="card p-5 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-200 mb-2">
              {isLost ? 'What did you lose?' : 'What did you find?'}{' '}
              <span className="text-red-400">*</span>
            </label>
            <input
              className="input"
              placeholder={
                isLost
                  ? 'e.g. My black JBL earphones, Blue Casio calculator...'
                  : 'e.g. Blue Casio Calculator, Black Apple AirPods...'
              }
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              maxLength={150}
              required
            />
            <div className="text-xs text-brand-muted mt-1 text-right">
              {form.title.length}/150
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-200 mb-2">
              Description <span className="text-red-400">*</span>
            </label>
            <textarea
              className="input resize-none"
              placeholder={
                isLost
                  ? 'Describe your item — color, brand, when and where you lost it...'
                  : 'Describe the item — color, brand, features, where you found it...'
              }
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              maxLength={1000}
              rows={4}
              required
            />
            <div className="text-xs text-brand-muted mt-1 text-right">
              {form.description.length}/1000
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-200 mb-2">
              <MapPin className="inline w-3.5 h-3.5 mr-1" />
              {isLost ? 'Where did you lose it?' : 'Where did you find it?'}{' '}
              <span className="text-brand-muted font-normal">(optional)</span>
            </label>
            <input
              className="input"
              placeholder="e.g. Library, Block 2 corridor, Cafeteria..."
              value={form.location}
              onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
            />
          </div>
        </div>

        {/* ── Image upload ── */}
        <div className="card p-5">
          <label className="block text-sm font-semibold text-gray-200 mb-3">
            <Image className="inline w-3.5 h-3.5 mr-1" />
            Photos{' '}
            <span className="text-brand-muted font-normal">(optional, max 5)</span>
          </label>

          {previews.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mb-3">
              {previews.map((src, i) => (
                <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-brand-surface">
                  <img src={src} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute top-1 right-1 w-6 h-6 bg-black/70 hover:bg-red-600 rounded-full flex items-center justify-center transition-colors"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {previews.length < 5 && (
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                isDragActive
                  ? 'border-brand-accent bg-brand-accent/5'
                  : 'border-brand-border hover:border-brand-accent/50 hover:bg-brand-surface/50'
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="w-8 h-8 text-brand-muted mx-auto mb-3" />
              <p className="text-sm text-brand-muted">
                {isDragActive ? 'Drop images here...' : 'Drag & drop or click to upload'}
              </p>
              <p className="text-xs text-brand-border mt-1">
                JPG, PNG, WebP · Max 5MB each
              </p>
            </div>
          )}
        </div>

        {/* ── Post info preview ── */}
        <div className={`card p-4 border ${
          isLost ? 'bg-red-500/5 border-red-500/20' : 'bg-green-500/5 border-green-500/20'
        }`}>
          <div className="text-sm text-brand-muted">
            Posting as{' '}
            <span className="font-mono text-brand-accent font-medium">
              {user?.rollNo || user?.email?.split('@')[0].toUpperCase()}
            </span>
            {' · '}
            <span className={`font-semibold ${isLost ? 'text-red-400' : 'text-green-400'}`}>
              {isLost ? 'Lost Item' : 'Found Item'}
            </span>
          </div>
        </div>

        {/* ── Buttons ── */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn-secondary flex-1"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className={`flex-1 justify-center font-semibold px-5 py-2.5 rounded-lg transition-all inline-flex items-center gap-2 ${
              isLost
                ? 'bg-red-500 hover:bg-red-400 text-white'
                : 'bg-brand-accent hover:bg-brand-accent-dark text-brand-dark'
            } disabled:opacity-50`}
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creating...
              </span>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                {isLost ? 'Post Lost Item' : 'Post Found Item'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreatePostPage;