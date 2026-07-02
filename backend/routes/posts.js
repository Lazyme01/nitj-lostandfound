const express = require('express');
const router = express.Router();

const Post = require('../models/Post');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');
const { uploadPostImage } = require('../config/cloudinary');
const { notifyUsers } = require('../controllers/postController');

// Debug — remove after confirming it works
console.log('Post type on load:', typeof Post);
console.log('Has countDocuments:', typeof Post.countDocuments);

// GET /api/posts
router.get('/', authMiddleware, async (req, res) => {
  try {
    const {
      category,
      status = 'active',
      page = 1,
      limit = 20,
      search,
      postType,
    } = req.query;

    const query = {};

    if (status === 'active') {
      query.isArchived = false;
      query.status = 'active';
    } else if (status === 'archived') {
      query.isArchived = true;
    } else if (status === 'resolved') {
      query.status = 'resolved';
    } else if (status === 'history') {
      query.$or = [{ isArchived: true }, { status: 'resolved' }];
    }

    if (postType && postType !== 'all') {
      query.postType = postType;
    }

    if (category && category !== 'all') {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await Post.countDocuments(query);
    const posts = await Post.find(query)
      .populate('postedBy', 'name email rollNo avatar')
      .populate('resolvedData.resolvedBy', 'name rollNo')
      .populate('resolvedData.givenTo', 'name rollNo')
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    res.json({
      posts,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
    });
  } catch (error) {
    console.error('GET /posts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/posts/:id - FIXED (views removed)
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('postedBy', 'name email rollNo avatar')
      .populate('resolvedData.resolvedBy', 'name rollNo')
      .populate('resolvedData.givenTo', 'name rollNo');

    if (!post) return res.status(404).json({ message: 'Post not found' });

    // views logic removed

    res.json({ post });
  } catch (error) {
    console.error('GET /posts/:id error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/posts
router.post(
  '/',
  authMiddleware,
  (req, res, next) => {
    uploadPostImage(req, res, (err) => {
      if (err) return res.status(400).json({ message: err.message });
      next();
    });
  },
  async (req, res) => {
    try {
      const { title, description, category, location, postType } = req.body;

      if (!title || !description || !category) {
        return res.status(400).json({
          message: 'Title, description, and category are required',
        });
      }

      if (!postType || !['found', 'lost'].includes(postType)) {
        return res.status(400).json({
          message: 'postType must be found or lost',
        });
      }

      const images = req.files
        ? req.files.map((file) => ({
            url: file.path,
            publicId: file.filename,
          }))
        : [];

      const post = await Post.create({
        title,
        description,
        category,
        location,
        postType,
        images,
        postedBy: req.user._id,
        rollNo:
          req.user.rollNo ||
          req.user.email.split('@')[0].toUpperCase(),
      });

      await post.populate('postedBy', 'name email rollNo avatar');

      const io = req.app.get('io');
      notifyUsers(post, req.user, io);

      res.status(201).json({
        post,
        message: 'Post created successfully',
      });
    } catch (error) {
      console.error('POST /posts error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// PUT /api/posts/:id/resolve
router.put('/:id/resolve', authMiddleware, async (req, res) => {
  try {
    const { givenToRollNo, notes } = req.body;
    const post = await Post.findById(req.params.id);

    if (!post)
      return res.status(404).json({ message: 'Post not found' });

    if (post.postedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: 'Only the post creator can resolve it',
      });
    }

    const givenToUser = givenToRollNo
      ? await User.findOne({
          rollNo: { $regex: new RegExp(givenToRollNo, 'i') },
        })
      : null;

    post.status = 'resolved';
    post.resolvedData = {
      resolvedBy: req.user._id,
      givenTo: givenToUser?._id,
      givenToRollNo,
      resolvedAt: new Date(),
      notes,
    };

    await post.save();
    await post.populate('postedBy', 'name email rollNo avatar');

    res.json({
      post,
      message: 'Post marked as resolved',
    });
  } catch (error) {
    console.error('PUT /posts/:id/resolve error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/posts/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post)
      return res.status(404).json({ message: 'Post not found' });

    if (post.postedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    await post.deleteOne();
    res.json({ message: 'Post deleted' });
  } catch (error) {
    console.error('DELETE /posts/:id error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;