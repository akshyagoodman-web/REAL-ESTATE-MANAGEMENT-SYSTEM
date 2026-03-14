import React from 'react';
import { Link } from 'react-router-dom';
import { FaBuilding, FaPhone, FaEnvelope, FaMapMarkerAlt, FaFacebook, FaWhatsapp } from 'react-icons/fa';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-main">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <div className="footer-logo"><FaBuilding /></div>
              <div className="footer-brand-name">Kalahandi Real Estate</div>
              <p className="footer-tagline">Western Odisha's most trusted platform for buying, selling and renting properties. Connecting landowners with buyers across Kalahandi and beyond.</p>
              <div className="social-links">
                <a href="#" className="social-link"><FaFacebook /></a>
                <a href="#" className="social-link"><FaWhatsapp /></a>
              </div>
            </div>

            <div>
              <h4 className="footer-heading">Quick Links</h4>
              <ul className="footer-links">
                <li><Link to="/properties">Browse Properties</Link></li>
                <li><Link to="/register?role=seller">List Your Property</Link></li>
                <li><Link to="/register">Create Account</Link></li>
                <li><Link to="/login">Login</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="footer-heading">Property Types</h4>
              <ul className="footer-links">
                <li><Link to="/properties?property_type=land">Agricultural Land</Link></li>
                <li><Link to="/properties?property_type=house">Houses</Link></li>
                <li><Link to="/properties?property_type=plot">Residential Plots</Link></li>
                <li><Link to="/properties?property_type=commercial">Commercial</Link></li>
                <li><Link to="/properties?property_type=farm">Farm Land</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="footer-heading">Districts</h4>
              <ul className="footer-links">
                {['Kalahandi', 'Nuapada', 'Bolangir', 'Bargarh', 'Sambalpur', 'Koraput'].map(d => (
                  <li key={d}><Link to={`/properties?district=${d}`}>{d}</Link></li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <div className="container">
          <div className="footer-bottom-inner">
            <span>© {new Date().getFullYear()} Kalahandi Real Estate. All rights reserved.</span>
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.82rem' }}>Made with ❤️ for Odisha</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
