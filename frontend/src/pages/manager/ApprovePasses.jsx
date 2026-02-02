import { Navigate } from 'react-router-dom';

// This manager page was consolidated into the unified `Verification` page.
export default function ApprovePasses() {
  return <Navigate to="/admin/verification" replace />;
}
