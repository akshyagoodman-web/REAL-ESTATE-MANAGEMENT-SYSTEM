import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FaFilter, FaSearch, FaSort, FaTimes, FaSlidersH } from 'react-icons/fa';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import PropertyCard from '../components/PropertyCard';
import './Properties.css';

const PROPERTY_TYPES = ['land', 'house', 'commercial', 'apartment', 'plot', 'farm'];
const DISTRICTS = ['Kalahandi', 'Nuapada', 'Bolangir', 'Bargarh', 'Sambalpur', 'Jharsuguda', 'Sundergarh', 'Koraput', 'Nabarangpur'];
const BLOCKS_BY_DISTRICT = {
  Kalahandi: ['Bhawanipatna', 'Junagarh', 'Dharmagarh', 'Kesinga', 'Thuamul Rampur', 'Narla', 'Golamunda', 'Kalampur', 'Lanjigarh', 'M. Rampur'],
  Nuapada: ['Khariar', 'Boden', 'Sinapali', 'Komna', 'Nuapada'],
  Bolangir: ['Bolangir', 'Titlagarh', 'Kantabanji', 'Patnagarh'],
};
const SORT_OPTIONS = [
  { value: 'created_at|DESC', label: 'Newest First' },
  { value: 'created_at|ASC', label: 'Oldest First' },
  { value: 'price|ASC', label: 'Price: Low to High' },
  { value: 'price|DESC', label: 'Price: High to Low' },
  { value: 'views|DESC', label: 'Most Viewed' },
];

