import { useEffect, useState, useMemo } from "react";
import Sidebar from "../../components/Sidebar";

// Helper to format date
function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString();
}

// Pass type and status options
const PASS_TYPE_OPTIONS = [
  { value: "", label: "All Types" },
  { value: "STUDENT", label: "Student Pass" },
  { value: "STAFF", label: "Staff Pass" },
  // Add more pass types as needed
];

const PASS_STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "PENDING", label: "Pending" },
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
  { value: "DISABLED", label: "Disabled" },
  { value: "EXPIRED", label: "Expired" },
];

export default function Passes() {
  const [passes, setPasses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters + search
  const [status, setStatus] = useState("");
  const [type, setType] = useState("");
  const [query, setQuery] = useState("");

  // Fetch all passes via backend, with support for status filter
  const loadPasses = async () => {
    setLoading(true);
    try {
      // Compose query parameters for backend API as per status filter
      const params = new URLSearchParams();
      if (status) params.append("status", status);
      if (type) params.append("type", type);
      if (query && query.trim().length > 0) params.append("q", query.trim());

      let url = "/api/passes/all";
      if (Array.from(params.keys()).length > 0) {
        url += `?${params.toString()}`;
      }

      const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:5000";
      const res = await fetch(`${SERVER_URL}${url}`, {
        method: "GET",
        credentials: "include",
      });
      const data = await res.json();
      setPasses(Array.isArray(data.passes) ? data.passes : []);
    } catch {
      setPasses([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadPasses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, type, query]);

  // Only slightly modify: Filtering is now primarily on server as per status filter
  const filtered = useMemo(() => {
    let filteredData = passes;
    if (query && query.trim().length > 0) {
      const q = query.trim().toLowerCase();
      filteredData = filteredData.filter((p) => {
        const name =
          (p.userName ||
            p.user?.profile?.fullName ||
            p.user?.username ||
            ""
          ).toLowerCase();
        const code = (p.passCode || "").toLowerCase();
        return (
          name.includes(q) ||
          code.includes(q) ||
          String(p.userId).includes(q)
        );
      });
    }
    return filteredData;
  }, [passes, query]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50 flex">
      <Sidebar role="manager" />
      <div className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-700 to-cyan-600 bg-clip-text text-transparent mb-2">
            Pass Management
          </h1>
          <p className="text-gray-600">
            Review, search and manage issued passes for all users.
          </p>
        </div>

        {/* Filters and Search */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <input
            type="text"
            placeholder="Search Name, Pass Code or ID…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="border border-gray-300 rounded-xl px-4 py-2 focus:ring focus:ring-blue-200 focus:outline-none transition shadow-sm w-full"
          />
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="border border-gray-300 rounded-xl px-4 py-2 focus:ring focus:ring-blue-200 focus:outline-none transition shadow-sm w-full"
          >
            {PASS_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="border border-gray-300 rounded-xl px-4 py-2 focus:ring focus:ring-blue-200 focus:outline-none transition shadow-sm w-full"
          >
            {PASS_STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <button
            className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-5 py-2 rounded-xl focus:outline-none hover:from-blue-700 hover:to-cyan-700 transition-all duration-200 shadow-lg font-semibold w-full"
            onClick={loadPasses}
            disabled={loading}
          >
            Refresh
          </button>
        </div>

        {/* Table or message */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600 text-center">Loading passes…</p>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-12 text-center m-auto max-w-md">
            <div className="mb-4">
              <svg className="w-16 h-16 text-gray-300 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
              </svg>
            </div>
            <p className="text-gray-500 text-lg mb-2">No passes found</p>
            <p className="text-gray-400">Try adjusting your filters or search keyword.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white/80 rounded-2xl shadow-xl border border-gray-200/50">
              <thead>
                <tr className="bg-gradient-to-r from-gray-50 to-blue-50 border-b">
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wide">Pass Code</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wide">User Name</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wide">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wide">Start</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wide">End</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wide">Applied At</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, idx) => (
                  <tr
                    key={p.id}
                    className={`border-b transition-all ${idx % 2 === 0 ? "bg-white/75" : "bg-blue-50/30"} hover:bg-cyan-50`}
                  >
                    <td className="px-4 py-2 font-mono text-blue-800 break-all">{p.passCode}</td>
                    <td className="px-4 py-2">
                      {p.userName ||
                        p.user?.profile?.fullName ||
                        p.user?.username ||
                        ""}
                    </td>
                    <td className="px-4 py-2">{p.type}</td>
                    <td className="px-4 py-2 align-middle">
                      <span
                        className={
                          "inline-block px-4 py-1 rounded-full text-xs font-semibold shadow-sm " +
                          (p.status === "ACTIVE"
                            ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white"
                            : p.status === "PENDING"
                            ? "bg-gradient-to-r from-yellow-400 to-orange-400 text-white"
                            : p.status === "INACTIVE"
                            ? "bg-gray-200 text-gray-700"
                            : p.status === "DISABLED"
                            ? "bg-red-100 text-red-700"
                            : p.status === "EXPIRED"
                            ? "bg-gray-100 text-gray-500"
                            : "")
                        }
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-2">{formatDate(p.startDate)}</td>
                    <td className="px-4 py-2">{formatDate(p.endDate)}</td>
                    <td className="px-4 py-2">{formatDate(p.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
