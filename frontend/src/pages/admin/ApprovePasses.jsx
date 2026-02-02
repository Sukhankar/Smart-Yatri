import { Navigate } from 'react-router-dom';

// This page was consolidated into the unified `Verification` page.
// Keep a small redirect stub to avoid breaking existing imports/routes.
export default function ApprovePasses() {
  return <Navigate to="/admin/verification" replace />;
}
