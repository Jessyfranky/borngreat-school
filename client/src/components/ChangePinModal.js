import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import '../styles/Modal.css';

export default function ChangePinModal({ onClose }) {
  const { user, changePin } = useAuth();
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (newPin !== confirmPin) { setError('New PINs do not match'); return; }
    if (newPin.length < 4) { setError('PIN must be at least 4 characters'); return; }
    if (newPin === '0000') { setError('Please choose a more secure PIN'); return; }

    setLoading(true);
    try {
      await changePin(currentPin, newPin);
      setSuccess(true);
      setTimeout(onClose, 1500);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to change PIN');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box modal-sm">
        <div className="modal-header">
          <h2>Change PIN</h2>
          {!user?.mustChangePin && <button className="modal-close" onClick={onClose}>✕</button>}
        </div>

        {user?.mustChangePin && (
          <div className="alert alert-info">
            🔐 Welcome! Please change your default PIN before continuing.
          </div>
        )}

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">✓ PIN changed successfully!</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Current PIN</label>
            <input type="password" value={currentPin} onChange={e => setCurrentPin(e.target.value)} placeholder="Your current PIN" required />
          </div>
          <div className="form-group">
            <label>New PIN</label>
            <input type="password" value={newPin} onChange={e => setNewPin(e.target.value)} placeholder="New PIN (min 4 characters)" required />
          </div>
          <div className="form-group">
            <label>Confirm New PIN</label>
            <input type="password" value={confirmPin} onChange={e => setConfirmPin(e.target.value)} placeholder="Repeat new PIN" required />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Changing...' : 'Change PIN'}
          </button>
        </form>
      </div>
    </div>
  );
}