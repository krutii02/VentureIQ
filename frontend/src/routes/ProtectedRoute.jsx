import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh' }}>
      <div className="animate-pulse-glow" style={{
        width:48, height:48, borderRadius:'50%',
        background:'linear-gradient(135deg,#6366f1,#8b5cf6)',
        display:'flex', alignItems:'center', justifyContent:'center',
        color:'#fff', fontSize:'1.4rem', fontWeight:'900'
      }}>V</div>
    </div>
  );

  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
}

export function RoleGuard({ children, roles }) {
  const { user } = useAuth();
  if (!user || !roles.includes(user.role)) return <Navigate to="/unauthorized" replace />;
  return children;
}
