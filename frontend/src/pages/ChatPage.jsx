import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Send, Image, X, MessageCircle, Search, CheckCircle2, ArrowLeft } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import API from '../utils/api';
import toast from 'react-hot-toast';
import ResolutionForm from '../components/chat/ResolutionForm';

const ChatPage = () => {
  const { userId } = useParams();
  const [searchParams] = useSearchParams();
  const relatedPostId = searchParams.get('postId');
  const navigate = useNavigate();
  const { user } = useAuth();
  const { sendMessage, addMessageListener, emitTyping, emitStopTyping, markRead, onlineUsers } = useSocket();

  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [chatUser, setChatUser] = useState(null);
  const [input, setInput] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePrev, setImagePrev] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showResolutionForm, setShowResolutionForm] = useState(false);
  const [typingUsers, setTypingUsers] = useState({});
  const [searchConv, setSearchConv] = useState('');
  const bottomRef = useRef(null);
  const typingTimeout = useRef(null);
  const fileInputRef = useRef(null);

  // Fetch conversations
  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await API.get('/chat/conversations');
        setConversations(data.conversations);
      } catch {}
    };
    fetch();
  }, [userId]);

  // Fetch chat user and messages
  useEffect(() => {
    if (!userId) return;
    const fetchChat = async () => {
      setLoading(true);
      try {
        const [userRes, msgRes] = await Promise.all([
          API.get(`/users/${userId}`),
          API.get(`/chat/${userId}`),
        ]);
        setChatUser(userRes.data.user);
        setMessages(msgRes.data.messages);
        markRead?.(`${[user._id, userId].sort().join('_')}`);
      } catch {
        toast.error('Failed to load chat');
      } finally {
        setLoading(false);
      }
    };
    fetchChat();
  }, [userId]);

  // Scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Listen for incoming messages
  useEffect(() => {
    const unsub = addMessageListener((msg) => {
      const convId = [user._id, userId].sort().join('_');
      if (msg.conversationId === convId) {
        setMessages(prev => [...prev, msg]);
      }
      // Refresh conversation list
      API.get('/chat/conversations').then(({ data }) => setConversations(data.conversations)).catch(() => {});
    });
    return unsub;
  }, [userId, user._id, addMessageListener]);

  const handleSend = async () => {
    const content = input.trim();
    if (!content && !imageFile) return;

    if (imageFile) {
      try {
        const fd = new FormData();
        fd.append('image', imageFile);
        fd.append('receiverId', userId);
        if (relatedPostId) fd.append('relatedPostId', relatedPostId);
        await API.post('/chat/image', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        setImageFile(null);
        setImagePrev(null);
      } catch {
        toast.error('Failed to send image');
      }
    } else {
      sendMessage({ receiverId: userId, content, relatedPostId });
    }
    setInput('');
    emitStopTyping(userId);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTyping = () => {
    emitTyping(userId);
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => emitStopTyping(userId), 2000);
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePrev(URL.createObjectURL(file));
  };

  const filteredConversations = conversations.filter(conv => {
    const other = conv.lastMessage.sender._id === user._id ? conv.lastMessage.receiver : conv.lastMessage.sender;
    return !searchConv || other.name?.toLowerCase().includes(searchConv.toLowerCase()) || other.rollNo?.toLowerCase().includes(searchConv.toLowerCase());
  });

  const isOnline = onlineUsers.has(userId);

  return (
    <div className="flex h-full overflow-hidden">
      {/* Conversations sidebar */}
      <div className={`${userId ? 'hidden lg:flex' : 'flex'} flex-col w-full lg:w-72 xl:w-80 border-r border-brand-border bg-brand-card flex-shrink-0`}>
        <div className="p-4 border-b border-brand-border">
          <h2 className="font-display font-bold text-white mb-3">Messages</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted" />
            <input
              className="input pl-9 text-sm"
              placeholder="Search conversations..."
              value={searchConv}
              onChange={e => setSearchConv(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="p-8 text-center">
              <MessageCircle className="w-10 h-10 text-brand-border mx-auto mb-3" />
              <p className="text-brand-muted text-sm">No conversations yet</p>
              <p className="text-xs text-brand-border mt-1">Contact a finder from any post</p>
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const other = conv.lastMessage.sender._id === user._id ? conv.lastMessage.receiver : conv.lastMessage.sender;
              const isActive = other._id === userId;
              const isUserOnline = onlineUsers.has(other._id);
              return (
                <div
                  key={conv._id}
                  onClick={() => navigate(`/chat/${other._id}`)}
                  className={`flex items-center gap-3 px-4 py-3.5 cursor-pointer border-b border-brand-border/50 transition-all ${
                    isActive ? 'bg-brand-accent/10' : 'hover:bg-brand-surface'
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    {other.avatar ? (
                      <img src={other.avatar} alt={other.name} className="w-10 h-10 rounded-xl object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-brand-accent/20 flex items-center justify-center">
                        <span className="font-semibold text-brand-accent text-sm">{other.name?.[0]}</span>
                      </div>
                    )}
                    {isUserOnline && <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 border-2 border-brand-card rounded-full" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-sm text-white truncate">{other.name}</span>
                      <span className="text-xs text-brand-muted ml-2 flex-shrink-0">
                        {formatDistanceToNow(new Date(conv.lastMessage.createdAt), { addSuffix: false })}
                      </span>
                    </div>
                    <div className="text-xs text-brand-muted truncate mt-0.5">
                      {conv.lastMessage.messageType === 'image' ? 'Image' :
                       conv.lastMessage.messageType === 'resolution' ? 'Resolution form' :
                       conv.lastMessage.content}
                    </div>
                  </div>
                  {conv.unreadCount > 0 && (
                    <span className="w-5 h-5 bg-brand-accent text-brand-dark text-xs font-bold rounded-full flex items-center justify-center flex-shrink-0">
                      {conv.unreadCount}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Chat area */}
      {userId ? (
        <div className="flex-1 flex flex-col min-w-0">
          {/* Chat header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-brand-border bg-brand-card flex-shrink-0">
            <button onClick={() => navigate('/chat')} className="lg:hidden btn-ghost p-2">
              <ArrowLeft className="w-4 h-4" />
            </button>
            {chatUser?.avatar ? (
              <div className="relative">
                <img src={chatUser.avatar} alt={chatUser.name} className="w-9 h-9 rounded-xl object-cover" />
                {isOnline && <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 border-2 border-brand-card rounded-full" />}
              </div>
            ) : (
              <div className="w-9 h-9 rounded-xl bg-brand-accent/20 flex items-center justify-center">
                <span className="text-brand-accent font-bold">{chatUser?.name?.[0]}</span>
              </div>
            )}
            <div>
              <div className="font-semibold text-white text-sm">{chatUser?.name}</div>
              <div className="text-xs font-mono text-brand-muted">{chatUser?.rollNo}</div>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <span className={`text-xs px-2 py-1 rounded-full ${isOnline ? 'bg-green-400/10 text-green-400' : 'bg-brand-surface text-brand-muted'}`}>
                {isOnline ? '● Online' : '○ Offline'}
              </span>
              <button
                onClick={() => setShowResolutionForm(true)}
                className="btn-secondary text-xs py-1.5"
                title="Submit resolution form"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Resolve</span>
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="w-6 h-6 border-2 border-brand-accent border-t-transparent rounded-full animate-spin" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <MessageCircle className="w-12 h-12 text-brand-border mb-4" />
                <p className="text-brand-muted">No messages yet. Say hello!</p>
                {relatedPostId && (
                  <p className="text-xs text-brand-border mt-2">Chatting about a found item</p>
                )}
              </div>
            ) : (
              messages.map((msg) => {
                const isSent = msg.sender._id === user._id || msg.sender === user._id;
                if (msg.messageType === 'resolution') {
                  return (
                    <div key={msg._id} className="flex justify-center my-4">
                      <div className="bg-green-900/30 border border-green-500/30 rounded-xl px-4 py-3 max-w-sm text-center">
                        <CheckCircle2 className="w-5 h-5 text-green-400 mx-auto mb-2" />
                        <div className="text-xs font-semibold text-green-400 mb-1">Resolution Submitted</div>
                        {msg.resolutionData?.finderRollNo && (
                          <div className="text-xs text-gray-300">Finder: <span className="font-mono">{msg.resolutionData.finderRollNo}</span></div>
                        )}
                        {msg.resolutionData?.receiverRollNo && (
                          <div className="text-xs text-gray-300">Owner: <span className="font-mono">{msg.resolutionData.receiverRollNo}</span></div>
                        )}
                        {msg.resolutionData?.notes && (
                          <div className="text-xs text-brand-muted mt-1">{msg.resolutionData.notes}</div>
                        )}
                      </div>
                    </div>
                  );
                }
                return (
                  <div key={msg._id} className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}>
                    <div className={isSent ? 'message-bubble-sent' : 'message-bubble-received'}>
                      {msg.messageType === 'image' && msg.image?.url && (
                        <img
                          src={msg.image.url}
                          alt="Shared image"
                          className="rounded-lg max-w-full mb-1 cursor-pointer"
                          style={{ maxHeight: 300 }}
                          onClick={() => window.open(msg.image.url, '_blank')}
                        />
                      )}
                      {msg.content && <p className="text-sm leading-relaxed break-words">{msg.content}</p>}
                      <div className={`text-xs mt-1 ${isSent ? 'text-brand-dark/60' : 'text-brand-muted'}`}>
                        {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>

          {/* Image preview */}
          {imagePrev && (
            <div className="px-4 pb-2">
              <div className="relative inline-block">
                <img src={imagePrev} alt="preview" className="h-20 rounded-lg object-cover" />
                <button
                  onClick={() => { setImageFile(null); setImagePrev(null); }}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            </div>
          )}

          {/* Input area */}
          <div className="p-4 border-t border-brand-border bg-brand-card flex-shrink-0">
            <div className="flex gap-2 items-end">
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="btn-ghost p-2.5 flex-shrink-0 text-brand-muted hover:text-brand-accent"
                title="Send image"
              >
                <Image className="w-5 h-5" />
              </button>
              <textarea
                className="input flex-1 resize-none min-h-10 max-h-32 py-2.5"
                placeholder="Type a message..."
                value={input}
                onChange={e => { setInput(e.target.value); handleTyping(); }}
                onKeyDown={handleKeyDown}
                rows={1}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() && !imageFile}
                className="btn-primary p-2.5 flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="hidden lg:flex flex-1 items-center justify-center">
          <div className="text-center">
            <MessageCircle className="w-16 h-16 text-brand-border mx-auto mb-6" />
            <h3 className="font-display text-xl font-semibold text-white mb-2">Select a conversation</h3>
            <p className="text-brand-muted">Choose from your conversations or contact a finder from a post</p>
          </div>
        </div>
      )}

      {/* Resolution form modal */}
      {showResolutionForm && (
        <ResolutionForm
          receiverId={userId}
          relatedPostId={relatedPostId}
          onClose={() => setShowResolutionForm(false)}
        />
      )}
    </div>
  );
};

export default ChatPage;
