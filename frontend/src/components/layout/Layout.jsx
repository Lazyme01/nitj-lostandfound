import React, { useState } from 'react';
import { NavLink, useNavigate, Outlet } from 'react-router-dom';
import {
  Search, LayoutDashboard, MessageCircle, Bell, History,
  LogOut, ChevronDown, User, Menu, X, Settings
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import NotificationPanel from '../notifications/NotificationPanel';
import toast from 'react-hot-toast';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/posts', icon: Search, label: 'Found Items' },
  { to: '/chat', icon: MessageCircle, label: 'Messages' },
  { to: '/history', icon: History, label: 'History' },
];

const Layout = () => {
  const { user, logout } = useAuth();
  const { unreadMessages, notifications } = useSocket();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const navigate = useNavigate();

  const unreadNotifs = notifications.filter(n => !n.isRead).length;

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-brand-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-brand-accent flex items-center justify-center flex-shrink-0">
            <Search className="w-4 h-4 text-brand-dark" />
          </div>
          <div>
            <div className="font-display font-bold text-white text-base leading-tight">Lost & Found</div>
            <div className="text-brand-muted text-xs">NIT Jalandhar</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
            {label === 'Messages' && unreadMessages > 0 && (
              <span className="ml-auto bg-brand-accent text-brand-dark text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {unreadMessages > 9 ? '9+' : unreadMessages}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User profile */}
      <div className="p-4 border-t border-brand-border">
        <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-brand-surface cursor-pointer transition-all" onClick={() => { setProfileOpen(!profileOpen); setSidebarOpen(false); navigate('/profile'); }}>
          {user?.avatar ? (
            <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-lg object-cover" />
          ) : (
            <div className="w-8 h-8 rounded-lg bg-brand-accent/20 flex items-center justify-center">
              <User className="w-4 h-4 text-brand-accent" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-white truncate">{user?.name}</div>
            <div className="text-xs text-brand-muted truncate font-mono">{user?.rollNo || user?.email?.split('@')[0]}</div>
          </div>
          <Settings className="w-4 h-4 text-brand-muted" />
        </div>
        <button onClick={handleLogout} className="mt-2 w-full btn-ghost text-red-400 hover:text-red-300 hover:bg-red-900/20 justify-start text-sm">
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-60 flex-col bg-brand-card border-r border-brand-border flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-72 bg-brand-card flex flex-col border-r border-brand-border animate-slide-up">
            <button className="absolute top-4 right-4 p-2 hover:bg-brand-surface rounded-lg" onClick={() => setSidebarOpen(false)}>
              <X className="w-4 h-4 text-brand-muted" />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-14 bg-brand-card border-b border-brand-border flex items-center px-4 gap-4 flex-shrink-0">
          <button className="lg:hidden p-2 hover:bg-brand-surface rounded-lg transition-colors" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-5 h-5 text-brand-muted" />
          </button>

          <div className="flex-1" />

          {/* Notifications */}
          <div className="relative">
            <button
              className="relative p-2 hover:bg-brand-surface rounded-lg transition-colors"
              onClick={() => setNotifOpen(!notifOpen)}
            >
              <Bell className="w-5 h-5 text-brand-muted" />
              {unreadNotifs > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-brand-accent rounded-full notif-dot" />
              )}
            </button>
            {notifOpen && (
              <NotificationPanel onClose={() => setNotifOpen(false)} />
            )}
          </div>

          {/* Avatar */}
          <div className="flex items-center gap-2">
            {user?.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-lg object-cover" />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-brand-accent/20 flex items-center justify-center">
                <User className="w-4 h-4 text-brand-accent" />
              </div>
            )}
            <span className="hidden sm:block text-sm font-medium text-gray-300">{user?.name?.split(' ')[0]}</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
