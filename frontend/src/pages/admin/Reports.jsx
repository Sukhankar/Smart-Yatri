import { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import { reportService } from '../../services/reportService';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

const REVENUE_COLORS = ['#ef4444', '#f97316', '#22c55e', '#3b82f6', '#a855f7', '#ec4899'];
const PIE_COLORS = ['#ef4444', '#22c55e', '#3b82f6', '#eab308', '#6366f1', '#14b8a6'];

export default function Reports() {
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [verificationFilters, setVerificationFilters] = useState({
    type: 'all',
    from: '',
    to: '',
    userType: '',
    status: '',
    minPrice: '',
    maxPrice: '',
  });
  const [verificationData, setVerificationData] = useState([]);
  const [verificationLoading, setVerificationLoading] = useState(false);

  useEffect(() => {
    loadReports();
    // eslint-disable-next-line
  }, []);

  const loadReports = async () => {
    try {
      const res = await reportService.getDashboardStats();
      setStats(res.stats);
      setAnalytics(res.analytics || null);
      setRecentActivity(res.recentActivity || []);
    } catch (err) {
      console.error('Error loading reports:', err);
      alert(err.message || 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const loadVerification = async () => {
    setVerificationLoading(true);
    try {
      const data = await reportService.getVerificationRecords(verificationFilters);
      setVerificationData(data.records || []);
    } catch (err) {
      console.error('Error loading verification:', err);
      alert(err.message || 'Failed to load verification records');
    } finally {
      setVerificationLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar role="admin" />
        <div className="flex-1 p-6 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar role="admin" />
      <div className="flex-1 p-4 md:p-6 lg:p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Reports & Analytics (Admin)</h1>

        <div className="mb-6">
          <nav className="flex space-x-4">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 py-2 rounded-lg font-medium ${
                activeTab === 'dashboard' ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('verification')}
              className={`px-4 py-2 rounded-lg font-medium ${
                activeTab === 'verification' ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              Verification
            </button>
          </nav>
        </div>

        {activeTab === 'dashboard' && (
          <>
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-sm font-semibold text-gray-500 mb-2">Total Active Users</h3>
                  <p className="text-3xl font-bold text-red-600">{stats.totalActiveUsers}</p>
                </div>
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-sm font-semibold text-gray-500 mb-2">Valid Passes</h3>
                  <p className="text-3xl font-bold text-green-600">{stats.validPasses}</p>
                </div>
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-sm font-semibold text-gray-500 mb-2">Expired Passes</h3>
                  <p className="text-3xl font-bold text-red-600">{stats.expiredPasses}</p>
                </div>
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-sm font-semibold text-gray-500 mb-2">Daily Scans</h3>
                  <p className="text-3xl font-bold text-purple-600">{stats.dailyScans}</p>
                </div>
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-sm font-semibold text-gray-500 mb-2">Active Routes</h3>
                  <p className="text-3xl font-bold text-indigo-600">{stats.activeRoutes}</p>
                </div>
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-sm font-semibold text-gray-500 mb-2">Active Buses</h3>
                  <p className="text-3xl font-bold text-teal-600">{stats.activeBuses}</p>
                </div>
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-sm font-semibold text-gray-500 mb-2">Pending Payments</h3>
                  <p className="text-3xl font-bold text-orange-600">{stats.pendingPayments}</p>
                </div>
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-sm font-semibold text-gray-500 mb-2">Recent Passes (30 days)</h3>
                  <p className="text-3xl font-bold text-cyan-600">{stats.recentPasses}</p>
                </div>
              </div>
            )}

            {/* Visual Reports */}
            {analytics && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
                  <h2 className="text-base md:text-lg font-semibold mb-3 text-gray-700">
                    Monthly Revenue
                  </h2>
                  {(!analytics.monthlyRevenue || analytics.monthlyRevenue.length === 0) ? (
                    <p className="text-sm text-gray-500">No revenue data available.</p>
                  ) : (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analytics.monthlyRevenue}>
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
                            {analytics.monthlyRevenue.map((entry, index) => (
                              <Cell
                                key={`rev-${index}`}
                                fill={REVENUE_COLORS[index % REVENUE_COLORS.length]}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
                  <h2 className="text-base md:text-lg font-semibold mb-3 text-gray-700">
                    Ticket vs Pass Usage
                  </h2>
                  {(!analytics.ticketVsPassUsage || analytics.ticketVsPassUsage.length === 0) ? (
                    <p className="text-sm text-gray-500">No usage data available.</p>
                  ) : (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={analytics.ticketVsPassUsage}
                            dataKey="count"
                            nameKey="type"
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            label
                          >
                            {analytics.ticketVsPassUsage.map((entry, index) => (
                              <Cell
                                key={`tvp-${index}`}
                                fill={PIE_COLORS[index % PIE_COLORS.length]}
                              />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-lg shadow-md p-4 md:p-6 lg:col-span-2">
                  <h2 className="text-base md:text-lg font-semibold mb-3 text-gray-700">
                    User Type Distribution
                  </h2>
                  {(!analytics.userTypeDistribution ||
                    analytics.userTypeDistribution.length === 0) ? (
                    <p className="text-sm text-gray-500">No user type data available.</p>
                  ) : (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analytics.userTypeDistribution}>
                          <XAxis dataKey="type" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="count" radius={[6, 6, 0, 0]} fill="#f97316" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-700">Recent Activity</h2>
              {recentActivity.length === 0 ? (
                <p className="text-gray-500">No recent activity</p>
              ) : (
                <div className="space-y-3">
                  {recentActivity.map((activity) => (
                    <div
                      key={activity.id}
                      className="border-l-4 border-red-500 bg-red-50 p-4 rounded"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-gray-800">{activity.userName}</p>
                          <p className="text-sm text-gray-600">
                            Scanned on route: {activity.routeName} - {activity.ticketType}
                          </p>
                          <p className="text-xs text-gray-400">
                            {new Date(activity.travelDate).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'verification' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Verification Records</h2>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={verificationFilters.type}
                    onChange={(e) => setVerificationFilters({ ...verificationFilters, type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:border-red-500 focus:ring-2 focus:ring-red-100"
                  >
                    <option value="all">All</option>
                    <option value="tickets">Only Tickets</option>
                    <option value="passes">Only Passes</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                  <input
                    type="date"
                    value={verificationFilters.from}
                    onChange={(e) => setVerificationFilters({ ...verificationFilters, from: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:border-red-500 focus:ring-2 focus:ring-red-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                  <input
                    type="date"
                    value={verificationFilters.to}
                    onChange={(e) => setVerificationFilters({ ...verificationFilters, to: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:border-red-500 focus:ring-2 focus:ring-red-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">User Type</label>
                  <select
                    value={verificationFilters.userType}
                    onChange={(e) => setVerificationFilters({ ...verificationFilters, userType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:border-red-500 focus:ring-2 focus:ring-red-100"
                  >
                    <option value="">All</option>
                    <option value="STUDENT">Student</option>
                    <option value="STAFF">Staff</option>
                    <option value="REGULAR">Regular</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={verificationFilters.status}
                    onChange={(e) => setVerificationFilters({ ...verificationFilters, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:border-red-500 focus:ring-2 focus:ring-red-100"
                  >
                    <option value="">All</option>
                    <option value="verified">Verified</option>
                    <option value="pending">Pending</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={loadVerification}
                    disabled={verificationLoading}
                    className="w-full bg-red-600 text-white font-semibold rounded-lg px-4 py-2 shadow hover:bg-red-700 transition-all duration-200 disabled:opacity-50"
                  >
                    {verificationLoading ? 'Loading...' : 'Load Records'}
                  </button>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Label</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {verificationLoading ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-10 text-center text-gray-400">
                        Loading...
                      </td>
                    </tr>
                  ) : verificationData.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-10 text-center text-gray-400">
                        No records found.
                      </td>
                    </tr>
                  ) : (
                    verificationData.map((record) => (
                      <tr key={record.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{record.kind}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.userName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.userType}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            record.status === 'verified' ? 'bg-green-100 text-green-800' :
                            record.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {record.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(record.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {record.price ? `₹${record.price}` : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.label}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

