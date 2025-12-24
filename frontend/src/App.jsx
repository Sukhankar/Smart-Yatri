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
import ManageBuses from "./pages/manager/ManageBuses";
import ManageUsers from "./pages/manager/ManageUsers";
import VerifyPayment from "./pages/manager/VerifyPayment";
import Reports from "./pages/manager/Reports";

// Admin pages
import AdminDashboard from "./pages/admin/Dashboard";
import AdminApprovePasses from "./pages/admin/ApprovePasses";
import AdminManageRoutes from "./pages/admin/ManageRoutes";
import AdminManageBuses from "./pages/admin/ManageBuses";
import AdminManageUsers from "./pages/admin/ManageUsers";
import AdminVerifyPayment from "./pages/admin/VerifyPayment";
import AdminReports from "./pages/admin/Reports";
import AuditLogs from "./pages/admin/AuditLogs";
import SystemConfig from "./pages/admin/SystemConfig";
import ManageTickets from "./pages/admin/ManageTickets";

// Faculty pages
import FacultyDashboard from "./pages/faculty/Dashboard";
import FacultyBookTicket from "./pages/faculty/BookTicket";
import FacultyMyTickets from "./pages/faculty/MyTickets";
import FacultyMyPass from "./pages/faculty/MyPass";
import FacultyTravelHistory from "./pages/faculty/TravelHistory";
import FacultyProfile from "./pages/faculty/Profile";

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
        <Route path="/manager/buses" element={<ManageBuses />} />
        <Route path="/manager/users" element={<ManageUsers />} />
        <Route path="/manager/verify-payment" element={<VerifyPayment />} />
        <Route path="/manager/reports" element={<Reports />} />
        
        {/* Admin routes */}
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/approve-passes" element={<AdminApprovePasses />} />
        <Route path="/admin/routes" element={<AdminManageRoutes />} />
        <Route path="/admin/buses" element={<AdminManageBuses />} />
        <Route path="/admin/users" element={<AdminManageUsers />} />
        <Route path="/admin/verify-payment" element={<AdminVerifyPayment />} />
        <Route path="/admin/reports" element={<AdminReports />} />
        <Route path="/admin/audit" element={<AuditLogs />} />
        <Route path="/admin/config" element={<SystemConfig />} />
        <Route path="/admin/tickets" element={<ManageTickets />} />
        
        {/* Faculty routes */}
        <Route path="/faculty/dashboard" element={<FacultyDashboard />} />
        <Route path="/faculty/book-ticket" element={<FacultyBookTicket />} />
        <Route path="/faculty/my-tickets" element={<FacultyMyTickets />} />
        <Route path="/faculty/my-pass" element={<FacultyMyPass />} />
        <Route path="/faculty/travel-history" element={<FacultyTravelHistory />} />
        <Route path="/faculty/profile" element={<FacultyProfile />} />
        
        {/* Redirect any unknown routes to the home page */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
