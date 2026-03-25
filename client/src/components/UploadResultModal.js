import { useState } from 'react';
import axios from 'axios';
import '../styles/Modal.css';

const TERMS = ['First Term', 'Second Term', 'Third Term'];
const RECEPTION_CLASSES = ['Lower Reception', 'Upper Reception'];

const currentSession = () => {
  const now = new Date();
  const y = now.getFullYear();
  return now.getMonth() >= 8 ? `${y}/${y+1}` : `${y-1}/${y}`;
};

const DEFAULT_STANDARD_SUBJECTS = [
  'Number Work','Letter Work','Basic Science','Hand Writing',
  'Diction','Cultural Creative Arts','Verbal Reasoning',
  'Quantitative Reasoning','Reading / Spelling','Story','Rhymes','RNV','Bible Story',
];

const DEFAULT_AFFECTIVE = [
  'Games & sport','Sociability','Self-confidence','Responsibility',
  'Carrying out of assignment','Leadership','Obedience','Self-control',
  'Perseverance','Initiative','Attendance','Neatness',
];

const DEFAULT_PSYCHOMOTOR = [
  'Crafts','Handling of tools','Communication skills',
  'Musical skills','Handwriting','Painting & drawing',
];

const DEFAULT_RECEPTION_SUBJECTS = [
  { subject: 'Literacy',    subSubject: 'Reading',     remark: '' },
  { subject: 'Literacy',    subSubject: 'Sorting',     remark: '' },
  { subject: 'Literacy',    subSubject: 'Recognition', remark: '' },
  { subject: 'Literacy',    subSubject: 'Writing',     remark: '' },
  { subject: 'Story',       subSubject: '',            remark: '' },
  { subject: 'Nursery Science', subSubject: '',        remark: '' },
  { subject: 'Numeracy',    subSubject: 'Counting',    remark: '' },
  { subject: 'Numeracy',    subSubject: 'Sorting',     remark: '' },
  { subject: 'Numeracy',    subSubject: 'Recognition', remark: '' },
  { subject: 'Numeracy',    subSubject: 'Writing',     remark: '' },
  { subject: 'Oral Expression/Communication', subSubject: '', remark: '' },
  { subject: 'Practical Life',  subSubject: '', remark: '' },
  { subject: 'Nursery Rhymes',  subSubject: '', remark: '' },
  { subject: 'Social Interaction', subSubject: '', remark: '' },
  { subject: 'Creative Art', subSubject: '', remark: '' },
];

