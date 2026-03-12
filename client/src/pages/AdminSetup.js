import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import '../styles/AdminSetup.css';

export default function AdminSetup() {
  const [fullName, setFullName] = useState('');
  const [pin, setPin] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (pin !== confirm) { setError("PINs don't match"); return; }
    if (pin.length < 4) { setError('PIN must be at least 4 characters'); return; }

    setLoading(true);
    try {
      const { data } = await axios.post('/api/admin/setup', { fullName, pin });
      setDone(data.admin);
    } catch (err) {
      setError(err?.response?.data?.message || 'Setup failed');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="setup-page">
        <div className="setup-card card">
          <div className="setup-success">
            <div className="success-icon"><i className="fa-solid fa-circle-check"></i></div>
            <h2>Admin Account Created!</h2>
            <p>Your admin account is ready. Save these credentials safely.</p>
            <div className="cred-box">
              <div className="cred-row">
                <span>Admin ID</span>
                <strong>{done.staffId}</strong>
              </div>
              <div className="cred-row">
                <span>Name</span>
                <strong>{done.fullName}</strong>
              </div>
              <div className="cred-row">
                <span>PIN</span>
                <strong>The one you just set</strong>
              </div>
            </div>
            <Link to="/login" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
              <i className="fa-solid fa-right-to-bracket"></i> Go to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="setup-page">
      <div className="setup-card card">
        <div className="setup-header">
          <img src="/logo.jpeg" alt="Logo" className="setup-logo" />
          <h1>Admin Setup</h1>
          <p>Create the administrator account for Borngreat International Schools portal. This can only be done once.</p>
        </div>

        {error && <div className="alert alert-error"><i className="fa-solid fa-circle-exclamation"></i> {error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label><i className="fa-solid fa-user"></i> Full Name</label>
            <input
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="e.g. Latifat Isonguyo Asada"
              required
            />
          </div>
          <div className="form-group">
            <label><i className="fa-solid fa-lock"></i> Create PIN / Password</label>
            <input
              type="password"
              value={pin}
              onChange={e => setPin(e.target.value)}
              placeholder="Minimum 4 characters"
              required
            />
          </div>
          <div className="form-group">
            <label><i className="fa-solid fa-lock"></i> Confirm PIN</label>
            <input
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="Repeat your PIN"
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
            {loading
              ? <><i className="fa-solid fa-spinner fa-spin"></i> Creating...</>
              : <><i className="fa-solid fa-shield-halved"></i> Create Admin Account</>
            }
          </button>
        </form>

        <p className="setup-note">
          <i className="fa-solid fa-circle-info"></i>
          Already have an account? <Link to="/login">Login here</Link>
        </p>
      </div>
    </div>
  );
}