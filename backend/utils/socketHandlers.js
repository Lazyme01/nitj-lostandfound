const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Message = require('../models/Message');

const onlineUsers = new Map(); // userId -> socketId

const setupSocketHandlers = (io) => {
  // Auth middleware for socket
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error('Authentication error'));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);
      if (!user) return next(new Error('User not found'));
      socket.userId = decoded.userId;
      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.userId;
    onlineUsers.set(userId, socket.id);
    
    console.log(`User connected: ${socket.user.name} (${userId})`);
    
    // Broadcast online status
    io.emit('user_status', { userId, status: 'online' });

    // Join personal room
    socket.join(`user_${userId}`);

    // Handle sending messages
    socket.on('send_message', async (data) => {
      try {
        const { receiverId, content, relatedPostId } = data;
        const conversationId = Message.getConversationId(userId, receiverId);

        const message = await Message.create({
          conversationId,
          sender: userId,
          receiver: receiverId,
          content,
          messageType: 'text',
          relatedPost: relatedPostId || undefined,
        });

        await message.populate('sender', 'name email rollNo avatar');
        await message.populate('receiver', 'name email rollNo avatar');

        // Emit to both users
        io.to(`user_${userId}`).emit('new_message', message);
        io.to(`user_${receiverId}`).emit('new_message', message);

        // Notification to receiver if offline
        if (!onlineUsers.has(receiverId)) {
          io.to(`user_${receiverId}`).emit('notification', {
            type: 'new_message',
            message: `New message from ${socket.user.name}`,
          });
        }
      } catch (err) {
        console.error('Send message error:', err);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle resolution form submission
    socket.on('send_resolution', async (data) => {
      try {
        const { receiverId, finderRollNo, receiverRollNo, notes, relatedPostId } = data;
        const conversationId = Message.getConversationId(userId, receiverId);

        const message = await Message.create({
          conversationId,
          sender: userId,
          receiver: receiverId,
          content: `Query Resolved - Finder: ${finderRollNo}, Given to: ${receiverRollNo}`,
          messageType: 'resolution',
          resolutionData: { finderRollNo, receiverRollNo, notes },
          relatedPost: relatedPostId || undefined,
        });

        await message.populate('sender', 'name email rollNo avatar');

        io.to(`user_${userId}`).emit('new_message', message);
        io.to(`user_${receiverId}`).emit('new_message', message);
      } catch (err) {
        socket.emit('error', { message: 'Failed to send resolution' });
      }
    });

    // Handle typing indicator
    socket.on('typing', ({ receiverId }) => {
      io.to(`user_${receiverId}`).emit('user_typing', { userId, name: socket.user.name });
    });

    socket.on('stop_typing', ({ receiverId }) => {
      io.to(`user_${receiverId}`).emit('user_stop_typing', { userId });
    });

    // Mark messages as read
    socket.on('mark_read', async ({ conversationId }) => {
      await Message.updateMany(
        { conversationId, receiver: userId, isRead: false },
        { isRead: true }
      );
    });

    socket.on('disconnect', () => {
      onlineUsers.delete(userId);
      io.emit('user_status', { userId, status: 'offline' });
      console.log(`User disconnected: ${socket.user?.name}`);
    });
  });
};

module.exports = { setupSocketHandlers, onlineUsers };
