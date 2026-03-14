import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaHome, FaBars, FaTimes, FaUser, FaSignOutAlt, FaPlus, FaHeart, FaEnvelope, FaBuilding } from 'react-icons/fa';
import './Navbar.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setProfileOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="navbar-brand">
          <div className="brand-icon"><FaBuilding /></div>
          <div>
            <div className="brand-name">Kalahandi</div>
            <div className="brand-sub">Real Estate</div>
          </div>
        </Link>

        <div className={`navbar-links ${menuOpen ? 'open' : ''}`}>
          <Link to="/properties" className={`nav-link ${isActive('/properties') ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>Browse Properties</Link>
          {user?.role === 'seller' && (
            <>
              <Link to="/seller/add-property" className={`nav-link ${isActive('/seller/add-property') ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>List Property</Link>
              <Link to="/seller/dashboard" className={`nav-link ${isActive('/seller/dashboard') ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>My Listings</Link>
              <Link to="/seller/inquiries" className={`nav-link ${isActive('/seller/inquiries') ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>Inquiries</Link>
            </>
          )}
          {user?.role === 'buyer' && (
            <>
              <Link to="/buyer/saved" className={`nav-link ${isActive('/buyer/saved') ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>Saved</Link>
              <Link to="/buyer/inquiries" className={`nav-link ${isActive('/buyer/inquiries') ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>My Inquiries</Link>
            </>
          )}
        </div>

        <div className="navbar-actions">
          {user ? (
            <div className="profile-menu">
              <button className="profile-btn" onClick={() => setProfileOpen(!profileOpen)}>
                <div className="avatar">{user.name?.charAt(0).toUpperCase()}</div>
                <span className="profile-name">{user.name?.split(' ')[0]}</span>
              </button>
              {profileOpen && (
                <div className="profile-dropdown">
                  <div className="dropdown-header">
                    <div className="avatar-lg">{user.name?.charAt(0).toUpperCase()}</div>
                    <div>
                      <div className="dropdown-name">{user.name}</div>
                      <div className="dropdown-role">{user.role}</div>
                      <div className="dropdown-mobile">{user.mobile}</div>
                    </div>
                  </div>
                  <div className="dropdown-divider" />
                  <Link to="/profile" className="dropdown-item" onClick={() => setProfileOpen(false)}><FaUser /> My Profile</Link>
                  {user.role === 'seller' && <Link to="/seller/add-property" className="dropdown-item" onClick={() => setProfileOpen(false)}><FaPlus /> Add Property</Link>}
                  {user.role === 'buyer' && <Link to="/buyer/saved" className="dropdown-item" onClick={() => setProfileOpen(false)}><FaHeart /> Saved Properties</Link>}
                  <Link to={user.role === 'seller' ? '/seller/inquiries' : '/buyer/inquiries'} className="dropdown-item" onClick={() => setProfileOpen(false)}><FaEnvelope /> Inquiries</Link>
                  <div className="dropdown-divider" />
                  <button className="dropdown-item danger" onClick={handleLogout}><FaSignOutAlt /> Logout</button>
                </div>
              )}
            </div>
          ) : (
            <div className="auth-btns">
              <Link to="/login" className="btn btn-ghost btn-sm">Login</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Register</Link>
            </div>
          )}
          <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>
      </div>
      {profileOpen && <div className="overlay" onClick={() => setProfileOpen(false)} />}
    </nav>
  );
}
