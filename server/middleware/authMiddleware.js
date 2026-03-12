const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    console.error('AUTH ERROR: No token provided');
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  try {
    console.log('AUTH: Verifying token...');
    console.log('AUTH: JWT_SECRET exists:', !!process.env.JWT_SECRET);
    console.log('AUTH: JWT_SECRET value:', process.env.JWT_SECRET);
    console.log('AUTH: Token (first 30 chars):', token.substring(0, 30));

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('AUTH: Token decoded OK, user id:', decoded.id);

    req.user = await User.findById(decoded.id).select('-pin');
    console.log('AUTH: User found:', req.user ? req.user.fullName : 'NOT FOUND');

    if (!req.user) return res.status(401).json({ message: 'User not found' });
    if (!req.user.isActive) return res.status(401).json({ message: 'Account deactivated' });
    next();
  } catch (err) {
    console.error('AUTH ERROR:', err.message);
    console.error('AUTH ERROR type:', err.name);
    res.status(401).json({ message: 'Not authorized, token invalid' });
  }
};

const teacherOnly = (req, res, next) => {
  if (req.user && (req.user.role === 'teacher' || req.user.role === 'admin')) return next();
  res.status(403).json({ message: 'Access denied: Teachers only' });
};

const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') return next();
  res.status(403).json({ message: 'Access denied: Admins only' });
};

module.exports = { protect, teacherOnly, adminOnly };