import { useState, useEffect, useRef, useCallback } from "react";
import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { notificationService } from "../services/notificationService";
import busLogo from "../assets/bus-logo.png";

// Icons SVGs
const icons = {
  dashboard: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  bookTicket: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
    </svg>
  ),
  tickets: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  pass: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
    </svg>
  ),
  travelHistory: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  profile: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  qrScanner: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
    </svg>
  ),
  manageRoutes: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4m-8 4h6m-6 4h6m-6 4h6" />
    </svg>
  ),
  buses: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 17V7a2 2 0 012-2h12a2 2 0 012 2v10M5 21h2a2 2 0 004 0h2a2 2 0 004 0h2" />
    </svg>
  ),
  users: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a4 4 0 00-4-4h-1M9 20H4v-2a4 4 0 014-4h1m4-4a4 4 0 100-8 4 4 0 000 8Zm6 8v-2a6 6 0 10-12 0v2" />
    </svg>
  ),
  verifyPayment: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7 5h10a2 2 0 012 2v10a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2z" />
    </svg>
  ),
  reports: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-6a2 2 0 012-2h2a2 2 0 012 2v6m3 3H6a2 2 0 01-2-2V7a2 2 0 012-2h6l6 6v8a2 2 0 01-2 2z" />
    </svg>
  ),
  approvePasses: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  audit: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2" />
    </svg>
  ),
  config: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2A9 9 0 1112 3v0a9 9 0 018 11z" />
    </svg>
  ),
  // You can add more for different roles...
};

