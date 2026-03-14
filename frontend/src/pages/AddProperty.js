import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaUpload, FaTimes, FaTrash } from 'react-icons/fa';
import toast from 'react-hot-toast';
import api, { API_URL } from '../utils/api';
import './AddProperty.css';

const DISTRICTS = ['Kalahandi', 'Nuapada', 'Bolangir', 'Bargarh', 'Sambalpur', 'Jharsuguda', 'Sundergarh', 'Koraput', 'Nabarangpur'];
const BLOCKS = ['Bhawanipatna', 'Junagarh', 'Dharmagarh', 'Kesinga', 'Thuamul Rampur', 'Narla', 'Golamunda', 'Kalampur', 'Lanjigarh', 'M. Rampur', 'Khariar', 'Boden', 'Sinapali', 'Komna', 'Bolangir', 'Titlagarh', 'Kantabanji', 'Patnagarh'];

const initialForm = {
  title: '', description: '', property_type: 'land', listing_type: 'sale',
  price: '', price_unit: 'total', area: '', area_unit: 'sqft',
  bedrooms: '0', bathrooms: '0', address: '', village: '', block: '', district: 'Kalahandi',
  state: 'Odisha', pincode: '', road_access: '', water_source: '',
  electricity: false, boundary_wall: false, facing: '',
};

