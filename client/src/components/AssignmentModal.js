import { useState } from 'react';
import axios from 'axios';
import '../styles/Modal.css';

const ALL_CLASSES = [
  'Lower Reception', 'Upper Reception',
  'Nursery 1', 'Nursery 2',
  'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5',
  'JSS 1', 'JSS 2', 'JSS 3',
];

export default function AssignmentModal({ onClose, onCreated, prefilledClass }) {
  const [form, setForm] = useState({
    title:       '',
    subject:     '',
    description: '',
    dueDate:     '',
    className:   prefilledClass || '',
  });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.title.trim() || !form.subject.trim() || !form.className) {
      setError('Title, subject and class are required.');
      return;
    }
    setLoading(true);
    try {
      const { data } = await axios.post('/api/assignments', form);
      onCreated(data.assignment);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to create assignment');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <h2><i className="fa-solid fa-clipboard-list"></i> New Assignment</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {error && <div className="alert alert-error"><i className="fa-solid fa-circle-exclamation"></i> {error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Assignment Title <span style={{ color: '#dc2626' }}>*</span></label>
            <input
              value={form.title}
              onChange={e => set('title', e.target.value)}
              placeholder="e.g. Draw and colour a plant"
              required
            />
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label>Subject <span style={{ color: '#dc2626' }}>*</span></label>
              <input
                value={form.subject}
                onChange={e => set('subject', e.target.value)}
                placeholder="e.g. Basic Science"
                required
              />
            </div>
            <div className="form-group">
              <label>Class <span style={{ color: '#dc2626' }}>*</span></label>
              <select value={form.className} onChange={e => set('className', e.target.value)} required>
                <option value="">Select class</option>
                {ALL_CLASSES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Due Date</label>
            <input
              value={form.dueDate}
              onChange={e => set('dueDate', e.target.value)}
              placeholder="e.g. Friday 20 March 2026"
            />
          </div>

          <div className="form-group">
            <label>Description / Instructions</label>
            <textarea
              value={form.description}
              onChange={e => set('description', e.target.value)}
              rows={4}
              placeholder="Describe what the student needs to do..."
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 8 }} disabled={loading}>
            {loading
              ? <><i className="fa-solid fa-spinner fa-spin"></i> Saving...</>
              : <><i className="fa-solid fa-paper-plane"></i> Post Assignment</>}
          </button>
        </form>
      </div>
    </div>
  );
}
