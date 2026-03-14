import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaPlus, FaEdit, FaTrash, FaEye, FaEnvelope, FaCheck, FaTimes } from 'react-icons/fa';
import toast from 'react-hot-toast';
import api, { API_URL } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';

function formatPrice(price) {
  if (price >= 10000000) return `₹${(price / 10000000).toFixed(2)} Cr`;
  if (price >= 100000) return `₹${(price / 100000).toFixed(2)} L`;
  return `₹${price.toLocaleString('en-IN')}`;
}

const STATUS_COLORS = { available: 'badge-success', sold: 'badge-gray', rented: 'badge-warning', pending: 'badge-primary' };

export default function SellerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, available: 0, sold: 0, inquiries: 0 });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/properties/my-listings');
      const props = res.data.data;
      setProperties(props);
      setStats({
        total: props.length,
        available: props.filter(p => p.status === 'available').length,
        sold: props.filter(p => p.status === 'sold').length,
        inquiries: props.reduce((sum, p) => sum + (p.inquiry_count || 0), 0),
      });
    } catch { toast.error('Failed to load listings'); }
    setLoading(false);
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/properties/${id}`);
      toast.success('Property deleted');
      setProperties(prev => prev.filter(p => p.id !== id));
    } catch { toast.error('Failed to delete'); }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await api.put(`/properties/${id}`, { status });
      setProperties(prev => prev.map(p => p.id === id ? { ...p, status } : p));
      toast.success('Status updated');
    } catch { toast.error('Failed to update status'); }
  };

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <div className="container">
          <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 700, color: 'white' }}>
                Welcome, {user?.name} 👋
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.8)' }}>Manage your property listings</p>
            </div>
            <Link to="/seller/add-property" className="btn btn-lg" style={{ background: 'white', color: 'var(--primary)', position: 'relative' }}>
              <FaPlus /> Add New Property
            </Link>
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingTop: 28, paddingBottom: 48 }}>
        {/* Stats */}
        <div className="stats-row">
          {[
            { label: 'Total Listings', val: stats.total, color: 'var(--primary)', icon: '🏘️' },
            { label: 'Available', val: stats.available, color: 'var(--secondary)', icon: '✅' },
            { label: 'Sold', val: stats.sold, color: 'var(--text-muted)', icon: '🤝' },
            { label: 'Inquiries', val: stats.inquiries, color: 'var(--accent)', icon: '📬' },
          ].map((s, i) => (
            <div key={i} className="stat-card">
              <div className="stat-icon">{s.icon}</div>
              <div className="stat-number" style={{ color: s.color }}>{s.val}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Quick Links */}
        <div className="quick-links">
          <Link to="/seller/add-property" className="quick-link"><FaPlus /> New Listing</Link>
          <Link to="/seller/inquiries" className="quick-link"><FaEnvelope /> View Inquiries</Link>
          <Link to="/profile" className="quick-link"><FaEdit /> Edit Profile</Link>
        </div>

        {/* Listings Table */}
        <div className="dashboard-section">
          <div className="flex-between mb-2">
            <h2 className="section-title" style={{ marginBottom: 0 }}>My Listings</h2>
          </div>

          {loading ? <div className="spinner" /> : properties.length === 0 ? (
            <div className="empty-state">
              <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🏠</div>
              <h3>No properties listed yet</h3>
              <p>Start by adding your first property listing</p>
              <Link to="/seller/add-property" className="btn btn-primary mt-2"><FaPlus /> Add Property</Link>
            </div>
          ) : (
            <div className="listings-table-wrap">
              <table className="listings-table">
                <thead>
                  <tr>
                    <th>Property</th>
                    <th>Type</th>
                    <th>Price</th>
                    <th>Location</th>
                    <th>Status</th>
                    <th>Views</th>
                    <th>Inquiries</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {properties.map(p => (
                    <tr key={p.id}>
                      <td>
                        <div className="listing-title-cell">
                          {p.primary_image && <img src={`${API_URL}${p.primary_image}`} alt="" className="listing-thumb" onError={e => e.target.style.display='none'} />}
                          <div>
                            <div className="listing-name">{p.title}</div>
                            <div className="listing-id">KRE-{String(p.id).padStart(5, '0')}</div>
                          </div>
                        </div>
                      </td>
                      <td><span className="badge badge-primary">{p.property_type}</span></td>
                      <td className="price-cell">{formatPrice(p.price)}</td>
                      <td className="location-cell">{[p.village, p.block, p.district].filter(Boolean).join(', ') || p.address?.substring(0, 30)}</td>
                      <td>
                        <select
                          className={`status-select badge ${STATUS_COLORS[p.status]}`}
                          value={p.status}
                          onChange={e => handleStatusChange(p.id, e.target.value)}
                        >
                          <option value="available">Available</option>
                          <option value="sold">Sold</option>
                          <option value="rented">Rented</option>
                          <option value="pending">Pending</option>
                        </select>
                      </td>
                      <td><span style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>{p.views || 0}</span></td>
                      <td>
                        <span style={{ color: p.inquiry_count > 0 ? 'var(--accent)' : 'var(--text-muted)', fontWeight: p.inquiry_count > 0 ? 700 : 400, fontSize: '0.88rem' }}>
                          {p.inquiry_count || 0}
                        </span>
                      </td>
                      <td>
                        <div className="action-row">
                          <Link to={`/properties/${p.id}`} className="icon-btn view-btn" title="View"><FaEye /></Link>
                          <Link to={`/seller/edit-property/${p.id}`} className="icon-btn edit-btn" title="Edit"><FaEdit /></Link>
                          <button className="icon-btn delete-btn" onClick={() => handleDelete(p.id, p.title)} title="Delete"><FaTrash /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
