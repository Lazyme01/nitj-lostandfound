const Message = require('../models/Message');

// GET /api/chat/conversations - Get all conversations for current user
const getConversations = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get latest message per conversation
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [{ sender: userId }, { receiver: userId }],
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $group: {
          _id: '$conversationId',
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ['$receiver', userId] }, { $eq: ['$isRead', false] }] },
                1,
                0,
              ],
            },
          },
        },
      },
      { $sort: { 'lastMessage.createdAt': -1 } },
    ]);
        
    // Populate user data
    await Message.populate(conversations, [
      { path: 'lastMessage.sender', select: 'name email rollNo avatar', model: 'User' },
      { path: 'lastMessage.receiver', select: 'name email rollNo avatar', model: 'User' },
      { path: 'lastMessage.relatedPost', select: 'title category', model: 'Post' },
    ]);

    res.json({ conversations });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/chat/:userId - Get messages between current user and another user
const getMessages = async (req, res) => {
  try {
    const conversationId = Message.getConversationId(req.user._id, req.params.userId);
    const { page = 1, limit = 50 } = req.query;

    const messages = await Message.find({ conversationId })
      .populate('sender', 'name email rollNo avatar')
      .populate('receiver', 'name email rollNo avatar')
      .populate('relatedPost', 'title category _id')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    // Mark messages as read
    await Message.updateMany(
      { conversationId, receiver: req.user._id, isRead: false },
      { isRead: true }
    );

    res.json({ messages: messages.reverse() });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/chat/image - Send image in chat
const sendChatImage = async (req, res) => {
  try {
    const { receiverId, relatedPostId } = req.body;
    if (!req.file) return res.status(400).json({ message: 'No image uploaded' });
    if (!receiverId) return res.status(400).json({ message: 'Receiver ID required' });

    const conversationId = Message.getConversationId(req.user._id, receiverId);

    const message = await Message.create({
      conversationId,
      sender: req.user._id,
      receiver: receiverId,
      messageType: 'image',
      image: {
        url: req.file.path,
        publicId: req.file.filename,
      },
      relatedPost: relatedPostId || undefined,
    });

    await message.populate('sender', 'name email rollNo avatar');
    await message.populate('receiver', 'name email rollNo avatar');

    // Emit via socket
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${req.user._id}`).emit('new_message', message);
      io.to(`user_${receiverId}`).emit('new_message', message);
    }

    res.json({ message });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getConversations,
  getMessages,
  sendChatImage,
};
