import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, Trash2, Package, MessageCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import API from '../../utils/api';

const NotificationPanel = ({ onClose }) => {
  const navigate = useNavigate();
  const panelRef = useRef(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const { data } = await API.get('/notifications');
        setNotifications(data.notifications);
      } catch {} finally {
        setLoading(false);
      }
    };
    fetchNotifs();

    const handleClick = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  const markAllRead = async () => {
    await API.put('/notifications/mark-all-read');
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const clearAll = async () => {
    await API.delete('/notifications');
    setNotifications([]);
  };

  const handleClick = (notif) => {
    if (notif.relatedPost) navigate(`/posts/${notif.relatedPost._id}`);
    onClose();
  };

  const typeIcon = (type) => {
    if (type === 'new_post') return <Package className="w-4 h-4 text-brand-accent" />;
    if (type === 'new_message') return <MessageCircle className="w-4 h-4 text-blue-400" />;
    return <Bell className="w-4 h-4 text-brand-muted" />;
  };

  return (
    <div
      ref={panelRef}
      className="absolute top-10 right-0 w-80 card shadow-2xl z-50 overflow-hidden animate-slide-up"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-brand-border">
        <h3 className="font-semibold text-white text-sm">Notifications</h3>
        <div className="flex gap-1">
          <button onClick={markAllRead} className="btn-ghost p-1.5 text-xs" title="Mark all read">
            <CheckCheck className="w-3.5 h-3.5" />
          </button>
          <button onClick={clearAll} className="btn-ghost p-1.5 text-xs text-red-400" title="Clear all">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="max-h-80 overflow-y-auto">
        {loading ? (
          <div className="p-8 text-center">
            <div className="w-6 h-6 border-2 border-brand-accent border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center">
            <Bell className="w-8 h-8 text-brand-border mx-auto mb-3" />
            <p className="text-brand-muted text-sm">All caught up!</p>
          </div>
        ) : (
          notifications.map(notif => (
            <div
              key={notif._id}
              onClick={() => handleClick(notif)}
              className={`flex gap-3 px-4 py-3 cursor-pointer hover:bg-brand-surface transition-all border-b border-brand-border/50 ${
                !notif.isRead ? 'bg-brand-accent/5' : ''
              }`}
            >
              <div className="w-8 h-8 rounded-lg bg-brand-surface flex items-center justify-center flex-shrink-0">
                {typeIcon(notif.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-gray-200 leading-snug">{notif.message}</div>
                <div className="text-xs text-brand-muted mt-1">
                  {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                </div>
              </div>
              {!notif.isRead && <div className="w-2 h-2 rounded-full bg-brand-accent mt-2 flex-shrink-0" />}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationPanel;
