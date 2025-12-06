import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/login.jsx";
import SignupPage from "./pages/signup.jsx";
import HomePage from "./pages/mainpage.jsx";

// Student pages
import StudentDashboard from "./pages/student/Dashboard";
import BookTicket from "./pages/student/BookTicket";
import MyTickets from "./pages/student/MyTickets";
import MyPass from "./pages/student/MyPass";
import TravelHistory from "./pages/student/TravelHistory";
import StudentProfile from "./pages/student/Profile";

// Conductor pages
import ConductorScanner from "./pages/conductor/Scanner";

// Manager pages
import ManagerDashboard from "./pages/manager/Dashboard";
import ApprovePasses from "./pages/manager/ApprovePasses";
import ManageRoutes from "./pages/manager/ManageRoutes";
import Reports from "./pages/manager/Reports";

// Admin pages
import AdminDashboard from "./pages/admin/Dashboard";
import ManageUsers from "./pages/admin/ManageUsers";
import AuditLogs from "./pages/admin/AuditLogs";
import SystemConfig from "./pages/admin/SystemConfig";

// Faculty pages
import FacultyDashboard from "./pages/faculty/Dashboard";
import FacultyBookTicket from "./pages/faculty/BookTicket";
import FacultyMyPass from "./pages/faculty/MyPass";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        
        {/* Student routes */}
        <Route path="/student/dashboard" element={<StudentDashboard />} />
        <Route path="/student/book-ticket" element={<BookTicket />} />
        <Route path="/student/my-tickets" element={<MyTickets />} />
        <Route path="/student/my-pass" element={<MyPass />} />
        <Route path="/student/travel-history" element={<TravelHistory />} />
        <Route path="/student/profile" element={<StudentProfile />} />
        
        {/* Conductor routes */}
        <Route path="/conductor/scanner" element={<ConductorScanner />} />
        
        {/* Manager routes */}
        <Route path="/manager/dashboard" element={<ManagerDashboard />} />
        <Route path="/manager/approve-passes" element={<ApprovePasses />} />
        <Route path="/manager/routes" element={<ManageRoutes />} />
        <Route path="/manager/reports" element={<Reports />} />
        
        {/* Admin routes */}
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<ManageUsers />} />
        <Route path="/admin/audit" element={<AuditLogs />} />
        <Route path="/admin/config" element={<SystemConfig />} />
        
        {/* Faculty routes */}
        <Route path="/faculty/dashboard" element={<FacultyDashboard />} />
        <Route path="/faculty/book-ticket" element={<FacultyBookTicket />} />
        <Route path="/faculty/my-pass" element={<FacultyMyPass />} />
        
        {/* Redirect any unknown routes to the home page */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
