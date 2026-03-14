const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../database');
const { authenticate, requireRole } = require('../middleware/auth');

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads/properties');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `prop_${Date.now()}_${Math.random().toString(36).substr(2, 9)}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only images allowed'), false);
  }
});

// GET /api/properties - List/search properties
router.get('/', (req, res) => {
  const {
    search, property_type, listing_type, district, block, village,
    min_price, max_price, min_area, max_area, status,
    sort = 'created_at', order = 'DESC', page = 1, limit = 12
  } = req.query;

  let where = ['p.status = "available"'];
  let params = [];

  if (search) {
    where.push('(p.title LIKE ? OR p.description LIKE ? OR p.address LIKE ? OR p.village LIKE ? OR p.block LIKE ?)');
    const s = `%${search}%`;
    params.push(s, s, s, s, s);
  }
  if (property_type) { where.push('p.property_type = ?'); params.push(property_type); }
  if (listing_type) { where.push('p.listing_type = ?'); params.push(listing_type); }
  if (district) { where.push('p.district LIKE ?'); params.push(`%${district}%`); }
  if (block) { where.push('p.block LIKE ?'); params.push(`%${block}%`); }
  if (village) { where.push('p.village LIKE ?'); params.push(`%${village}%`); }
  if (min_price) { where.push('p.price >= ?'); params.push(parseFloat(min_price)); }
  if (max_price) { where.push('p.price <= ?'); params.push(parseFloat(max_price)); }
  if (min_area) { where.push('p.area >= ?'); params.push(parseFloat(min_area)); }
  if (max_area) { where.push('p.area <= ?'); params.push(parseFloat(max_area)); }
  if (status) { where.push('p.status = ?'); params.push(status); }

  const validSorts = ['price', 'created_at', 'views', 'area'];
  const sortField = validSorts.includes(sort) ? sort : 'created_at';
  const sortOrder = order === 'ASC' ? 'ASC' : 'DESC';

  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
  const offset = (pageNum - 1) * limitNum;

  const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';

  const total = db.prepare(`SELECT COUNT(*) as count FROM properties p ${whereClause}`).get(...params);

  const properties = db.prepare(`
    SELECT p.*,
      u.name as seller_name, u.mobile as seller_mobile,
      (SELECT image_path FROM property_images WHERE property_id = p.id AND is_primary = 1 LIMIT 1) as primary_image,
      (SELECT COUNT(*) FROM property_images WHERE property_id = p.id) as image_count,
      (SELECT COUNT(*) FROM saved_properties WHERE property_id = p.id) as saves_count
    FROM properties p
    LEFT JOIN users u ON p.seller_id = u.id
    ${whereClause}
    ORDER BY p.is_featured DESC, p.${sortField} ${sortOrder}
    LIMIT ? OFFSET ?
  `).all(...params, limitNum, offset);

  res.json({
    success: true,
    data: properties,
    pagination: {
      total: total.count,
      page: pageNum,
      limit: limitNum,
      pages: Math.ceil(total.count / limitNum)
    }
  });
});

// GET /api/properties/featured - Featured properties
router.get('/featured', (req, res) => {
  const properties = db.prepare(`
    SELECT p.*,
      u.name as seller_name,
      (SELECT image_path FROM property_images WHERE property_id = p.id AND is_primary = 1 LIMIT 1) as primary_image
    FROM properties p
    LEFT JOIN users u ON p.seller_id = u.id
    WHERE p.status = 'available' AND p.is_featured = 1
    ORDER BY p.created_at DESC LIMIT 6
  `).all();
  res.json({ success: true, data: properties });
});

// GET /api/properties/stats - Stats for homepage
router.get('/stats', (req, res) => {
  const totalProps = db.prepare('SELECT COUNT(*) as count FROM properties WHERE status = "available"').get();
  const totalSellers = db.prepare('SELECT COUNT(*) as count FROM users WHERE role = "seller"').get();
  const totalBuyers = db.prepare('SELECT COUNT(*) as count FROM users WHERE role = "buyer"').get();
  const byType = db.prepare('SELECT property_type, COUNT(*) as count FROM properties WHERE status = "available" GROUP BY property_type').all();

  res.json({
    success: true,
    data: {
      total_properties: totalProps.count,
      total_sellers: totalSellers.count,
      total_buyers: totalBuyers.count,
      by_type: byType
    }
  });
});

