import { useEffect, useState, useMemo } from "react";
import Sidebar from "../../components/Sidebar";

// Helper to format date
function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString();
}

// Pass type and status options (for UI)
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
    // Do not filter by status in client; that's handled via server query param
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
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar role="manager" />
      <div className="flex-1 p-4 md:p-6 lg:p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          All Passes
        </h1>
        {/* Filters and search */}
        <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4 mb-6">
          <input
            type="text"
            placeholder="Search Name, Pass Code or ID…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 focus:ring focus:ring-blue-200 focus:outline-none"
            style={{ minWidth: "200px" }}
          />
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 focus:ring focus:ring-blue-200 focus:outline-none"
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
            className="border border-gray-300 rounded-md px-3 py-2 focus:ring focus:ring-blue-200 focus:outline-none"
          >
            {PASS_STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded focus:outline-none hover:bg-blue-600"
            onClick={loadPasses}
            disabled={loading}
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600 text-center">Loading passes…</p>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-500 text-lg">No passes found</p>
          </div>
        ) : (
          <div className="overflow-auto">
            <table className="min-w-full bg-white rounded-lg shadow">
              <thead>
                <tr className="bg-gray-100 border-b">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-800">Pass Code</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-800">User Name</th>
                  {/* Removed ID Number column */}
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-800">Type</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-800">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-800">Start</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-800">End</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-800">Applied At</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} className="border-b hover:bg-blue-50 transition">
                    <td className="px-4 py-2 font-mono text-blue-800">{p.passCode}</td>
                    <td className="px-4 py-2">
                      {p.userName ||
                        p.user?.profile?.fullName ||
                        p.user?.username ||
                        ""}
                    </td>
                    {/* Removed ID Number cell */}
                    <td className="px-4 py-2">{p.type}</td>
                    <td className="px-4 py-2">
                      <span
                        className={
                          "inline-block px-2 py-1 rounded text-xs font-bold " +
                          (p.status === "ACTIVE"
                            ? "bg-green-100 text-green-700"
                            : p.status === "PENDING"
                            ? "bg-yellow-100 text-yellow-700"
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
                    <td className="px-4 py-2">
                      {formatDate(p.createdAt)}
                    </td>
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
