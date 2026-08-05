import React from 'react';
import { Navigate } from 'react-router-dom';

/* Instant redirect to /login with mode: 'signup' state */
export default function RegisterPage() {
  return <Navigate to="/login" state={{ mode: 'signup' }} replace />;
}