// GET /api/properties/my-listings - Seller's own properties
router.get('/my-listings', authenticate, requireRole('seller'), (req, res) => {
  const properties = db.prepare(`
    SELECT p.*,
      (SELECT image_path FROM property_images WHERE property_id = p.id AND is_primary = 1 LIMIT 1) as primary_image,
      (SELECT COUNT(*) FROM property_images WHERE property_id = p.id) as image_count,
      (SELECT COUNT(*) FROM inquiries WHERE property_id = p.id) as inquiry_count
    FROM properties p
    WHERE p.seller_id = ?
    ORDER BY p.created_at DESC
  `).all(req.user.id);
  res.json({ success: true, data: properties });
});

// GET /api/properties/saved - Buyer's saved properties
router.get('/saved', authenticate, (req, res) => {
  const properties = db.prepare(`
    SELECT p.*, sp.created_at as saved_at,
      u.name as seller_name,
      (SELECT image_path FROM property_images WHERE property_id = p.id AND is_primary = 1 LIMIT 1) as primary_image
    FROM saved_properties sp
    JOIN properties p ON sp.property_id = p.id
    LEFT JOIN users u ON p.seller_id = u.id
    WHERE sp.user_id = ?
    ORDER BY sp.created_at DESC
  `).all(req.user.id);
  res.json({ success: true, data: properties });
});

// GET /api/properties/:id - Get single property
router.get('/:id', (req, res) => {
  const property = db.prepare(`
    SELECT p.*,
      u.name as seller_name, u.mobile as seller_mobile, u.email as seller_email,
      u.address as seller_address
    FROM properties p
    LEFT JOIN users u ON p.seller_id = u.id
    WHERE p.id = ?
  `).get(req.params.id);

  if (!property) {
    return res.status(404).json({ success: false, message: 'Property not found.' });
  }

  const images = db.prepare('SELECT * FROM property_images WHERE property_id = ? ORDER BY is_primary DESC').all(property.id);

  // Increment views
  db.prepare('UPDATE properties SET views = views + 1 WHERE id = ?').run(property.id);

  // Check if saved (if authenticated)
  let isSaved = false;
  const authHeader = req.headers.authorization;
  if (authHeader) {
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
      const saved = db.prepare('SELECT id FROM saved_properties WHERE user_id = ? AND property_id = ?').get(decoded.userId, property.id);
      isSaved = !!saved;
    } catch (e) {}
  }

  res.json({ success: true, data: { ...property, images, is_saved: isSaved } });
});

