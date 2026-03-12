const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

const generateToken = (id) => {
  console.log('GENERATE TOKEN: JWT_SECRET exists:', !!process.env.JWT_SECRET);
  console.log('GENERATE TOKEN: JWT_SECRET value:', process.env.JWT_SECRET);
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { userId, pin } = req.body;

    if (!userId || !pin) {
      return res.status(400).json({ message: 'Please provide your ID and PIN' });
    }

    // Find user by studentId or staffId
    const user = await User.findOne({
      $or: [{ studentId: userId.toUpperCase() }, { staffId: userId.toUpperCase() }]
    });

    if (!user) return res.status(401).json({ message: 'Invalid ID or PIN' });
    if (!user.isActive) return res.status(401).json({ message: 'Account has been deactivated' });

    const isMatch = await user.comparePin(pin);
    if (!isMatch) return res.status(401).json({ message: 'Invalid ID or PIN' });

    res.json({
      token: generateToken(user._id),
      user: {
        id: user._id,
        role: user.role,
        fullName: user.fullName,
        studentId: user.studentId,
        staffId: user.staffId,
        className: user.className,
        section: user.section,
        mustChangePin: user.mustChangePin
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/auth/change-pin
router.post('/change-pin', protect, async (req, res) => {
  try {
    const { currentPin, newPin } = req.body;

    if (!currentPin || !newPin) {
      return res.status(400).json({ message: 'Please provide current and new PIN' });
    }

    if (newPin.length < 4) {
      return res.status(400).json({ message: 'PIN must be at least 4 characters' });
    }

    const user = await User.findById(req.user._id);
    const isMatch = await user.comparePin(currentPin);
    if (!isMatch) return res.status(400).json({ message: 'Current PIN is incorrect' });

    user.pin = newPin;
    user.mustChangePin = false;
    await user.save();

    res.json({ message: 'PIN changed successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/auth/me
router.get('/me', protect, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;