// userRoutes.js
const express = require('express');
const crypto = require('crypto'); // Node.js built-in module for token generation
const bcrypt = require('bcryptjs'); // For password hashing
const User = require('../models/User'); // User model
const jwt = require('jsonwebtoken'); // JWT for token handling
const zxcvbn = require('zxcvbn'); // Password strength checking
const authenticateToken = require('./authenticateToken');
const nodemailer = require('nodemailer'); // Nodemailer for email sending
require('dotenv').config();  // Load environment variables from .env file

const router = express.Router();

// Configure Nodemailer for sending emails (example using Gmail)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER, // Your Gmail address
    pass: process.env.GMAIL_PASS  // Your Gmail password or App password
  }
});

// Test Registration Route
router.post('/test-register', async (req, res) => {
  try {
    const password = req.body.password; // This will be your test password
    const hashedPassword = await bcrypt.hash(password, 12); // Hash the password
    console.log('Hashed Password:', hashedPassword); // This will show in your terminal
    res.json({ hashedPassword }); // Send back the hashed password
  } catch (error) {
    res.status(500).send('Error during registration');
  }
});

// Test Login Route
router.post('/test-login', async (req, res) => {
  try {
    const { password, hashedPassword } = req.body; // Password and hash from your test
    const isMatch = await bcrypt.compare(password, hashedPassword); // Compare them
    console.log('Do they match:', isMatch); // This will show in your terminal
    res.send(`Password match: ${isMatch}`); // Tell us if it matched
  } catch (error) {
    res.status(500).send('Error during login');
  }
});

// User registration with password strength validation
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Password strength validation using zxcvbn
    const passwordCheck = zxcvbn(password);
    if (passwordCheck.score < 3) {
      return res.status(400).json({
        error: 'Password is not strong enough',
        suggestions: passwordCheck.feedback.suggestions
      });
    }

    // Check if username already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: "Username already exists" });
    }

    // Hash the password before saving to the database
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = new User({ username, email, password: hashedPassword });
    await user.save();
    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// User login route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT request to update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const updatedData = req.body;

    const user = await User.findByIdAndUpdate(userId, updatedData, { new: true });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ user, message: 'Profile updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST request to initiate password reset
router.post('/password-reset', async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const resetToken = crypto.randomBytes(20).toString('hex');
    const hashedResetToken = await bcrypt.hash(resetToken, 12);
    user.resetPasswordToken = hashedResetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour from now

    await user.save();

    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: email,
      subject: 'Hyper-Lab Password Reset',
      text: `Please use the following token to reset your password: ${resetToken}`
    };

    transporter.sendMail(mailOptions, function(error, info) {
      if (error) {
        res.status(500).send('Error sending email');
      } else {
        res.json({ message: 'Password reset token sent to email' });
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST request to reset password using the token
router.post('/password-reset/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Password reset token is invalid or has expired' });
    }

    user.password = await bcrypt.hash(password, 12);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: 'Password has been reset successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
