import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useReactToPrint } from 'react-to-print';
import { useAuth } from '../context/AuthContext';
import ChangePinModal from '../components/ChangePinModal';
import '../styles/StudentDashboard.css';

const TERMS = ['First Term', 'Second Term', 'Third Term'];
const currentSession = () => {
  const now = new Date();
  const y = now.getFullYear();
  return now.getMonth() >= 8 ? `${y}/${y+1}` : `${y-1}/${y}`;
};

export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const [activeTab,      setActiveTab]      = useState('results');
  const [results,        setResults]        = useState([]);
  const [selectedResult, setSelectedResult] = useState(null);
  const [assignments,    setAssignments]    = useState([]);
  const [term,           setTerm]           = useState('');
  const [session,        setSession]        = useState('');
  const [loading,        setLoading]        = useState(false);
  const [showPinModal,   setShowPinModal]   = useState(user?.mustChangePin);
  const printRef = useRef();

  useEffect(() => { if (activeTab === 'results')     fetchResults();     }, [term, session, activeTab]);
  useEffect(() => { if (activeTab === 'assignments') fetchAssignments(); }, [activeTab]);

  const fetchResults = async () => {
    setLoading(true);
    try {
      const params = {};
      if (term)    params.term    = term;
      if (session) params.session = session;
      const { data } = await axios.get('/api/results/my', { params });
      setResults(data.results);
      if (data.results.length > 0) setSelectedResult(data.results[0]);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get('/api/assignments/my');
      setAssignments(data.assignments);
    } catch { setAssignments([]); }
    finally { setLoading(false); }
  };

  const handlePrint = useReactToPrint({ content: () => printRef.current });

  return (
    <div className="student-portal">
      {showPinModal && <ChangePinModal onClose={() => setShowPinModal(false)} />}

      {/* ── Header ── */}
      <div className="portal-header">
        <div>
          <h1>Welcome, {user?.fullName?.split(' ')[0]} 👋</h1>
          <p>Student ID: <strong>{user?.studentId}</strong> &nbsp;|&nbsp; Class: <strong>{user?.className}</strong></p>
        </div>
        <div className="header-actions">
          <button className="btn btn-outline btn-sm" onClick={() => setShowPinModal(true)}>Change PIN</button>
          <button className="btn btn-sm" style={{ background: '#fee2e2', color: '#991b1b' }} onClick={logout}>Logout</button>
        </div>
      </div>

      {/* ── Tab Bar ── */}
      <div className="student-tab-bar">
        <button className={`student-tab ${activeTab === 'results' ? 'active' : ''}`} onClick={() => setActiveTab('results')}>
          <i className="fa-solid fa-file-lines"></i> My Results
        </button>
        <button className={`student-tab ${activeTab === 'assignments' ? 'active' : ''}`} onClick={() => setActiveTab('assignments')}>
          <i className="fa-solid fa-clipboard-list"></i> Assignments
          {assignments.length > 0 && (
            <span style={{ background: 'var(--gold)', color: '#fff', borderRadius: 99, padding: '1px 7px', fontSize: '0.7rem', marginLeft: 6, fontWeight: 700 }}>
              {assignments.length}
            </span>
          )}
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════
          ASSIGNMENTS TAB
         ══════════════════════════════════════════════════════ */}
      {activeTab === 'assignments' && (
        loading ? (
          <div className="loader"><div className="spinner"></div></div>
        ) : assignments.length === 0 ? (
          <div className="empty-state card">
            <div className="empty-icon">📝</div>
            <h3>No Assignments Yet</h3>
            <p>Your teacher hasn't posted any assignments. Check back soon!</p>
          </div>
        ) : (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {assignments.map((a, idx) => (
              <div key={a._id} style={{ padding: '18px 24px', borderBottom: idx < assignments.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <div style={{ width: 42, height: 42, borderRadius: 10, flexShrink: 0, marginTop: 2, background: '#f0fdf4', color: '#1a6b3c', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>
                    <i className="fa-solid fa-clipboard-list"></i>
                  </div>
                  <div style={{ flex: 1 }}>
                    <strong style={{ fontSize: '0.97rem', color: '#111', display: 'block', marginBottom: 5 }}>{a.title}</strong>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 16px', fontSize: '0.78rem', color: '#6b7280', marginBottom: a.description ? 8 : 0 }}>
                      <span><i className="fa-solid fa-book" style={{ marginRight: 4 }}></i>{a.subject}</span>
                      <span><i className="fa-solid fa-chalkboard-user" style={{ marginRight: 4 }}></i>{a.teacherName}</span>
                      {a.dueDate && <span style={{ color: '#c9a84c', fontWeight: 600 }}><i className="fa-solid fa-calendar-days" style={{ marginRight: 4 }}></i>Due: {a.dueDate}</span>}
                      <span style={{ color: '#9ca3af' }}><i className="fa-solid fa-clock" style={{ marginRight: 4 }}></i>{new Date(a.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>
                    {a.description && <p style={{ fontSize: '0.85rem', color: '#374151', margin: 0, lineHeight: 1.6, whiteSpace: 'pre-line' }}>{a.description}</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* ══════════════════════════════════════════════════════
          RESULTS TAB
         ══════════════════════════════════════════════════════ */}
      {activeTab === 'results' && (
        <>
          {/* Filters */}
          <div className="filters card">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Academic Session</label>
            <select value={session} onChange={e => setSession(e.target.value)}>
  <option value="">All Sessions</option>
  {Array.from({ length: 7 }, (_, i) => {
    const y = new Date().getFullYear() - 3 + i;
    return `${y}/${y + 1}`;
  }).map(s => (
    <option key={s} value={s}>{s}</option>
  ))}
</select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Term</label>
              <select value={term} onChange={e => setTerm(e.target.value)}>
                <option value="">All Terms</option>
                {TERMS.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="loader"><div className="spinner"></div></div>
          ) : results.length === 0 ? (
            <div className="empty-state card">
              <div className="empty-icon">📋</div>
              <h3>No Results Yet</h3>
              <p>Your results have not been uploaded yet. Check back later or ask your teacher.</p>
            </div>
          ) : (
            <>
              {/* Term selector */}
              {results.length > 1 && (
                <div className="result-tabs">
                  {results.map(r => (
                    <button
                      key={r._id}
                      className={`result-tab ${selectedResult?._id === r._id ? 'active' : ''}`}
                      onClick={() => setSelectedResult(r)}
                    >
                      {r.term} · {r.session}
                    </button>
                  ))}
                </div>
              )}

              {selectedResult && (
                <div className="result-card card" ref={printRef}>

                  {/* ── SCHOOL HEADER ── */}
                  <div className="result-school-header">
                    <img src="/logo.jpeg" alt="Logo" className="result-logo" />
                    <div className="result-school-info">
                      <h2>BORNGREAT SCHOOL</h2>
                      <p>19 CALABAR STREET, UYO AKWA IBOM STATE, AKWAIBOM, NIGERIA</p>
                      <div className="result-type-badge">
                        {(() => {
                          const cn = selectedResult.className || '';
                          if (selectedResult.reportType === 'reception') return 'RECEPTION TERMINAL REPORT';
                          if (cn.startsWith('Nursery')) return 'NURSERY TERMINAL REPORT';
                          if (cn.startsWith('Grade'))   return 'GRADE TERMINAL REPORT';
                          if (cn.startsWith('JSS'))     return 'JSS TERMINAL REPORT';
                          return 'TERMINAL REPORT';
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* ── STUDENT META ── */}
                  <div className="result-meta-grid">
                    <div className="meta-row">
                      <div className="meta-field"><span>Name:</span><strong>{selectedResult.studentName}</strong></div>
                      <div className="meta-field"><span>Number In Class:</span><strong>{selectedResult.numberInClass || '—'}</strong></div>
                    </div>
                    <div className="meta-row">
                      <div className="meta-field"><span>Sex:</span><strong>{selectedResult.sex || '—'}</strong></div>
                      <div className="meta-field"><span>Class:</span><strong>{selectedResult.className}</strong></div>
                      <div className="meta-field"><span>Class Average:</span><strong>{selectedResult.classAverage || '—'}</strong></div>
                    </div>
                    <div className="meta-row">
                      <div className="meta-field"><span>Term:</span><strong>{selectedResult.term}</strong></div>
                      <div className="meta-field"><span>Session:</span><strong>{selectedResult.session}</strong></div>
                      <div className="meta-field"><span>Student Average:</span><strong>{selectedResult.studentAverage || '—'}</strong></div>
                      <div className="meta-field"><span>Overall Result:</span>
                        <strong className={selectedResult.overallResult === 'PASS' || selectedResult.overallResult === 'PROMOTED' ? 'text-green' : 'text-red'}>
                          {selectedResult.overallResult || 'PASS'}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* ── RECEPTION TEMPLATE ── */}
                  {selectedResult.reportType === 'reception' && (
                    <div className="cognitive-section">
                      <div className="domain-title">COGNITIVE DOMAIN</div>
                      <table className="report-table">
                        <thead>
                          <tr>
                            <th colSpan={2} style={{ width: '35%' }}>SUBJECTS</th>
                            <th>TEACHER'S REMARK</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(selectedResult.receptionSubjects || []).map((s, i) => (
                            <tr key={i}>
                              <td className="subject-main">{s.subject}</td>
                              <td className="subject-sub">{s.subSubject}</td>
                              <td>{s.remark}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* ── STANDARD TEMPLATE ── */}
                  {selectedResult.reportType !== 'reception' && (
                    <>
                      <div className="cognitive-section">
                        <table className="report-table">
                          <thead>
                            <tr>
                              <th style={{ textAlign: 'left' }}>SUBJECTS</th>
                              <th>CAT (30%)</th>
                              <th>Exams (70%)</th>
                              <th>TOTAL</th>
                              <th>GRADE</th>
                              <th>REMARK</th>
                              <th>POSITION/SUBJECT</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(selectedResult.subjects || []).map((s, i) => {
                              const catVal   = s.cat  !== null && s.cat  !== undefined ? s.cat  : '—';
                              const examVal  = s.exam !== null && s.exam !== undefined ? s.exam : '—';
                              const totalVal = (s.cat !== null && s.exam !== null)     ? s.total : '—';
                              return (
                                <tr key={i}>
                                  <td><strong>{s.subject}</strong></td>
                                  <td className="center">{catVal}</td>
                                  <td className="center">{examVal}</td>
                                  <td className="center"><strong>{totalVal}</strong></td>
                                  <td className="center"><strong>{s.grade || '—'}</strong></td>
                                  <td>{s.remark || '—'}</td>
                                  <td className="center">{s.subjectPosition || '—'}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* Total score */}
                      {selectedResult.totalScore > 0 && (
                        <div className="total-score-row">
                          Total Score: <strong>{selectedResult.totalScore}</strong>
                          &nbsp;&nbsp;|&nbsp;&nbsp;
                          Student Average: <strong>{selectedResult.studentAverage}</strong>
                          &nbsp;&nbsp;|&nbsp;&nbsp;
                          
                        </div>
                      )}

                      {/* Affective + Psychomotor */}
                      {((selectedResult.affectiveDomain?.length > 0) || (selectedResult.psychomotorDomain?.length > 0)) && (
                        <div className="domain-two-col">
                          {selectedResult.affectiveDomain?.length > 0 && (
                            <div className="domain-box">
                              <div className="domain-title">AFFECTIVE DOMAIN</div>
                              <table className="domain-table">
                                <thead><tr><th>TRAITS</th><th>5</th><th>4</th><th>3</th><th>2</th><th>1</th></tr></thead>
                                <tbody>
                                  {selectedResult.affectiveDomain.map((t, i) => (
                                    <tr key={i}>
                                      <td>{i+1}. {t.trait}</td>
                                      {[5,4,3,2,1].map(n => (
                                        <td key={n} className="rating-cell">{Number(t.rating) === n ? '✓' : ''}</td>
                                      ))}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                          {selectedResult.psychomotorDomain?.length > 0 && (
                            <div className="domain-box">
                              <div className="domain-title">PSYCHOMOTOR DOMAIN</div>
                              <table className="domain-table">
                                <thead><tr><th>TRAITS</th><th>5</th><th>4</th><th>3</th><th>2</th><th>1</th></tr></thead>
                                <tbody>
                                  {selectedResult.psychomotorDomain.map((t, i) => (
                                    <tr key={i}>
                                      <td>{i+1}. {t.trait}</td>
                                      {[5,4,3,2,1].map(n => (
                                        <td key={n} className="rating-cell">{Number(t.rating) === n ? '✓' : ''}</td>
                                      ))}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                              <div className="behaviour-scale">
                                <strong>BEHAVIOUR &amp; SKILLS SCALE</strong><br/>
                                Excellent: 5, Very Good: 4, Good: 3, Fair: 2, Poor: 1
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="cognitive-keys">
                        <strong>Cognitive Keys:</strong>&nbsp;
                        Excellent 70–100 A &nbsp;|&nbsp; Very Good 60–69 B &nbsp;|&nbsp; Good 50–59 C &nbsp;|&nbsp; Fair 45–49 D &nbsp;|&nbsp; Poor 40–44 E &nbsp;|&nbsp; Fail 0–39 F
                      </div>
                    </>
                  )}

                  {/* ── COMMENTS ── */}
                  <div className="report-comments">
                    <div className="comment-row"><span>Class Teacher's Remark:</span><p>{selectedResult.teacherComment || '___________________________'}</p></div>
                    <div className="comment-row"><span>Head Teacher's Remark:</span><p>{selectedResult.headComment || '___________________________'}</p></div>
                    <div className="comment-row"><span>Next Term Begins:</span><p>{selectedResult.nextTermBegins || '___________________________'}</p></div>
                    <div className="comment-row"><span>Next Term Fee:</span><p>{selectedResult.nextTermFee || '___________________________'}</p></div>
                  </div>

                </div>
              )}

              {selectedResult && (
                <div className="print-bar">
                  <button className="btn btn-primary" onClick={handlePrint}>
                    <i className="fa-solid fa-print"></i> Print Report Card
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

// Helper for ordinal suffix on position
function ordinalSuffix(n) {
  const s = ['th','st','nd','rd'];
  const v = n % 100;
  return s[(v-20)%10] || s[v] || s[0];
}
