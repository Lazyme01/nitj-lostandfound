const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const {
  checkEmail,
  sendOtp,
  signup,
  login,
  getMe,
  updateProfile,
  changePassword,
} = require('../controllers/authController');

// Authentication routes
router.post('/check-email', checkEmail);
router.post('/send-otp', sendOtp);
router.post('/signup', signup);
router.post('/login', login);
router.get('/me', authMiddleware, getMe);
router.put('/profile', authMiddleware, updateProfile);
router.put('/change-password', authMiddleware, changePassword);

module.exports = router;