const Post = require('../models/Post');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { notifyAllUsersOfNewPost } = require('../utils/email');

// Archive posts older than 7 days
const archiveOldPosts = async () => {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const result = await Post.updateMany(
      {
        createdAt: { $lte: sevenDaysAgo },
        isArchived: false,
        status: 'active',
      },
      {
        isArchived: true,
        archivedAt: new Date(),
        status: 'archived',
      }
    );
    console.log(`Archived ${result.modifiedCount} old posts.`);
  } catch (error) {
    console.error('Archive posts error:', error);
  }
};

// Notify all users of new post
const notifyUsers = async (post, poster, io) => {
  try {
    const users = await User.find({
      _id: { $ne: poster._id },
      isActive: true,
      notificationsEnabled: true,
    }).select('email _id');

    // Create in-app notifications
    const notifications = users.map(user => ({
      recipient: user._id,
      type: 'new_post',
      title: 'New Found Item Posted',
      message: `${poster.name} found a ${post.category} item: "${post.title}"`,
      relatedPost: post._id,
      relatedUser: poster._id,
    }));

    await Notification.insertMany(notifications);

    // Emit socket notification
    if (io) {
      users.forEach(user => {
        io.to(`user_${user._id}`).emit('notification', {
          type: 'new_post',
          title: 'New Found Item',
          message: `${poster.name} found: "${post.title}"`,
          postId: post._id,
        });
      });
    }

    // Send emails in background
    notifyAllUsersOfNewPost(post, poster, users).catch(console.error);
  } catch (error) {
    console.error('Notify users error:', error);
  }
};

module.exports = { archiveOldPosts, notifyUsers };
