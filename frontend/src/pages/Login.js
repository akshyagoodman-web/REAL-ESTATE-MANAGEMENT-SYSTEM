import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FaPhone, FaLock, FaEye, FaEyeSlash, FaBuilding } from 'react-icons/fa';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const from = location.state?.from?.pathname || '/';

  const [mode, setMode] = useState('password'); // password | otp
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [sentOtp, setSentOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const sendOTP = async () => {
    if (!/^[6-9]\d{9}$/.test(mobile)) return toast.error('Enter a valid 10-digit mobile number');
    setLoading(true);
    try {
      const res = await api.post('/auth/send-otp', { mobile, purpose: 'login' });
      setOtpSent(true);
      if (res.data.otp) setSentOtp(res.data.otp);
      toast.success('OTP sent to your mobile!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP');
    } finally { setLoading(false); }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!/^[6-9]\d{9}$/.test(mobile)) return toast.error('Enter a valid mobile number');
    setLoading(true);
    try {
      let res;
      if (mode === 'password') {
        res = await api.post('/auth/login', { mobile, password });
      } else {
        res = await api.post('/auth/login-otp', { mobile, otp });
      }
      login(res.data.token, res.data.user);
      toast.success(`Welcome back, ${res.data.user.name}! 👋`);
      const dest = res.data.user.role === 'seller' ? '/seller/dashboard' : '/properties';
      navigate(from !== '/' ? from : dest);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-branding">
          <div className="auth-logo"><FaBuilding /></div>
          <h1 className="auth-brand-name">Kalahandi<br />Real Estate</h1>
          <p className="auth-brand-tagline">Your trusted partner for buying and selling properties in Western Odisha</p>
          <div className="auth-features">
            <div className="auth-feature"><span>🔒</span> Secure OTP-based login</div>
            <div className="auth-feature"><span>🏘️</span> 100s of properties listed</div>
            <div className="auth-feature"><span>📞</span> Direct seller contact</div>
            <div className="auth-feature"><span>💼</span> Buyer & Seller dashboard</div>
          </div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-card">
          <h2 className="auth-title">Welcome Back</h2>
          <p className="auth-subtitle">Login to your Kalahandi Real Estate account</p>

          <div className="tab-switch">
            <button className={`tab-btn ${mode === 'password' ? 'active' : ''}`} onClick={() => setMode('password')}>Password Login</button>
            <button className={`tab-btn ${mode === 'otp' ? 'active' : ''}`} onClick={() => setMode('otp')}>OTP Login</button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Mobile Number *</label>
              <div className="input-icon-wrap">
                <FaPhone className="input-icon" />
                <input type="tel" className="form-control has-icon" placeholder="10-digit mobile number" value={mobile} onChange={e => setMobile(e.target.value)} maxLength={10} required />
              </div>
            </div>

            {mode === 'password' ? (
              <div className="form-group">
                <label className="form-label">Password *</label>
                <div className="input-icon-wrap">
                  <FaLock className="input-icon" />
                  <input type={showPwd ? 'text' : 'password'} className="form-control has-icon has-icon-right" placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)} required />
                  <button type="button" className="input-icon-right" onClick={() => setShowPwd(!showPwd)}>{showPwd ? <FaEyeSlash /> : <FaEye />}</button>
                </div>
              </div>
            ) : (
              <div className="form-group">
                <label className="form-label">OTP</label>
                <div className="input-with-btn">
                  <input type="text" className="form-control" placeholder="Enter 6-digit OTP" value={otp} onChange={e => setOtp(e.target.value)} maxLength={6} style={{flex:1}} />
                  <button type="button" className="btn btn-outline btn-sm" onClick={sendOTP} disabled={loading}>
                    {otpSent ? 'Resend OTP' : 'Send OTP'}
                  </button>
                </div>
                {sentOtp && <div className="dev-otp">🔑 Dev OTP: <strong>{sentOtp}</strong></div>}
              </div>
            )}

            <button type="submit" className="btn btn-primary w-full btn-lg" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <p className="auth-switch">Don't have an account? <Link to="/register">Register here</Link></p>
        </div>
      </div>
    </div>
  );
}
