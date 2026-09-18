const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const {
  getUsers,
  getUserById,
} = require('../controllers/userController');

// User routes
router.get('/', authMiddleware, getUsers);
router.get('/:id', authMiddleware, getUserById);

module.exports = router;
