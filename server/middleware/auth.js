import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Not authorized — no access token' });
    }

    const token = authHeader.split(' ')[1];

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Access token expired', code: 'TOKEN_EXPIRED' });
      }
      return res.status(401).json({ message: 'Access token invalid', code: 'TOKEN_INVALID' });
    }

    if (decoded.type !== 'access') {
      return res.status(401).json({ message: 'Wrong token type' });
    }

    const user = await User.findById(decoded.id).select('-password -refreshTokens');
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'User not found or inactive' });
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

export const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      message: `Role '${req.user.role}' is not authorized to access this route`,
    });
  }
  next();
};
