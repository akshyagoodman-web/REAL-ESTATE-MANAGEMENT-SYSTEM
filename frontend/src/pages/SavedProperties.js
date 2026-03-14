import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaHeart, FaSearch } from 'react-icons/fa';
import toast from 'react-hot-toast';
import api from '../utils/api';
import PropertyCard from '../components/PropertyCard';

export default function SavedProperties() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/properties/saved').then(res => setProperties(res.data.data)).catch(() => toast.error('Failed to load')).finally(() => setLoading(false));
  }, []);

  const handleUnsave = async (propertyId) => {
    try {
      await api.post(`/properties/${propertyId}/save`);
      setProperties(prev => prev.filter(p => p.id !== propertyId));
      toast.success('Removed from saved');
    } catch { toast.error('Failed'); }
  };

  return (
    <div>
      <div className="page-header">
        <div className="container">
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 700, color: 'white', position: 'relative' }}>❤️ Saved Properties</h1>
          <p style={{ color: 'rgba(255,255,255,0.8)', position: 'relative' }}>Properties you've saved for later</p>
        </div>
      </div>
      <div className="container" style={{ paddingTop: 28, paddingBottom: 60 }}>
        {loading ? <div className="spinner" /> : properties.length === 0 ? (
          <div className="empty-state">
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}><FaHeart /></div>
            <h3>No saved properties</h3>
            <p>Save properties you're interested in to view them here</p>
            <Link to="/properties" className="btn btn-primary mt-2"><FaSearch /> Browse Properties</Link>
          </div>
        ) : (
          <div className="grid grid-3">
            {properties.map(p => (
              <PropertyCard key={p.id} property={p} onSaveToggle={handleUnsave} isSaved={true} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
