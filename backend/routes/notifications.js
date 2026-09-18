const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const {
  getNotifications,
  markAllAsRead,
  clearNotifications,
} = require('../controllers/notificationController');

// Notification routes
router.get('/', authMiddleware, getNotifications);
router.put('/mark-all-read', authMiddleware, markAllAsRead);
router.delete('/', authMiddleware, clearNotifications);

module.exports = router;
