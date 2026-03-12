const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/User');
const { protect, teacherOnly } = require('../middleware/authMiddleware');

const router = express.Router();

// DEBUG — remove after fixing
router.get('/debug/:id', protect, async (req, res) => {
  try {
    const raw = req.params.id.trim();
    console.log('DEBUG: searching for:', raw);

    // Show ALL students in DB
    const allStudents = await User.find({ role: 'student' }).select('studentId fullName className');
    console.log('ALL STUDENTS IN DB:', JSON.stringify(allStudents, null, 2));

    // Try exact match
    const exact = await User.findOne({ studentId: raw.toUpperCase() });
    console.log('EXACT MATCH:', exact ? exact.fullName : 'NONE');

    // Try case-insensitive
    const caseInsensitive = await User.findOne({ studentId: { $regex: new RegExp(`^${raw}$`, 'i') } });
    console.log('CASE INSENSITIVE MATCH:', caseInsensitive ? caseInsensitive.fullName : 'NONE');

    res.json({
      searchedFor: raw,
      allStudents: allStudents.map(s => ({ studentId: s.studentId, fullName: s.fullName, className: s.className })),
      exactMatch: exact ? { studentId: exact.studentId, fullName: exact.fullName } : null,
      caseInsensitiveMatch: caseInsensitive ? { studentId: caseInsensitive.studentId, fullName: caseInsensitive.fullName } : null,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/students — Create student (teacher only)
router.post('/', protect, teacherOnly, async (req, res) => {
  try {
    const { fullName, className, section, admissionYear, dateOfBirth, defaultPin } = req.body;

    if (!fullName || !className) {
      return res.status(400).json({ message: 'Full name and class are required' });
    }

    const year = admissionYear || new Date().getFullYear();
    const studentId = await User.generateStudentId(year);

    const student = await User.create({
      role: 'student',
      studentId,
      fullName,
      className,
      section: section || 'A',
      admissionYear: year,
      dateOfBirth,
      pin: defaultPin || '0000',
      mustChangePin: true,
      createdBy: req.user._id
    });

    res.status(201).json({
      message: 'Student created successfully',
      student: {
        id: student._id,
        studentId: student.studentId,
        fullName: student.fullName,
        className: student.className,
        section: student.section,
        defaultPin: defaultPin || '0000',  // Return for printing
        admissionYear: student.admissionYear
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/students/bulk — Create multiple students at once
router.post('/bulk', protect, teacherOnly, async (req, res) => {
  try {
    const { students, className, section, admissionYear } = req.body;

    if (!students || !Array.isArray(students) || students.length === 0) {
      return res.status(400).json({ message: 'Provide an array of student names' });
    }

    if (!className) {
      return res.status(400).json({ message: 'Class name is required' });
    }

    const year = admissionYear || new Date().getFullYear();
    const created = [];
    const defaultPin = '0000';

    for (const name of students) {
      const trimmedName = name.trim();
      if (!trimmedName) continue; // skip empty lines

      const studentId = await User.generateStudentId(year);
      const student = await User.create({
        role: 'student',
        studentId,
        fullName: trimmedName,
        className,
        section: section || 'A',
        admissionYear: year,
        pin: defaultPin,
        mustChangePin: true,
        createdBy: req.user._id
      });
      created.push({
        studentId: student.studentId,
        fullName: student.fullName,
        className: student.className,
        section: student.section,
        defaultPin
      });
    }

    res.status(201).json({ message: `${created.length} students created`, students: created });
  } catch (err) {
    console.error('BULK CREATE ERROR:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/students — Get all students (teacher) or own info (student)
router.get('/', protect, async (req, res) => {
  try {
    if (req.user.role === 'student') {
      return res.json({ student: req.user });
    }

    const { className, section, search } = req.query;
    const filter = { role: 'student', isActive: true };
    if (className) filter.className = className;
    if (section) filter.section = section;
    if (search) filter.fullName = { $regex: search, $options: 'i' };

    const students = await User.find(filter)
      .select('-pin')
      .sort({ className: 1, fullName: 1 });

    res.json({ students, total: students.length });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/students/:id — Get single student
router.get('/:id', protect, teacherOnly, async (req, res) => {
  try {
    const param = req.params.id.trim().toUpperCase();
    const isObjectId = mongoose.Types.ObjectId.isValid(param) && param.length === 24;

    const query = isObjectId
      ? { $or: [{ _id: param }, { studentId: param }], role: 'student' }
      : { studentId: param, role: 'student' };

    const student = await User.findOne(query).select('-pin');

    if (!student) return res.status(404).json({ message: 'Student not found. Check the ID.' });
    res.json({ student });
  } catch (err) {
    console.error('GET STUDENT ERROR:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT /api/students/:id — Update student info
router.put('/:id', protect, teacherOnly, async (req, res) => {
  try {
    const { fullName, className, section, isActive } = req.body;
    const student = await User.findByIdAndUpdate(
      req.params.id,
      { fullName, className, section, isActive },
      { new: true }
    ).select('-pin');

    if (!student) return res.status(404).json({ message: 'Student not found' });
    res.json({ message: 'Student updated', student });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/students/:id/reset-pin — Teacher resets a student's PIN
router.post('/:id/reset-pin', protect, teacherOnly, async (req, res) => {
  try {
    const student = await User.findById(req.params.id);
    if (!student || student.role !== 'student') return res.status(404).json({ message: 'Student not found' });

    const newPin = req.body.newPin || '0000';
    student.pin = newPin;
    student.mustChangePin = true;
    await student.save();

    res.json({ message: `PIN reset to ${newPin}. Student must change it on next login.` });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;