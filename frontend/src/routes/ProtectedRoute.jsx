import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Read the stored user directly from localStorage.
 * This acts as a synchronous fallback when React context
 * hasn't propagated the state yet (e.g. right after login).
 */
function getStoredUser() {
  try {
    const raw = localStorage.getItem('ventureiq_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

const LoadingSpinner = () => (
  <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh' }}>
    <div className="animate-pulse-glow" style={{
      width:48, height:48, borderRadius:'50%',
      background:'linear-gradient(135deg,#6366f1,#8b5cf6)',
      display:'flex', alignItems:'center', justifyContent:'center',
      color:'#fff', fontSize:'1.4rem', fontWeight:'900'
    }}>V</div>
  </div>
);

export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingSpinner />;

  // Use context user, or fall back to localStorage for the race-condition window
  const effectiveUser = user || getStoredUser();
  if (!effectiveUser) return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
}

export function RoleGuard({ children, roles }) {
  const { user, loading } = useAuth();

  if (loading) return <LoadingSpinner />;

  // Use context user, or fall back to localStorage for the race-condition window
  const effectiveUser = user || getStoredUser();
  if (!effectiveUser) return <Navigate to="/login" replace />;

  const userRole = (effectiveUser.role || '').toUpperCase();
  const allowedRoles = (roles || []).map(r => r.toUpperCase());

  if (!allowedRoles.includes(userRole)) {
    return <Navigate to="/unauthorized" replace />;
  }
  return children;
}
