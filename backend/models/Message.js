const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  conversationId: {
    type: String,
    required: true,
    index: true,
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  content: {
    type: String,
    trim: true,
    default: '',
  },
  image: {
    url: String,
    publicId: String,
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'resolution'],
    default: 'text',
  },
  resolutionData: {
    finderRollNo: String,
    receiverRollNo: String,
    notes: String,
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  relatedPost: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
  },
}, { timestamps: true });

// Generate conversation ID (sorted user IDs)
messageSchema.statics.getConversationId = function(userId1, userId2) {
  return [userId1.toString(), userId2.toString()].sort().join('_');
};

module.exports = mongoose.model('Message', messageSchema);
