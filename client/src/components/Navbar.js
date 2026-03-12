import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Navbar.css';

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo */}
        <Link to="/" className="navbar-brand">
          <img src="/logo.jpeg" alt="Borngreat International Schools" className="brand-logo" />
          <div className="brand-text">
            <span className="brand-name">Borngreat School</span>
            <span className="brand-tagline">Future Secured and Assured</span>
          </div>
        </Link>

        {/* Desktop Links */}
        <div className="navbar-links">
          <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}><i className="fa-solid fa-house"></i> Home</Link>
          <Link to="/about" className={`nav-link ${isActive('/about') ? 'active' : ''}`}><i className="fa-solid fa-school"></i> About</Link>
          <Link to="/gallery" className={`nav-link ${isActive('/gallery') ? 'active' : ''}`}><i className="fa-solid fa-images"></i> Gallery</Link>
          <Link to="/contact" className={`nav-link ${isActive('/contact') ? 'active' : ''}`}><i className="fa-solid fa-envelope"></i> Contact</Link>
        </div>

        {/* Auth Button */}
        <div className="navbar-auth">
          {user ? (
            <div className="user-menu">
              <Link to="/portal" className="user-chip">
                <span className="user-avatar">{user.fullName[0]}</span>
                <span className="user-name">{user.fullName.split(' ')[0]}</span>
              </Link>
              <button onClick={handleLogout} className="btn btn-outline btn-sm">
                <i className="fa-solid fa-right-from-bracket"></i> Logout
              </button>
            </div>
          ) : (
            <Link to="/login" className="btn btn-primary btn-sm">
              <i className="fa-solid fa-lock"></i> School Portal
            </Link>
          )}
        </div>

        {/* Mobile Hamburger */}
        <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
          <span></span><span></span><span></span>
        </button>
      </div>

      {/* Mobile Menu */}
      <div className={`mobile-menu ${menuOpen ? 'open' : ''}`}>
        <Link to="/" onClick={() => setMenuOpen(false)}><i className="fa-solid fa-house"></i> Home</Link>
        <Link to="/about" onClick={() => setMenuOpen(false)}><i className="fa-solid fa-school"></i> About Us</Link>
        <Link to="/gallery" onClick={() => setMenuOpen(false)}><i className="fa-solid fa-images"></i> Gallery</Link>
        <Link to="/contact" onClick={() => setMenuOpen(false)}><i className="fa-solid fa-envelope"></i> Contact</Link>
        {user ? (
          <>
            <Link to="/portal" onClick={() => setMenuOpen(false)}><i className="fa-solid fa-gauge"></i> My Portal</Link>
            <button onClick={() => { handleLogout(); setMenuOpen(false); }}><i className="fa-solid fa-right-from-bracket"></i> Logout</button>
          </>
        ) : (
          <Link to="/login" onClick={() => setMenuOpen(false)}><i className="fa-solid fa-lock"></i> School Portal</Link>
        )}
      </div>
    </nav>
  );
}