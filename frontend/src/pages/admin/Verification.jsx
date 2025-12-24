import { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import { reportService } from '../../services/reportService';

const USER_TYPES = [
  { value: '', label: 'All' },
  { value: 'STUDENT', label: 'Student' },
  { value: 'STAFF', label: 'Staff' },
  { value: 'REGULAR', label: 'Regular' },
];

const STATUSES = [
  { value: '', label: 'All' },
  { value: 'verified', label: 'Verified' },
  { value: 'pending', label: 'Pending' },
  { value: 'rejected', label: 'Rejected' },
];

export default function Verification() {
  const [activeTab, setActiveTab] = useState('all'); // 'tickets' | 'passes' | 'all'
  const [filters, setFilters] = useState({
    from: '',
    to: '',
    userType: '',
    status: '',
    minPrice: '',
    maxPrice: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState(null);
  const [records, setRecords] = useState([]);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await reportService.getVerificationRecords({
        type: activeTab,
        ...filters,
      });
      setSummary(res.summary || null);
      setRecords(res.records || []);
    } catch (err) {
      setError(err.message || 'Failed to load verification data');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleApplyFilters = async (e) => {
    e.preventDefault();
    await loadData();
  };

  const handleResetFilters = () => {
    setFilters({
      from: '',
      to: '',
      userType: '',
      status: '',
      minPrice: '',
      maxPrice: '',
    });
    // reload with cleared filters
    setTimeout(loadData, 0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-red-50/30 to-gray-50 flex">
      <Sidebar role="admin" />
      <div className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-red-700 to-pink-600 bg-clip-text text-transparent mb-2">
              Verification Center
            </h1>
            <p className="text-gray-600 text-sm md:text-base">
              Verify tickets and passes with powerful server-side filters.
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="inline-flex rounded-2xl bg-white/80 border border-gray-200 shadow-sm overflow-hidden">
            {[
              { key: 'tickets', label: 'Only Tickets' },
              { key: 'passes', label: 'Only Passes' },
              { key: 'all', label: 'All' },
            ].map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-4 md:px-6 py-2 text-sm font-semibold transition-all duration-150 ${
                    isActive
                      ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white shadow'
                      : 'bg-transparent text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Filters */}
        <form
          onSubmit={handleApplyFilters}
          className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-4 md:p-6 mb-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                From Date
              </label>
              <input
                type="date"
                name="from"
                value={filters.from}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-gray-50 focus:border-red-500 focus:ring-2 focus:ring-red-100 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                To Date
              </label>
              <input
                type="date"
                name="to"
                value={filters.to}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-gray-50 focus:border-red-500 focus:ring-2 focus:ring-red-100 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                User Type
              </label>
              <select
                name="userType"
                value={filters.userType}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-gray-50 focus:border-red-500 focus:ring-2 focus:ring-red-100 text-sm"
              >
                {USER_TYPES.map((u) => (
                  <option key={u.value} value={u.value}>
                    {u.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Status
              </label>
              <select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-gray-50 focus:border-red-500 focus:ring-2 focus:ring-red-100 text-sm"
              >
                {STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Min Price (₹)
              </label>
              <input
                type="number"
                name="minPrice"
                value={filters.minPrice}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-gray-50 focus:border-red-500 focus:ring-2 focus:ring-red-100 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Max Price (₹)
              </label>
              <input
                type="number"
                name="maxPrice"
                value={filters.maxPrice}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-gray-50 focus:border-red-500 focus:ring-2 focus:ring-red-100 text-sm"
              />
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 text-sm font-semibold bg-gray-50 hover:bg-gray-100"
            >
              Reset
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-red-500 to-pink-500 text-white text-sm font-semibold shadow hover:from-red-600 hover:to-pink-600"
            >
              Apply Filters
            </button>
          </div>
        </form>

        {/* Summary */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <p className="text-xs text-gray-500 mb-1">Total Records</p>
              <p className="text-2xl font-bold text-gray-800">{summary.total}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <p className="text-xs text-gray-500 mb-1">Tickets</p>
              <p className="text-2xl font-bold text-blue-700">{summary.tickets}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <p className="text-xs text-gray-500 mb-1">Passes</p>
              <p className="text-2xl font-bold text-emerald-700">{summary.passes}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <p className="text-xs text-gray-500 mb-1">Verified</p>
              <p className="text-2xl font-bold text-green-700">{summary.verified}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <p className="text-xs text-gray-500 mb-1">Pending / Rejected</p>
              <p className="text-2xl font-bold text-amber-700">
                {summary.pending + summary.rejected}
              </p>
            </div>
          </div>
        )}

        {/* Results table */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    User Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Label / Route
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Price (₹)
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Created At
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-10 text-center text-gray-400 text-sm md:text-base"
                    >
                      Loading...
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-10 text-center text-red-500 text-sm md:text-base"
                    >
                      {error}
                    </td>
                  </tr>
                ) : records.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-10 text-center text-gray-400 text-sm md:text-base"
                    >
                      No records found for the selected filters.
                    </td>
                  </tr>
                ) : (
                  records.map((r) => (
                    <tr key={r.id} className="hover:bg-red-50/40 transition">
                      <td className="px-4 py-3 text-xs md:text-sm font-mono text-gray-700">
                        {r.id}
                      </td>
                      <td className="px-4 py-3 text-xs md:text-sm font-semibold text-gray-800">
                        {r.kind}
                      </td>
                      <td className="px-4 py-3 text-xs md:text-sm text-gray-800">
                        {r.userName}
                      </td>
                      <td className="px-4 py-3 text-xs md:text-sm text-gray-600">
                        {r.userType}
                      </td>
                      <td className="px-4 py-3 text-xs md:text-sm">
                        <span
                          className={`inline-flex px-2 py-1 rounded-full text-[11px] font-semibold ${
                            r.status === 'verified'
                              ? 'bg-green-100 text-green-700'
                              : r.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs md:text-sm text-gray-700">
                        {r.kind === 'PASS'
                          ? r.label
                          : r.routeName
                          ? `${r.routeName} (${r.label})`
                          : r.label}
                      </td>
                      <td className="px-4 py-3 text-xs md:text-sm text-gray-800">
                        {r.price != null ? `₹${r.price}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-xs md:text-sm text-gray-600">
                        {r.createdAt ? new Date(r.createdAt).toLocaleString() : '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}


