import React, { useState } from 'react';
import { CheckCircle2, X } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';
import toast from 'react-hot-toast';

const ResolutionForm = ({ receiverId, relatedPostId, onClose }) => {
  const { sendResolution } = useSocket();
  const [form, setForm] = useState({ finderRollNo: '', receiverRollNo: '', notes: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.finderRollNo || !form.receiverRollNo) {
      toast.error('Please fill in both roll numbers');
      return;
    }
    sendResolution({
      receiverId,
      finderRollNo: form.finderRollNo,
      receiverRollNo: form.receiverRollNo,
      notes: form.notes,
      relatedPostId,
    });
    toast.success('Resolution submitted!');
    onClose();
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
            <CheckCircle2 className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <h2 className="font-display font-bold text-white">Submit Resolution</h2>
            <p className="text-brand-muted text-sm">Record who found and who received the item</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-200 mb-2">
              Finder's Roll Number <span className="text-red-400">*</span>
            </label>
            <input
              className="input font-mono"
              placeholder="e.g., ADITYAKM.CS.23"
              value={form.finderRollNo}
              onChange={e => setForm(f => ({ ...f, finderRollNo: e.target.value.toUpperCase() }))}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-200 mb-2">
              Owner's Roll Number <span className="text-red-400">*</span>
            </label>
            <input
              className="input font-mono"
              placeholder="e.g., ROHITKS.ME.22"
              value={form.receiverRollNo}
              onChange={e => setForm(f => ({ ...f, receiverRollNo: e.target.value.toUpperCase() }))}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-200 mb-2">Notes (optional)</label>
            <textarea
              className="input resize-none"
              rows={2}
              placeholder="Any notes..."
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1 justify-center bg-green-500 hover:bg-green-400 text-white">
              <CheckCircle2 className="w-4 h-4" />
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResolutionForm;
