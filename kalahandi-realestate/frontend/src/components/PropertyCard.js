import React from 'react';
import { Link } from 'react-router-dom';
import { FaMapMarkerAlt, FaRulerCombined, FaBed, FaBath, FaHeart, FaRegHeart, FaEye } from 'react-icons/fa';
import { API_URL } from '../utils/api';
import './PropertyCard.css';

const TYPE_LABELS = {
  land: '🌿 Land', house: '🏠 House', commercial: '🏢 Commercial',
  apartment: '🏙️ Apartment', plot: '📐 Plot', farm: '🌾 Farm'
};

function formatPrice(price) {
  if (price >= 10000000) return `₹${(price / 10000000).toFixed(2)} Cr`;
  if (price >= 100000) return `₹${(price / 100000).toFixed(2)} L`;
  if (price >= 1000) return `₹${(price / 1000).toFixed(1)}K`;
  return `₹${price}`;
}

export default function PropertyCard({ property, onSaveToggle, isSaved }) {
  const imageUrl = property.primary_image
    ? `${API_URL}${property.primary_image}`
    : '/placeholder-property.jpg';

  return (
    <div className="property-card card">
      <Link to={`/properties/${property.id}`} className="prop-image-wrap">
        <img src={imageUrl} alt={property.title} className="prop-image" onError={e => e.target.src = 'https://via.placeholder.com/400x250/FED7AA/C2410C?text=Property'} />
        <div className="prop-badges">
          <span className="badge badge-primary">{TYPE_LABELS[property.property_type] || property.property_type}</span>
          {property.listing_type === 'rent' && <span className="badge badge-warning">For Rent</span>}
          {property.is_featured ? <span className="badge badge-success">⭐ Featured</span> : null}
        </div>
        {property.image_count > 1 && <div className="image-count">📷 {property.image_count}</div>}
      </Link>

      <div className="prop-body">
        <div className="prop-price">{formatPrice(property.price)}
          {property.price_unit !== 'total' && <span className="price-unit">/{property.price_unit === 'per_acre' ? 'acre' : 'sqft'}</span>}
        </div>

        <Link to={`/properties/${property.id}`}>
          <h3 className="prop-title">{property.title}</h3>
        </Link>

        <div className="prop-location">
          <FaMapMarkerAlt />
          <span>{[property.village, property.block, property.district].filter(Boolean).join(', ') || property.address}</span>
        </div>

        {(property.area || property.bedrooms > 0) && (
          <div className="prop-specs">
            {property.area && <span><FaRulerCombined /> {property.area} {property.area_unit}</span>}
            {property.bedrooms > 0 && <span><FaBed /> {property.bedrooms} BHK</span>}
            {property.bathrooms > 0 && <span><FaBath /> {property.bathrooms} Bath</span>}
          </div>
        )}

        <div className="prop-footer">
          <span className="prop-seller">By {property.seller_name || 'Owner'}</span>
          <div className="prop-actions">
            <span className="views-count"><FaEye /> {property.views || 0}</span>
            {onSaveToggle && (
              <button className={`save-btn ${isSaved ? 'saved' : ''}`} onClick={(e) => { e.preventDefault(); onSaveToggle(property.id); }} title={isSaved ? 'Remove from saved' : 'Save property'}>
                {isSaved ? <FaHeart /> : <FaRegHeart />}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
