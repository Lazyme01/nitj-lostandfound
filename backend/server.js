require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
const cron = require('node-cron');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const postRoutes = require('./routes/posts');
const chatRoutes = require('./routes/chat');
const userRoutes = require('./routes/users');
const notificationRoutes = require('./routes/notifications');
const { archiveOldPosts } = require('./controllers/postController');
const { setupSocketHandlers } = require('./utils/socketHandlers');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: 'Too many requests, please try again later.',
});
app.use('/api/', limiter);

// Make io accessible in routes
app.set('io', io);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', message: 'NITJ Lost & Found API is running' }));

// Socket.IO setup
setupSocketHandlers(io);

// Cron job: Archive posts older than 7 days (runs every day at midnight)
cron.schedule('0 0 * * *', async () => {
  console.log('Running daily post archive job...');
  await archiveOldPosts();
});

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected');
    server.listen(process.env.PORT || 5000, () => {
      console.log(`Server running on port ${process.env.PORT || 5000}`);
    });
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
