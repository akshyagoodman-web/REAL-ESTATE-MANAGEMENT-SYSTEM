# 🏡 Kalahandi Real Estate
### Western Odisha's Trusted Property Platform

A full-stack real estate web application for buying, selling, and renting properties across **Kalahandi** and surrounding districts of Western Odisha.

---

## 🌟 Features

### 👤 Two User Types
- **Buyer** — Browse, search, filter, save properties & send inquiries
- **Seller** — List properties with photos, manage listings, respond to inquiries

### 🔐 Authentication System
- Register & login with **mobile number + password**
- **OTP-based login** (send OTP to mobile, verify & login)
- JWT token-based session management
- Role-based access (buyer/seller protected routes)

### 🏘️ Property Listings
- **6 property types**: Land, House, Commercial, Apartment, Plot, Farm
- Upload up to **10 photos** per property
- Detailed fields: area, price, bedrooms, bathrooms, road access, water source, electricity, boundary wall
- Full location: village, block, district, pincode

### 🔍 Search & Filter
- Search by keyword, title, village, location
- Filter by: property type, listing type (sale/rent), district, block, price range
- Sort by price, date, views
- Pagination

### 📬 Inquiry System
- Buyers send inquiries to sellers directly
- Sellers reply from their dashboard
- Status tracking: pending → responded → closed

### 💾 Save Properties
- Buyers can save/bookmark properties
- Dedicated saved properties page

### 📊 Seller Dashboard
- All listings table with status management
- Statistics: total listings, available, sold, inquiries
- Quick actions: add, edit, delete, change status

---

## 📁 Project Structure

```
kalahandi-realestate/
├── backend/                  # Node.js + Express API
│   ├── routes/
│   │   ├── auth.js           # Register, Login, OTP endpoints
│   │   ├── properties.js     # CRUD for properties
│   │   └── inquiries.js      # Inquiry management
│   ├── middleware/
│   │   └── auth.js           # JWT authentication middleware
│   ├── uploads/              # Property images stored here
│   ├── database.js           # SQLite DB setup & schema
│   ├── server.js             # Express app entry point
│   ├── .env                  # Environment variables
│   └── package.json
│
├── frontend/                 # React.js app
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.js     # Top navigation
│   │   │   ├── Footer.js     # Site footer
│   │   │   └── PropertyCard.js # Reusable property card
│   │   ├── context/
│   │   │   └── AuthContext.js # Global auth state
│   │   ├── pages/
│   │   │   ├── Home.js       # Landing page
│   │   │   ├── Login.js      # Login page
│   │   │   ├── Register.js   # Registration page
│   │   │   ├── Properties.js # Property listing + search
│   │   │   ├── PropertyDetail.js # Single property view
│   │   │   ├── SellerDashboard.js # Seller's listing manager
│   │   │   ├── AddProperty.js # Add/edit property form
│   │   │   ├── Inquiries.js  # Buyer & Seller inquiries
│   │   │   ├── SavedProperties.js # Buyer's saved list
│   │   │   └── Profile.js    # User profile editor
│   │   ├── utils/
│   │   │   └── api.js        # Axios instance & API base URL
│   │   ├── App.js            # Routes
│   │   └── index.js          # Entry point
│   └── package.json
│
├── start-windows.bat         # One-click start for Windows
├── start-linux-mac.sh        # One-click start for Linux/Mac
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** v16 or higher → [Download here](https://nodejs.org)
- That's it! No database installation needed (uses SQLite — file-based)

---

### 🪟 Windows Users

1. Extract the ZIP file
2. Double-click **`start-windows.bat`**
3. Wait for both servers to start
4. Browser will open at **http://localhost:3000**

---

### 🐧 Linux / Mac Users

1. Extract the ZIP file
2. Open terminal in the project folder
3. Run:
```bash
chmod +x start-linux-mac.sh
./start-linux-mac.sh
```
4. Visit **http://localhost:3000**

---

### 🛠️ Manual Setup

**Step 1: Backend**
```bash
cd backend
npm install
npm run dev
```
Backend runs on: `http://localhost:5000`

