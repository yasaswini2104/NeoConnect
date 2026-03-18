import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';

const generateAccessToken = (id) =>
  jwt.sign({ id, type: 'access' }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  });

const generateRefreshToken = () => crypto.randomBytes(64).toString('hex');

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,                                       
  secure: process.env.NODE_ENV === 'production',        
  sameSite: 'strict',                                   
  maxAge: 7 * 24 * 60 * 60 * 1000,                     
  path: '/api/auth',                                   
};

const saveRefreshToken = async (user, rawToken) => {
  const hashed = await bcrypt.hash(rawToken, 10);
  user.refreshTokens.push({ token: hashed });
  if (user.refreshTokens.length > 5) {
    user.refreshTokens = user.refreshTokens.slice(-5);
  }
  await user.save();
};

const consumeRefreshToken = async (user, rawToken) => {
  let matched = false;
  const remaining = [];

  for (const entry of user.refreshTokens) {
    if (!matched && (await bcrypt.compare(rawToken, entry.token))) {
      matched = true; // drop this entry — it's been consumed
    } else {
      remaining.push(entry);
    }
  }

  user.refreshTokens = remaining;
  await user.save();
  return matched;
};

// POST /api/auth/register
export const register = async (req, res) => {
  try {
    const { name, email, password, role, department } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role || 'staff',
      department,
    });

    const accessToken  = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken();
    await saveRefreshToken(user, refreshToken);

    res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);
    res.status(201).json({ accessToken, user: user.toJSON() });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// POST /api/auth/login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    if (!user.isActive) {
      return res.status(403).json({ message: 'Account is deactivated' });
    }

    user.lastLogin = new Date();

    const accessToken  = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken();
    await saveRefreshToken(user, refreshToken); // also calls user.save()

    res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);
    res.json({ accessToken, user: user.toJSON() });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// POST /api/auth/refresh-token
export const refreshToken = async (req, res) => {
  try {
    const raw = req.cookies?.refreshToken;
    if (!raw) {
      return res.status(401).json({ message: 'No refresh token provided' });
    }

    const users = await User.find({ isActive: true, 'refreshTokens.0': { $exists: true } });

    let matched = false;
    let targetUser = null;

    for (const u of users) {
      const found = await consumeRefreshToken(u, raw);
      if (found) {
        matched = true;
        targetUser = u;
        break;
      }
    }

    if (!matched || !targetUser) {
      res.clearCookie('refreshToken', { ...REFRESH_COOKIE_OPTIONS, maxAge: 0 });
      return res.status(401).json({ message: 'Refresh token invalid or already used' });
    }

    const newAccessToken  = generateAccessToken(targetUser._id);
    const newRefreshToken = generateRefreshToken();
    await saveRefreshToken(targetUser, newRefreshToken);

    res.cookie('refreshToken', newRefreshToken, REFRESH_COOKIE_OPTIONS);
    res.json({ accessToken: newAccessToken, user: targetUser.toJSON() });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// POST /api/auth/logout
export const logout = async (req, res) => {
  try {
    const raw = req.cookies?.refreshToken;

    if (raw) {
      const users = await User.find({ isActive: true, 'refreshTokens.0': { $exists: true } });
      for (const u of users) {
        const found = await consumeRefreshToken(u, raw);
        if (found) break;
      }
    }

    res.clearCookie('refreshToken', { ...REFRESH_COOKIE_OPTIONS, maxAge: 0 });
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET /api/auth/me
export const getMe = (req, res) => {
  res.json({ user: req.user });
};

// PUT /api/auth/change-password
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const valid = await user.comparePassword(currentPassword);
    if (!valid) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    user.refreshTokens = [];
    user.password = newPassword;
    await user.save();

    res.clearCookie('refreshToken', { ...REFRESH_COOKIE_OPTIONS, maxAge: 0 });
    res.json({ message: 'Password changed. Please log in again.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
