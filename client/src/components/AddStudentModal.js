import { useState } from 'react';
import axios from 'axios';
import '../styles/Modal.css';

const CLASSES = [
  'Lower Reception', 'Upper Reception',
  'Nursery 1', 'Nursery 2',
  'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5',
  'JSS 1', 'JSS 2', 'JSS 3',
];

export default function AddStudentModal({ onClose, onAdded }) {
  const [mode, setMode] = useState('single'); // 'single' or 'bulk'
  const [form, setForm] = useState({ fullName: '', className: '', admissionYear: new Date().getFullYear() });
  const [bulkNames, setBulkNames] = useState('');
  const [bulkClass, setBulkClass] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSingle = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await axios.post('/api/students', form);
      onAdded(data.student);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to add student');
    } finally { setLoading(false); }
  };

  const handleBulk = async (e) => {
    e.preventDefault();
    setError('');
    if (!bulkClass) { setError('Please select a class'); return; }
    const names = bulkNames.split('\n').map(n => n.trim()).filter(Boolean);
    if (names.length === 0) { setError('Please enter at least one name'); return; }
    setLoading(true);
    try {
      const { data } = await axios.post('/api/students/bulk', {
        students: names,
        className: bulkClass,
        admissionYear: new Date().getFullYear()
      });
      onAdded(data.students);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to add students');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <h2>Add Student(s)</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-tabs">
          <button className={`modal-tab ${mode === 'single' ? 'active' : ''}`} onClick={() => setMode('single')}>Single Student</button>
          <button className={`modal-tab ${mode === 'bulk' ? 'active' : ''}`} onClick={() => setMode('bulk')}>Bulk (Whole Class)</button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {mode === 'single' ? (
          <form onSubmit={handleSingle}>
            <div className="form-group">
              <label>Full Name</label>
              <input value={form.fullName} onChange={e => setForm({...form, fullName: e.target.value})} placeholder="e.g. Amina Bello" required />
            </div>
            <div className="form-group">
              <label>Class</label>
              <select value={form.className} onChange={e => setForm({...form, className: e.target.value})} required>
                <option value="">Select class</option>
                {CLASSES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <p className="modal-hint">💡 Default PIN will be <strong>0000</strong>. Student must change it on first login.</p>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Adding...' : 'Add Student & Print Credentials'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleBulk}>
            <div className="form-group">
              <label>Class</label>
              <select value={bulkClass} onChange={e => setBulkClass(e.target.value)} required>
                <option value="">Select class</option>
                {CLASSES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Student Names (one per line)</label>
              <textarea
                value={bulkNames}
                onChange={e => setBulkNames(e.target.value)}
                rows={8}
                placeholder={"Amina Bello\nKofi Asante\nChidi Okafor\n..."}
              />
              <small style={{ color: 'var(--gray-400)', fontSize: '0.82rem' }}>
                Enter each student's full name on a separate line
              </small>
            </div>
            <p className="modal-hint">💡 All students will get PIN <strong>0000</strong>. A printable credential slip will be generated.</p>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Adding...' : 'Add All Students & Print Credentials'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}