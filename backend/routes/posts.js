const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { uploadPostImage } = require('../config/cloudinary');
const {
  getPosts,
  getPostById,
  createPost,
  resolvePost,
  deletePost,
} = require('../controllers/postController');

const handleUpload = (req, res, next) => {
  uploadPostImage(req, res, (err) => {
    if (err) return res.status(400).json({ message: err.message });
    next();
  });
};

// Post routes
router.get('/', authMiddleware, getPosts);
router.get('/:id', authMiddleware, getPostById);
router.post('/', authMiddleware, handleUpload, createPost);
router.put('/:id/resolve', authMiddleware, resolvePost);
router.delete('/:id', authMiddleware, deletePost);

module.exports = router;