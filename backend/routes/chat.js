const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { uploadChatImage } = require('../config/cloudinary');
const {
  getConversations,
  getMessages,
  sendChatImage,
} = require('../controllers/chatController');

const handleChatImageUpload = (req, res, next) => {
  uploadChatImage(req, res, (err) => {
    if (err) return res.status(400).json({ message: err.message });
    next();
  });
};

// Chat routes
router.get('/conversations', authMiddleware, getConversations);
router.get('/:userId', authMiddleware, getMessages);
router.post('/image', authMiddleware, handleChatImageUpload, sendChatImage);

module.exports = router;
