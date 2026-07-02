import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [notifications, setNotifications] = useState([]);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const messageListeners = useRef([]);
  const notifListeners = useRef([]);

  useEffect(() => {
    if (!user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    const token = localStorage.getItem('token');
    const socket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000', {
      auth: { token },
      transports: ['websocket'],
    });

    socketRef.current = socket;

    socket.on('connect', () => console.log('Socket connected'));
    socket.on('disconnect', () => console.log('Socket disconnected'));

    socket.on('user_status', ({ userId, status }) => {
      setOnlineUsers(prev => {
        const next = new Set(prev);
        if (status === 'online') next.add(userId);
        else next.delete(userId);
        return next;
      });
    });

    socket.on('new_message', (message) => {
      messageListeners.current.forEach(cb => cb(message));
      if (message.receiver._id === user._id || message.receiver === user._id) {
        setUnreadMessages(prev => prev + 1);
      }
    });

    socket.on('notification', (notif) => {
      setNotifications(prev => [notif, ...prev].slice(0, 50));
      notifListeners.current.forEach(cb => cb(notif));
    });

    return () => {
      socket.disconnect();
    };
  }, [user]);

  const addMessageListener = (cb) => {
    messageListeners.current.push(cb);
    return () => {
      messageListeners.current = messageListeners.current.filter(l => l !== cb);
    };
  };

  const addNotifListener = (cb) => {
    notifListeners.current.push(cb);
    return () => {
      notifListeners.current = notifListeners.current.filter(l => l !== cb);
    };
  };

  const sendMessage = (data) => socketRef.current?.emit('send_message', data);
  const sendResolution = (data) => socketRef.current?.emit('send_resolution', data);
  const emitTyping = (receiverId) => socketRef.current?.emit('typing', { receiverId });
  const emitStopTyping = (receiverId) => socketRef.current?.emit('stop_typing', { receiverId });
  const markRead = (conversationId) => socketRef.current?.emit('mark_read', { conversationId });
  const clearUnreadMessages = () => setUnreadMessages(0);

  return (
    <SocketContext.Provider value={{
      socket: socketRef.current,
      onlineUsers,
      notifications,
      unreadMessages,
      clearUnreadMessages,
      addMessageListener,
      addNotifListener,
      sendMessage,
      sendResolution,
      emitTyping,
      emitStopTyping,
      markRead,
    }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
