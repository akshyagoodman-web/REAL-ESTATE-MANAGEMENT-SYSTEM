import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaEnvelope, FaReply, FaCheck, FaTimes, FaHome } from 'react-icons/fa';
import toast from 'react-hot-toast';
import api, { API_URL } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import './Inquiries.css';

const STATUS_COLORS = { pending: 'badge-warning', responded: 'badge-success', closed: 'badge-gray' };

export default function Inquiries() {
  const { user } = useAuth();
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyModal, setReplyModal] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isSeller = user?.role === 'seller';

  useEffect(() => {
    const endpoint = isSeller ? '/inquiries/received' : '/inquiries/my-inquiries';
    api.get(endpoint).then(res => {
      setInquiries(res.data.data);
    }).catch(() => toast.error('Failed to load inquiries')).finally(() => setLoading(false));
  }, [isSeller]);

  const handleReply = async () => {
    if (!replyText.trim()) return toast.error('Please write a response');
    setSubmitting(true);
    try {
      await api.put(`/inquiries/${replyModal.id}/respond`, { seller_response: replyText, status: 'responded' });
      setInquiries(prev => prev.map(i => i.id === replyModal.id ? { ...i, seller_response: replyText, status: 'responded' } : i));
      toast.success('Response sent!');
      setReplyModal(null);
      setReplyText('');
    } catch { toast.error('Failed to send response'); }
    setSubmitting(false);
  };

  const handleClose = async (id) => {
    try {
      await api.put(`/inquiries/${id}/close`);
      setInquiries(prev => prev.map(i => i.id === id ? { ...i, status: 'closed' } : i));
      toast.success('Inquiry closed');
    } catch { toast.error('Failed'); }
  };

  return (
    <div className="inquiries-page">
      <div className="page-header">
        <div className="container">
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 700, color: 'white', position: 'relative' }}>
            {isSeller ? '📬 Received Inquiries' : '📩 My Inquiries'}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.8)', position: 'relative' }}>
            {isSeller ? 'Manage buyer inquiries for your listings' : 'Track your property inquiries'}
          </p>
        </div>
      </div>

      <div className="container" style={{ paddingTop: 28, paddingBottom: 60 }}>
        {loading ? <div className="spinner" /> : inquiries.length === 0 ? (
          <div className="empty-state">
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>📭</div>
            <h3>No inquiries yet</h3>
            <p>{isSeller ? 'Inquiries from buyers will appear here' : 'Browse properties and contact sellers'}</p>
            {!isSeller && <Link to="/properties" className="btn btn-primary mt-2"><FaHome /> Browse Properties</Link>}
          </div>
        ) : (
          <div className="inquiry-list">
            {inquiries.map(inq => (
              <div key={inq.id} className="inquiry-card card">
                <div className="inquiry-header">
                  <div className="inquiry-prop">
                    {inq.property_image && <img src={`${API_URL}${inq.property_image}`} alt="" className="inq-prop-thumb" onError={e => e.target.style.display='none'} />}
                    <div>
                      <Link to={`/properties/${inq.property_id}`} className="inq-prop-title">{inq.property_title}</Link>
                      <div className="inq-prop-location">{inq.property_address}</div>
                      <div className="inq-prop-price" style={{ color: 'var(--primary)', fontWeight: 700 }}>
                        ₹{(inq.property_price || 0).toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>
                  <span className={`badge ${STATUS_COLORS[inq.status]}`}>{inq.status}</span>
                </div>

                <div className="inquiry-body">
                  <div className="inquiry-from">
                    <strong>{isSeller ? `👤 ${inq.buyer_name}` : `🏠 Seller: ${inq.seller_name}`}</strong>
                    <span className="inq-mobile">📞 {isSeller ? inq.buyer_mobile : inq.seller_mobile}</span>
                    <span className="inq-date">{new Date(inq.created_at).toLocaleDateString('en-IN')}</span>
                  </div>
                  <div className="inquiry-message">
                    <div className="msg-label">Message:</div>
                    <div className="msg-text">{inq.message}</div>
                    {inq.contact_mobile && <div className="msg-contact">📞 Alternate contact: {inq.contact_mobile}</div>}
                  </div>

                  {inq.seller_response && (
                    <div className="inquiry-response">
                      <div className="msg-label response-label">✅ Seller's Response:</div>
                      <div className="msg-text">{inq.seller_response}</div>
                    </div>
                  )}
                </div>

                {isSeller && inq.status !== 'closed' && (
                  <div className="inquiry-actions">
                    <button className="btn btn-secondary btn-sm" onClick={() => { setReplyModal(inq); setReplyText(inq.seller_response || ''); }}>
                      <FaReply /> {inq.seller_response ? 'Update Response' : 'Reply'}
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={() => handleClose(inq.id)}>
                      <FaCheck /> Mark Closed
                    </button>
                  </div>
                )}
                {!isSeller && inq.status !== 'closed' && (
                  <div className="inquiry-actions">
                    <button className="btn btn-ghost btn-sm" onClick={() => handleClose(inq.id)}>
                      <FaTimes /> Close Inquiry
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reply Modal */}
      {replyModal && (
        <div className="modal-overlay" onClick={() => setReplyModal(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Reply to Inquiry</h3>
              <button onClick={() => setReplyModal(null)}><FaTimes /></button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: 12, fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                Replying to: <strong>{replyModal.buyer_name}</strong> about <strong>{replyModal.property_title}</strong>
              </p>
              <div className="form-group">
                <label className="form-label">Your Response *</label>
                <textarea className="form-control" rows={5} placeholder="Write your response to the buyer..." value={replyText} onChange={e => setReplyText(e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-ghost" onClick={() => setReplyModal(null)}>Cancel</button>
                <button className="btn btn-secondary flex-1" onClick={handleReply} disabled={submitting}>
                  {submitting ? 'Sending...' : 'Send Response'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
