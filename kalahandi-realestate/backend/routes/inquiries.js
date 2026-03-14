const express = require('express');
const router = express.Router();
const db = require('../database');
const { authenticate, requireRole } = require('../middleware/auth');

// POST /api/inquiries - Submit inquiry (buyer)
router.post('/', authenticate, requireRole('buyer'), (req, res) => {
  const { property_id, message, contact_mobile } = req.body;
  if (!property_id || !message) {
    return res.status(400).json({ success: false, message: 'Property ID and message required.' });
  }

  const property = db.prepare('SELECT * FROM properties WHERE id = ? AND status = "available"').get(property_id);
  if (!property) {
    return res.status(404).json({ success: false, message: 'Property not found.' });
  }

  const result = db.prepare(
    'INSERT INTO inquiries (property_id, buyer_id, seller_id, message, contact_mobile) VALUES (?, ?, ?, ?, ?)'
  ).run(property_id, req.user.id, property.seller_id, message, contact_mobile || null);

  res.status(201).json({ success: true, message: 'Inquiry sent successfully.', id: result.lastInsertRowid });
});

// GET /api/inquiries/my-inquiries - Buyer's sent inquiries
router.get('/my-inquiries', authenticate, requireRole('buyer'), (req, res) => {
  const inquiries = db.prepare(`
    SELECT i.*, p.title as property_title, p.address as property_address, p.price as property_price,
      p.property_type, u.name as seller_name, u.mobile as seller_mobile,
      (SELECT image_path FROM property_images WHERE property_id = p.id AND is_primary = 1 LIMIT 1) as property_image
    FROM inquiries i
    JOIN properties p ON i.property_id = p.id
    JOIN users u ON i.seller_id = u.id
    WHERE i.buyer_id = ?
    ORDER BY i.created_at DESC
  `).all(req.user.id);
  res.json({ success: true, data: inquiries });
});

// GET /api/inquiries/received - Seller's received inquiries
router.get('/received', authenticate, requireRole('seller'), (req, res) => {
  const { property_id, status } = req.query;
  let where = ['i.seller_id = ?'];
  let params = [req.user.id];
  if (property_id) { where.push('i.property_id = ?'); params.push(property_id); }
  if (status) { where.push('i.status = ?'); params.push(status); }

  const inquiries = db.prepare(`
    SELECT i.*, p.title as property_title, p.address as property_address, p.price as property_price,
      u.name as buyer_name, u.mobile as buyer_mobile,
      (SELECT image_path FROM property_images WHERE property_id = p.id AND is_primary = 1 LIMIT 1) as property_image
    FROM inquiries i
    JOIN properties p ON i.property_id = p.id
    JOIN users u ON i.buyer_id = u.id
    WHERE ${where.join(' AND ')}
    ORDER BY i.created_at DESC
  `).all(...params);
  res.json({ success: true, data: inquiries });
});

// PUT /api/inquiries/:id/respond - Seller responds
router.put('/:id/respond', authenticate, requireRole('seller'), (req, res) => {
  const { seller_response, status } = req.body;
  const inquiry = db.prepare('SELECT * FROM inquiries WHERE id = ? AND seller_id = ?').get(req.params.id, req.user.id);
  if (!inquiry) return res.status(404).json({ success: false, message: 'Inquiry not found.' });

  db.prepare('UPDATE inquiries SET seller_response = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(seller_response || inquiry.seller_response, status || 'responded', req.params.id);

  res.json({ success: true, message: 'Response sent.' });
});

// PUT /api/inquiries/:id/close - Close inquiry
router.put('/:id/close', authenticate, (req, res) => {
  const inquiry = db.prepare('SELECT * FROM inquiries WHERE id = ? AND (buyer_id = ? OR seller_id = ?)').get(req.params.id, req.user.id, req.user.id);
  if (!inquiry) return res.status(404).json({ success: false, message: 'Inquiry not found.' });
  db.prepare('UPDATE inquiries SET status = "closed", updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(req.params.id);
  res.json({ success: true, message: 'Inquiry closed.' });
});

module.exports = router;
