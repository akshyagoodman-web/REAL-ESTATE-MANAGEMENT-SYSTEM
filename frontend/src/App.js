import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Properties from './pages/Properties';
import PropertyDetail from './pages/PropertyDetail';
import SellerDashboard from './pages/SellerDashboard';
import AddProperty from './pages/AddProperty';
import Inquiries from './pages/Inquiries';
import SavedProperties from './pages/SavedProperties';
import Profile from './pages/Profile';

function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;
  return children;
}

function AppContent() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <main style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/properties" element={<Properties />} />
          <Route path="/properties/:id" element={<PropertyDetail />} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/seller/dashboard" element={<ProtectedRoute role="seller"><SellerDashboard /></ProtectedRoute>} />
          <Route path="/seller/add-property" element={<ProtectedRoute role="seller"><AddProperty /></ProtectedRoute>} />
          <Route path="/seller/edit-property/:id" element={<ProtectedRoute role="seller"><AddProperty /></ProtectedRoute>} />
          <Route path="/seller/inquiries" element={<ProtectedRoute role="seller"><Inquiries /></ProtectedRoute>} />
          <Route path="/buyer/saved" element={<ProtectedRoute role="buyer"><SavedProperties /></ProtectedRoute>} />
          <Route path="/buyer/inquiries" element={<ProtectedRoute role="buyer"><Inquiries /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
        <Toaster position="top-right" toastOptions={{ duration: 3500, style: { fontFamily: 'var(--font-body)', fontSize: '0.9rem', borderRadius: '10px' } }} />
      </AuthProvider>
    </BrowserRouter>
  );
}