export default function UploadResultModal({ onClose, onUploaded, prefilledStudent }) {
  const [studentId,   setStudentId]   = useState(prefilledStudent?.studentId || '');
  const [studentInfo, setStudentInfo] = useState(prefilledStudent || null);
  const [term,        setTerm]        = useState('First Term');
  const [session,     setSession]     = useState(currentSession());
  const [searching,   setSearching]   = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState('');

  // Standard fields
  const [subjects, setSubjects] = useState(
    DEFAULT_STANDARD_SUBJECTS.map(s => ({ subject: s, cat: '', exam: '', grade: '', remark: '' }))
  );
  const [affective,     setAffective]     = useState(DEFAULT_AFFECTIVE.map(t => ({ trait: t, rating: '' })));
  const [psychomotor,   setPsychomotor]   = useState(DEFAULT_PSYCHOMOTOR.map(t => ({ trait: t, rating: '' })));
  const [numberInClass, setNumberInClass] = useState('');
  const [sex,           setSex]           = useState('');
  const [overallResult, setOverallResult] = useState('PASS');

  // Reception fields
  const [receptionSubjects, setReceptionSubjects] = useState(DEFAULT_RECEPTION_SUBJECTS);

  // Common
  const [teacherComment, setTeacherComment] = useState('');
  const [headComment,    setHeadComment]    = useState('');
  const [nextTermBegins, setNextTermBegins] = useState('');
  const [nextTermFee,    setNextTermFee]    = useState('');

  const isReception = studentInfo ? RECEPTION_CLASSES.includes(studentInfo.className) : false;

  const searchStudent = async () => {
    if (!studentId) return;
    setSearching(true);
    try {
      const { data } = await axios.get(`/api/students/${studentId}`);
      setStudentInfo(data.student);
      setError('');
    } catch {
      setStudentInfo(null);
      setError('Student not found. Check the ID.');
    } finally { setSearching(false); }
  };

  const getGrade = (total) => {
    if (total >= 70) return 'A';
    if (total >= 60) return 'B';
    if (total >= 50) return 'C';
    if (total >= 45) return 'D';
    if (total >= 40) return 'E';
    return 'F';
  };

  const getRemarkFromGrade = (grade) => {
    const map = { A: 'Excellent', B: 'Very Good', C: 'Good', D: 'Fair', E: 'Poor', F: 'Fail' };
    return map[grade] || '';
  };

  const updateSubject = (i, field, val) => {
    const u = [...subjects];
    u[i] = { ...u[i], [field]: val };
    // Auto-calculate grade and remark when CAT or Exam changes
    if (field === 'cat' || field === 'exam') {
      const cat  = field === 'cat'  ? Number(val) || 0 : Number(u[i].cat)  || 0;
      const exam = field === 'exam' ? Number(val) || 0 : Number(u[i].exam) || 0;
      if (val !== '') {
        const total = cat + exam;
        const grade = getGrade(total);
        u[i].grade  = grade;
        u[i].remark = getRemarkFromGrade(grade);
      }
    }
    setSubjects(u);
  };
  const addSubject       = () => setSubjects([...subjects, { subject: '', cat: '', exam: '', grade: '', remark: '' }]);
  const removeSubject    = (i) => setSubjects(subjects.filter((_, idx) => idx !== i));
  const updateReception  = (i, field, val) => { const u = [...receptionSubjects]; u[i] = { ...u[i], [field]: val }; setReceptionSubjects(u); };
  const addReceptionRow    = () => setReceptionSubjects([...receptionSubjects, { subject: '', subSubject: '', remark: '' }]);
  const removeReceptionRow = (i) => setReceptionSubjects(receptionSubjects.filter((_, idx) => idx !== i));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!studentInfo) { setError('Please find a valid student first'); return; }
    setLoading(true);
    try {
      const payload = {
        studentId: studentInfo.studentId,
        term, session, sex,
        teacherComment, headComment, nextTermBegins, nextTermFee,
        numberInClass,
      };

      if (isReception) {
        payload.receptionSubjects = receptionSubjects.filter(s => s.subject.trim());
      } else {
        payload.subjects          = subjects.filter(s => s.subject.trim());
        payload.affectiveDomain   = affective;
        payload.psychomotorDomain = psychomotor;
        payload.overallResult     = overallResult;
      }

      await axios.post('/api/results', payload);
      onUploaded();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to upload result');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box modal-xl">
        <div className="modal-header">
          <h2><i className="fa-solid fa-file-arrow-up"></i> Upload Result</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {error && <div className="alert alert-error"><i className="fa-solid fa-circle-exclamation"></i> {error}</div>}

        <form onSubmit={handleSubmit}>

          {/* ── STUDENT ── */}
          <div className="upload-section">
            <h4><i className="fa-solid fa-user-graduate"></i> Student</h4>
            {!prefilledStudent && (
              <div className="student-search">
                <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                  <input value={studentId} onChange={e => setStudentId(e.target.value.toUpperCase())} placeholder="Enter Student ID e.g. BG-2025-001" />
                </div>
                <button type="button" className="btn btn-outline" onClick={searchStudent} disabled={searching}>
                  {searching ? 'Searching...' : 'Find Student'}
                </button>
              </div>
            )}
            {studentInfo && (
              <div className="student-found">
                <i className="fa-solid fa-circle-check"></i>
                <strong>{studentInfo.fullName}</strong> — {studentInfo.className} ({studentInfo.studentId})
                <span className={`badge ${isReception ? 'badge-gold' : 'badge-green'}`} style={{ marginLeft: 8 }}>
                  {isReception ? 'Reception Report' : 'Standard Report'}
                </span>
              </div>
            )}
          </div>

          {/* ── ACADEMIC PERIOD ── */}
          <div className="upload-section">
            <h4><i className="fa-solid fa-calendar"></i> Academic Period</h4>
            <div className="form-row-2">
              <div className="form-group">
                <label>Term</label>
                <select value={term} onChange={e => setTerm(e.target.value)}>
                  {TERMS.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Session</label>
                <input value={session} onChange={e => setSession(e.target.value)} placeholder="e.g. 2025/2026" />
              </div>
            </div>
          </div>

          {/* ── CLASS INFO ── */}
          <div className="upload-section">
            <h4><i className="fa-solid fa-school"></i> Class Information</h4>
            <div className="form-row-2">
              <div className="form-group">
                <label>Sex</label>
                <select value={sex} onChange={e => setSex(e.target.value)}>
                  <option value="">Select</option>
                  <option>Male</option>
                  <option>Female</option>
                </select>
              </div>
              <div className="form-group">
                <label>Number in Class</label>
                <input type="number" value={numberInClass} onChange={e => setNumberInClass(e.target.value)} placeholder="e.g. 17" />
              </div>
              {!isReception && (
                <div className="form-group">
                  <label>Overall Result</label>
                  <select value={overallResult} onChange={e => setOverallResult(e.target.value)}>
                    <option>PASS</option>
                    <option>FAIL</option>
                    <option>PROMOTED</option>
                    <option>REPEATED</option>
                  </select>
                </div>
              )}
            </div>
            {!isReception && studentInfo && (
              <div className="auto-calc-note">
                <i className="fa-solid fa-calculator"></i>
                Total Score, Student Average, Class Average and Subject Positions are calculated automatically.
              </div>
            )}
          </div>

          {/* ── RECEPTION SUBJECTS ── */}
          {isReception && (
            <div className="upload-section">
              <div className="section-row-header">
                <h4><i className="fa-solid fa-book"></i> Cognitive Domain</h4>
                <button type="button" className="btn btn-outline btn-sm" onClick={addReceptionRow}>+ Add Row</button>
              </div>
              <div className="table-wrapper">
                <table className="scores-table">
                  <thead>
                    <tr>
                      <th>Subject</th>
                      <th>Sub-Subject</th>
                      <th>Teacher's Remark</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {receptionSubjects.map((s, i) => (
                      <tr key={i}>
                        <td><input value={s.subject} onChange={e => updateReception(i, 'subject', e.target.value)} className="score-input subject-input" placeholder="e.g. Literacy" /></td>
                        <td><input value={s.subSubject} onChange={e => updateReception(i, 'subSubject', e.target.value)} className="score-input subject-input" placeholder="e.g. Reading" /></td>
                        <td><input value={s.remark} onChange={e => updateReception(i, 'remark', e.target.value)} className="score-input" style={{ minWidth: 200 }} placeholder="Teacher's remark..." /></td>
                        <td><button type="button" onClick={() => removeReceptionRow(i)} className="remove-row-btn"><i className="fa-solid fa-xmark"></i></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── STANDARD SUBJECTS ── */}
          {!isReception && studentInfo && (
            <div className="upload-section">
              <div className="section-row-header">
                <h4><i className="fa-solid fa-book"></i> Subject Scores</h4>
                <button type="button" className="btn btn-outline btn-sm" onClick={addSubject}>+ Add Subject</button>
              </div>
              <div className="table-wrapper">
                <table className="scores-table">
                  <thead>
                    <tr>
                      <th>Subject</th>
                      <th>CAT <span className="th-max">/30</span></th>
                      <th>Exam <span className="th-max">/70</span></th>
                      <th>Total <span className="th-max">/100</span></th>
                      <th>Grade</th>
                      <th>Remark</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {subjects.map((s, i) => {
                      const total = (Number(s.cat) || 0) + (Number(s.exam) || 0);
                      const isBlank = s.cat === '' && s.exam === '' && s.grade === '' && s.remark === '';
                      return (
                        <tr key={i} style={{ opacity: isBlank ? 0.45 : 1 }}>
                          <td><input value={s.subject} onChange={e => updateSubject(i, 'subject', e.target.value)} className="score-input subject-input" placeholder="e.g. Mathematics" /></td>
                          <td><input type="number" min="0" max="30" value={s.cat} onChange={e => updateSubject(i, 'cat', e.target.value)} className="score-input num-input" /></td>
                          <td><input type="number" min="0" max="70" value={s.exam} onChange={e => updateSubject(i, 'exam', e.target.value)} className="score-input num-input" /></td>
                          <td><div className={`total-cell ${total >= 45 ? 'pass' : total > 0 ? 'fail' : ''}`}>{total || ''}</div></td>
                          <td><input value={s.grade} onChange={e => updateSubject(i, 'grade', e.target.value)} className="score-input" style={{ width: 60 }} placeholder="A" /></td>
                          <td><input value={s.remark} onChange={e => updateSubject(i, 'remark', e.target.value)} className="score-input remark-input" placeholder="Excellent" /></td>
                          <td>
                            {isBlank && <span style={{ fontSize: '0.7rem', color: '#9ca3af', display: 'block', textAlign: 'center' }}>skip</span>}
                            <button type="button" onClick={() => removeSubject(i)} className="remove-row-btn"><i className="fa-solid fa-xmark"></i></button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── AFFECTIVE DOMAIN ── */}
          {!isReception && studentInfo && (
            <div className="upload-section">
              <h4><i className="fa-solid fa-star"></i> Affective Domain <span className="section-hint">(5=Excellent, 4=Very Good, 3=Good, 2=Fair, 1=Poor)</span></h4>
              <div className="domain-grid">
                {affective.map((t, i) => (
                  <div key={i} className="domain-item">
                    <span className="domain-trait">{i + 1}. {t.trait}</span>
                    <select value={t.rating} onChange={e => { const u=[...affective]; u[i]={...u[i],rating:e.target.value}; setAffective(u); }} className="domain-select">
                      <option value="">—</option>
                      {[5,4,3,2,1].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── PSYCHOMOTOR DOMAIN ── */}
          {!isReception && studentInfo && (
            <div className="upload-section">
              <h4><i className="fa-solid fa-hand"></i> Psychomotor Domain <span className="section-hint">(Rate 1–5)</span></h4>
              <div className="domain-grid">
                {psychomotor.map((t, i) => (
                  <div key={i} className="domain-item">
                    <span className="domain-trait">{i + 1}. {t.trait}</span>
                    <select value={t.rating} onChange={e => { const u=[...psychomotor]; u[i]={...u[i],rating:e.target.value}; setPsychomotor(u); }} className="domain-select">
                      <option value="">—</option>
                      {[5,4,3,2,1].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── COMMENTS ── */}
          <div className="upload-section">
            <h4><i className="fa-solid fa-comment"></i> Comments & Info</h4>
            <div className="form-row-2">
              <div className="form-group">
                <label>Class Teacher's Remark</label>
                <textarea value={teacherComment} onChange={e => setTeacherComment(e.target.value)} rows={2} placeholder="e.g. Destiny participates very well in class..." />
              </div>
              <div className="form-group">
                <label>Head Teacher's Remark</label>
                <textarea value={headComment} onChange={e => setHeadComment(e.target.value)} rows={2} placeholder="e.g. Excellent Result, keep it up..." />
              </div>
            </div>
            <div className="form-row-2">
              <div className="form-group">
                <label>Next Term Begins</label>
                <input value={nextTermBegins} onChange={e => setNextTermBegins(e.target.value)} placeholder="e.g. 12 January, 2026" />
              </div>
              <div className="form-group">
                <label>Next Term Fee</label>
                <input value={nextTermFee} onChange={e => setNextTermFee(e.target.value)} placeholder="e.g. #TBA" />
              </div>
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 8 }} disabled={loading}>
            {loading ? <><i className="fa-solid fa-spinner fa-spin"></i> Uploading...</> : <><i className="fa-solid fa-file-arrow-up"></i> Upload Result</>}
          </button>
        </form>
      </div>
    </div>
  );
}