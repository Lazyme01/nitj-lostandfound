const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: ['new_post', 'new_message', 'post_resolved', 'post_expiring'],
    required: true,
  },
  title: String,
  message: String,
  relatedPost: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
  },
  relatedUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  emailSent: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

notificationSchema.index({ recipient: 1, isRead: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
