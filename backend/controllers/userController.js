const User = require('../models/User');

// GET /api/users - Get all users (for chat initiation)
const getUsers = async (req, res) => {
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
};

// GET /api/users/:id - Get user profile
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('name email rollNo avatar branch year lastSeen createdAt');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getUsers,
  getUserById,
};
