import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import Layout from './components/layout/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import PostsPage from './pages/PostsPage';
import CreatePostPage from './pages/CreatePostPage';
import PostDetailPage from './pages/PostDetailPage';
import ChatPage from './pages/ChatPage';
import HistoryPage from './pages/HistoryPage';
import ProfilePage from './pages/ProfilePage';

const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || '';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-dark">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-brand-accent border-t-transparent rounded-full animate-spin" />
          <p className="text-brand-muted text-sm">Loading...</p>
        </div>
      </div>
    );
  }
  return user ? children : <Navigate to="/login" replace />;
};

const AppRoutes = () => {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="posts" element={<PostsPage />} />
        <Route path="posts/create" element={<CreatePostPage />} />
        <Route path="posts/:id" element={<PostDetailPage />} />
        <Route path="chat" element={<ChatPage />} />
        <Route path="chat/:userId" element={<ChatPage />} />
        <Route path="history" element={<HistoryPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

const App = () => {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <SocketProvider>
          <BrowserRouter>
            <AppRoutes />
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#161b22',
                  color: '#e5e7eb',
                  border: '1px solid #21262d',
                  borderRadius: '12px',
                  fontSize: '14px',
                },
                success: {
                  iconTheme: { primary: '#f59e0b', secondary: '#161b22' },
                },
                error: {
                  iconTheme: { primary: '#ef4444', secondary: '#161b22' },
                },
              }}
            />
          </BrowserRouter>
        </SocketProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
};

export default App;
