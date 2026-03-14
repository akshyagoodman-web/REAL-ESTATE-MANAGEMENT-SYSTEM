const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'kalahandi_realestate.db');
const db = new Database(dbPath);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initializeDatabase() {
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      mobile TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT CHECK(role IN ('buyer', 'seller')) NOT NULL,
      email TEXT,
      profile_image TEXT,
      address TEXT,
      is_verified INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // OTP table
  db.exec(`
    CREATE TABLE IF NOT EXISTS otps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mobile TEXT NOT NULL,
      otp TEXT NOT NULL,
      purpose TEXT CHECK(purpose IN ('register', 'login', 'reset')) NOT NULL,
      expires_at DATETIME NOT NULL,
      is_used INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Properties table
  db.exec(`
    CREATE TABLE IF NOT EXISTS properties (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      seller_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      property_type TEXT CHECK(property_type IN ('land', 'house', 'commercial', 'apartment', 'plot', 'farm')) NOT NULL,
      listing_type TEXT CHECK(listing_type IN ('sale', 'rent')) DEFAULT 'sale',
      price REAL NOT NULL,
      price_unit TEXT CHECK(price_unit IN ('total', 'per_acre', 'per_sqft')) DEFAULT 'total',
      area REAL,
      area_unit TEXT CHECK(area_unit IN ('sqft', 'sqm', 'acre', 'cent', 'guntha', 'bigha')) DEFAULT 'sqft',
      bedrooms INTEGER DEFAULT 0,
      bathrooms INTEGER DEFAULT 0,
      address TEXT NOT NULL,
      village TEXT,
      block TEXT,
      district TEXT DEFAULT 'Kalahandi',
      state TEXT DEFAULT 'Odisha',
      pincode TEXT,
      latitude REAL,
      longitude REAL,
      road_access TEXT,
      water_source TEXT,
      electricity INTEGER DEFAULT 0,
      boundary_wall INTEGER DEFAULT 0,
      facing TEXT,
      status TEXT CHECK(status IN ('available', 'sold', 'rented', 'pending')) DEFAULT 'available',
      is_featured INTEGER DEFAULT 0,
      views INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Property images table
  db.exec(`
    CREATE TABLE IF NOT EXISTS property_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      property_id INTEGER NOT NULL,
      image_path TEXT NOT NULL,
      is_primary INTEGER DEFAULT 0,
      caption TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
    )
  `);

  // Inquiries / Contact table
  db.exec(`
    CREATE TABLE IF NOT EXISTS inquiries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      property_id INTEGER NOT NULL,
      buyer_id INTEGER NOT NULL,
      seller_id INTEGER NOT NULL,
      message TEXT NOT NULL,
      contact_mobile TEXT,
      status TEXT CHECK(status IN ('pending', 'responded', 'closed')) DEFAULT 'pending',
      seller_response TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
      FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Saved/Wishlist properties
  db.exec(`
    CREATE TABLE IF NOT EXISTS saved_properties (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      property_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, property_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
    )
  `);

  // Property views tracking
  db.exec(`
    CREATE TABLE IF NOT EXISTS property_views (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      property_id INTEGER NOT NULL,
      user_id INTEGER,
      ip_address TEXT,
      viewed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
    )
  `);

  console.log('✅ Database initialized successfully');
  return db;
}

initializeDatabase();

module.exports = db;
