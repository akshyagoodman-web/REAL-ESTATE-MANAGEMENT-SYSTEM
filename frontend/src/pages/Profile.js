import React, { useState } from 'react';
import { FaUser, FaPhone, FaEnvelope, FaMapMarkerAlt, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '', address: user?.address || '' });
  const [pwdForm, setPwdForm] = useState({ password: '', newPassword: '', confirmNew: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);

  const handleUpdate = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.put('/auth/update-profile', { name: form.name, email: form.email, address: form.address });
      updateUser(res.data.user);
      toast.success('Profile updated!');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to update'); }
    setLoading(false);
  };

  const handlePwd = async e => {
    e.preventDefault();
    if (pwdForm.newPassword !== pwdForm.confirmNew) return toast.error('Passwords do not match');
    if (pwdForm.newPassword.length < 6) return toast.error('New password must be at least 6 characters');
    setPwdLoading(true);
    try {
      await api.put('/auth/update-profile', { password: pwdForm.password, newPassword: pwdForm.newPassword });
      toast.success('Password changed!');
      setPwdForm({ password: '', newPassword: '', confirmNew: '' });
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    setPwdLoading(false);
  };

  return (
    <div>
      <div className="page-header">
        <div className="container">
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 700, color: 'white', position: 'relative' }}>My Profile</h1>
        </div>
      </div>
      <div className="container" style={{ paddingTop: 28, paddingBottom: 60, maxWidth: 680 }}>
        {/* User Info Card */}
        <div className="card" style={{ padding: 24, marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
            <div style={{ width: 64, height: 64, background: 'linear-gradient(135deg, var(--primary), var(--earth))', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '1.8rem', fontWeight: 700 }}>
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 700 }}>{user?.name}</div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 }}>
                <span className="badge badge-primary" style={{ textTransform: 'capitalize' }}>{user?.role}</span>
                {user?.is_verified ? <span className="badge badge-success">✓ Verified</span> : <span className="badge badge-warning">Unverified</span>}
              </div>
            </div>
          </div>

          <form onSubmit={handleUpdate}>
            <div className="form-group">
              <label className="form-label"><FaUser /> Full Name *</label>
              <input type="text" className="form-control" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label"><FaPhone /> Mobile Number</label>
              <input type="text" className="form-control" value={user?.mobile} disabled style={{ background: 'var(--border-light)', cursor: 'not-allowed' }} />
              <small style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>Mobile number cannot be changed</small>
            </div>
            <div className="form-group">
              <label className="form-label"><FaEnvelope /> Email</label>
              <input type="email" className="form-control" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="your@email.com" />
            </div>
            <div className="form-group">
              <label className="form-label"><FaMapMarkerAlt /> Address</label>
              <textarea className="form-control" rows={3} value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Your address..." />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Updating...' : 'Update Profile'}</button>
          </form>
        </div>

        {/* Change Password */}
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 20 }}>🔒 Change Password</h3>
          <form onSubmit={handlePwd}>
            <div className="form-group">
              <label className="form-label">Current Password *</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <FaLock style={{ position: 'absolute', left: 14, color: 'var(--text-light)' }} />
                <input type={showPwd ? 'text' : 'password'} className="form-control" style={{ paddingLeft: 40 }} value={pwdForm.password} onChange={e => setPwdForm({ ...pwdForm, password: e.target.value })} required />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">New Password *</label>
              <input type="password" className="form-control" value={pwdForm.newPassword} onChange={e => setPwdForm({ ...pwdForm, newPassword: e.target.value })} placeholder="Min 6 characters" required />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm New Password *</label>
              <input type="password" className="form-control" value={pwdForm.confirmNew} onChange={e => setPwdForm({ ...pwdForm, confirmNew: e.target.value })} required />
            </div>
            <button type="submit" className="btn btn-outline" disabled={pwdLoading}>{pwdLoading ? 'Changing...' : 'Change Password'}</button>
          </form>
        </div>
      </div>
    </div>
  );
}
