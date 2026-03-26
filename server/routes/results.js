const express = require('express');
const Result = require('../models/Result');
const User = require('../models/User');
const { protect, teacherOnly } = require('../middleware/auth');

const router = express.Router();

const RECEPTION_CLASSES = ['Lower Reception', 'Upper Reception'];

// ── POST /api/results — Upload results for a student (teacher only) ─────────
router.post('/', protect, teacherOnly, async (req, res) => {
  try {
    const {
      studentId, term, session, sex,
      subjects, affectiveDomain, psychomotorDomain,
      numberInClass,
      overallResult,
      receptionSubjects,
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
      // Only save subjects teacher actually filled in
      const processedSubjects = (subjects || [])
        .filter(s => s.subject.trim() && (
          s.cat !== '' || s.exam !== '' || s.grade !== '' || s.remark !== ''
        ))
        .map(s => {
          const cat   = s.cat  !== '' ? Number(s.cat)  : null;
          const exam  = s.exam !== '' ? Number(s.exam) : null;
          const total = (cat || 0) + (exam || 0);
          const grade = (cat !== null || exam !== null) ? getGrade(total) : (s.grade || '');
          return {
            subject:         s.subject.trim(),
            cat, exam, total,
            grade,
            remark:          s.remark || getRemark(grade),
            subjectPosition: '',
          };
        });

      // Auto-calculate total score and student average
      const scoredSubjects = processedSubjects.filter(s => s.cat !== null || s.exam !== null);
      const totalScore     = scoredSubjects.reduce((sum, s) => sum + s.total, 0);
      const studentAverage = scoredSubjects.length > 0
        ? Math.round((totalScore / scoredSubjects.length) * 100) / 100
        : 0;
      const obtainedMarks = totalScore;
      const totalMarks    = scoredSubjects.length * 100;
      const percentage    = totalMarks > 0 ? Math.round((obtainedMarks / totalMarks) * 100) : 0;

      resultData = {
        ...resultData,
        subjects:          processedSubjects,
        affectiveDomain:   (affectiveDomain   || []).map(t => ({ trait: t.trait, rating: Number(t.rating) || 0 })),
        psychomotorDomain: (psychomotorDomain || []).map(t => ({ trait: t.trait, rating: Number(t.rating) || 0 })),
        totalScore,
        studentAverage:    String(studentAverage),
        obtainedMarks, totalMarks, percentage,
        overallResult:     overallResult || 'PASS',
      };
    }

    const result = await Result.create(resultData);

    // Run full class recalculation after save
    if (!isReception) {
      await recalculateClass(result.className, result.term, result.session);
    }

    const updated = await Result.findById(result._id);
    res.status(201).json({ message: 'Result uploaded successfully', result: updated });
  } catch (err) {
    console.error('UPLOAD RESULT ERROR:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ── GET /api/results/my — Student views their own results ──────────────────
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

// ── GET /api/results — Teacher gets results ─────────────────────────────────
router.get('/', protect, teacherOnly, async (req, res) => {
  try {
    const { className, section, term, session, studentId } = req.query;
    const filter = {};
    if (className) filter.className = className;
    if (section)   filter.section   = section;
    if (term)      filter.term      = term;
    if (session)   filter.session   = session;
    if (studentId) filter.studentId = studentId.toUpperCase();

    const results = await Result.find(filter).sort({ studentName: 1 });
    res.json({ results, total: results.length });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ── PUT /api/results/:id — Update a result ──────────────────────────────────
router.put('/:id', protect, teacherOnly, async (req, res) => {
  try {
    const result = await Result.findById(req.params.id);
    if (!result) return res.status(404).json({ message: 'Result not found' });

    const { subjects, teacherComment, isPublished } = req.body;
    if (subjects)                result.subjects      = subjects;
    if (teacherComment !== undefined) result.teacherComment = teacherComment;
    if (isPublished !== undefined)    result.isPublished    = isPublished;

    await result.save();
    await recalculateClass(result.className, result.term, result.session);

    res.json({ message: 'Result updated', result });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ── DELETE /api/results/:id — Teacher deletes a result ─────────────────────
router.delete('/:id', protect, teacherOnly, async (req, res) => {
  try {
    const result = await Result.findById(req.params.id);
    if (!result) return res.status(404).json({ message: 'Result not found' });

    const { className, term, session } = result;
    await Result.findByIdAndDelete(req.params.id);
    await recalculateClass(className, term, session);

    res.json({ message: 'Result deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ── GET /api/results/:id — Single result ───────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────────
// FULL CLASS RECALCULATION
// Runs after every upload/delete. Calculates:
//   1. Subject positions (rank students per subject in this class/term/session)
//   2. Class position (overall rank by percentage)
//   3. Class average (mean of all student averages)
// ─────────────────────────────────────────────────────────────────────────────
async function recalculateClass(className, term, session) {
  const results = await Result.find({ className, term, session, isPublished: true, reportType: 'standard' });
  if (results.length === 0) return;

  // ── 1. Subject positions ──────────────────────────────────────────────────
  // Collect all unique subject names across all results
  const subjectNames = [...new Set(results.flatMap(r => r.subjects.map(s => s.subject)))];

  for (const subjectName of subjectNames) {
    // Get all students who have this subject with a real score
    const entries = results
      .map(r => {
        const subj = r.subjects.find(s => s.subject === subjectName);
        if (!subj || (subj.cat === null && subj.exam === null)) return null;
        return { resultId: r._id, subjIndex: r.subjects.indexOf(subj), total: subj.total };
      })
      .filter(Boolean)
      .sort((a, b) => b.total - a.total); // highest first

    // Assign positions with ties (same score = same position)
    let pos = 1;
    for (let i = 0; i < entries.length; i++) {
      if (i > 0 && entries[i].total < entries[i - 1].total) pos = i + 1;
      entries[i].position = pos;
    }

    // Write position back to each result's subject
    for (const entry of entries) {
      const suffix = ordinal(entry.position);
      await Result.updateOne(
        { _id: entry.resultId },
        { $set: { [`subjects.${entry.subjIndex}.subjectPosition`]: suffix } }
      );
    }
  }

  // ── 2. Class position + class average ────────────────────────────────────
  // Re-fetch after subject position updates
  const refreshed = await Result.find({ className, term, session, isPublished: true, reportType: 'standard' })
    .sort({ percentage: -1 });

  // Class average = mean of all studentAverages
  const validAverages = refreshed
    .map(r => parseFloat(r.studentAverage))
    .filter(v => !isNaN(v) && v > 0);
  const classAverage = validAverages.length > 0
    ? (validAverages.reduce((a, b) => a + b, 0) / validAverages.length).toFixed(2)
    : '0';

  // Assign overall class position with ties
  let pos = 1;
  for (let i = 0; i < refreshed.length; i++) {
    if (i > 0 && refreshed[i].percentage < refreshed[i - 1].percentage) pos = i + 1;
    await Result.findByIdAndUpdate(refreshed[i]._id, {
      position:     pos,
      classSize:    refreshed.length,
      classAverage: classAverage,
    });
  }
}

function getGrade(total) {
  if (total >= 70) return 'A';
  if (total >= 60) return 'B';
  if (total >= 50) return 'C';
  if (total >= 45) return 'D';
  if (total >= 40) return 'E';
  return 'F';
}

function getRemark(grade) {
  const map = { A: 'Excellent', B: 'Very Good', C: 'Good', D: 'Fair', E: 'Poor', F: 'Fail' };
  return map[grade] || '';
}

function ordinal(n) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

module.exports = router;
