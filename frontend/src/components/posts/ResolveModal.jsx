import React, { useState } from 'react';
import { CheckCircle, X } from 'lucide-react';
import API from '../../utils/api';
import toast from 'react-hot-toast';

const ResolveModal = ({ post, onClose, onResolved }) => {
  const [form, setForm] = useState({ givenToRollNo: '', notes: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await API.put(`/posts/${post._id}/resolve`, form);
      toast.success('Post marked as resolved!');
      onResolved(data.post);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to resolve post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative card p-6 w-full max-w-md animate-slide-up z-10">
        <button onClick={onClose} className="absolute top-4 right-4 btn-ghost p-2">
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-green-400/10 rounded-xl flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <h2 className="font-display font-bold text-white">Resolve Post</h2>
            <p className="text-brand-muted text-sm">"{post.title}"</p>
          </div>
        </div>

        <p className="text-sm text-brand-muted mb-5 leading-relaxed">
          Fill in the resolution details. This will be recorded in the system history and the post will be marked as resolved.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-200 mb-2">
              Owner's Roll Number <span className="text-brand-muted font-normal">(optional)</span>
            </label>
            <input
              className="input font-mono"
              placeholder="e.g., ADITYAKM.CS.23"
              value={form.givenToRollNo}
              onChange={e => setForm(f => ({ ...f, givenToRollNo: e.target.value.toUpperCase() }))}
            />
            <p className="text-xs text-brand-muted mt-1">Enter the roll number of the person who owned the item</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-200 mb-2">
              Notes <span className="text-brand-muted font-normal">(optional)</span>
            </label>
            <textarea
              className="input resize-none"
              rows={3}
              placeholder="Any additional notes about the resolution..."
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center bg-green-500 hover:bg-green-400 text-white">
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Resolving...
                </span>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Mark as Resolved
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResolveModal;
