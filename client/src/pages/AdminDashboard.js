import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import ChangePinModal from '../components/ChangePinModal';
import '../styles/AdminDashboard.css';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showPinModal, setShowPinModal] = useState(user?.mustChangePin);
  const [showAddTeacher, setShowAddTeacher] = useState(false);
  const [newTeacherResult, setNewTeacherResult] = useState(null);
  const [editTeacher, setEditTeacher] = useState(null);
  const [search, setSearch] = useState('');
  const [resultSearch, setResultSearch] = useState('');
  const [resultFilters, setResultFilters] = useState({ className: '', term: '', session: '' });
  const [expandedResult, setExpandedResult] = useState(null);
  const [toast, setToast] = useState('');

  useEffect(() => { fetchStats(); }, []);
  useEffect(() => { if (activeTab === 'teachers') fetchTeachers(); }, [activeTab]);
  useEffect(() => { if (activeTab === 'students') fetchStudents(); }, [activeTab, search]);
  useEffect(() => { if (activeTab === 'results') fetchResults(); }, [activeTab, resultFilters, resultSearch]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const fetchStats = async () => {
    try {
      const { data } = await axios.get('/api/admin/stats');
      setStats(data);
    } catch {}
  };

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get('/api/admin/teachers');
      setTeachers(data.teachers);
    } finally { setLoading(false); }
  };

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const params = search ? { search } : {};
      const { data } = await axios.get('/api/admin/students', { params });
      setStudents(data.students);
    } finally { setLoading(false); }
  };

  const fetchResults = async () => {
    setLoading(true);
    try {
      const params = { ...resultFilters };
      if (resultSearch) params.search = resultSearch;
      Object.keys(params).forEach(k => { if (!params[k]) delete params[k]; });
      const { data } = await axios.get('/api/admin/results', { params });
      setResults(data.results);
    } catch { setResults([]); }
    finally { setLoading(false); }
  };

  const handleDeactivate = async (id, name) => {
    if (!window.confirm(`Deactivate ${name}? They won't be able to login.`)) return;
    try {
      await axios.delete(`/api/admin/teachers/${id}`);
      showToast(`${name} has been deactivated`);
      fetchTeachers();
      fetchStats();
    } catch { showToast('Failed to deactivate teacher'); }
  };

  const handleDeleteTeacher = async (id, name) => {
    const confirmed = window.confirm(
      `⚠️ PERMANENTLY DELETE "${name}"?\n\nThis cannot be undone. Their account will be removed from the system.`
    );
    if (!confirmed) return;
    try {
      await axios.delete(`/api/admin/teachers/${id}/permanent`);
      showToast(`${name} permanently deleted`);
      fetchTeachers();
      fetchStats();
    } catch { showToast('Failed to delete teacher'); }
  };

  const handleDeleteStudent = async (id, name, studentId) => {
    const withResults = window.confirm(
      `⚠️ DELETE "${name}" (${studentId})?\n\nClick OK to also delete all their results.\nClick Cancel to keep their results but remove the account.`
    );
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete ${name}? This CANNOT be undone.`
    );
    if (!confirmed) return;
    try {
      await axios.delete(`/api/admin/students/${id}?deleteResults=${withResults}`);
      showToast(`${name} permanently deleted`);
      fetchStudents();
      fetchStats();
    } catch { showToast('Failed to delete student'); }
  };

  const handleReactivate = async (id, name) => {
    try {
      await axios.put(`/api/admin/teachers/${id}`, { isActive: true });
      showToast(`${name} reactivated`);
      fetchTeachers();
    } catch { showToast('Failed to reactivate'); }
  };

  const handleResetPin = async (id, name) => {
    if (!window.confirm(`Reset PIN for ${name} to 1234?`)) return;
    try {
      await axios.post(`/api/admin/teachers/${id}/reset-pin`, { newPin: '1234' });
      showToast(`PIN reset to 1234 for ${name}`);
    } catch { showToast('Failed to reset PIN'); }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    showToast('Copied to clipboard!');
  };

  return (
    <div className="admin-portal">
      {showPinModal && <ChangePinModal onClose={() => setShowPinModal(false)} />}
      {showAddTeacher && (
        <AddTeacherModal
          onClose={() => { setShowAddTeacher(false); setNewTeacherResult(null); }}
          onCreated={(t) => { setNewTeacherResult(t); fetchTeachers(); fetchStats(); }}
          result={newTeacherResult}
        />
      )}
      {editTeacher && (
        <EditTeacherModal
          teacher={editTeacher}
          onClose={() => setEditTeacher(null)}
          onSaved={() => { setEditTeacher(null); fetchTeachers(); showToast('Teacher updated'); }}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className="toast">
          <i className="fa-solid fa-circle-check"></i> {toast}
        </div>
      )}

      {/* Header */}
      <div className="admin-header">
        <div className="admin-header-left">
          <img src="/logo.jpeg" alt="Logo" className="admin-logo" />
          <div>
            <h1>Admin Panel</h1>
            <p>Welcome, <strong>{user?.fullName}</strong> &nbsp;·&nbsp; <span className="admin-id-tag">{user?.staffId}</span></p>
          </div>
        </div>
        <div className="admin-header-right">
          <button className="btn btn-outline btn-sm" onClick={() => setShowPinModal(true)}>
            <i className="fa-solid fa-key"></i> Change PIN
          </button>
          <button className="btn btn-sm btn-danger" onClick={logout}>
            <i className="fa-solid fa-right-from-bracket"></i> Logout
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="admin-tabs">
        {[
          { key: 'overview', icon: 'fa-solid fa-gauge', label: 'Overview' },
          { key: 'teachers', icon: 'fa-solid fa-chalkboard-user', label: 'Teachers' },
          { key: 'students', icon: 'fa-solid fa-user-graduate', label: 'Students' },
          { key: 'results',  icon: 'fa-solid fa-file-lines', label: 'Results' },
        ].map(t => (
          <button
            key={t.key}
            className={`admin-tab ${activeTab === t.key ? 'active' : ''}`}
            onClick={() => setActiveTab(t.key)}
          >
            <i className={t.icon}></i> {t.label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {activeTab === 'overview' && (
        <div className="overview-section">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon green"><i className="fa-solid fa-chalkboard-user"></i></div>
              <div><div className="stat-num">{stats?.totalTeachers ?? '—'}</div><div className="stat-lbl">Teachers</div></div>
            </div>
            <div className="stat-card">
              <div className="stat-icon blue"><i className="fa-solid fa-user-graduate"></i></div>
              <div><div className="stat-num">{stats?.totalStudents ?? '—'}</div><div className="stat-lbl">Students</div></div>
            </div>
            <div className="stat-card">
              <div className="stat-icon gold"><i className="fa-solid fa-file-lines"></i></div>
              <div><div className="stat-num">{stats?.totalResults ?? '—'}</div><div className="stat-lbl">Results Uploaded</div></div>
            </div>
            <div className="stat-card">
              <div className="stat-icon teal"><i className="fa-solid fa-school"></i></div>
              <div><div className="stat-num">{stats?.totalClasses ?? '—'}</div><div className="stat-lbl">Classes</div></div>
            </div>
          </div>

          <div className="quick-card card">
            <h3><i className="fa-solid fa-bolt"></i> Quick Actions</h3>
            <div className="quick-grid">
              <button className="quick-btn" onClick={() => { setActiveTab('teachers'); setShowAddTeacher(true); }}>
                <i className="fa-solid fa-user-plus"></i>
                <span>Add New Teacher</span>
              </button>
              <button className="quick-btn" onClick={() => setActiveTab('teachers')}>
                <i className="fa-solid fa-users"></i>
                <span>View All Teachers</span>
              </button>
              <button className="quick-btn" onClick={() => setActiveTab('students')}>
                <i className="fa-solid fa-user-graduate"></i>
                <span>View All Students</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TEACHERS ── */}
      {activeTab === 'teachers' && (
        <div className="section-content">
          <div className="section-topbar">
            <h2><i className="fa-solid fa-chalkboard-user"></i> Teachers ({teachers.length})</h2>
            <button className="btn btn-primary" onClick={() => { setNewTeacherResult(null); setShowAddTeacher(true); }}>
              <i className="fa-solid fa-user-plus"></i> Add Teacher
            </button>
          </div>

          {loading ? (
            <div className="loader"><div className="spinner"></div></div>
          ) : teachers.length === 0 ? (
            <div className="empty-state card">
              <i className="fa-solid fa-chalkboard-user empty-icon-fa"></i>
              <h3>No Teachers Yet</h3>
              <p>Click "Add Teacher" to create the first teacher account.</p>
              <button className="btn btn-primary" onClick={() => setShowAddTeacher(true)}>
                <i className="fa-solid fa-user-plus"></i> Add First Teacher
              </button>
            </div>
          ) : (
            <div className="teachers-grid">
              {teachers.map(t => (
                <div key={t._id} className={`teacher-card card ${!t.isActive ? 'inactive' : ''}`}>
                  <div className="teacher-card-top">
                    <div className="teacher-avatar">{t.fullName[0]}</div>
                    <div className="teacher-info">
                      <strong>{t.fullName}</strong>
                      <span className="teacher-id"><i className="fa-solid fa-id-badge"></i> {t.staffId}</span>
                      {t.subject && <span className="teacher-subject"><i className="fa-solid fa-book"></i> {t.subject}</span>}
                      {t.phone && <span className="teacher-phone"><i className="fa-solid fa-phone"></i> {t.phone}</span>}
                      {t.classes && t.classes.length > 0 && (
                        <span className="teacher-classes">
                          <i className="fa-solid fa-school"></i>
                          {t.classes.join(', ')}
                        </span>
                      )}
                    </div>
                    <span className={`badge ${t.isActive ? 'badge-green' : 'badge-red'}`}>
                      {t.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="teacher-card-actions">
                    <button className="action-btn" onClick={() => copyToClipboard(t.staffId)} title="Copy Staff ID">
                      <i className="fa-solid fa-copy"></i> Copy ID
                    </button>
                    <button className="action-btn" onClick={() => setEditTeacher(t)} title="Edit">
                      <i className="fa-solid fa-pen"></i> Edit
                    </button>
                    <button className="action-btn" onClick={() => handleResetPin(t._id, t.fullName)} title="Reset PIN">
                      <i className="fa-solid fa-key"></i> Reset PIN
                    </button>
                    {t.isActive ? (
                      <button className="action-btn danger" onClick={() => handleDeactivate(t._id, t.fullName)}>
                        <i className="fa-solid fa-ban"></i> Deactivate
                      </button>
                    ) : (
                      <button className="action-btn success" onClick={() => handleReactivate(t._id, t.fullName)}>
                        <i className="fa-solid fa-circle-check"></i> Reactivate
                      </button>
                    )}
                    <button className="action-btn delete" onClick={() => handleDeleteTeacher(t._id, t.fullName)} title="Permanently delete">
                      <i className="fa-solid fa-trash"></i> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── STUDENTS ── */}
      {activeTab === 'students' && (
        <div className="section-content">
          <div className="section-topbar">
            <h2><i className="fa-solid fa-user-graduate"></i> Students ({students.length})</h2>
            <div className="search-box">
              <i className="fa-solid fa-magnifying-glass"></i>
              <input
                placeholder="Search by name..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          {loading ? (
            <div className="loader"><div className="spinner"></div></div>
          ) : (
            <div className="card">
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Student ID</th>
                      <th>Full Name</th>
                      <th>Class</th>
                      <th>Section</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map(s => (
                      <tr key={s._id}>
                        <td><code className="id-code">{s.studentId}</code></td>
                        <td><strong>{s.fullName}</strong></td>
                        <td>{s.className}</td>
                        <td>{s.section}</td>
                        <td><span className={`badge ${s.isActive ? 'badge-green' : 'badge-red'}`}>{s.isActive ? 'Active' : 'Inactive'}</span></td>
                        <td>
                          <button
                            className="action-btn delete"
                            style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                            onClick={() => handleDeleteStudent(s._id, s.fullName, s.studentId)}
                            title="Permanently delete student"
                          >
                            <i className="fa-solid fa-trash"></i> Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {students.length === 0 && (
                  <p style={{ textAlign: 'center', padding: 32, color: 'var(--gray-400)' }}>No students found.</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── RESULTS ── */}
      {activeTab === 'results' && (
        <div className="section-content">
          <div className="section-topbar">
            <h2><i className="fa-solid fa-file-lines"></i> Student Results ({results.length})</h2>
            <div className="search-box">
              <i className="fa-solid fa-magnifying-glass"></i>
              <input
                placeholder="Search by student name..."
                value={resultSearch}
                onChange={e => setResultSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Filters */}
          <div className="result-filters card">
            <div className="filter-row">
              <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
                <label><i className="fa-solid fa-school"></i> Class</label>
                <select value={resultFilters.className} onChange={e => setResultFilters({ ...resultFilters, className: e.target.value })}>
                  <option value="">All Classes</option>
                  {FLAT_CLASSES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
                <label><i className="fa-solid fa-calendar"></i> Term</label>
                <select value={resultFilters.term} onChange={e => setResultFilters({ ...resultFilters, term: e.target.value })}>
                  <option value="">All Terms</option>
                  <option>First Term</option>
                  <option>Second Term</option>
                  <option>Third Term</option>
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
                <label><i className="fa-solid fa-clock-rotate-left"></i> Session</label>
                <input
                  value={resultFilters.session}
                  onChange={e => setResultFilters({ ...resultFilters, session: e.target.value })}
                  placeholder="e.g. 2024/2025"
                />
              </div>
              <button className="btn btn-outline btn-sm" style={{ alignSelf: 'flex-end' }}
                onClick={() => { setResultFilters({ className: '', term: '', session: '' }); setResultSearch(''); }}>
                <i className="fa-solid fa-xmark"></i> Clear
              </button>
            </div>
          </div>

          {loading ? (
            <div className="loader"><div className="spinner"></div></div>
          ) : results.length === 0 ? (
            <div className="empty-state card">
              <i className="fa-solid fa-file-lines empty-icon-fa"></i>
              <h3>No Results Found</h3>
              <p>Try adjusting the filters above.</p>
            </div>
          ) : (
            <div className="card">
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Student ID</th>
                      <th>Name</th>
                      <th>Class</th>
                      <th>Term</th>
                      <th>Session</th>
                      <th>Score</th>
                      <th>%</th>
                      <th>Position</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map(r => (
                      <>
                        <tr key={r._id} className={expandedResult === r._id ? 'row-expanded' : ''}>
                          <td><code className="id-code">{r.studentId}</code></td>
                          <td><strong>{r.studentName}</strong></td>
                          <td>{r.className}</td>
                          <td>{r.term}</td>
                          <td>{r.session}</td>
                          <td>{r.obtainedMarks}/{r.totalMarks}</td>
                          <td><span className={`badge ${r.percentage >= 45 ? 'badge-green' : 'badge-red'}`}>{r.percentage}%</span></td>
                          <td>{r.position ? `${r.position} of ${r.classSize}` : '—'}</td>
                          <td>
                            <button
                              className="action-btn"
                              onClick={() => setExpandedResult(expandedResult === r._id ? null : r._id)}
                            >
                              <i className={`fa-solid fa-chevron-${expandedResult === r._id ? 'up' : 'down'}`}></i> Subjects
                            </button>
                          </td>
                        </tr>
                        {expandedResult === r._id && (
                          <tr key={r._id + '-detail'} className="detail-row">
                            <td colSpan={9}>
                              <div className="subjects-detail">
                                {r.reportType === 'reception' ? (
                                  <table className="subjects-inner-table">
                                    <thead>
                                      <tr>
                                        <th>Subject</th>
                                        <th>Sub-Subject</th>
                                        <th>Teacher's Remark</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {(r.receptionSubjects || []).map((s, i) => (
                                        <tr key={i}>
                                          <td><strong>{s.subject}</strong></td>
                                          <td>{s.subSubject || '—'}</td>
                                          <td>{s.remark || '—'}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                ) : (
                                  <table className="subjects-inner-table">
                                    <thead>
                                      <tr>
                                        <th>Subject</th>
                                        <th>CAT (30%)</th>
                                        <th>Exams (70%)</th>
                                        <th>Total</th>
                                        <th>Grade</th>
                                        <th>Remark</th>
                                        <th>Position/Subject</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {(r.subjects || []).map((s, i) => {
                                        const catVal  = s.cat  !== null && s.cat  !== undefined ? s.cat  : '—';
                                        const examVal = s.exam !== null && s.exam !== undefined ? s.exam : '—';
                                        const totalVal = (s.cat !== null && s.exam !== null) ? s.total : '—';
                                        return (
                                          <tr key={i}>
                                            <td><strong>{s.subject}</strong></td>
                                            <td style={{ textAlign: 'center' }}>{catVal}</td>
                                            <td style={{ textAlign: 'center' }}>{examVal}</td>
                                            <td style={{ textAlign: 'center' }}><strong>{totalVal}</strong></td>
                                            <td style={{ textAlign: 'center' }}>{s.grade || '—'}</td>
                                            <td>{s.remark || '—'}</td>
                                            <td style={{ textAlign: 'center' }}>{s.subjectPosition || '—'}</td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                )}
                                {r.teacherComment && (
                                  <div className="detail-comment">
                                    <i className="fa-solid fa-comment"></i> <strong>Teacher's Comment:</strong> {r.teacherComment}
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── SCHOOL CLASSES ─────────────────────────────────────────────────────────────
const ALL_CLASSES = [
  { group: 'Reception', classes: ['Lower Reception', 'Upper Reception'] },
  { group: 'Nursery',  classes: ['Nursery 1', 'Nursery 2'] },
  { group: 'Grade', classes: ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5'] },
  { group: 'JSS', classes: ['JSS 1', 'JSS 2', 'JSS 3'] },
];
const FLAT_CLASSES = ALL_CLASSES.flatMap(g => g.classes);

// Reusable class picker component
function ClassPicker({ selected, onChange }) {
  const toggle = (cls) => {
    if (selected.includes(cls)) onChange(selected.filter(c => c !== cls));
    else onChange([...selected, cls]);
  };
  const toggleGroup = (groupClasses) => {
    const allSelected = groupClasses.every(c => selected.includes(c));
    if (allSelected) onChange(selected.filter(c => !groupClasses.includes(c)));
    else onChange([...new Set([...selected, ...groupClasses])]);
  };
  const selectAll = () => onChange([...FLAT_CLASSES]);
  const clearAll  = () => onChange([]);

  return (
    <div className="class-picker">
      <div className="class-picker-top">
        <span className="class-picker-label"><i className="fa-solid fa-school"></i> Classes Assigned</span>
        <div className="class-picker-actions">
          <button type="button" onClick={selectAll} className="picker-link">Select All</button>
          <span>·</span>
          <button type="button" onClick={clearAll} className="picker-link">Clear</button>
        </div>
      </div>
      {selected.length > 0 && (
        <div className="class-selected-count">
          <i className="fa-solid fa-circle-check"></i> {selected.length} class{selected.length > 1 ? 'es' : ''} selected
        </div>
      )}
      <div className="class-groups">
        {ALL_CLASSES.map(({ group, classes }) => (
          <div key={group} className="class-group">
            <button
              type="button"
              className={`group-header ${classes.every(c => selected.includes(c)) ? 'all-selected' : ''}`}
              onClick={() => toggleGroup(classes)}
            >
              <i className={`fa-solid ${classes.every(c => selected.includes(c)) ? 'fa-square-check' : 'fa-square'}`}></i>
              {group}
            </button>
            <div className="class-chips">
              {classes.map(cls => (
                <button
                  type="button"
                  key={cls}
                  className={`class-chip ${selected.includes(cls) ? 'selected' : ''}`}
                  onClick={() => toggle(cls)}
                >
                  {selected.includes(cls) && <i className="fa-solid fa-check"></i>}
                  {cls}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── ADD TEACHER MODAL ──────────────────────────────────────────────────────────
function AddTeacherModal({ onClose, onCreated, result }) {
  const [form, setForm] = useState({ fullName: '', subject: '', phone: '', pin: '1234', classes: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await axios.post('/api/admin/teachers', form);
      onCreated(data.teacher);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to create teacher');
    } finally { setLoading(false); }
  };

  const copyAll = (t) => {
    const text = `Staff ID: ${t.staffId}\nName: ${t.fullName}\nDefault PIN: ${t.defaultPin}\nClasses: ${(t.classes || []).join(', ') || 'None'}`;
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box modal-wide">
        <div className="modal-header">
          <h2><i className="fa-solid fa-user-plus"></i> {result ? 'Teacher Created!' : 'Add New Teacher'}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {result ? (
          /* ── SUCCESS VIEW ── */
          <div className="created-result">
            <div className="created-check"><i className="fa-solid fa-circle-check"></i></div>
            <p className="created-msg">Teacher account created. Share these credentials with the teacher.</p>

            <div className="cred-display">
              <div className="cred-item">
                <label>Staff ID (Login Username)</label>
                <div className="cred-value">
                  <span>{result.staffId}</span>
                  <button onClick={() => navigator.clipboard.writeText(result.staffId)} className="copy-btn">
                    <i className="fa-solid fa-copy"></i>
                  </button>
                </div>
              </div>
              <div className="cred-item">
                <label>Full Name</label>
                <div className="cred-value"><span>{result.fullName}</span></div>
              </div>
              {result.subject && (
                <div className="cred-item">
                  <label>Subject / Role</label>
                  <div className="cred-value"><span>{result.subject}</span></div>
                </div>
              )}
              {result.classes && result.classes.length > 0 && (
                <div className="cred-item">
                  <label>Classes Assigned</label>
                  <div className="cred-value"><span style={{ fontSize: '0.85rem', letterSpacing: 0 }}>{result.classes.join(', ')}</span></div>
                </div>
              )}
              <div className="cred-item">
                <label>Default PIN</label>
                <div className="cred-value pin-value">
                  <span>{result.defaultPin}</span>
                  <button onClick={() => navigator.clipboard.writeText(result.defaultPin)} className="copy-btn">
                    <i className="fa-solid fa-copy"></i>
                  </button>
                </div>
              </div>
            </div>

            <div className="alert alert-info" style={{ fontSize: '0.85rem' }}>
              <i className="fa-solid fa-circle-info"></i> The teacher must change their PIN on first login.
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => copyAll(result)}>
                <i className="fa-solid fa-copy"></i> Copy All
              </button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => { onCreated(null); setForm({ fullName: '', subject: '', phone: '', pin: '1234', classes: [] }); }}>
                <i className="fa-solid fa-user-plus"></i> Add Another
              </button>
            </div>
          </div>
        ) : (
          /* ── FORM VIEW ── */
          <form onSubmit={handleSubmit}>
            {error && <div className="alert alert-error"><i className="fa-solid fa-circle-exclamation"></i> {error}</div>}

            <div className="form-row-2">
              <div className="form-group">
                <label><i className="fa-solid fa-user"></i> Full Name <span className="required">*</span></label>
                <input
                  value={form.fullName}
                  onChange={e => setForm({ ...form, fullName: e.target.value })}
                  placeholder="e.g. Mrs. Amaka Johnson"
                  required
                />
              </div>
              <div className="form-group">
                <label><i className="fa-solid fa-book"></i> Subject / Role</label>
                <input
                  value={form.subject}
                  onChange={e => setForm({ ...form, subject: e.target.value })}
                  placeholder="e.g. Mathematics, Class Teacher"
                />
              </div>
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label><i className="fa-solid fa-phone"></i> Phone Number</label>
                <input
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  placeholder="e.g. 08012345678"
                />
              </div>
              <div className="form-group">
                <label><i className="fa-solid fa-key"></i> Default PIN</label>
                <input
                  value={form.pin}
                  onChange={e => setForm({ ...form, pin: e.target.value })}
                  placeholder="Default: 1234"
                />
                <small className="field-hint">Teacher will change this on first login.</small>
              </div>
            </div>

            <ClassPicker
              selected={form.classes}
              onChange={classes => setForm({ ...form, classes })}
            />

            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 20 }} disabled={loading}>
              {loading
                ? <><i className="fa-solid fa-spinner fa-spin"></i> Creating...</>
                : <><i className="fa-solid fa-user-plus"></i> Create Teacher Account</>
              }
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

// ── EDIT TEACHER MODAL ─────────────────────────────────────────────────────────
function EditTeacherModal({ teacher, onClose, onSaved }) {
  const [form, setForm] = useState({
    fullName: teacher.fullName,
    subject: teacher.subject || '',
    phone: teacher.phone || '',
    classes: teacher.classes || [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await axios.put(`/api/admin/teachers/${teacher._id}`, form);
      onSaved();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to update');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box modal-wide">
        <div className="modal-header">
          <h2><i className="fa-solid fa-pen"></i> Edit Teacher</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <div className="edit-staff-id">
          <i className="fa-solid fa-id-badge"></i> {teacher.staffId}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-row-2">
            <div className="form-group">
              <label><i className="fa-solid fa-user"></i> Full Name</label>
              <input value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} required />
            </div>
            <div className="form-group">
              <label><i className="fa-solid fa-book"></i> Subject / Role</label>
              <input value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} />
            </div>
          </div>
          <div className="form-group">
            <label><i className="fa-solid fa-phone"></i> Phone Number</label>
            <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
          </div>

          <ClassPicker
            selected={form.classes}
            onChange={classes => setForm({ ...form, classes })}
          />

          <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
            <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
              {loading ? 'Saving...' : <><i className="fa-solid fa-floppy-disk"></i> Save Changes</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}