**Step 2: Frontend** (new terminal)
```bash
cd frontend
npm install
npm start
```
Frontend opens at: `http://localhost:3000`

---

## 🔑 OTP in Development Mode

Since SMS gateway is not configured by default, OTPs are returned in the API response during development.

When you click **"Send OTP"**, the OTP will appear on screen in a yellow box labeled:
> 🔑 Dev OTP: **123456**

To integrate real SMS (production), edit `backend/routes/auth.js` → `sendOTP()` function and add your SMS provider (Twilio, MSG91, TextLocal, etc.)

---

## 🗄️ Database

- Uses **SQLite** (via `better-sqlite3`) — zero configuration needed
- Database file: `backend/kalahandi_realestate.db` (auto-created on first run)
- Tables: `users`, `otps`, `properties`, `property_images`, `inquiries`, `saved_properties`, `property_views`

---

## 🌐 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/send-otp` | Send OTP to mobile |
| POST | `/api/auth/verify-otp` | Verify OTP |
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login with password |
| POST | `/api/auth/login-otp` | Login with OTP |
| GET | `/api/auth/me` | Get current user |
| PUT | `/api/auth/update-profile` | Update profile/password |

### Properties
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/properties` | List/search properties |
| GET | `/api/properties/featured` | Featured listings |
| GET | `/api/properties/stats` | Platform statistics |
| GET | `/api/properties/my-listings` | Seller's listings |
| GET | `/api/properties/saved` | Buyer's saved list |
| GET | `/api/properties/:id` | Single property |
| POST | `/api/properties` | Create property (seller) |
| PUT | `/api/properties/:id` | Update property (seller) |
| DELETE | `/api/properties/:id` | Delete property (seller) |
| POST | `/api/properties/:id/save` | Save/unsave property |

### Inquiries
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/inquiries` | Send inquiry (buyer) |
| GET | `/api/inquiries/my-inquiries` | Buyer's sent inquiries |
| GET | `/api/inquiries/received` | Seller's received inquiries |
| PUT | `/api/inquiries/:id/respond` | Seller responds |
| PUT | `/api/inquiries/:id/close` | Close inquiry |

---

## ⚙️ Environment Variables (backend/.env)

```env
PORT=5000
JWT_SECRET=kalahandi_realestate_super_secret_jwt_key_2024
JWT_EXPIRES_IN=7d
OTP_EXPIRY_MINUTES=10
NODE_ENV=development
```

For production, change `NODE_ENV=production` and update `JWT_SECRET`.

---

## 📱 SMS Integration (Production)

Edit `backend/routes/auth.js` → `sendOTP(mobile, otp)`:

```javascript
// Example with MSG91 (popular in India)
const axios = require('axios');

async function sendOTP(mobile, otp) {
  await axios.get(`https://api.msg91.com/api/sendotp.php`, {
    params: {
      authkey: 'YOUR_MSG91_AUTHKEY',
      mobile: `91${mobile}`,
      message: `Your Kalahandi Real Estate OTP is ${otp}. Valid for 10 minutes.`,
      otp: otp,
    }
  });
}
```

---

## 🎨 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js 18, React Router v6 |
| Styling | Custom CSS with Google Fonts |
| HTTP Client | Axios |
| Notifications | React Hot Toast |
| Icons | React Icons |
| Backend | Node.js, Express.js |
| Database | SQLite (better-sqlite3) |
| Auth | JWT + bcryptjs |
| File Upload | Multer |
| Env Config | dotenv |

---

## 🆓 Free Resources Used
- **Node.js** — Free runtime
- **React.js** — Free frontend framework
- **SQLite** — Free embedded database (no server needed)
- **better-sqlite3** — Free SQLite driver
- **All npm packages** — Free & open source
- **Google Fonts** — Free fonts (Playfair Display + DM Sans)

---

## 📞 Support

For issues, check:
1. Node.js version: `node --version` (must be v16+)
2. Ports 3000 and 5000 must be free
3. Backend health check: `http://localhost:5000/api/health`

---

*Kalahandi Real Estate — Connecting land owners with buyers across Western Odisha* 🏡