// POST /api/properties - Create property (seller only)
router.post('/', authenticate, requireRole('seller'), upload.array('images', 10), (req, res) => {
  const {
    title, description, property_type, listing_type, price, price_unit,
    area, area_unit, bedrooms, bathrooms, address, village, block, district,
    state, pincode, latitude, longitude, road_access, water_source,
    electricity, boundary_wall, facing
  } = req.body;

  if (!title || !description || !property_type || !price || !address) {
    return res.status(400).json({ success: false, message: 'Title, description, type, price and address required.' });
  }

  const result = db.prepare(`
    INSERT INTO properties (
      seller_id, title, description, property_type, listing_type, price, price_unit,
      area, area_unit, bedrooms, bathrooms, address, village, block, district,
      state, pincode, latitude, longitude, road_access, water_source,
      electricity, boundary_wall, facing
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    req.user.id, title, description, property_type, listing_type || 'sale', parseFloat(price), price_unit || 'total',
    area ? parseFloat(area) : null, area_unit || 'sqft', parseInt(bedrooms) || 0, parseInt(bathrooms) || 0,
    address, village || null, block || null, district || 'Kalahandi',
    state || 'Odisha', pincode || null, latitude ? parseFloat(latitude) : null, longitude ? parseFloat(longitude) : null,
    road_access || null, water_source || null,
    electricity === 'true' || electricity === '1' ? 1 : 0,
    boundary_wall === 'true' || boundary_wall === '1' ? 1 : 0,
    facing || null
  );

  const propertyId = result.lastInsertRowid;

  // Handle uploaded images
  if (req.files && req.files.length > 0) {
    const insertImage = db.prepare('INSERT INTO property_images (property_id, image_path, is_primary) VALUES (?, ?, ?)');
    req.files.forEach((file, idx) => {
      insertImage.run(propertyId, `/uploads/properties/${file.filename}`, idx === 0 ? 1 : 0);
    });
  }

  const property = db.prepare('SELECT * FROM properties WHERE id = ?').get(propertyId);
  const images = db.prepare('SELECT * FROM property_images WHERE property_id = ?').all(propertyId);

  res.status(201).json({ success: true, message: 'Property listed successfully.', data: { ...property, images } });
});

// PUT /api/properties/:id - Update property
router.put('/:id', authenticate, requireRole('seller'), upload.array('images', 10), (req, res) => {
  const property = db.prepare('SELECT * FROM properties WHERE id = ? AND seller_id = ?').get(req.params.id, req.user.id);
  if (!property) {
    return res.status(404).json({ success: false, message: 'Property not found or unauthorized.' });
  }

  const {
    title, description, property_type, listing_type, price, price_unit,
    area, area_unit, bedrooms, bathrooms, address, village, block, district,
    state, pincode, latitude, longitude, road_access, water_source,
    electricity, boundary_wall, facing, status, delete_images
  } = req.body;

  db.prepare(`
    UPDATE properties SET
      title = ?, description = ?, property_type = ?, listing_type = ?, price = ?, price_unit = ?,
      area = ?, area_unit = ?, bedrooms = ?, bathrooms = ?, address = ?, village = ?, block = ?,
      district = ?, state = ?, pincode = ?, latitude = ?, longitude = ?, road_access = ?,
      water_source = ?, electricity = ?, boundary_wall = ?, facing = ?, status = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    title || property.title, description || property.description,
    property_type || property.property_type, listing_type || property.listing_type,
    price ? parseFloat(price) : property.price, price_unit || property.price_unit,
    area ? parseFloat(area) : property.area, area_unit || property.area_unit,
    bedrooms !== undefined ? parseInt(bedrooms) : property.bedrooms,
    bathrooms !== undefined ? parseInt(bathrooms) : property.bathrooms,
    address || property.address, village || property.village, block || property.block,
    district || property.district, state || property.state, pincode || property.pincode,
    latitude ? parseFloat(latitude) : property.latitude, longitude ? parseFloat(longitude) : property.longitude,
    road_access || property.road_access, water_source || property.water_source,
    electricity !== undefined ? (electricity === 'true' || electricity === '1' ? 1 : 0) : property.electricity,
    boundary_wall !== undefined ? (boundary_wall === 'true' || boundary_wall === '1' ? 1 : 0) : property.boundary_wall,
    facing || property.facing, status || property.status,
    req.params.id
  );

  // Delete specified images
  if (delete_images) {
    const ids = JSON.parse(delete_images);
    ids.forEach(imgId => db.prepare('DELETE FROM property_images WHERE id = ? AND property_id = ?').run(imgId, req.params.id));
  }

  // Add new images
  if (req.files && req.files.length > 0) {
    const existingCount = db.prepare('SELECT COUNT(*) as c FROM property_images WHERE property_id = ?').get(req.params.id).c;
    const insertImage = db.prepare('INSERT INTO property_images (property_id, image_path, is_primary) VALUES (?, ?, ?)');
    req.files.forEach((file, idx) => {
      insertImage.run(req.params.id, `/uploads/properties/${file.filename}`, existingCount === 0 && idx === 0 ? 1 : 0);
    });
  }

  const updated = db.prepare('SELECT * FROM properties WHERE id = ?').get(req.params.id);
  const images = db.prepare('SELECT * FROM property_images WHERE property_id = ?').all(req.params.id);
  res.json({ success: true, message: 'Property updated.', data: { ...updated, images } });
});

// DELETE /api/properties/:id
router.delete('/:id', authenticate, requireRole('seller'), (req, res) => {
  const property = db.prepare('SELECT * FROM properties WHERE id = ? AND seller_id = ?').get(req.params.id, req.user.id);
  if (!property) {
    return res.status(404).json({ success: false, message: 'Property not found or unauthorized.' });
  }
  db.prepare('DELETE FROM properties WHERE id = ?').run(req.params.id);
  res.json({ success: true, message: 'Property deleted.' });
});

// POST /api/properties/:id/save - Save/unsave property
router.post('/:id/save', authenticate, (req, res) => {
  const existing = db.prepare('SELECT id FROM saved_properties WHERE user_id = ? AND property_id = ?').get(req.user.id, req.params.id);
  if (existing) {
    db.prepare('DELETE FROM saved_properties WHERE user_id = ? AND property_id = ?').run(req.user.id, req.params.id);
    return res.json({ success: true, saved: false, message: 'Removed from saved.' });
  }
  db.prepare('INSERT INTO saved_properties (user_id, property_id) VALUES (?, ?)').run(req.user.id, req.params.id);
  res.json({ success: true, saved: true, message: 'Property saved.' });
});

module.exports = router;
