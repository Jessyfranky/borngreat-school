import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import ChangePinModal from '../components/ChangePinModal';
import AddStudentModal from '../components/AddStudentModal';
import UploadResultModal from '../components/UploadResultModal';
import AssignmentModal from '../components/AssignmentModal';
import CredentialSlip from '../components/CredentialSlip';
import '../styles/TeacherDashboard.css';

export default function TeacherDashboard() {
  const { user, logout } = useAuth();
  const [activeTab,    setActiveTab]    = useState('students');
  const [students,     setStudents]     = useState([]);
  const [results,      setResults]      = useState([]);
  const [assignments,  setAssignments]  = useState([]);
  const [classes,      setClasses]      = useState([]);
  const [search,       setSearch]       = useState('');
  const [filterClass,  setFilterClass]  = useState('');
  const [filterTerm,   setFilterTerm]   = useState('');
  const [expandedResult, setExpandedResult] = useState(null);
  const [loading,      setLoading]      = useState(false);
  const [showAddStudent,    setShowAddStudent]    = useState(false);
  const [showUploadResult,  setShowUploadResult]  = useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [showPinModal,      setShowPinModal]      = useState(user?.mustChangePin);
  const [newStudents,       setNewStudents]        = useState(null);
  const [selectedStudentForResult, setSelectedStudentForResult] = useState(null);
  const [assignmentClassFilter, setAssignmentClassFilter] = useState('');

  useEffect(() => { fetchClasses(); }, []);
  useEffect(() => { if (activeTab === 'students')    fetchStudents();    }, [activeTab, filterClass, search]);
  useEffect(() => { if (activeTab === 'results')     fetchResults();     }, [activeTab, filterClass, filterTerm]);
  useEffect(() => { if (activeTab === 'assignments') fetchAssignments(); }, [activeTab, assignmentClassFilter]);

  const fetchClasses = async () => {
    try { const { data } = await axios.get('/api/teachers/classes'); setClasses(data.classes); } catch {}
  };
  const fetchStudents = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterClass) params.className = filterClass;
      if (search)      params.search    = search;
      const { data } = await axios.get('/api/students', { params });
      setStudents(data.students);
    } finally { setLoading(false); }
  };
  const fetchResults = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterClass) params.className = filterClass;
      if (filterTerm)  params.term      = filterTerm;
      const { data } = await axios.get('/api/results', { params });
      setResults(data.results);
    } finally { setLoading(false); }
  };
  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const params = {};
      if (assignmentClassFilter) params.className = assignmentClassFilter;
      const { data } = await axios.get('/api/assignments', { params });
      setAssignments(data.assignments);
    } catch { setAssignments([]); }
    finally { setLoading(false); }
  };

  const handleStudentAdded = (newStudentData) => {
    setShowAddStudent(false);
    setNewStudents(Array.isArray(newStudentData) ? newStudentData : [newStudentData]);
    fetchStudents(); fetchClasses();
  };
  const handleResultUploaded = () => {
    setShowUploadResult(false);
    setSelectedStudentForResult(null);
    fetchResults();
  };
  const handleDeleteResult = async (id, studentName, term) => {
    if (!window.confirm(`Delete result for ${studentName} — ${term}? This cannot be undone.`)) return;
    try {
      await axios.delete(`/api/results/${id}`);
      fetchResults();
    } catch (err) {
      alert(`Failed to delete: ${err?.response?.data?.message || err.message}`);
    }
  };
  const handleDeleteAssignment = async (id, title) => {
    if (!window.confirm(`Delete assignment "${title}"?`)) return;
    try {
      await axios.delete(`/api/assignments/${id}`);
      setAssignments(prev => prev.filter(a => a._id !== id));
    } catch { alert('Failed to delete assignment'); }
  };
  const handleResetPin = async (studentId, studentName) => {
    if (!window.confirm(`Reset PIN for ${studentName} to 0000?`)) return;
    try {
      await axios.post(`/api/students/${studentId}/reset-pin`, { newPin: '0000' });
      alert('PIN reset to 0000.');
    } catch { alert('Failed to reset PIN'); }
  };
  const openUploadForStudent = (student) => {
    setSelectedStudentForResult(student);
    setShowUploadResult(true);
  };

  return (
    <div className="teacher-portal">
      {showPinModal && <ChangePinModal onClose={() => setShowPinModal(false)} />}
      {showAddStudent && <AddStudentModal onClose={() => setShowAddStudent(false)} onAdded={handleStudentAdded} />}
      {showUploadResult && (
        <UploadResultModal
          onClose={() => { setShowUploadResult(false); setSelectedStudentForResult(null); }}
          onUploaded={handleResultUploaded}
          prefilledStudent={selectedStudentForResult}
        />
      )}
      {showAssignmentModal && (
        <AssignmentModal
          onClose={() => setShowAssignmentModal(false)}
          onCreated={(a) => { setShowAssignmentModal(false); setAssignments(prev => [a, ...prev]); }}
          prefilledClass={assignmentClassFilter}
        />
      )}
      {newStudents && <CredentialSlip students={newStudents} onClose={() => setNewStudents(null)} />}

      {/* Header */}
      <div className="portal-header">
        <div>
          <h1>Teacher Portal 👩‍🏫</h1>
          <p>Welcome, <strong>{user?.fullName}</strong> &nbsp;|&nbsp; Staff ID: <strong>{user?.staffId}</strong></p>
        </div>
        <div className="header-actions">
          <button className="btn btn-outline btn-sm" onClick={() => setShowPinModal(true)}>Change PIN</button>
          <button className="btn btn-sm" style={{ background: '#fee2e2', color: '#991b1b' }} onClick={logout}>Logout</button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <button className="action-card" onClick={() => setShowAddStudent(true)}>
          <span>➕</span><strong>Add Student</strong><small>Register new student</small>
        </button>
        <button className="action-card" onClick={() => setShowUploadResult(true)}>
          <span>📤</span><strong>Upload Result</strong><small>Enter student scores</small>
        </button>
        <button className="action-card" onClick={() => { setActiveTab('assignments'); setShowAssignmentModal(true); }}>
          <span>📝</span><strong>New Assignment</strong><small>Give homework / task</small>
        </button>
        <button className="action-card" onClick={() => setActiveTab('students')}>
          <span>👥</span><strong>{students.length || '—'} Students</strong><small>View all students</small>
        </button>
        <button className="action-card" onClick={() => setActiveTab('results')}>
          <span>📋</span><strong>{results.length || '—'} Results</strong><small>View uploaded results</small>
        </button>
      </div>

      {/* Tabs */}
      <div className="tab-bar">
        <button className={`tab ${activeTab === 'students'    ? 'active' : ''}`} onClick={() => setActiveTab('students')}>Students</button>
        <button className={`tab ${activeTab === 'results'     ? 'active' : ''}`} onClick={() => setActiveTab('results')}>Results</button>
        <button className={`tab ${activeTab === 'assignments' ? 'active' : ''}`} onClick={() => setActiveTab('assignments')}>
          Assignments {assignments.length > 0 && <span className="tab-count">{assignments.length}</span>}
        </button>
      </div>

      {/* Filters */}
      <div className="filters card">
        {activeTab === 'students' && (
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Search</label>
            <input placeholder="Search by name..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        )}
        {(activeTab === 'students' || activeTab === 'results') && (
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Class</label>
            <select value={filterClass} onChange={e => setFilterClass(e.target.value)}>
              <option value="">All Classes</option>
              {classes.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        )}
        {activeTab === 'results' && (
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Term</label>
            <select value={filterTerm} onChange={e => setFilterTerm(e.target.value)}>
              <option value="">All Terms</option>
              <option>First Term</option><option>Second Term</option><option>Third Term</option>
            </select>
          </div>
        )}
        {activeTab === 'assignments' && (
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Filter by Class</label>
            <select value={assignmentClassFilter} onChange={e => setAssignmentClassFilter(e.target.value)}>
              <option value="">All Classes</option>
              {classes.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        )}
      </div>

      {loading ? (
        <div className="loader"><div className="spinner"></div></div>
      ) : activeTab === 'students' ? (

        /* ── STUDENTS ── */
        <div className="card">
          <div className="table-header">
            <h3>Students ({students.length})</h3>
            <button className="btn btn-primary btn-sm" onClick={() => setShowAddStudent(true)}>+ Add Student</button>
          </div>
          {students.length === 0 ? (
            <div className="empty-state" style={{ padding: 40 }}><p>No students found.</p></div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead><tr><th>Student ID</th><th>Full Name</th><th>Class</th><th>Actions</th></tr></thead>
                <tbody>
                  {students.map(s => (
                    <tr key={s._id}>
                      <td><code className="id-code">{s.studentId}</code></td>
                      <td><strong>{s.fullName}</strong></td>
                      <td>{s.className}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button className="btn btn-primary btn-sm" onClick={() => openUploadForStudent(s)}>Upload Result</button>
                          <button className="btn btn-outline btn-sm" onClick={() => handleResetPin(s._id, s.fullName)}>Reset PIN</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      ) : activeTab === 'results' ? (

        /* ── RESULTS ── */
        <div className="card">
          <div className="table-header">
            <h3>Uploaded Results ({results.length})</h3>
            <button className="btn btn-primary btn-sm" onClick={() => setShowUploadResult(true)}>+ Upload Result</button>
          </div>
          {results.length === 0 ? (
            <div className="empty-state" style={{ padding: 40 }}><p>No results found.</p></div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Student ID</th>
                    <th>Name</th>
                    <th>Class</th>
                    <th>Term</th>
                    <th>Total Score</th>
                    <th>Average</th>
                    <th>Class Avg</th>
                    <th>Position</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map(r => (
                    <>
                      <tr key={r._id} style={{ background: expandedResult === r._id ? '#f0fdf4' : '' }}>
                        <td><code className="id-code">{r.studentId}</code></td>
                        <td><strong>{r.studentName}</strong></td>
                        <td>{r.className}</td>
                        <td>{r.term}</td>
                        <td><strong>{r.totalScore || r.obtainedMarks || '—'}</strong></td>
                        <td><span className="badge badge-green">{r.studentAverage || '—'}</span></td>
                        <td>{r.classAverage || '—'}</td>
                        <td>{r.position ? `${r.position}${ordSuffix(r.position)} of ${r.classSize}` : '—'}</td>
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button
                              className="action-btn"
                              onClick={() => setExpandedResult(expandedResult === r._id ? null : r._id)}
                              title="View subjects"
                            >
                              <i className={`fa-solid fa-chevron-${expandedResult === r._id ? 'up' : 'down'}`}></i> Subjects
                            </button>
                            <button
                              className="delete-result-btn"
                              onClick={() => handleDeleteResult(r._id, r.studentName, r.term)}
                              title="Delete result"
                            >
                              <i className="fa-solid fa-trash"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                      {expandedResult === r._id && (
                        <tr key={r._id + '-exp'}>
                          <td colSpan={9} style={{ background: '#f8fafc', padding: '12px 20px' }}>
                            {r.reportType === 'reception' ? (
                              <table className="subjects-inner-table">
                                <thead><tr><th>Subject</th><th>Sub-Subject</th><th>Remark</th></tr></thead>
                                <tbody>
                                  {(r.receptionSubjects || []).map((s, i) => (
                                    <tr key={i}><td><strong>{s.subject}</strong></td><td>{s.subSubject || '—'}</td><td>{s.remark || '—'}</td></tr>
                                  ))}
                                </tbody>
                              </table>
                            ) : (
                              <table className="subjects-inner-table">
                                <thead>
                                  <tr>
                                    <th>Subject</th><th>CAT (30%)</th><th>Exam (70%)</th>
                                    <th>Total</th><th>Grade</th><th>Remark</th><th>Position</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {(r.subjects || []).map((s, i) => (
                                    <tr key={i}>
                                      <td><strong>{s.subject}</strong></td>
                                      <td style={{ textAlign: 'center' }}>{s.cat ?? '—'}</td>
                                      <td style={{ textAlign: 'center' }}>{s.exam ?? '—'}</td>
                                      <td style={{ textAlign: 'center' }}><strong>{s.total ?? '—'}</strong></td>
                                      <td style={{ textAlign: 'center', fontWeight: 700, color: s.grade === 'A' ? '#166534' : s.grade === 'F' ? '#dc2626' : '#374151' }}>{s.grade || '—'}</td>
                                      <td>{s.remark || '—'}</td>
                                      <td style={{ textAlign: 'center' }}>{s.subjectPosition || '—'}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            )}
                            {r.teacherComment && (
                              <p style={{ margin: '10px 0 0', fontSize: '0.83rem', color: '#374151' }}>
                                <strong>Teacher's Comment:</strong> {r.teacherComment}
                              </p>
                            )}
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      ) : (

        /* ── ASSIGNMENTS ── */
        <div className="card">
          <div className="table-header">
            <h3>Assignments ({assignments.length})</h3>
            <button className="btn btn-primary btn-sm" onClick={() => setShowAssignmentModal(true)}>
              <i className="fa-solid fa-plus"></i> New Assignment
            </button>
          </div>
          {assignments.length === 0 ? (
            <div className="empty-state" style={{ padding: 40 }}>
              <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>📝</div>
              <p>No assignments yet. Click "New Assignment" to post one.</p>
            </div>
          ) : (
            <div className="assignments-list">
              {assignments.map(a => (
                <div key={a._id} className="assignment-card">
                  <div className="assignment-card-top">
                    <div className="assignment-icon"><i className="fa-solid fa-clipboard-list"></i></div>
                    <div className="assignment-info">
                      <strong className="assignment-title">{a.title}</strong>
                      <div className="assignment-meta">
                        <span><i className="fa-solid fa-book"></i> {a.subject}</span>
                        <span><i className="fa-solid fa-school"></i> {a.className}</span>
                        {a.dueDate && <span><i className="fa-solid fa-calendar-days"></i> Due: {a.dueDate}</span>}
                        <span style={{ color: '#9ca3af' }}><i className="fa-solid fa-clock"></i> {new Date(a.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </div>
                      {a.description && <p className="assignment-desc">{a.description}</p>}
                    </div>
                    <button className="delete-result-btn" onClick={() => handleDeleteAssignment(a._id, a.title)} title="Delete">
                      <i className="fa-solid fa-trash"></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ordSuffix(n) {
  const s = ['th','st','nd','rd'];
  const v = n % 100;
  return s[(v-20)%10] || s[v] || s[0];
}
