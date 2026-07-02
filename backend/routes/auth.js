const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const OTP = require('../models/OTP');
const authMiddleware = require('../middleware/auth');
const { sendEmail } = require('../utils/email');

const ALLOWED_DOMAIN = process.env.ALLOWED_EMAIL_DOMAIN || 'nitj.ac.in';

const generateOTP = () => crypto.randomInt(100000, 999999).toString();

const validateNITJEmail = (email) => {
  return email.toLowerCase().endsWith(`@${ALLOWED_DOMAIN}`);
};

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

const userResponse = (user, token) => ({
  token,
  user: {
    _id: user._id,
    email: user.email,
    name: user.name,
    avatar: user.avatar,
    rollNo: user.rollNo,
    branch: user.branch,
    year: user.year,
    notificationsEnabled: user.notificationsEnabled,
  },
});

// ─── POST /api/auth/check-email ──────────────────────────────────────────
// Check if user exists → frontend decides login or signup flow
router.post('/check-email', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    if (!validateNITJEmail(email)) {
      return res.status(403).json({
        message: 'Only @nitj.ac.in email addresses are allowed.',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    res.json({
      exists: !!user,
      name: user?.name || null,
    });
  } catch (error) {
    console.error('Check email error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── POST /api/auth/send-otp ─────────────────────────────────────────────
// Only for NEW users during signup — sends OTP to verify email
router.post('/send-otp', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    if (!validateNITJEmail(email)) {
      return res.status(403).json({ message: 'Only @nitj.ac.in emails allowed.' });
    }

    // Block if already registered
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'Account already exists. Please login.' });
    }

    // Delete old OTPs
    await OTP.deleteMany({ email: email.toLowerCase() });

    const otp = generateOTP();
    await OTP.create({
      email: email.toLowerCase(),
      otp,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 min
    });

    await sendEmail({
      to: email,
      subject: 'Verify your email — NITJ Lost & Found',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', sans-serif; background: #f4f4f5; margin: 0; padding: 20px; }
            .container { max-width: 480px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
            .header { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 32px; text-align: center; }
            .header h1 { color: #f59e0b; margin: 0; font-size: 20px; letter-spacing: 2px; }
            .body { padding: 32px; text-align: center; }
            .otp-box { background: #f8fafc; border: 2px dashed #e2e8f0; border-radius: 12px; padding: 24px; margin: 24px 0; }
            .otp { font-size: 42px; font-weight: 800; letter-spacing: 12px; color: #1a1a2e; font-family: monospace; }
            .note { color: #94a3b8; font-size: 13px; }
            .footer { background: #f8fafc; padding: 16px; text-align: center; font-size: 12px; color: #94a3b8; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header"><h1>NITJ LOST & FOUND</h1></div>
            <div class="body">
              <p style="color:#374151;font-size:16px;font-weight:600;">Verify your email to create your account</p>
              <p style="color:#6b7280;font-size:14px;">Your sign up OTP is:</p>
              <div class="otp-box">
                <div class="otp">${otp}</div>
              </div>
              <p class="note">Valid for <strong>10 minutes</strong>. Do not share it with anyone.</p>
            </div>
            <div class="footer">NIT Jalandhar Lost & Found Portal</div>
          </div>
        </body>
        </html>
      `,
    });

    res.json({ message: `Verification OTP sent to ${email}` });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ message: 'Failed to send OTP. Please try again.' });
  }
});

// ─── POST /api/auth/signup ────────────────────────────────────────────────
// Verify OTP + name + password → create new account
router.post('/signup', async (req, res) => {
  try {
    const { email, otp, name, password } = req.body;

    if (!email || !otp || !name || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    if (!validateNITJEmail(email)) {
      return res.status(403).json({ message: 'Only @nitj.ac.in emails allowed.' });
    }

    // Block if already registered
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'Account already exists. Please login.' });
    }

    // Verify OTP
    const otpRecord = await OTP.findOne({
      email: email.toLowerCase(),
      otp,
      expiresAt: { $gt: new Date() },
    });

    if (!otpRecord) {
      return res.status(400).json({ message: 'Invalid or expired OTP. Please try again.' });
    }

    // Delete used OTP
    await OTP.deleteMany({ email: email.toLowerCase() });

    const localPart = email.split('@')[0];

    // Create user (password will be hashed by pre-save hook)
    const user = await User.create({
      email: email.toLowerCase(),
      name: name.trim(),
      password,
      rollNo: localPart.toUpperCase(),
    });

    const token = generateToken(user._id);
    res.status(201).json(userResponse(user, token));
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Signup failed. Please try again.' });
  }
});

// ─── POST /api/auth/login ─────────────────────────────────────────────────
// Existing users — email + password, no OTP
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    if (!validateNITJEmail(email)) {
      return res.status(403).json({ message: 'Only @nitj.ac.in emails allowed.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: 'No account found. Please sign up first.' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Incorrect password. Please try again.' });
    }

    const token = generateToken(user._id);
    res.json(userResponse(user, token));
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed. Please try again.' });
  }
});

// ─── GET /api/auth/me ─────────────────────────────────────────────────────
router.get('/me', authMiddleware, async (req, res) => {
  res.json({ user: req.user });
});

// ─── PUT /api/auth/profile ────────────────────────────────────────────────
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { branch, year, notificationsEnabled, name } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { branch, year, notificationsEnabled, name },
      { new: true, runValidators: true }
    ).select('-password');
    res.json({ user });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// ─── PUT /api/auth/change-password ───────────────────────────────────────
router.put('/change-password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Both fields are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    const user = await User.findById(req.user._id);
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;