export default function Properties() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();

  const [properties, setProperties] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [savedIds, setSavedIds] = useState(new Set());
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    property_type: searchParams.get('property_type') || '',
    listing_type: searchParams.get('listing_type') || '',
    district: searchParams.get('district') || '',
    block: '',
    min_price: '',
    max_price: '',
    sort: 'created_at',
    order: 'DESC',
    page: 1,
  });

  const fetchProperties = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v; });
      const res = await api.get('/properties', { params });
      setProperties(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      toast.error('Failed to load properties');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchProperties(); }, [fetchProperties]);

  useEffect(() => {
    if (user?.role === 'buyer') {
      api.get('/properties/saved').then(res => {
        setSavedIds(new Set(res.data.data.map(p => p.id)));
      }).catch(() => {});
    }
  }, [user]);

  const handleFilter = (key, value) => {
    setFilters(f => ({ ...f, [key]: value, page: 1 }));
  };

  const handleSortChange = (val) => {
    const [sort, order] = val.split('|');
    setFilters(f => ({ ...f, sort, order, page: 1 }));
  };

  const handleSaveToggle = async (propertyId) => {
    if (!user) return toast.error('Login to save properties');
    try {
      const res = await api.post(`/properties/${propertyId}/save`);
      setSavedIds(prev => {
        const next = new Set(prev);
        res.data.saved ? next.add(propertyId) : next.delete(propertyId);
        return next;
      });
      toast.success(res.data.message);
    } catch {
      toast.error('Failed to save property');
    }
  };

  const clearFilters = () => setFilters({ search: '', property_type: '', listing_type: '', district: '', block: '', min_price: '', max_price: '', sort: 'created_at', order: 'DESC', page: 1 });

  const activeFilterCount = [filters.property_type, filters.listing_type, filters.district, filters.block, filters.min_price, filters.max_price].filter(Boolean).length;

  return (
    <div className="properties-page">
      {/* Header */}
      <div className="page-header">
        <div className="container">
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 700, color: 'white', marginBottom: 8, position: 'relative' }}>
            Browse Properties
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.8)', position: 'relative' }}>
            Explore land, houses and commercial properties across Western Odisha
          </p>
        </div>
      </div>

      <div className="container" style={{ paddingTop: 24, paddingBottom: 40 }}>
        {/* Search + Sort bar */}
        <div className="search-sort-bar">
          <div className="search-wrap">
            <FaSearch className="bar-search-icon" />
            <input
              type="text"
              placeholder="Search by title, location, village..."
              value={filters.search}
              onChange={e => handleFilter('search', e.target.value)}
              className="bar-search-input"
            />
            {filters.search && <button className="bar-clear" onClick={() => handleFilter('search', '')}><FaTimes /></button>}
          </div>
          <select className="sort-select" value={`${filters.sort}|${filters.order}`} onChange={e => handleSortChange(e.target.value)}>
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <button className={`filter-toggle-btn ${showFilters ? 'active' : ''}`} onClick={() => setShowFilters(!showFilters)}>
            <FaSlidersH /> Filters {activeFilterCount > 0 && <span className="filter-badge">{activeFilterCount}</span>}
          </button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="filter-panel">
            <div className="filter-grid">
              <div>
                <label className="filter-label">Property Type</label>
                <div className="filter-chips">
                  {PROPERTY_TYPES.map(t => (
                    <button key={t} className={`chip ${filters.property_type === t ? 'active' : ''}`} onClick={() => handleFilter('property_type', filters.property_type === t ? '' : t)}>
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="filter-label">Listing Type</label>
                <div className="filter-chips">
                  {['sale', 'rent'].map(t => (
                    <button key={t} className={`chip ${filters.listing_type === t ? 'active' : ''}`} onClick={() => handleFilter('listing_type', filters.listing_type === t ? '' : t)}>
                      For {t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="filter-label">District</label>
                <select className="form-control" value={filters.district} onChange={e => handleFilter('district', e.target.value)}>
                  <option value="">All Districts</option>
                  {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="filter-label">Block / Tehsil</label>
                <select className="form-control" value={filters.block} onChange={e => handleFilter('block', e.target.value)}>
                  <option value="">All Blocks</option>
                  {(BLOCKS_BY_DISTRICT[filters.district] || Object.values(BLOCKS_BY_DISTRICT).flat()).map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="filter-label">Min Price (₹)</label>
                <input type="number" className="form-control" placeholder="e.g. 500000" value={filters.min_price} onChange={e => handleFilter('min_price', e.target.value)} />
              </div>
              <div>
                <label className="filter-label">Max Price (₹)</label>
                <input type="number" className="form-control" placeholder="e.g. 5000000" value={filters.max_price} onChange={e => handleFilter('max_price', e.target.value)} />
              </div>
            </div>
            {activeFilterCount > 0 && (
              <button className="btn btn-ghost btn-sm" onClick={clearFilters} style={{ marginTop: 12 }}>
                <FaTimes /> Clear All Filters
              </button>
            )}
          </div>
        )}

        {/* Results summary */}
        <div className="results-meta">
          <span>{loading ? 'Loading...' : `${pagination.total || 0} properties found`}</span>
          {activeFilterCount > 0 && <span className="filter-active-note">Filters applied: {activeFilterCount}</span>}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="spinner" />
        ) : properties.length === 0 ? (
          <div className="empty-state">
            <div style={{ fontSize: '3rem', marginBottom: 12 }}>🏠</div>
            <h3>No properties found</h3>
            <p>Try adjusting your filters or search terms</p>
            <button className="btn btn-outline mt-2" onClick={clearFilters}>Clear Filters</button>
          </div>
        ) : (
          <>
            <div className="grid grid-3">
              {properties.map(p => (
                <PropertyCard
                  key={p.id}
                  property={p}
                  onSaveToggle={user ? handleSaveToggle : null}
                  isSaved={savedIds.has(p.id)}
                />
              ))}
            </div>
            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="pagination">
                <button className="page-btn" disabled={filters.page <= 1} onClick={() => handleFilter('page', filters.page - 1)}>← Prev</button>
                {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
                  <button key={p} className={`page-btn ${filters.page === p ? 'active' : ''}`} onClick={() => handleFilter('page', p)}>{p}</button>
                ))}
                <button className="page-btn" disabled={filters.page >= pagination.pages} onClick={() => handleFilter('page', filters.page + 1)}>Next →</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
