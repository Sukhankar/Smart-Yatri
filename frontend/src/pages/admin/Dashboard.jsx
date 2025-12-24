import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { passService } from '../../services/passService';
import { paymentService } from '../../services/paymentService';
import { reportService } from '../../services/reportService';
import Sidebar from '../../components/Sidebar';

export default function AdminDashboard() {
  const [pendingPasses, setPendingPasses] = useState([]);
  const [stats, setStats] = useState({
    totalActiveUsers: 0,
    validPasses: 0,
    expiredPasses: 0,
    pendingPasses: 0,
    pendingPayments: 0,
    dailyScans: 0,
    activeRoutes: 0,
    activeBuses: 0,
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [passesRes, paymentsRes, statsRes] = await Promise.all([
        passService.getPendingPasses().catch(() => ({ passes: [] })),
        paymentService.getPendingPayments().catch(() => ({ payments: [] })),
        reportService.getDashboardStats().catch(() => ({ stats: {}, recentActivity: [] })),
      ]);
      setPendingPasses(passesRes.passes || []);
      setStats({
        totalActiveUsers: statsRes.stats?.totalActiveUsers || 0,
        validPasses: statsRes.stats?.validPasses || 0,
        expiredPasses: statsRes.stats?.expiredPasses || 0,
        pendingPasses: passesRes.passes?.length || 0,
        pendingPayments: paymentsRes.payments?.length || 0,
        dailyScans: statsRes.stats?.dailyScans || 0,
        activeRoutes: statsRes.stats?.activeRoutes || 0,
        activeBuses: statsRes.stats?.activeBuses || 0,
      });
    } catch (err) {
      console.error('Error loading dashboard:', err);
    } finally {
      setLoading(false);
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-red-50/30 to-gray-50 flex">
      <Sidebar role="admin" />
      <div className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-red-700 to-pink-600 bg-clip-text text-transparent mb-2">
            Admin Dashboard
          </h1>
          <p className="text-gray-600">Monitor and manage the bus system operations</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 p-6 hover:shadow-xl transition-all duration-300 group">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
            <h3 className="text-sm font-semibold text-gray-600 mb-1">Total Active Users</h3>
            <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">{stats.totalActiveUsers}</p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 p-6 hover:shadow-xl transition-all duration-300 group">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <h3 className="text-sm font-semibold text-gray-600 mb-1">Valid Passes</h3>
            <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">{stats.validPasses}</p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 p-6 hover:shadow-xl transition-all duration-300 group">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <h3 className="text-sm font-semibold text-gray-600 mb-1">Pending Requests</h3>
            <p className="text-3xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">{stats.pendingPasses}</p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 p-6 hover:shadow-xl transition-all duration-300 group">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
            <h3 className="text-sm font-semibold text-gray-600 mb-1">Pending Payments</h3>
            <p className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">{stats.pendingPayments}</p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 p-6 hover:shadow-xl transition-all duration-300 group">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
              </div>
            </div>
            <h3 className="text-sm font-semibold text-gray-600 mb-1">Daily Scans</h3>
            <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">{stats.dailyScans}</p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 p-6 hover:shadow-xl transition-all duration-300 group">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-xl group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
            </div>
            <h3 className="text-sm font-semibold text-gray-600 mb-1">Active Routes</h3>
            <p className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">{stats.activeRoutes}</p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 p-6 hover:shadow-xl transition-all duration-300 group">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-xl group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                </svg>
              </div>
            </div>
            <h3 className="text-sm font-semibold text-gray-600 mb-1">Active Buses</h3>
            <p className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">{stats.activeBuses}</p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 p-6 hover:shadow-xl transition-all duration-300 group">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-gradient-to-br from-red-500 to-pink-500 rounded-xl group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <h3 className="text-sm font-semibold text-gray-600 mb-1">Expired Passes</h3>
            <p className="text-3xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">{stats.expiredPasses}</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <button
            onClick={() => navigate('/admin/approve-passes')}
            className="group bg-gradient-to-br from-blue-600 to-blue-700 text-white p-6 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 text-left transform hover:scale-[1.02] border border-blue-500/50"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-white/20 rounded-lg group-hover:bg-white/30 transition">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold">Approve Passes</h3>
            </div>
            <p className="text-sm opacity-90">
              {pendingPasses.length} pending request{pendingPasses.length !== 1 ? 's' : ''}
            </p>
          </button>
          <button
            onClick={() => navigate('/admin/verify-payment')}
            className="group bg-gradient-to-br from-orange-600 to-red-600 text-white p-6 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 text-left transform hover:scale-[1.02] border border-orange-500/50"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-white/20 rounded-lg group-hover:bg-white/30 transition">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold">Verify Payments</h3>
            </div>
            <p className="text-sm opacity-90">
              {stats.pendingPayments} pending payment{stats.pendingPayments !== 1 ? 's' : ''}
            </p>
          </button>
          <button
            onClick={() => navigate('/admin/routes')}
            className="group bg-gradient-to-br from-green-600 to-emerald-600 text-white p-6 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 text-left transform hover:scale-[1.02] border border-green-500/50"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-white/20 rounded-lg group-hover:bg-white/30 transition">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
              <h3 className="text-lg font-bold">Manage Routes</h3>
            </div>
            <p className="text-sm opacity-90">View and edit bus routes</p>
          </button>
          <button
            onClick={() => navigate('/admin/buses')}
            className="group bg-gradient-to-br from-teal-600 to-cyan-600 text-white p-6 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 text-left transform hover:scale-[1.02] border border-teal-500/50"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-white/20 rounded-lg group-hover:bg-white/30 transition">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                </svg>
              </div>
              <h3 className="text-lg font-bold">Manage Buses</h3>
            </div>
            <p className="text-sm opacity-90">View and manage buses</p>
          </button>
          <button
            onClick={() => navigate('/admin/users')}
            className="group bg-gradient-to-br from-indigo-600 to-purple-600 text-white p-6 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 text-left transform hover:scale-[1.02] border border-indigo-500/50"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-white/20 rounded-lg group-hover:bg-white/30 transition">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold">Manage Users</h3>
            </div>
            <p className="text-sm opacity-90">View all users</p>
          </button>
          <button
            onClick={() => navigate('/admin/reports')}
            className="group bg-gradient-to-br from-purple-600 to-pink-600 text-white p-6 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 text-left transform hover:scale-[1.02] border border-purple-500/50"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-white/20 rounded-lg group-hover:bg-white/30 transition">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold">Reports</h3>
            </div>
            <p className="text-sm opacity-90">View system reports</p>
          </button>
        </div>

        {/* Pending Passes */}
        {pendingPasses.length > 0 && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-800">Pending Pass Requests</h2>
              <span className="px-3 py-1 bg-yellow-500 text-white text-sm font-bold rounded-full">
                {pendingPasses.length}
              </span>
            </div>
            <div className="space-y-3">
              {pendingPasses.slice(0, 5).map((pass) => (
                <div key={pass.id} className="border-l-4 border-yellow-500 bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-xl hover:shadow-md transition-all duration-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-gray-800">{pass.userName}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        {pass.type} Pass - Requested{' '}
                        {new Date(pass.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() => navigate(`/admin/approve-passes`)}
                      className="bg-gradient-to-r from-red-600 to-pink-600 text-white px-4 py-2 rounded-lg hover:from-red-700 hover:to-pink-700 transition text-sm font-semibold shadow-md"
                    >
                      Review
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
