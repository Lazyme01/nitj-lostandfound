import React, { useState } from 'react';
import { User, Mail, Hash, Building, Calendar, Bell, BellOff, Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';
import toast from 'react-hot-toast';

const BRANCHES = ['CS', 'IT', 'ECE', 'EE', 'ME', 'CE', 'CHE', 'MCA', 'MBA', 'PHY', 'CHEM', 'MATH'];
const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year', 'PG 1st Year', 'PG 2nd Year', 'PhD'];

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({
    branch: user?.branch || '',
    year: user?.year || '',
    notificationsEnabled: user?.notificationsEnabled ?? true,
  });
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      const { data } = await API.put('/auth/profile', form);
      updateUser(data.user);
      toast.success('Profile updated!');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6 animate-fade-in">
      <h1 className="font-display text-2xl font-bold text-white">Profile Settings</h1>

      {/* Avatar & basic info */}
      <div className="card p-6">
        <div className="flex items-center gap-5 mb-6">
          {user?.avatar ? (
            <img src={user.avatar} alt={user.name} className="w-16 h-16 rounded-2xl object-cover" />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-brand-accent/20 flex items-center justify-center">
              <User className="w-8 h-8 text-brand-accent" />
            </div>
          )}
          <div>
            <h2 className="font-display font-bold text-xl text-white">{user?.name}</h2>
            <p className="text-brand-muted text-sm flex items-center gap-1.5 mt-1">
              <Mail className="w-3.5 h-3.5" /> {user?.email}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="card p-4 bg-brand-surface">
            <div className="text-xs text-brand-muted mb-1 flex items-center gap-1.5">
              <Hash className="w-3 h-3" /> Roll Number
            </div>
            <div className="font-mono font-semibold text-brand-accent">{user?.rollNo || '—'}</div>
          </div>
          <div className="card p-4 bg-brand-surface">
            <div className="text-xs text-brand-muted mb-1 flex items-center gap-1.5">
              <Mail className="w-3 h-3" /> Email Domain
            </div>
            <div className="font-mono font-semibold text-green-400">
              {user?.email?.split('@')[1] ? `@${user.email.split('@')[1]} (Verified)` : 'Verified'}
            </div>
          </div>
        </div>
      </div>

      {/* Editable fields */}
      <div className="card p-6 space-y-4">
        <h3 className="font-semibold text-white">Academic Details</h3>

        <div>
          <label className="block text-sm font-semibold text-gray-200 mb-2 flex items-center gap-1.5">
            <Building className="w-3.5 h-3.5" /> Branch
          </label>
          <select
            className="input"
            value={form.branch}
            onChange={e => setForm(f => ({ ...f, branch: e.target.value }))}
          >
            <option value="">Select Branch</option>
            {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-200 mb-2 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" /> Year
          </label>
          <select
            className="input"
            value={form.year}
            onChange={e => setForm(f => ({ ...f, year: e.target.value }))}
          >
            <option value="">Select Year</option>
            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* Notification preference */}
      <div className="card p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-semibold text-white flex items-center gap-2">
              {form.notificationsEnabled ? <Bell className="w-4 h-4 text-brand-accent" /> : <BellOff className="w-4 h-4 text-brand-muted" />}
              Email Notifications
            </div>
            <p className="text-brand-muted text-sm mt-1">Receive email alerts when new items are found</p>
          </div>
          <button
            onClick={() => setForm(f => ({ ...f, notificationsEnabled: !f.notificationsEnabled }))}
            className={`relative w-12 h-6 rounded-full transition-all duration-300 ${form.notificationsEnabled ? 'bg-brand-accent' : 'bg-brand-border'}`}
          >
            <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${form.notificationsEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
          </button>
        </div>
      </div>

      <button onClick={handleSave} disabled={loading} className="btn-primary w-full justify-center">
        {loading ? (
          <span className="inline-flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-brand-dark/30 border-t-brand-dark rounded-full animate-spin" />
            Saving...
          </span>
        ) : (
          <>
            <Save className="w-4 h-4" />
            Save Changes
          </>
        )}
      </button>
    </div>
  );
};

export default ProfilePage;
