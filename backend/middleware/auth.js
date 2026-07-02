const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided. Access denied.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');

    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'User not found or inactive.' });
    }

    // Update lastSeen asynchronously to avoid concurrent save/VersionError conflicts
    User.updateOne({ _id: user._id }, { $set: { lastSeen: new Date() } }).catch(err => {
      console.error('Failed to update lastSeen:', err);
    });

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token.' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired. Please login again.' });
    }
    console.error('Auth middleware error:', error);
    res.status(500).json({ message: 'Server error during authentication.' });
  }
};

module.exports = authMiddleware;