const express = require('express');
const User = require('../models/User');
const { protect, adminOnly } = require('../middleware/authMiddleware');

const router = express.Router();

// POST /api/teachers — Create teacher (admin only, or first setup)
router.post('/', async (req, res) => {
  try {
    const { fullName, subject, phone, pin, adminSecret } = req.body;

    // Simple admin secret for setup — change in production
    if (adminSecret !== (process.env.ADMIN_SECRET || 'borngreat-admin-2024')) {
      return res.status(403).json({ message: 'Not authorized to create teachers' });
    }

    if (!fullName) return res.status(400).json({ message: 'Full name is required' });

    const staffId = await User.generateStaffId();

    const teacher = await User.create({
      role: 'teacher',
      staffId,
      fullName,
      subject,
      phone,
      pin: pin || '1234',
      mustChangePin: true
    });

    res.status(201).json({
      message: 'Teacher created',
      teacher: {
        staffId: teacher.staffId,
        fullName: teacher.fullName,
        subject: teacher.subject,
        defaultPin: pin || '1234'
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/teachers/classes — Get distinct classes
router.get('/classes', protect, async (req, res) => {
  try {
    const classes = await User.distinct('className', { role: 'student', isActive: true });
    res.json({ classes: classes.sort() });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;