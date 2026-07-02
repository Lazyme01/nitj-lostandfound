const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  postType: {
    type: String,
    enum: ['found', 'lost'],
    default: 'found',
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 150,
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000,
  },
  category: {
    type: String,
    required: true,
    enum: ['electronics', 'stationary', 'clothing', 'accessories', 'documents', 'others'],
  },
  location: {
    type: String,
    trim: true,
    default: '',
  },
  images: [{
    url: String,
    publicId: String,
  }],
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  rollNo: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['active', 'resolved', 'archived'],
    default: 'active',
  },
  resolvedData: {
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    givenTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    givenToRollNo: String,
    resolvedAt: Date,
    notes: String,
  },
  isArchived: {
    type: Boolean,
    default: false,
  },
  archivedAt: {
    type: Date,
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  },
  views: {
    type: Number,
    default: 0,
  },
}, { timestamps: true });

postSchema.index({ category: 1, status: 1 });
postSchema.index({ postedBy: 1 });
postSchema.index({ expiresAt: 1 });
postSchema.index({ postType: 1 });

module.exports = mongoose.model('Post', postSchema);