const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database');
const { authenticate } = require('../middleware/auth');

// Generate 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// In development, OTP is returned in response (in production, send via SMS)
function sendOTP(mobile, otp) {
  console.log(`📱 OTP for ${mobile}: ${otp}`);
  // TODO: Integrate SMS gateway (Twilio, MSG91, etc.)
  return true;
}

// POST /api/auth/send-otp - Send OTP for registration
router.post('/send-otp', (req, res) => {
  const { mobile, purpose } = req.body;
  if (!mobile || !/^[6-9]\d{9}$/.test(mobile)) {
    return res.status(400).json({ success: false, message: 'Invalid mobile number.' });
  }
  if (!['register', 'login', 'reset'].includes(purpose)) {
    return res.status(400).json({ success: false, message: 'Invalid OTP purpose.' });
  }

  // For register: check mobile not already used
  if (purpose === 'register') {
    const existing = db.prepare('SELECT id FROM users WHERE mobile = ?').get(mobile);
    if (existing) {
      return res.status(409).json({ success: false, message: 'Mobile number already registered.' });
    }
  }
  // For login: check mobile exists
  if (purpose === 'login' || purpose === 'reset') {
    const existing = db.prepare('SELECT id FROM users WHERE mobile = ?').get(mobile);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Mobile number not registered.' });
    }
  }

  // Invalidate previous OTPs
  db.prepare('UPDATE otps SET is_used = 1 WHERE mobile = ? AND purpose = ? AND is_used = 0').run(mobile, purpose);

  const otp = generateOTP();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 min

  db.prepare('INSERT INTO otps (mobile, otp, purpose, expires_at) VALUES (?, ?, ?, ?)').run(mobile, otp, purpose, expiresAt);
  sendOTP(mobile, otp);

  res.json({
    success: true,
    message: 'OTP sent successfully.',
    // In development, expose OTP
    ...(process.env.NODE_ENV === 'development' && { otp, note: 'OTP exposed in development mode only' })
  });
});

// POST /api/auth/verify-otp - Verify OTP
router.post('/verify-otp', (req, res) => {
  const { mobile, otp, purpose } = req.body;
  if (!mobile || !otp || !purpose) {
    return res.status(400).json({ success: false, message: 'Mobile, OTP and purpose required.' });
  }

  const record = db.prepare(
    'SELECT * FROM otps WHERE mobile = ? AND otp = ? AND purpose = ? AND is_used = 0 AND expires_at > datetime("now") ORDER BY created_at DESC LIMIT 1'
  ).get(mobile, otp, purpose);

  if (!record) {
    return res.status(400).json({ success: false, message: 'Invalid or expired OTP.' });
  }

  db.prepare('UPDATE otps SET is_used = 1 WHERE id = ?').run(record.id);
  res.json({ success: true, message: 'OTP verified successfully.' });
});

// POST /api/auth/register - Register new user
router.post('/register', async (req, res) => {
  const { name, mobile, password, role, email, otp } = req.body;

  if (!name || !mobile || !password || !role) {
    return res.status(400).json({ success: false, message: 'Name, mobile, password and role are required.' });
  }
  if (!['buyer', 'seller'].includes(role)) {
    return res.status(400).json({ success: false, message: 'Role must be buyer or seller.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
  }

  // Verify OTP
  if (otp) {
    const otpRecord = db.prepare(
      'SELECT * FROM otps WHERE mobile = ? AND otp = ? AND purpose = ? AND is_used = 0 AND expires_at > datetime("now") ORDER BY created_at DESC LIMIT 1'
    ).get(mobile, otp, 'register');
    if (!otpRecord) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP.' });
    }
    db.prepare('UPDATE otps SET is_used = 1 WHERE id = ?').run(otpRecord.id);
  }

  const existing = db.prepare('SELECT id FROM users WHERE mobile = ?').get(mobile);
  if (existing) {
    return res.status(409).json({ success: false, message: 'Mobile number already registered.' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const result = db.prepare(
    'INSERT INTO users (name, mobile, password, role, email, is_verified) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(name, mobile, hashedPassword, role, email || null, otp ? 1 : 0);

  const token = jwt.sign({ userId: result.lastInsertRowid, role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
  const user = db.prepare('SELECT id, name, mobile, role, email, is_verified, created_at FROM users WHERE id = ?').get(result.lastInsertRowid);

  res.status(201).json({ success: true, message: 'Registration successful.', token, user });
});

// POST /api/auth/login - Login with password
router.post('/login', async (req, res) => {
  const { mobile, password } = req.body;
  if (!mobile || !password) {
    return res.status(400).json({ success: false, message: 'Mobile and password required.' });
  }

  const user = db.prepare('SELECT * FROM users WHERE mobile = ? AND is_active = 1').get(mobile);
  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid mobile or password.' });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(401).json({ success: false, message: 'Invalid mobile or password.' });
  }

  const token = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
  const { password: _, ...userWithoutPassword } = user;

  res.json({ success: true, message: 'Login successful.', token, user: userWithoutPassword });
});

// POST /api/auth/login-otp - Login with OTP
router.post('/login-otp', (req, res) => {
  const { mobile, otp } = req.body;
  if (!mobile || !otp) {
    return res.status(400).json({ success: false, message: 'Mobile and OTP required.' });
  }

  const otpRecord = db.prepare(
    'SELECT * FROM otps WHERE mobile = ? AND otp = ? AND purpose = "login" AND is_used = 0 AND expires_at > datetime("now") ORDER BY created_at DESC LIMIT 1'
  ).get(mobile, otp);

  if (!otpRecord) {
    return res.status(400).json({ success: false, message: 'Invalid or expired OTP.' });
  }

  const user = db.prepare('SELECT * FROM users WHERE mobile = ? AND is_active = 1').get(mobile);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found.' });
  }

  db.prepare('UPDATE otps SET is_used = 1 WHERE id = ?').run(otpRecord.id);
  const token = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
  const { password: _, ...userWithoutPassword } = user;

  res.json({ success: true, message: 'Login successful.', token, user: userWithoutPassword });
});

// GET /api/auth/me - Get current user
router.get('/me', authenticate, (req, res) => {
  const user = db.prepare('SELECT id, name, mobile, role, email, profile_image, address, is_verified, created_at FROM users WHERE id = ?').get(req.user.id);
  res.json({ success: true, user });
});

// PUT /api/auth/update-profile - Update profile
router.put('/update-profile', authenticate, async (req, res) => {
  const { name, email, address, password, newPassword } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);

  let hashedPassword = user.password;
  if (newPassword) {
    if (!password) return res.status(400).json({ success: false, message: 'Current password required.' });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ success: false, message: 'Current password incorrect.' });
    hashedPassword = await bcrypt.hash(newPassword, 10);
  }

  db.prepare('UPDATE users SET name = ?, email = ?, address = ?, password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(name || user.name, email || user.email, address || user.address, hashedPassword, req.user.id);

  const updated = db.prepare('SELECT id, name, mobile, role, email, address, is_verified FROM users WHERE id = ?').get(req.user.id);
  res.json({ success: true, message: 'Profile updated.', user: updated });
});

module.exports = router;
