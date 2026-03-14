import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSearch, FaMapMarkerAlt, FaHome, FaTree, FaBuilding, FaUsers, FaShieldAlt, FaHandshake, FaStar } from 'react-icons/fa';
import api from '../utils/api';
import PropertyCard from '../components/PropertyCard';
import './Home.css';

const DISTRICTS = ['Kalahandi', 'Nuapada', 'Bolangir', 'Bargarh', 'Sambalpur', 'Jharsuguda', 'Sundergarh', 'Koraput', 'Nabarangpur'];
const BLOCKS = ['Bhawanipatna', 'Junagarh', 'Dharmagarh', 'Kesinga', 'Khariar', 'Phulbani', 'Titlagarh', 'Raipur'];
const PROPERTY_TYPES = [
  { value: 'land', label: 'Land', icon: <FaTree />, desc: 'Agricultural & plots' },
  { value: 'house', label: 'House', icon: <FaHome />, desc: 'Residential homes' },
  { value: 'commercial', label: 'Commercial', icon: <FaBuilding />, desc: 'Shops & offices' },
  { value: 'apartment', label: 'Apartment', icon: <FaBuilding />, desc: 'Flats & apartments' },
  { value: 'plot', label: 'Plot', icon: <FaMapMarkerAlt />, desc: 'Residential plots' },
  { value: 'farm', label: 'Farm', icon: <FaTree />, desc: 'Farmland' },
];

