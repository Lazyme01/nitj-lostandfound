const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const authMiddleware = require('../middleware/auth');

// GET /api/notifications - Get user notifications
router.get('/', authMiddleware, async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .populate('relatedPost', 'title category')
      .populate('relatedUser', 'name rollNo avatar')
      .sort({ createdAt: -1 })
      .limit(50);
    const unreadCount = await Notification.countDocuments({ recipient: req.user._id, isRead: false });
    res.json({ notifications, unreadCount });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/notifications/mark-all-read
router.put('/mark-all-read', authMiddleware, async (req, res) => {
  try {
    await Notification.updateMany({ recipient: req.user._id, isRead: false }, { isRead: true });
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/notifications - Clear all
router.delete('/', authMiddleware, async (req, res) => {
  try {
    await Notification.deleteMany({ recipient: req.user._id });
    res.json({ message: 'Notifications cleared' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