function NotificationFullScreen({
  notifications,
  unreadCount,
  setShowNotifications,
  showNotifications,
  handleMarkAsRead,
  handleMarkAllAsRead,
  getNotificationIconColor,
  getNotificationBgColor,
}) {
  const notifMainRef = useRef();

  useEffect(() => {
    if (showNotifications && notifMainRef.current) notifMainRef.current.focus();
  }, [showNotifications]);

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === "Escape") setShowNotifications(false);
    }
    if (showNotifications) {
      window.addEventListener("keydown", onKeyDown);
      return () => window.removeEventListener("keydown", onKeyDown);
    }
  }, [showNotifications, setShowNotifications]);

  if (!showNotifications) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-stretch justify-center bg-black/70 backdrop-blur-sm transition-all duration-300"
      aria-modal="true"
      tabIndex={-1}
      ref={notifMainRef}
      onClick={() => setShowNotifications(false)}
      style={{ overscrollBehavior: "contain" }}
    >
      <section
        className="relative bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col mx-2 my-8 sm:my-10 w-full max-w-lg md:max-w-2xl lg:max-w-3xl xl:max-w-4xl max-h-[90vh]"
        onClick={e => e.stopPropagation()}
        tabIndex={0}
      >
        <header className="sticky top-0 bg-gradient-to-r from-gray-900 to-gray-800 text-white px-6 py-4 flex items-center justify-between border-b border-gray-700 rounded-t-lg">
          <div className="flex items-center gap-2">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <h3 className="font-bold text-lg">Notifications</h3>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full ml-2">
                {unreadCount} new
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs text-gray-300 hover:text-white transition-colors px-2 py-1 rounded hover:bg-gray-700"
              >
                Mark all read
              </button>
            )}
            <button
              onClick={() => setShowNotifications(false)}
              className="text-gray-300 hover:text-white rounded hover:bg-gray-700 transition-colors p-2"
              aria-label="Close notifications"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto max-h-[65vh] md:max-h-[65vh] transition-shadow">
          {notifications.length === 0 ? (
            <div className="p-12 text-center">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <p className="text-gray-500 font-medium">No notifications</p>
              <p className="text-gray-400 text-sm mt-1">You're all caught up!</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 w-full">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-4 border-l-4 transition-all duration-200 hover:bg-gray-50 cursor-pointer ${getNotificationBgColor(notif.type, notif.isRead)}`}
                  onClick={() => !notif.isRead && handleMarkAsRead(notif.id)}
                  role="button"
                  tabIndex={0}
                  aria-label={notif.title}
                  onKeyDown={e => {
                    if (e.key === "Enter" && !notif.isRead) handleMarkAsRead(notif.id);
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className={`flex-shrink-0 mt-0.5 ${getNotificationIconColor(notif.type)}`}>
                      {notif.type === "SUCCESS" ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      ) : notif.type === "WARNING" ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      ) : notif.type === "ERROR" ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className={`font-semibold text-sm ${notif.isRead ? "text-gray-600" : "text-gray-900"}`}>
                          {notif.title}
                        </h4>
                        {!notif.isRead && (
                          <span className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-1.5"></span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1 leading-relaxed">{notif.message}</p>
                      <p className="text-xs text-gray-400 mt-2">
                        {new Date(notif.createdAt).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

/**
 * This component renders JUST the header and nav for mobile, 
 * and is exported so it can be used in your root layout.
 * 
 * To ensure the contents are not hidden behind the header/footer (mobile safespace), 
 * in your main layout or content container, add:
 * 
 *   <div className="pt-[70px] pb-[70px] md:pt-0 md:pb-0"> ...Your page... </div>
 * 
 * Where 70px = h-16 + some extra (header/footer height + extra space). 
 * This ensures the content is always fully visible with some spacing.
 * For extra safety with iPhones, you can use css env(safe-area-inset-top) and env(safe-area-inset-bottom).
 */

export default function Sidebar({ role = "student" }) {
  const navigate = useNavigate();
  const location = useLocation();

  // For mobile sidebar toggling (desktop only)
  const [isOpen, setIsOpen] = useState(false);

  // Notification state
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Per-role menuItems - completed for main roles per ui
  const menuItems = {
    student: [
      { path: "/student/dashboard", label: "Dashboard", icon: icons.dashboard },
      { path: "/student/book-ticket", label: "Buy Ticket", icon: icons.bookTicket },
      { path: "/student/my-tickets", label: "My Tickets", icon: icons.tickets },
      { path: "/student/my-pass", label: "My Pass", icon: icons.pass },
      { path: "/student/travel-history", label: "Travel History", icon: icons.travelHistory },
      { path: "/student/profile", label: "Profile", icon: icons.profile },
    ],
    conductor: [
      { path: "/conductor/scanner", label: "QR Scanner", icon: icons.qrScanner },
    ],
    manager: [
      { path: "/manager/dashboard", label: "Dashboard", icon: icons.dashboard },
      { path: "/manager/approve-passes", label: "Approve Passes", icon: icons.approvePasses },
      { path: "/manager/routes", label: "Manage Routes", icon: icons.manageRoutes },
      { path: "/manager/buses", label: "Manage Buses", icon: icons.buses },
      { path: "/manager/users", label: "Manage Users", icon: icons.users },
      { path: "/manager/verify-payment", label: "Verify Payment", icon: icons.verifyPayment },
      { path: "/manager/reports", label: "Reports", icon: icons.reports },
    ],
    admin: [
      { path: "/admin/dashboard", label: "Dashboard", icon: icons.dashboard },
      { path: "/admin/approve-passes", label: "Approve Passes", icon: icons.approvePasses },
      { path: "/admin/tickets", label: "Ticket Sessions", icon: icons.tickets },
      { path: "/admin/pricing-rules", label: "Pricing Rules", icon: icons.config },
      { path: "/admin/verification", label: "Verification", icon: icons.verifyPayment },
      { path: "/admin/routes", label: "Manage Routes", icon: icons.manageRoutes },
      { path: "/admin/buses", label: "Manage Buses", icon: icons.buses },
      { path: "/admin/users", label: "Manage Users", icon: icons.users },
      { path: "/admin/verify-payment", label: "Verify Payment", icon: icons.verifyPayment },
      { path: "/admin/reports", label: "Reports", icon: icons.reports },
      { path: "/admin/audit", label: "Audit Logs", icon: icons.audit },
      { path: "/admin/config", label: "System Config", icon: icons.config },
    ],
    faculty: [
      { path: "/faculty/dashboard", label: "Dashboard", icon: icons.dashboard },
      { path: "/faculty/book-ticket", label: "Buy Ticket", icon: icons.bookTicket },
      { path: "/faculty/my-tickets", label: "My Tickets", icon: icons.tickets },
      { path: "/faculty/my-pass", label: "My Pass", icon: icons.pass },
      { path: "/faculty/travel-history", label: "Travel History", icon: icons.travelHistory },
      { path: "/faculty/profile", label: "Profile", icon: icons.profile },
    ],
  };

  const items = menuItems[role] || menuItems.student;

  const handleLogout = async () => {
    try {
      const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:5000";
      await fetch(`${SERVER_URL}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
      navigate("/login");
    } catch (err) {
      console.error("Logout error:", err);
      navigate("/login");
    }
  };

  const roleColors = {
    student: "from-blue-600 to-blue-800",
    conductor: "from-green-600 to-green-800",
    manager: "from-purple-600 to-purple-800",
    admin: "from-red-600 to-red-800",
    faculty: "from-indigo-600 to-indigo-800",
  };

  const roleColor = roleColors[role] || roleColors.student;

  const loadNotifications = useCallback(async () => {
    try {
      const res = await notificationService.listNotifications();
      if (res?.notifications) {
        setNotifications(res.notifications);
        setUnreadCount(res.unreadCount || res.notifications.filter(n => !n.isRead).length);
      }
    } catch (err) {
      console.error("Error loading notifications:", err);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [loadNotifications]);

  const handleMarkAsRead = async id => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.isRead);
      await Promise.all(unreadNotifications.map(n => notificationService.markAsRead(n.id)));
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Error marking all as read:", err);
    }
  };

  const getNotificationIconColor = (type) => {
    switch (type) {
      case "SUCCESS":
        return "text-green-500";
      case "WARNING":
        return "text-yellow-500";
      case "ERROR":
        return "text-red-500";
      default:
        return "text-blue-500";
    }
  };
  const getNotificationBgColor = (type, isRead) => {
    if (isRead) return "bg-gray-50 border-gray-200";
    switch (type) {
      case "SUCCESS":
        return "bg-green-50 border-green-300";
      case "WARNING":
        return "bg-yellow-50 border-yellow-300";
      case "ERROR":
        return "bg-red-50 border-red-300";
      default:
        return "bg-blue-50 border-blue-300";
    }
  };

  /**
   * 
   * Use pt-[70px] pb-[70px] (or safe-area-aware custom styles) on your page container for mobile safespace.
   * For example, in your main layout/component:
   * <div className="pt-[70px] pb-[70px] md:pt-0 md:pb-0"> ... </div>
   */

  return (
    <>
      {/* Mobile Safe Space Styles */}
      <style>{`
        /* Add safe space padding for mobile content to prevent overlap with fixed header/footer */
        @media (max-width: 767px) {
          /* Target content divs that come after Sidebar in flex containers */
          .flex > .flex-1 {
            padding-top: calc(70px + env(safe-area-inset-top, 0px)) !important;
            padding-bottom: calc(70px + env(safe-area-inset-bottom, 0px)) !important;
          }
          
          /* Also handle cases where content is in min-h-screen containers */
          .min-h-screen.flex > .flex-1 {
            padding-top: calc(70px + env(safe-area-inset-top, 0px)) !important;
            padding-bottom: calc(70px + env(safe-area-inset-bottom, 0px)) !important;
          }
        }
      `}</style>
      {/* Notification Overlay */}
      <NotificationFullScreen
        notifications={notifications}
        unreadCount={unreadCount}
        setShowNotifications={setShowNotifications}
        showNotifications={showNotifications}
        handleMarkAsRead={handleMarkAsRead}
        handleMarkAllAsRead={handleMarkAllAsRead}
        getNotificationIconColor={getNotificationIconColor}
        getNotificationBgColor={getNotificationBgColor}
      />
      {/* Mobile: Sticky Top Header - add extra space with increased height and safe-area-inset-top */}
      <header
        className="md:hidden fixed top-0 left-0 right-0 z-50 bg-black border-b border-gray-800"
        style={{
          paddingTop: "calc(env(safe-area-inset-top, 0px) + 8px)", // extra space
          height: "70px", // 56px + extra 14px (approx 1rem)
        }}
      >
        <div className="flex items-center justify-between px-4 h-16"> {/* h-14 -> h-16 */}
          <div className="flex items-center gap-2">
            <img
              src={busLogo}
              alt="SmartYatri Logo"
              className="w-8 h-8 rounded-lg"
            />
            <div className="flex flex-col">
              <h2 className="text-base font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent leading-tight">
                SmartYatri
              </h2>
              <p className="text-[10px] text-gray-400 capitalize leading-tight">{role}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowNotifications(true)}
              className="text-white hover:text-gray-300 transition-colors relative"
              aria-label="Notifications"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setIsOpen(true)}
              className="text-white hover:text-gray-300 transition-colors"
              aria-label="Menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </header>
      {/* Mobile: Sticky Bottom Nav - add extra space with increased height and safe-area-inset-bottom */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-black border-t border-gray-800"
        style={{
          paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 8px)", // extra space
          height: "70px", // 56px + extra 14px
        }}
      >
        <div className="flex items-center justify-around h-16 px-2">
          {items.slice(0, 5).map(item => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`relative flex flex-col items-center justify-center flex-1 h-full transition-all duration-200 ${
                  isActive ? "text-white" : "text-gray-400"
                }`}
                aria-label={item.label}
              >
                <span className={`${isActive ? "scale-110" : ""} transition-transform duration-200`}>
                  {React.cloneElement(item.icon, { className: "w-6 h-6" })}
                </span>
                <span className={`text-[10px] mt-0.5 font-medium ${isActive ? "text-white" : "text-gray-500"}`}>
                  {item.label.length > 10 ? item.label.substring(0, 8) + ".." : item.label}
                </span>
                {isActive && (
                  <span className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-white rounded-full"></span>
                )}
              </button>
            );
          })}
          {items.length > 5 && (
            <button
              onClick={() => setIsOpen(true)}
              className="flex flex-col items-center justify-center flex-1 h-full transition-all duration-200 text-gray-400"
              aria-label="More"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
              <span className="text-[10px] mt-0.5 font-medium text-gray-500">More</span>
            </button>
          )}
        </div>
      </nav>
      {/* Mobile: Full Menu Modal */}
      <div
        className={`fixed inset-0 z-50 bg-black bg-opacity-50 transition-opacity duration-200 md:hidden ${isOpen ? "block" : "hidden"}`}
        onClick={() => setIsOpen(false)}
        // For mobile overlay, ensure full coverage, safearea handled by header/footer itself
      >
        <div
          className="fixed bottom-0 left-0 right-0 bg-gray-900 rounded-t-3xl shadow-2xl max-h-[80vh] overflow-y-auto"
          onClick={e => e.stopPropagation()}
        >
          <div className="sticky top-0 bg-gray-900 border-b border-gray-700 px-6 py-4 flex items-center justify-between">
            <h3 className="text-lg font-bold text-white">Menu</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-300 hover:text-white transition-colors"
              aria-label="Close menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="p-4">
            <ul className="space-y-2">
              {items.map(item => {
                const isActive = location.pathname === item.path;
                return (
                  <li key={item.path}>
                    <button
                      onClick={() => {
                        navigate(item.path);
                        setIsOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                        isActive
                          ? `bg-gradient-to-r ${roleColor} text-white shadow-lg`
                          : "text-gray-300 hover:bg-gray-700/50 hover:text-white"
                      }`}
                    >
                      <span className={isActive ? "scale-110" : ""}>
                        {item.icon}
                      </span>
                      <span className="font-medium">{item.label}</span>
                      {isActive && (
                        <span className="ml-auto w-2 h-2 bg-white rounded-full animate-pulse"></span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
            <div className="mt-4 pt-4 border-t border-gray-700">
              <button
                onClick={() => {
                  handleLogout();
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 hover:bg-red-600/20 hover:text-red-400 transition-all duration-200 border border-gray-700/50 hover:border-red-500/50"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="font-medium">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* Desktop: Sidebar */}
      <div className="hidden md:block">
        <aside className="sticky top-0 h-screen w-64 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white flex flex-col shadow-2xl border-r border-gray-700">
          <div className="p-6 border-b border-gray-700/50 bg-gradient-to-r from-gray-800 to-gray-900">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <img src={busLogo} alt="SmartYatri Logo" className="w-10 h-10 rounded-lg shadow-lg" />
                <div>
                  <h2 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                    SmartYatri
                  </h2>
                  <p className="text-xs text-gray-400 capitalize font-medium mt-0.5">{role} Portal</p>
                </div>
              </div>
              <button
                onClick={() => setShowNotifications(true)}
                className="text-gray-300 hover:text-white transition-colors relative p-2 rounded-lg hover:bg-gray-700/50"
                aria-label="Notifications"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
            </div>
          </div>
          <nav className="flex-1 p-4 overflow-y-auto">
            <ul className="space-y-2">
              {items.map(item => {
                const isActive = location.pathname === item.path;
                return (
                  <li key={item.path}>
                    <button
                      onClick={() => navigate(item.path)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                        isActive
                          ? `bg-gradient-to-r ${roleColor} text-white shadow-lg transform scale-[1.02]`
                          : "text-gray-300 hover:bg-gray-700/50 hover:text-white hover:translate-x-1"
                      }`}
                    >
                      <span className={`transition-transform duration-200 ${isActive ? "scale-110" : "group-hover:scale-110"}`}>
                        {item.icon}
                      </span>
                      <span className="font-medium">{item.label}</span>
                      {isActive && (
                        <span className="ml-auto w-2 h-2 bg-white rounded-full animate-pulse"></span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
          <div className="p-4 border-t border-gray-700/50 bg-gray-900/50 mt-auto">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 hover:bg-red-600/20 hover:text-red-400 transition-all duration-200 group border border-gray-700/50 hover:border-red-500/50"
            >
              <svg className="w-5 h-5 group-hover:rotate-12 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </aside>
      </div>
    </>
  );
}