export default function AddProperty() {
  const { id } = useParams(); // if editing
  const navigate = useNavigate();
  const fileRef = useRef();

  const [form, setForm] = useState(initialForm);
  const [images, setImages] = useState([]); // new files
  const [existingImages, setExistingImages] = useState([]); // for edit
  const [deleteImages, setDeleteImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    if (id) {
      setFetching(true);
      api.get(`/properties/${id}`).then(res => {
        const p = res.data.data;
        setForm({
          title: p.title || '', description: p.description || '',
          property_type: p.property_type || 'land', listing_type: p.listing_type || 'sale',
          price: p.price || '', price_unit: p.price_unit || 'total',
          area: p.area || '', area_unit: p.area_unit || 'sqft',
          bedrooms: p.bedrooms || '0', bathrooms: p.bathrooms || '0',
          address: p.address || '', village: p.village || '', block: p.block || '',
          district: p.district || 'Kalahandi', state: p.state || 'Odisha',
          pincode: p.pincode || '', road_access: p.road_access || '',
          water_source: p.water_source || '',
          electricity: !!p.electricity, boundary_wall: !!p.boundary_wall,
          facing: p.facing || '',
        });
        setExistingImages(p.images || []);
      }).catch(() => toast.error('Failed to load property')).finally(() => setFetching(false));
    }
  }, [id]);

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleImages = e => {
    const files = Array.from(e.target.files);
    const previews = files.map(f => ({ file: f, url: URL.createObjectURL(f) }));
    setImages(prev => [...prev, ...previews]);
  };

  const removeNewImage = i => setImages(prev => prev.filter((_, idx) => idx !== i));

  const toggleDeleteExisting = (imgId) => {
    setDeleteImages(prev => prev.includes(imgId) ? prev.filter(i => i !== imgId) : [...prev, imgId]);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.title || !form.description || !form.price || !form.address) {
      return toast.error('Please fill all required fields');
    }
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      images.forEach(img => fd.append('images', img.file));
      if (deleteImages.length > 0) fd.append('delete_images', JSON.stringify(deleteImages));

      if (id) {
        await api.put(`/properties/${id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Property updated successfully!');
      } else {
        await api.post('/properties', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Property listed successfully!');
      }
      navigate('/seller/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save property');
    } finally { setLoading(false); }
  };

  if (fetching) return <div className="container"><div className="spinner" /></div>;

  return (
    <div className="add-property-page">
      <div className="page-header">
        <div className="container">
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 700, color: 'white', position: 'relative' }}>
            {id ? 'Edit Property' : 'List New Property'}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.8)', position: 'relative' }}>Fill in the details to {id ? 'update' : 'list'} your property</p>
        </div>
      </div>

      <div className="container" style={{ paddingTop: 28, paddingBottom: 60 }}>
        <form onSubmit={handleSubmit} className="prop-form">
          {/* Basic Info */}
          <div className="form-section">
            <h3 className="form-section-title">📋 Basic Information</h3>
            <div className="form-grid-2">
              <div className="form-group form-span-2">
                <label className="form-label">Property Title *</label>
                <input type="text" name="title" className="form-control" placeholder="e.g. 2 Acre Agricultural Land in Bhawanipatna" value={form.title} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label className="form-label">Property Type *</label>
                <select name="property_type" className="form-control" value={form.property_type} onChange={handleChange}>
                  <option value="land">Land</option>
                  <option value="house">House</option>
                  <option value="commercial">Commercial</option>
                  <option value="apartment">Apartment</option>
                  <option value="plot">Plot</option>
                  <option value="farm">Farm</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Listing Type *</label>
                <select name="listing_type" className="form-control" value={form.listing_type} onChange={handleChange}>
                  <option value="sale">For Sale</option>
                  <option value="rent">For Rent</option>
                </select>
              </div>
              <div className="form-group form-span-2">
                <label className="form-label">Description *</label>
                <textarea name="description" className="form-control" rows={5} placeholder="Describe the property in detail — location, condition, special features, nearby amenities..." value={form.description} onChange={handleChange} required />
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="form-section">
            <h3 className="form-section-title">💰 Pricing</h3>
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Price (₹) *</label>
                <input type="number" name="price" className="form-control" placeholder="e.g. 500000" value={form.price} onChange={handleChange} required min="0" />
              </div>
              <div className="form-group">
                <label className="form-label">Price Unit</label>
                <select name="price_unit" className="form-control" value={form.price_unit} onChange={handleChange}>
                  <option value="total">Total Price</option>
                  <option value="per_acre">Per Acre</option>
                  <option value="per_sqft">Per Sqft</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Area</label>
                <input type="number" name="area" className="form-control" placeholder="e.g. 2000" value={form.area} onChange={handleChange} min="0" />
              </div>
              <div className="form-group">
                <label className="form-label">Area Unit</label>
                <select name="area_unit" className="form-control" value={form.area_unit} onChange={handleChange}>
                  <option value="sqft">Square Feet (sqft)</option>
                  <option value="sqm">Square Meters (sqm)</option>
                  <option value="acre">Acres</option>
                  <option value="cent">Cent</option>
                  <option value="guntha">Guntha</option>
                  <option value="bigha">Bigha</option>
                </select>
              </div>
            </div>
          </div>

          {/* Property Details */}
          {['house', 'apartment', 'commercial'].includes(form.property_type) && (
            <div className="form-section">
              <h3 className="form-section-title">🏠 Property Details</h3>
              <div className="form-grid-3">
                <div className="form-group">
                  <label className="form-label">Bedrooms</label>
                  <input type="number" name="bedrooms" className="form-control" value={form.bedrooms} onChange={handleChange} min="0" max="20" />
                </div>
                <div className="form-group">
                  <label className="form-label">Bathrooms</label>
                  <input type="number" name="bathrooms" className="form-control" value={form.bathrooms} onChange={handleChange} min="0" max="20" />
                </div>
                <div className="form-group">
                  <label className="form-label">Facing</label>
                  <select name="facing" className="form-control" value={form.facing} onChange={handleChange}>
                    <option value="">Select</option>
                    <option value="East">East</option>
                    <option value="West">West</option>
                    <option value="North">North</option>
                    <option value="South">South</option>
                    <option value="North-East">North-East</option>
                    <option value="North-West">North-West</option>
                    <option value="South-East">South-East</option>
                    <option value="South-West">South-West</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Location */}
          <div className="form-section">
            <h3 className="form-section-title">📍 Location Details</h3>
            <div className="form-grid-2">
              <div className="form-group form-span-2">
                <label className="form-label">Full Address *</label>
                <input type="text" name="address" className="form-control" placeholder="House No., Street, Village, Block" value={form.address} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label className="form-label">Village / Area</label>
                <input type="text" name="village" className="form-control" placeholder="e.g. Kesinga" value={form.village} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Block / Tehsil</label>
                <select name="block" className="form-control" value={form.block} onChange={handleChange}>
                  <option value="">Select Block</option>
                  {BLOCKS.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">District *</label>
                <select name="district" className="form-control" value={form.district} onChange={handleChange}>
                  {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">State</label>
                <input type="text" name="state" className="form-control" value={form.state} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Pincode</label>
                <input type="text" name="pincode" className="form-control" placeholder="6-digit pincode" value={form.pincode} onChange={handleChange} maxLength={6} />
              </div>
            </div>
          </div>

          {/* Amenities */}
          <div className="form-section">
            <h3 className="form-section-title">🏗️ Amenities & Features</h3>
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Road Access</label>
                <select name="road_access" className="form-control" value={form.road_access} onChange={handleChange}>
                  <option value="">Select</option>
                  <option value="Paved Road">Paved Road</option>
                  <option value="Kutcha Road">Kutcha Road</option>
                  <option value="National Highway">National Highway</option>
                  <option value="State Highway">State Highway</option>
                  <option value="No Road">No Road</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Water Source</label>
                <select name="water_source" className="form-control" value={form.water_source} onChange={handleChange}>
                  <option value="">Select</option>
                  <option value="Municipal Supply">Municipal Supply</option>
                  <option value="Borewell">Borewell</option>
                  <option value="River/Canal">River/Canal</option>
                  <option value="Well">Well</option>
                  <option value="None">None</option>
                </select>
              </div>
            </div>
            <div className="checkbox-row">
              <label className="checkbox-label">
                <input type="checkbox" name="electricity" checked={form.electricity} onChange={handleChange} />
                <span>Electricity Available</span>
              </label>
              <label className="checkbox-label">
                <input type="checkbox" name="boundary_wall" checked={form.boundary_wall} onChange={handleChange} />
                <span>Boundary Wall Present</span>
              </label>
            </div>
          </div>

          {/* Images */}
          <div className="form-section">
            <h3 className="form-section-title">📸 Property Images (max 10)</h3>

            {/* Existing images (edit mode) */}
            {existingImages.length > 0 && (
              <div className="existing-images">
                <p className="form-label mb-1">Existing Images</p>
                <div className="image-preview-grid">
                  {existingImages.map(img => (
                    <div key={img.id} className={`preview-item ${deleteImages.includes(img.id) ? 'marked-delete' : ''}`}>
                      <img src={`${API_URL}${img.image_path}`} alt="" />
                      {img.is_primary && <div className="primary-badge">Primary</div>}
                      <button type="button" className="remove-img-btn" onClick={() => toggleDeleteExisting(img.id)} title={deleteImages.includes(img.id) ? 'Undo' : 'Delete'}>
                        {deleteImages.includes(img.id) ? '↩' : <FaTrash />}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="upload-area" onClick={() => fileRef.current?.click()}>
              <FaUpload className="upload-icon" />
              <div className="upload-text">Click to upload property images</div>
              <div className="upload-hint">JPG, PNG up to 5MB each. First image will be the primary photo.</div>
            </div>
            <input ref={fileRef} type="file" multiple accept="image/*" style={{ display: 'none' }} onChange={handleImages} />

            {images.length > 0 && (
              <div className="image-preview-grid mt-2">
                {images.map((img, i) => (
                  <div key={i} className="preview-item">
                    <img src={img.url} alt="" />
                    {i === 0 && existingImages.length === 0 && <div className="primary-badge">Primary</div>}
                    <button type="button" className="remove-img-btn" onClick={() => removeNewImage(i)}><FaTimes /></button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-ghost btn-lg" onClick={() => navigate(-1)}>Cancel</button>
            <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
              {loading ? (id ? 'Updating...' : 'Listing...') : (id ? 'Update Property' : 'List Property')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
