import { useNavigate, useLocation } from "react-router-dom";
import {
  Home,
  Ticket,
  User,
  History,

  Users,
  ClipboardList,
  Settings,
  LogOut,
  FileCheck,
  Route,
  ListChecks,
  Scan
} from "lucide-react";
import { useRef, useState } from "react";

export default function Sidebar({ role = "student" }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [width, setWidth] = useState(256); // 64*4 = 256px (Tailwind w-64)
  const resizing = useRef(false);
  const sidebarRef = useRef(null);

  // ---------------- ICON MAP ---------------- //
  const icons = {
    dashboard: <Home className="w-5 h-5" />,
    buyTicket: <Ticket className="w-5 h-5" />,
    myTickets: <ClipboardList className="w-5 h-5" />,
    pass: <FileCheck className="w-5 h-5" />,
    travel: <History className="w-5 h-5" />,
    profile: <User className="w-5 h-5" />,
    scan: <Scan className="w-5 h-5" />,
    users: <Users className="w-5 h-5" />,
    audit: <ListChecks className="w-5 h-5" />,
    routes: <Route className="w-5 h-5" />,
    reports: <History className="w-5 h-5" />,
    settings: <Settings className="w-5 h-5" />,
  };

  // ---------------- MENU CONFIG ---------------- //
  const menuItems = {
    student: [
      { path: "/student/dashboard", label: "Dashboard", icon: icons.dashboard },
      { path: "/student/book-ticket", label: "Buy Ticket", icon: icons.buyTicket },
      { path: "/student/my-tickets", label: "My Tickets", icon: icons.myTickets },
      { path: "/student/my-pass", label: "My Pass", icon: icons.pass },
      { path: "/student/travel-history", label: "Travel History", icon: icons.travel },
      { path: "/student/profile", label: "Profile", icon: icons.profile },
    ],
    conductor: [
      { path: "/conductor/scanner", label: "QR Scanner", icon: icons.scan },
    ],
    manager: [
      { path: "/manager/dashboard", label: "Dashboard", icon: icons.dashboard },
      { path: "/manager/approve-passes", label: "Approve Passes", icon: icons.pass },
      { path: "/manager/routes", label: "Manage Routes", icon: icons.routes },
      { path: "/manager/reports", label: "Reports", icon: icons.reports },
    ],
    admin: [
      { path: "/admin/dashboard", label: "Dashboard", icon: icons.dashboard },
      { path: "/admin/users", label: "Manage Users", icon: icons.users },
      { path: "/admin/audit", label: "Audit Logs", icon: icons.audit },
      { path: "/admin/config", label: "System Config", icon: icons.settings },
    ],
    faculty: [
      { path: "/faculty/dashboard", label: "Dashboard", icon: icons.dashboard },
      { path: "/faculty/book-ticket", label: "Book Ticket", icon: icons.buyTicket },
      { path: "/faculty/my-pass", label: "My Pass", icon: icons.pass },
      { path: "/faculty/profile", label: "Profile", icon: icons.profile },
    ],
  };

  const items = menuItems[role] || menuItems.student;

  const handleLogout = async () => {
    try {
      const SERVER_URL =
        import.meta.env.VITE_SERVER_URL || "http://localhost:5000";

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

  // ---------------- RESIZE LOGIC ---------------- //
  const handleMouseDown = (e) => {
    e.preventDefault();
    resizing.current = true;

    // useEffect cleanup will handle this safely and lint error-free,
    // so we set a temp variable to track cursor stuckness
    document.body.classList.add("cursor-col-resize");
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleMouseMove = (e) => {
    if (!resizing.current) return;
    let newWidth = e.clientX - (sidebarRef.current?.getBoundingClientRect().left || 0);
    newWidth = Math.max(160, Math.min(newWidth, 400));
    setWidth(newWidth);
  };

  const handleMouseUp = () => {
    resizing.current = false;
    document.body.classList.remove("cursor-col-resize");
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  };

  // Add the style to the document head if it doesn't exist (once per load)
  if (typeof window !== "undefined" && typeof document !== "undefined" && !document.getElementById("sidebar-cursor-css")) {
    const style = document.createElement("style");
    style.id = "sidebar-cursor-css";
    style.innerHTML = `.cursor-col-resize { cursor: col-resize !important; }`;
    document.head.appendChild(style);
  }

  // ---------------- SIDEBAR UI ---------------- //
  return (
    <div
      ref={sidebarRef}
      style={{
        width: width,
        minWidth: 160,
        maxWidth: 400,
        transition: resizing.current ? 'none' : 'width 0.15s cubic-bezier(.4,0,.2,1)',
        userSelect: resizing.current ? "none" : "auto",
        zIndex: 10,
      }}
      className="
        min-h-screen backdrop-blur-xl bg-white/40 
        border-r border-gray-200 shadow-xl flex flex-col relative
      "
    >
      {/* HEADER */}
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-bold text-gray-800 tracking-tight">
          Bus Ticket System
        </h2>
        <p className="text-xs text-blue-600 mt-1 capitalize font-medium">
          {role}
        </p>
      </div>

      {/* MENU LIST */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {items.map((item) => {
            const isActive = location.pathname === item.path;

            return (
              <li key={item.path}>
                <button
                  onClick={() => navigate(item.path)}
                  className={`
                    w-full flex items-center gap-3 px-4 py-2 rounded-xl transition-all text-xs
                    ${isActive
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                      : "text-gray-700 hover:bg-blue-50 hover:text-blue-700"
                    }
                  `}
                >
                  <span className={`${isActive ? "text-white" : "text-blue-700"}`}>
                    {item.icon}
                  </span>
                  <span className="font-medium">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* LOGOUT BUTTON */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className="
            w-full flex items-center gap-3 px-4 py-2 rounded-xl
            text-xs text-red-600 hover:bg-red-50 transition-all font-medium
          "
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>

      {/* RESIZER HANDLE */}
      <div
        onMouseDown={handleMouseDown}
        style={{
          cursor: "col-resize",
          position: "absolute",
          top: 0,
          right: 0,
          width: 8,
          height: "100%",
          zIndex: 50,
          // visually show the resizer
          background:
            resizing.current
              ? "rgba(37,99,235, 0.08)"
              : "transparent",
          transition: "background 0.15s",
        }}
        className="group"
        aria-label="Resize sidebar"
        title="Drag to resize"
      >
        <div
          className="absolute top-1/2 right-0 -translate-y-1/2 w-1.5 h-16 rounded bg-blue-400 opacity-50 group-hover:opacity-80 transition z-50"
          style={{ pointerEvents: "none" }}
        />
      </div>
    </div>
  );
}
