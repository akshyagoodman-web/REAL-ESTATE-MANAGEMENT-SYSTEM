import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { FaUser, FaPhone, FaLock, FaEye, FaEyeSlash, FaHome, FaBuilding } from 'react-icons/fa';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

export default function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [searchParams] = useSearchParams();
  const defaultRole = searchParams.get('role') || 'buyer';

  const [step, setStep] = useState(1); // 1: form, 2: OTP verify
  const [form, setForm] = useState({ name: '', mobile: '', password: '', confirmPassword: '', role: defaultRole, email: '' });
  const [otp, setOtp] = useState('');
  const [sentOtp, setSentOtp] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const sendOTP = async () => {
    if (!/^[6-9]\d{9}$/.test(form.mobile)) return toast.error('Enter a valid 10-digit mobile number');
    setLoading(true);
    try {
      const res = await api.post('/auth/send-otp', { mobile: form.mobile, purpose: 'register' });
      setOtpSent(true);
      if (res.data.otp) setSentOtp(res.data.otp); // dev mode
      toast.success('OTP sent to your mobile!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP');
    } finally { setLoading(false); }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Name is required');
    if (!/^[6-9]\d{9}$/.test(form.mobile)) return toast.error('Enter a valid mobile number');
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
    if (form.password !== form.confirmPassword) return toast.error('Passwords do not match');

    setLoading(true);
    try {
      const payload = { name: form.name, mobile: form.mobile, password: form.password, role: form.role, email: form.email };
      if (otp) payload.otp = otp;
      const res = await api.post('/auth/register', payload);
      login(res.data.token, res.data.user);
      toast.success('Registration successful! Welcome aboard 🎉');
      navigate(form.role === 'seller' ? '/seller/dashboard' : '/properties');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-branding">
          <div className="auth-logo"><FaBuilding /></div>
          <h1 className="auth-brand-name">Kalahandi<br />Real Estate</h1>
          <p className="auth-brand-tagline">Western Odisha's Most Trusted Property Platform</p>
          <div className="auth-features">
            <div className="auth-feature"><span>🏡</span> List & sell properties directly</div>
            <div className="auth-feature"><span>🔍</span> Search across 10+ districts</div>
            <div className="auth-feature"><span>📱</span> Connect with buyers/sellers directly</div>
            <div className="auth-feature"><span>✅</span> Verified listings & secure platform</div>
          </div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-card">
          <h2 className="auth-title">Create Account</h2>
          <p className="auth-subtitle">Join Kalahandi Real Estate today</p>

          {/* Role Selection */}
          <div className="role-selector">
            <button type="button" className={`role-btn ${form.role === 'buyer' ? 'active' : ''}`} onClick={() => setForm({ ...form, role: 'buyer' })}>
              <FaHome /> <span>I'm a Buyer</span>
              <small>Looking to buy/rent</small>
            </button>
            <button type="button" className={`role-btn ${form.role === 'seller' ? 'active' : ''}`} onClick={() => setForm({ ...form, role: 'seller' })}>
              <FaBuilding /> <span>I'm a Seller</span>
              <small>Want to list property</small>
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <div className="input-icon-wrap">
                <FaUser className="input-icon" />
                <input type="text" name="name" className="form-control has-icon" placeholder="Enter your full name" value={form.name} onChange={handleChange} required />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Mobile Number *</label>
              <div className="input-with-btn">
                <div className="input-icon-wrap" style={{flex:1}}>
                  <FaPhone className="input-icon" />
                  <input type="tel" name="mobile" className="form-control has-icon" placeholder="10-digit mobile number" value={form.mobile} onChange={handleChange} maxLength={10} required />
                </div>
                <button type="button" className="btn btn-outline btn-sm" onClick={sendOTP} disabled={loading || otpSent}>
                  {otpSent ? 'Resend' : 'Send OTP'}
                </button>
              </div>
              {sentOtp && <div className="dev-otp">🔑 Dev OTP: <strong>{sentOtp}</strong></div>}
            </div>

            {otpSent && (
              <div className="form-group">
                <label className="form-label">Enter OTP (optional but recommended)</label>
                <input type="text" className="form-control" placeholder="6-digit OTP" value={otp} onChange={e => setOtp(e.target.value)} maxLength={6} />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Email (optional)</label>
              <input type="email" name="email" className="form-control" placeholder="your@email.com" value={form.email} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label className="form-label">Password *</label>
              <div className="input-icon-wrap">
                <FaLock className="input-icon" />
                <input type={showPwd ? 'text' : 'password'} name="password" className="form-control has-icon has-icon-right" placeholder="Min 6 characters" value={form.password} onChange={handleChange} required />
                <button type="button" className="input-icon-right" onClick={() => setShowPwd(!showPwd)}>{showPwd ? <FaEyeSlash /> : <FaEye />}</button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Confirm Password *</label>
              <div className="input-icon-wrap">
                <FaLock className="input-icon" />
                <input type="password" name="confirmPassword" className="form-control has-icon" placeholder="Re-enter password" value={form.confirmPassword} onChange={handleChange} required />
              </div>
            </div>

            <button type="submit" className="btn btn-primary w-full btn-lg" disabled={loading}>
              {loading ? 'Creating Account...' : `Register as ${form.role === 'buyer' ? 'Buyer' : 'Seller'}`}
            </button>
          </form>

          <p className="auth-switch">Already have an account? <Link to="/login">Login here</Link></p>
        </div>
      </div>
    </div>
  );
}
