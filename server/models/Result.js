const mongoose = require('mongoose');

// ── Standard subject (Nursery 1 – JSS 3) ──────────────────────────────────────
const standardSubjectSchema = new mongoose.Schema({
  subject:         { type: String, required: true },
  cat:             { type: Number, default: null },   // CAT 30% — null means N/A
  exam:            { type: Number, default: null },   // Exam 70% — null means N/A
  total:           { type: Number, default: 0 },
  grade:           { type: String, default: '' },
  remark:          { type: String, default: '' },
  subjectPosition: { type: String, default: '' },    // e.g. "1st", "2nd"
});

// ── Reception subject (Lower/Upper Reception) ─────────────────────────────────
const receptionSubjectSchema = new mongoose.Schema({
  subject:     { type: String, required: true },   // e.g. "Literacy"
  subSubject:  { type: String, default: '' },       // e.g. "Reading"
  remark:      { type: String, default: '' },
});

// ── Affective/Psychomotor domain trait ────────────────────────────────────────
const traitSchema = new mongoose.Schema({
  trait:  { type: String, required: true },
  rating: { type: Number, default: 0 },  // 1–5
});

// ── Main Result ───────────────────────────────────────────────────────────────
const resultSchema = new mongoose.Schema({
  student:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  studentId:      { type: String, required: true },
  studentName:    { type: String, required: true },
  sex:            { type: String, default: '' },
  className:      { type: String, required: true },
  section:        { type: String },
  term:           { type: String, enum: ['First Term', 'Second Term', 'Third Term'], required: true },
  session:        { type: String, required: true },
  reportType:     { type: String, enum: ['standard', 'reception'], default: 'standard' },

  // Standard report fields
  subjects:           [standardSubjectSchema],
  affectiveDomain:    [traitSchema],
  psychomotorDomain:  [traitSchema],
  totalScore:         { type: Number, default: 0 },
  obtainedMarks:      { type: Number, default: 0 },
  totalMarks:         { type: Number, default: 0 },
  percentage:         { type: Number, default: 0 },
  classAverage:       { type: String, default: '' },
  studentAverage:     { type: String, default: '' },
  overallResult:      { type: String, default: 'PASS' },
  position:           { type: Number },
  classSize:          { type: Number },

  // Reception report fields
  receptionSubjects:  [receptionSubjectSchema],

  // Common
  numberInClass:  { type: Number },
  teacherComment: { type: String },
  headComment:    { type: String },
  nextTermBegins: { type: String },
  nextTermFee:    { type: String },
  uploadedBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isPublished:    { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Result', resultSchema);