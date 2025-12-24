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

const REVENUE_COLORS = ['#3b82f6', '#22c55e', '#f97316', '#a855f7', '#0ea5e9', '#6366f1'];
const PIE_COLORS = ['#3b82f6', '#22c55e', '#f97316', '#eab308', '#6366f1', '#14b8a6'];

export default function Reports() {
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar role="manager" />
        <div className="flex-1 p-6 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar role="manager" />
      <div className="flex-1 p-4 md:p-6 lg:p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Reports & Analytics</h1>

        {/* Statistics Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-sm font-semibold text-gray-500 mb-2">Total Active Users</h3>
              <p className="text-3xl font-bold text-blue-600">{stats.totalActiveUsers}</p>
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
                          // eslint-disable-next-line react/no-array-index-key
                          <Cell key={`rev-${index}`} fill={REVENUE_COLORS[index % REVENUE_COLORS.length]} />
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
                          // eslint-disable-next-line react/no-array-index-key
                          <Cell key={`tvp-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
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
                      <Bar dataKey="count" radius={[6, 6, 0, 0]} fill="#3b82f6" />
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
                  className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded"
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
      </div>
    </div>
  );
}
