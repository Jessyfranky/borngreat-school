const express = require('express');
const Result = require('../models/Result');
const User = require('../models/User');
const { protect, teacherOnly } = require('../middleware/authMiddleware');

const router = express.Router();

const RECEPTION_CLASSES = ['Lower Reception', 'Upper Reception'];

// POST /api/results — Upload results for a student (teacher only)
router.post('/', protect, teacherOnly, async (req, res) => {
  try {
    const {
      studentId, term, session,
      sex,
      // standard
      subjects, affectiveDomain, psychomotorDomain,
      numberInClass, classAverage, studentAverage, overallResult,
      totalScore,
      // reception
      receptionSubjects,
      // common
      teacherComment, headComment, nextTermBegins, nextTermFee,
    } = req.body;

    if (!studentId || !term || !session) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const student = await User.findOne({ studentId: studentId.toUpperCase(), role: 'student' });
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const existing = await Result.findOne({ studentId: studentId.toUpperCase(), term, session });
    if (existing) {
      return res.status(400).json({ message: 'Result already exists for this term and session.', resultId: existing._id });
    }

    const isReception = RECEPTION_CLASSES.includes(student.className);
    const reportType  = isReception ? 'reception' : 'standard';

    let resultData = {
      student:       student._id,
      studentId:     student.studentId,
      studentName:   student.fullName,
      sex:           sex || '',
      className:     student.className,
      section:       student.section,
      term, session, reportType,
      numberInClass: Number(numberInClass) || undefined,
      teacherComment, headComment, nextTermBegins, nextTermFee,
      uploadedBy:    req.user._id,
      isPublished:   true,
    };

    if (isReception) {
      resultData.receptionSubjects = (receptionSubjects || []).map(s => ({
        subject:    s.subject || '',
        subSubject: s.subSubject || '',
        remark:     s.remark || '',
      }));
    } else {
      // Process standard subjects — only save rows teacher actually filled in
      const processedSubjects = (subjects || [])
        .filter(s => s.subject.trim() && (
          s.cat !== '' || s.exam !== '' || s.grade !== '' || s.remark !== '' || s.subjectPosition !== ''
        ))
        .map(s => ({
          subject:         s.subject.trim(),
          cat:             s.cat !== '' ? Number(s.cat) : null,
          exam:            s.exam !== '' ? Number(s.exam) : null,
          total:           (Number(s.cat) || 0) + (Number(s.exam) || 0),
          grade:           s.grade  || '',
          remark:          s.remark || '',
          subjectPosition: s.subjectPosition || '',
        }));

      const obtainedMarks = processedSubjects.reduce((sum, s) => sum + s.total, 0);
      const totalMarks    = processedSubjects.length * 100;
      const percentage    = totalMarks > 0 ? Math.round((obtainedMarks / totalMarks) * 100) : 0;

      resultData = {
        ...resultData,
        subjects:          processedSubjects,
        affectiveDomain:   (affectiveDomain   || []).map(t => ({ trait: t.trait, rating: Number(t.rating) || 0 })),
        psychomotorDomain: (psychomotorDomain || []).map(t => ({ trait: t.trait, rating: Number(t.rating) || 0 })),
        totalScore:        Number(totalScore) || obtainedMarks,
        obtainedMarks, totalMarks, percentage,
        classAverage:      classAverage   || '',
        studentAverage:    studentAverage || '',
        overallResult:     overallResult  || 'PASS',
      };
    }

    const result = await Result.create(resultData);
    if (!isReception) await calculatePositions(result.className, result.term, result.session);

    res.status(201).json({ message: 'Result uploaded successfully', result });
  } catch (err) {
    console.error('UPLOAD RESULT ERROR:', err.message);
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/results/bulk — Upload results for entire class
router.post('/bulk', protect, teacherOnly, async (req, res) => {
  try {
    const { results, term, session } = req.body;

    if (!results || !Array.isArray(results)) {
      return res.status(400).json({ message: 'Provide array of results' });
    }

    const uploaded = [];
    const errors = [];

    for (const r of results) {
      try {
        const student = await User.findOne({ studentId: r.studentId.toUpperCase(), role: 'student' });
        if (!student) { errors.push({ studentId: r.studentId, error: 'Student not found' }); continue; }

        const existing = await Result.findOne({ studentId: r.studentId.toUpperCase(), term, session });
        if (existing) { errors.push({ studentId: r.studentId, error: 'Result already exists' }); continue; }

        const result = await Result.create({
          student: student._id,
          studentId: student.studentId,
          studentName: student.fullName,
          className: student.className,
          section: student.section,
          term,
          session,
          subjects: r.subjects,
          teacherComment: r.teacherComment,
          headComment: r.headComment,
          nextTermBegins: r.nextTermBegins,
          uploadedBy: req.user._id,
          isPublished: true
        });
        uploaded.push(result.studentId);
      } catch (e) {
        errors.push({ studentId: r.studentId, error: e.message });
      }
    }

    if (uploaded.length > 0) {
      const sampleResult = await Result.findOne({ studentId: uploaded[0], term, session });
      if (sampleResult) await calculatePositions(sampleResult.className, term, session);
    }

    res.json({ message: `${uploaded.length} results uploaded`, uploaded, errors });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/results/my — Student views their own results
router.get('/my', protect, async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'This endpoint is for students only' });
    }

    const { term, session } = req.query;
    const filter = { studentId: req.user.studentId, isPublished: true };
    if (term) filter.term = term;
    if (session) filter.session = session;

    const results = await Result.find(filter).sort({ createdAt: -1 });
    res.json({ results });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/results — Teacher gets results (class view)
router.get('/', protect, teacherOnly, async (req, res) => {
  try {
    const { className, section, term, session, studentId } = req.query;
    const filter = {};
    if (className) filter.className = className;
    if (section) filter.section = section;
    if (term) filter.term = term;
    if (session) filter.session = session;
    if (studentId) filter.studentId = studentId.toUpperCase();

    const results = await Result.find(filter).sort({ studentName: 1 });
    res.json({ results, total: results.length });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT /api/results/:id — Update a result
router.put('/:id', protect, teacherOnly, async (req, res) => {
  try {
    const result = await Result.findById(req.params.id);
    if (!result) return res.status(404).json({ message: 'Result not found' });

    const { subjects, teacherComment, isPublished } = req.body;
    if (subjects) result.subjects = subjects;
    if (teacherComment !== undefined) result.teacherComment = teacherComment;
    if (isPublished !== undefined) result.isPublished = isPublished;

    await result.save();
    await calculatePositions(result.className, result.term, result.session);

    res.json({ message: 'Result updated', result });
  } catch (err) {
    console.error('UPDATE RESULT ERROR:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// DELETE /api/results/:id — Teacher deletes a result
router.delete('/:id', protect, teacherOnly, async (req, res) => {
  try {
    console.log('DELETE REQUEST for result id:', req.params.id);
    console.log('Requested by:', req.user?.fullName, '| role:', req.user?.role);

    const result = await Result.findById(req.params.id);
    if (!result) {
      console.log('Result not found for id:', req.params.id);
      return res.status(404).json({ message: 'Result not found' });
    }

    console.log('Found result for:', result.studentName, '|', result.term);
    const { className, term, session } = result;
    await Result.findByIdAndDelete(req.params.id);
    console.log('Result deleted successfully');

    await calculatePositions(className, term, session);
    res.json({ message: 'Result deleted successfully' });
  } catch (err) {
    console.error('DELETE RESULT ERROR:', err.message);
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/results/:id — Single result
router.get('/:id', protect, async (req, res) => {
  try {
    const result = await Result.findById(req.params.id);
    if (!result) return res.status(404).json({ message: 'Result not found' });

    if (req.user.role === 'student' && result.studentId !== req.user.studentId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ result });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Helper: Calculate class positions
async function calculatePositions(className, term, session) {
  const results = await Result.find({ className, term, session, isPublished: true })
    .sort({ percentage: -1 });

  for (let i = 0; i < results.length; i++) {
    results[i].position = i + 1;
    results[i].classSize = results.length;
    await Result.findByIdAndUpdate(results[i]._id, {
      position: i + 1,
      classSize: results.length
    });
  }
}

module.exports = router;