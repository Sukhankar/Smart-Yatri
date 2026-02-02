import { Navigate } from 'react-router-dom';

// Consolidated: redirect to unified Verification page
export default function VerifyPayment() {
  return <Navigate to="/admin/verification" replace />;
}