export default function Home() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [district, setDistrict] = useState('');
  const [propType, setPropType] = useState('');
  const [featured, setFeatured] = useState([]);
  const [stats, setStats] = useState({});
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/properties/featured'),
      api.get('/properties/stats'),
      api.get('/properties?limit=6&sort=created_at&order=DESC'),
    ]).then(([featRes, statsRes, recentRes]) => {
      setFeatured(featRes.data.data || []);
      setStats(statsRes.data.data || {});
      setRecent(recentRes.data.data || []);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (district) params.set('district', district);
    if (propType) params.set('property_type', propType);
    navigate(`/properties?${params.toString()}`);
  };

  return (
    <div className="home">
      {/* Hero */}
      <section className="hero">
        <div className="hero-bg" />
        <div className="hero-content container">
          <div className="hero-badge">🏡 Odisha's Trusted Property Platform</div>
          <h1 className="hero-title">
            Find Your Dream Property in<br />
            <span className="hero-highlight">Kalahandi & Beyond</span>
          </h1>
          <p className="hero-desc">Buy, sell or rent land, houses and commercial properties across Western Odisha. Connecting landowners with buyers directly.</p>

          <form className="search-box" onSubmit={handleSearch}>
            <div className="search-field">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search by location, title or keywords..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="search-input"
              />
            </div>
            <select className="search-select" value={district} onChange={e => setDistrict(e.target.value)}>
              <option value="">All Districts</option>
              {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <select className="search-select" value={propType} onChange={e => setPropType(e.target.value)}>
              <option value="">All Types</option>
              {PROPERTY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <button type="submit" className="btn btn-primary btn-lg search-btn">
              <FaSearch /> Search
            </button>
          </form>

          <div className="hero-stats">
            <div className="hero-stat"><span className="stat-num">{stats.total_properties || 0}+</span><span className="stat-label">Properties Listed</span></div>
            <div className="hero-stat-divider" />
            <div className="hero-stat"><span className="stat-num">{stats.total_sellers || 0}+</span><span className="stat-label">Verified Sellers</span></div>
            <div className="hero-stat-divider" />
            <div className="hero-stat"><span className="stat-num">{stats.total_buyers || 0}+</span><span className="stat-label">Happy Buyers</span></div>
          </div>
        </div>
      </section>

      {/* Property Types */}
      <section className="section bg-light">
        <div className="container">
          <h2 className="section-title text-center">Browse by Property Type</h2>
          <p className="section-subtitle text-center">Find exactly what you're looking for</p>
          <div className="type-grid">
            {PROPERTY_TYPES.map(type => (
              <button key={type.value} className="type-card" onClick={() => navigate(`/properties?property_type=${type.value}`)}>
                <div className="type-icon">{type.icon}</div>
                <div className="type-label">{type.label}</div>
                <div className="type-desc">{type.desc}</div>
                <div className="type-count">{(stats.by_type || []).find(t => t.property_type === type.value)?.count || 0} listed</div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured */}
      {featured.length > 0 && (
        <section className="section">
          <div className="container">
            <div className="flex-between mb-3">
              <div>
                <h2 className="section-title">⭐ Featured Properties</h2>
                <p className="section-subtitle">Hand-picked premium listings</p>
              </div>
              <button className="btn btn-outline" onClick={() => navigate('/properties?is_featured=1')}>View All</button>
            </div>
            <div className="grid grid-3">
              {featured.map(p => <PropertyCard key={p.id} property={p} />)}
            </div>
          </div>
        </section>
      )}

      {/* Recent */}
      <section className="section bg-light">
        <div className="container">
          <div className="flex-between mb-3">
            <div>
              <h2 className="section-title">🆕 Latest Listings</h2>
              <p className="section-subtitle">Freshly added properties</p>
            </div>
            <button className="btn btn-outline" onClick={() => navigate('/properties')}>Browse All</button>
          </div>
          {loading ? <div className="spinner" /> : (
            <div className="grid grid-3">
              {recent.map(p => <PropertyCard key={p.id} property={p} />)}
            </div>
          )}
        </div>
      </section>

      {/* Quick Links by Location */}
      <section className="section">
        <div className="container">
          <h2 className="section-title text-center">Popular Locations</h2>
          <p className="section-subtitle text-center">Explore properties by district</p>
          <div className="location-grid">
            {DISTRICTS.map(d => (
              <button key={d} className="location-card" onClick={() => navigate(`/properties?district=${d}`)}>
                <FaMapMarkerAlt />
                <span>{d}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Why Us */}
      <section className="section bg-dark">
        <div className="container">
          <h2 className="section-title text-center" style={{color:'white'}}>Why Choose Kalahandi Real Estate?</h2>
          <p className="section-subtitle text-center" style={{color:'rgba(255,255,255,0.7)'}}>Trusted platform for Western Odisha</p>
          <div className="grid grid-3 mt-3">
            {[
              { icon: <FaShieldAlt />, title: 'Verified Listings', desc: 'All properties are verified by our team before listing for your peace of mind.' },
              { icon: <FaHandshake />, title: 'Direct Connect', desc: 'Connect directly with owners and sellers without any middlemen or extra fees.' },
              { icon: <FaUsers />, title: 'Local Expertise', desc: 'Deep knowledge of Kalahandi, Nuapada, Bolangir and surrounding districts.' },
              { icon: <FaStar />, title: 'Trusted Reviews', desc: 'Real buyer reviews and ratings to help you make informed decisions.' },
              { icon: <FaHome />, title: 'All Property Types', desc: 'From agricultural land to commercial shops — all in one platform.' },
              { icon: <FaMapMarkerAlt />, title: 'Hyper Local', desc: 'Properties listed by block, village and pincode for precise location search.' },
            ].map((f, i) => (
              <div key={i} className="feature-card">
                <div className="feature-icon">{f.icon}</div>
                <h3 className="feature-title">{f.title}</h3>
                <p className="feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="container text-center">
          <h2 className="section-title" style={{color:'white'}}>Ready to List Your Property?</h2>
          <p style={{color:'rgba(255,255,255,0.85)', fontSize:'1.1rem', marginBottom:'32px'}}>
            Join thousands of sellers on Kalahandi Real Estate and reach genuine buyers across Odisha.
          </p>
          <div style={{display:'flex', gap:'16px', justifyContent:'center', flexWrap:'wrap'}}>
            <button className="btn btn-lg" style={{background:'white', color:'var(--primary)'}} onClick={() => navigate('/register?role=seller')}>
              List Your Property Free
            </button>
            <button className="btn btn-lg btn-outline" style={{color:'white', borderColor:'white'}} onClick={() => navigate('/properties')}>
              Browse Properties
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
