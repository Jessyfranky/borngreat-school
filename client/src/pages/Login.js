import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Login.css';

export default function Login() {
  const [userId, setUserId] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login(userId.trim(), pin);
      navigate('/portal');
    } catch (err) {
      setError(err?.response?.data?.message || 'Login failed. Check your ID and PIN.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-left">
        <Link to="/" className="login-brand">
          <div className="brand-emblem-lg">BG</div>
          <div>
            <h2>Borngreat School</h2>
            <p>School Portal</p>
          </div>
        </Link>
        <div className="login-info">
          <h3>How to Login</h3>
          <div className="login-tip">
            <span className="tip-icon">👩‍🏫</span>
            <div>
              <strong>Teachers</strong>
              <p>Use your Staff ID (e.g., <code>BG-TCH-001</code>) and your password.</p>
            </div>
          </div>
          <div className="login-tip">
            <span className="tip-icon">🧒</span>
            <div>
              <strong>Students</strong>
              <p>Use your Student ID (e.g., <code>BG-2024-001</code>) and your PIN. The default PIN is <code>0000</code> — change it after first login.</p>
            </div>
          </div>
          <div className="login-tip">
            <span className="tip-icon">💡</span>
            <div>
              <strong>Don't know your ID?</strong>
              <p>Ask your teacher for your printed credential slip.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="login-right">
        <div className="login-form-card card">
          <div className="login-form-header">
            <h1>Welcome Back</h1>
            <p>Enter your credentials to access your portal</p>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Student ID or Staff ID</label>
              <input
                type="text"
                value={userId}
                onChange={e => setUserId(e.target.value)}
                placeholder="e.g. BG-2024-001 or BG-TCH-001"
                autoComplete="username"
                required
              />
            </div>
            <div className="form-group">
              <label>PIN / Password</label>
              <input
                type="password"
                value={pin}
                onChange={e => setPin(e.target.value)}
                placeholder="Enter your PIN"
                autoComplete="current-password"
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Logging in...' : 'Login to Portal →'}
            </button>
          </form>

          <p className="login-help">
            Having trouble? Contact your school admin for assistance.
          </p>
        </div>
      </div>
    </div>
  );
}