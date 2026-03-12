const express = require('express');
const User = require('../models/User');
const Result = require('../models/Result');
const { protect, adminOnly } = require('../middleware/authMiddleware');

const router = express.Router();

// ─── SETUP: Create the very first admin (only works if NO admin exists) ───────
// POST /api/admin/setup
router.post('/setup', async (req, res) => {
  try {
    const existing = await User.findOne({ role: 'admin' });
    if (existing) {
      return res.status(403).json({ message: 'Admin already exists. Use login.' });
    }

    const { fullName, pin } = req.body;
    if (!fullName || !pin) {
      return res.status(400).json({ message: 'Full name and PIN are required' });
    }
    if (pin.length < 4) {
      return res.status(400).json({ message: 'PIN must be at least 4 characters' });
    }

    const staffId = await User.generateAdminId();
    const admin = await User.create({
      role: 'admin',
      staffId,
      fullName,
      pin,
      mustChangePin: false,
    });

    res.status(201).json({
      message: '✓ Admin account created successfully',
      admin: { staffId: admin.staffId, fullName: admin.fullName }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── DASHBOARD STATS ──────────────────────────────────────────────────────────
// GET /api/admin/stats
router.get('/stats', protect, adminOnly, async (req, res) => {
  try {
    const [totalStudents, totalTeachers, totalResults, classes] = await Promise.all([
      User.countDocuments({ role: 'student', isActive: true }),
      User.countDocuments({ role: 'teacher', isActive: true }),
      Result.countDocuments({ isPublished: true }),
      User.distinct('className', { role: 'student', isActive: true }),
    ]);

    res.json({ totalStudents, totalTeachers, totalResults, totalClasses: classes.length });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── TEACHERS ─────────────────────────────────────────────────────────────────
// GET /api/admin/teachers
router.get('/teachers', protect, adminOnly, async (req, res) => {
  try {
    const teachers = await User.find({ role: 'teacher' })
      .select('-pin')
      .sort({ createdAt: -1 });
    res.json({ teachers });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/admin/teachers — Create a teacher
router.post('/teachers', protect, adminOnly, async (req, res) => {
  try {
    const { fullName, subject, phone, pin, classes } = req.body;
    if (!fullName) return res.status(400).json({ message: 'Full name is required' });

    const defaultPin = pin || '1234';
    const staffId = await User.generateStaffId();

    const teacher = await User.create({
      role: 'teacher',
      staffId,
      fullName,
      subject: subject || '',
      phone: phone || '',
      classes: classes || [],
      pin: defaultPin,
      mustChangePin: true,
      createdBy: req.user._id,
    });

    res.status(201).json({
      message: 'Teacher created successfully',
      teacher: {
        id: teacher._id,
        staffId: teacher.staffId,
        fullName: teacher.fullName,
        subject: teacher.subject,
        phone: teacher.phone,
        classes: teacher.classes,
        defaultPin,
      }
    });
  } catch (err) {
    console.error('CREATE TEACHER ERROR:', err.message);
    console.error('Full error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT /api/admin/teachers/:id — Edit teacher
router.put('/teachers/:id', protect, adminOnly, async (req, res) => {
  try {
    const { fullName, subject, phone, isActive, classes } = req.body;
    const teacher = await User.findByIdAndUpdate(
      req.params.id,
      { fullName, subject, phone, isActive, classes },
      { new: true }
    ).select('-pin');

    if (!teacher) return res.status(404).json({ message: 'Teacher not found' });
    res.json({ message: 'Teacher updated', teacher });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/admin/teachers/:id/reset-pin — Reset teacher PIN
router.post('/teachers/:id/reset-pin', protect, adminOnly, async (req, res) => {
  try {
    const teacher = await User.findById(req.params.id);
    if (!teacher || teacher.role !== 'teacher') {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    const newPin = req.body.newPin || '1234';
    teacher.pin = newPin;
    teacher.mustChangePin = true;
    await teacher.save();

    res.json({ message: `PIN reset to ${newPin}`, newPin });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// DELETE /api/admin/teachers/:id — Deactivate teacher (soft delete)
router.delete('/teachers/:id', protect, adminOnly, async (req, res) => {
  try {
    const teacher = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!teacher) return res.status(404).json({ message: 'Teacher not found' });
    res.json({ message: 'Teacher deactivated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// DELETE /api/admin/teachers/:id/permanent — Permanently delete teacher
router.delete('/teachers/:id/permanent', protect, adminOnly, async (req, res) => {
  try {
    const teacher = await User.findById(req.params.id);
    if (!teacher || teacher.role !== 'teacher') {
      return res.status(404).json({ message: 'Teacher not found' });
    }
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: `${teacher.fullName} has been permanently deleted` });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// DELETE /api/admin/students/:id — Permanently delete student (and optionally their results)
router.delete('/students/:id', protect, adminOnly, async (req, res) => {
  try {
    const student = await User.findById(req.params.id);
    if (!student || student.role !== 'student') {
      return res.status(404).json({ message: 'Student not found' });
    }
    const deleteResults = req.query.deleteResults === 'true';
    if (deleteResults) {
      const deleted = await Result.deleteMany({ studentId: student.studentId });
      await User.findByIdAndDelete(req.params.id);
      return res.json({ message: `${student.fullName} and ${deleted.deletedCount} result(s) permanently deleted` });
    }
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: `${student.fullName} has been permanently deleted` });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── STUDENTS OVERVIEW ────────────────────────────────────────────────────────
// GET /api/admin/students
router.get('/students', protect, adminOnly, async (req, res) => {
  try {
    const { className, search } = req.query;
    const filter = { role: 'student' };
    if (className) filter.className = className;
    if (search) filter.fullName = { $regex: search, $options: 'i' };

    const students = await User.find(filter)
      .select('-pin')
      .sort({ className: 1, fullName: 1 });

    res.json({ students, total: students.length });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── RESULTS OVERVIEW ─────────────────────────────────────────────────────────
// GET /api/admin/results
router.get('/results', protect, adminOnly, async (req, res) => {
  try {
    const { className, term, session, search } = req.query;
    const filter = {};
    if (className) filter.className = className;
    if (term) filter.term = term;
    if (session) filter.session = session;
    if (search) filter.studentName = { $regex: search, $options: 'i' };

    const results = await Result.find(filter)
      .sort({ className: 1, studentName: 1 });

    res.json({ results, total: results.length });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;