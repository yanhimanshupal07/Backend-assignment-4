const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const appEvents = require('../events/appEvents');
const { authenticate, authorizeRoles } = require('../middleware/auth');

const router = express.Router();
const SALT_ROUNDS = 10;

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'username, email and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const exists = await User.findOne({ $or: [{ email: email.toLowerCase() }, { username }] });
    if (exists) return res.status(409).json({ message: 'User already exists' });

    const hashed = await bcrypt.hash(password, SALT_ROUNDS);
    // Role is only honoured for "admin" if explicitly requested (lab demo of RBAC).
    const user = await User.create({
      username,
      email,
      password: hashed,
      role: role === 'admin' ? 'admin' : 'user',
    });

    appEvents.emit('user:registered', user);
    res.status(201).json({
      message: 'User registered',
      id: user._id,
      username: user.username,
      email: user.email,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    const valid = user && (await bcrypt.compare(password, user.password));
    if (!valid) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    });

    // Also set an httpOnly cookie (matches the Cookie header in the sample output).
    res.cookie
      ? res.cookie('token', token, { httpOnly: true, sameSite: 'strict' })
      : res.setHeader('Set-Cookie', `token=${token}; HttpOnly; SameSite=Strict; Path=/`);

    appEvents.emit('user:loggedIn', user);
    res.status(200).json({ message: 'Login successful', token });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/auth/profile  (protected)
router.get('/profile', authenticate, async (req, res) => {
  const user = await User.findById(req.user.id).select('-password');
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
});

// GET /api/auth/users  (admin only - RBAC demo)
router.get('/users', authenticate, authorizeRoles('admin'), async (req, res) => {
  const users = await User.find().select('-password');
  res.json(users);
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.setHeader('Set-Cookie', 'token=; HttpOnly; Max-Age=0; Path=/');
  res.json({ message: 'Logged out' });
});

module.exports = router;
