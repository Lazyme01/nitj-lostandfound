const express = require('express');
const router = express.Router();
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

// GET /api/users - Get all users (for chat initiation)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { search } = req.query;
    const query = { _id: { $ne: req.user._id }, isActive: true };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { rollNo: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    const users = await User.find(query).select('name email rollNo avatar lastSeen').limit(20);
    res.json({ users });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/users/:id - Get user profile
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('name email rollNo avatar branch year lastSeen createdAt');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
