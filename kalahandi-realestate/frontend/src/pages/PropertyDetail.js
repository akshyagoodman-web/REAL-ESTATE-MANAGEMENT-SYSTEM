import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  FaMapMarkerAlt, FaRulerCombined, FaBed, FaBath, FaHeart, FaRegHeart,
  FaPhone, FaEnvelope, FaShare, FaArrowLeft, FaCheck, FaTimes,
  FaRoad, FaWater, FaBolt, FaWall, FaCalendar, FaEye
} from 'react-icons/fa';
import toast from 'react-hot-toast';
import api, { API_URL } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import './PropertyDetail.css';

const TYPE_LABELS = { land: 'Land', house: 'House', commercial: 'Commercial', apartment: 'Apartment', plot: 'Plot', farm: 'Farm' };

function formatPrice(price) {
  if (price >= 10000000) return `₹${(price / 10000000).toFixed(2)} Crore`;
  if (price >= 100000) return `₹${(price / 100000).toFixed(2)} Lakh`;
  if (price >= 1000) return `₹${(price / 1000).toFixed(1)}K`;
  return `₹${price}`;
}

export default function PropertyDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [showInquiry, setShowInquiry] = useState(false);
  const [inquiry, setInquiry] = useState({ message: '', contact_mobile: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get(`/properties/${id}`).then(res => {
      setProperty(res.data.data);
      setIsSaved(res.data.data.is_saved);
      setLoading(false);
    }).catch(() => { toast.error('Property not found'); navigate('/properties'); });
  }, [id]);

  const handleSave = async () => {
    if (!user) return toast.error('Login to save properties');
    try {
      const res = await api.post(`/properties/${id}/save`);
      setIsSaved(res.data.saved);
      toast.success(res.data.message);
    } catch { toast.error('Failed'); }
  };

  const handleInquiry = async e => {
    e.preventDefault();
    if (!user) return toast.error('Login to send inquiry');
    if (!inquiry.message.trim()) return toast.error('Message is required');
    setSubmitting(true);
    try {
      await api.post('/inquiries', { property_id: id, message: inquiry.message, contact_mobile: inquiry.contact_mobile });
      toast.success('Inquiry sent successfully! The seller will contact you soon.');
      setShowInquiry(false);
      setInquiry({ message: '', contact_mobile: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send inquiry');
    } finally { setSubmitting(false); }
  };

  if (loading) return <div className="container"><div className="spinner" /></div>;
  if (!property) return null;

  const images = property.images || [];
  const currentImage = images[activeImage]
    ? `${API_URL}${images[activeImage].image_path}`
    : 'https://via.placeholder.com/800x500/FED7AA/C2410C?text=No+Image';

  return (
    <div className="property-detail">
      <div className="container">
        {/* Breadcrumb */}
        <div className="breadcrumb">
          <button onClick={() => navigate(-1)} className="back-btn"><FaArrowLeft /> Back</button>
          <span className="breadcrumb-sep">/</span>
          <Link to="/properties">Properties</Link>
          <span className="breadcrumb-sep">/</span>
          <span>{property.title}</span>
        </div>

        <div className="detail-layout">
          {/* Left: Images + Details */}
          <div className="detail-main">
            {/* Image Gallery */}
            <div className="gallery">
              <div className="gallery-main">
                <img src={currentImage} alt={property.title} onError={e => e.target.src = 'https://via.placeholder.com/800x500/FED7AA/C2410C?text=Property'} />
                <div className="gallery-badges">
                  <span className="badge badge-primary">{TYPE_LABELS[property.property_type]}</span>
                  {property.listing_type === 'rent' && <span className="badge badge-warning">For Rent</span>}
                  {property.status !== 'available' && <span className="badge" style={{background:'#fee2e2',color:'#dc2626'}}>{property.status}</span>}
                </div>
              </div>
              {images.length > 1 && (
                <div className="gallery-thumbs">
                  {images.map((img, i) => (
                    <div key={img.id} className={`thumb ${i === activeImage ? 'active' : ''}`} onClick={() => setActiveImage(i)}>
                      <img src={`${API_URL}${img.image_path}`} alt="" onError={e => e.target.src = 'https://via.placeholder.com/100/FED7AA/C2410C?text=+'} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Title & Price */}
            <div className="detail-header">
              <div>
                <h1 className="detail-title">{property.title}</h1>
                <div className="detail-location"><FaMapMarkerAlt /> {[property.address, property.village, property.block, property.district, property.state].filter(Boolean).join(', ')}</div>
              </div>
              <div className="detail-price-block">
                <div className="detail-price">{formatPrice(property.price)}</div>
                {property.price_unit !== 'total' && <div className="detail-price-unit">per {property.price_unit === 'per_acre' ? 'acre' : 'sqft'}</div>}
              </div>
            </div>

            {/* Specs */}
            <div className="specs-grid">
              {property.area && <div className="spec-item"><FaRulerCombined className="spec-icon" /><div><div className="spec-val">{property.area} {property.area_unit}</div><div className="spec-key">Area</div></div></div>}
              {property.bedrooms > 0 && <div className="spec-item"><FaBed className="spec-icon" /><div><div className="spec-val">{property.bedrooms}</div><div className="spec-key">Bedrooms</div></div></div>}
              {property.bathrooms > 0 && <div className="spec-item"><FaBath className="spec-icon" /><div><div className="spec-val">{property.bathrooms}</div><div className="spec-key">Bathrooms</div></div></div>}
              {property.facing && <div className="spec-item"><span className="spec-icon">🧭</span><div><div className="spec-val">{property.facing}</div><div className="spec-key">Facing</div></div></div>}
              <div className="spec-item"><FaEye className="spec-icon" /><div><div className="spec-val">{property.views}</div><div className="spec-key">Views</div></div></div>
              <div className="spec-item"><FaCalendar className="spec-icon" /><div><div className="spec-val">{new Date(property.created_at).toLocaleDateString('en-IN')}</div><div className="spec-key">Listed On</div></div></div>
            </div>

            {/* Description */}
            <div className="detail-section">
              <h2 className="detail-section-title">About This Property</h2>
              <p className="detail-description">{property.description}</p>
            </div>

            {/* Amenities */}
            <div className="detail-section">
              <h2 className="detail-section-title">Features & Amenities</h2>
              <div className="amenities-grid">
                {[
                  { icon: <FaBolt />, label: 'Electricity', val: property.electricity },
                  { icon: <FaWall />, label: 'Boundary Wall', val: property.boundary_wall },
                  { icon: <FaRoad />, label: 'Road Access', val: property.road_access },
                  { icon: <FaWater />, label: 'Water Source', val: property.water_source },
                ].map((a, i) => (
                  <div key={i} className="amenity">
                    <span className="amenity-icon">{a.icon}</span>
                    <span className="amenity-label">{a.label}</span>
                    <span className={`amenity-val ${a.val ? 'yes' : 'no'}`}>
                      {typeof a.val === 'string' ? a.val : (a.val ? <FaCheck /> : <FaTimes />)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Location */}
            <div className="detail-section">
              <h2 className="detail-section-title">Location Details</h2>
              <div className="location-details">
                {[
                  ['Village', property.village], ['Block', property.block],
                  ['District', property.district], ['State', property.state],
                  ['Pincode', property.pincode],
                ].filter(([, v]) => v).map(([k, v]) => (
                  <div key={k} className="loc-item"><span className="loc-key">{k}</span><span className="loc-val">{v}</span></div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Seller + Actions */}
          <div className="detail-sidebar">
            {/* Actions */}
            <div className="sidebar-card">
              <div className="action-btns">
                <button className={`btn ${isSaved ? 'btn-primary' : 'btn-outline'} w-full`} onClick={handleSave}>
                  {isSaved ? <FaHeart /> : <FaRegHeart />} {isSaved ? 'Saved' : 'Save Property'}
                </button>
                <button className="btn btn-ghost w-full" onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success('Link copied!'); }}>
                  <FaShare /> Share
                </button>
              </div>
              {user?.role === 'buyer' && property.status === 'available' && (
                <button className="btn btn-secondary w-full btn-lg mt-2" onClick={() => setShowInquiry(true)}>
                  <FaEnvelope /> Send Inquiry to Seller
                </button>
              )}
              {!user && (
                <div className="login-prompt">
                  <Link to="/login" className="btn btn-primary w-full">Login to Contact Seller</Link>
                </div>
              )}
            </div>

            {/* Seller Info */}
            <div className="sidebar-card seller-card">
              <h3 className="sidebar-title">About the Seller</h3>
              <div className="seller-info">
                <div className="seller-avatar">{property.seller_name?.charAt(0).toUpperCase()}</div>
                <div>
                  <div className="seller-name">{property.seller_name}</div>
                  <div className="seller-badge">Verified Seller</div>
                </div>
              </div>
              {user && (
                <div className="seller-contact-info">
                  <div className="contact-item"><FaPhone /> {property.seller_mobile}</div>
                  {property.seller_email && <div className="contact-item"><FaEnvelope /> {property.seller_email}</div>}
                </div>
              )}
            </div>

            {/* Property ID */}
            <div className="sidebar-card">
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                <div>Property ID: <strong>KRE-{String(property.id).padStart(5, '0')}</strong></div>
                <div>Listed: {new Date(property.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Inquiry Modal */}
      {showInquiry && (
        <div className="modal-overlay" onClick={() => setShowInquiry(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Send Inquiry</h3>
              <button onClick={() => setShowInquiry(false)}><FaTimes /></button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: 16, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                Inquiry about: <strong>{property.title}</strong>
              </p>
              <form onSubmit={handleInquiry}>
                <div className="form-group">
                  <label className="form-label">Your Message *</label>
                  <textarea className="form-control" rows={4} placeholder="I am interested in this property. Please contact me with more details..." value={inquiry.message} onChange={e => setInquiry({ ...inquiry, message: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Contact Mobile (optional)</label>
                  <input type="tel" className="form-control" placeholder="Alternate mobile number" value={inquiry.contact_mobile} onChange={e => setInquiry({ ...inquiry, contact_mobile: e.target.value })} maxLength={10} />
                </div>
                <button type="submit" className="btn btn-secondary w-full btn-lg" disabled={submitting}>
                  {submitting ? 'Sending...' : 'Send Inquiry'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
