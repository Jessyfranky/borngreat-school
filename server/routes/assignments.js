const express = require('express');
const Assignment = require('../models/Assignment');
const { protect, teacherOnly } = require('../middleware/authMiddleware');

const router = express.Router();

// POST /api/assignments — Teacher creates an assignment
router.post('/', protect, teacherOnly, async (req, res) => {
  try {
    const { title, subject, description, dueDate, className } = req.body;
    if (!title || !subject || !className) {
      return res.status(400).json({ message: 'Title, subject and class are required' });
    }
    const assignment = await Assignment.create({
      title, subject, description, dueDate, className,
      uploadedBy:  req.user._id,
      teacherName: req.user.fullName,
    });
    res.status(201).json({ message: 'Assignment created', assignment });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/assignments — Teacher sees all assignments (filterable by class)
router.get('/', protect, teacherOnly, async (req, res) => {
  try {
    const { className } = req.query;
    const filter = {};
    if (className) filter.className = className;
    const assignments = await Assignment.find(filter).sort({ createdAt: -1 });
    res.json({ assignments });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/assignments/my — Student sees assignments for their class
router.get('/my', protect, async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Students only' });
    }
    const assignments = await Assignment.find({ className: req.user.className })
      .sort({ createdAt: -1 });
    res.json({ assignments });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// DELETE /api/assignments/:id — Teacher deletes their assignment
router.delete('/:id', protect, teacherOnly, async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });
    await Assignment.findByIdAndDelete(req.params.id);
    res.json({ message: 'Assignment deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
