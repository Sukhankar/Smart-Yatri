import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { passService } from '../../services/passService';
import { notificationService } from '../../services/notificationService';
import Sidebar from '../../components/Sidebar';

export default function ManagerDashboard() {
  const [pendingPasses, setPendingPasses] = useState([]);
  const [stats, setStats] = useState({
    totalPasses: 0,
    pendingPasses: 0,
    activePasses: 0,
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const res = await passService.getPendingPasses();
      setPendingPasses(res.passes || []);
      setStats({
        pendingPasses: res.passes?.length || 0,
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
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Manager Dashboard</h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-sm font-semibold text-gray-500 mb-2">Pending Pass Requests</h3>
            <p className="text-3xl font-bold text-yellow-600">{stats.pendingPasses}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-sm font-semibold text-gray-500 mb-2">Active Routes</h3>
            <p className="text-3xl font-bold text-blue-600">-</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-sm font-semibold text-gray-500 mb-2">Total Users</h3>
            <p className="text-3xl font-bold text-green-600">-</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <button
            onClick={() => navigate('/manager/approve-passes')}
            className="bg-blue-600 text-white p-6 rounded-lg shadow-md hover:bg-blue-700 transition text-left"
          >
            <h3 className="text-lg font-semibold mb-2">Approve Passes</h3>
            <p className="text-sm opacity-90">
              {pendingPasses.length} pending request{pendingPasses.length !== 1 ? 's' : ''}
            </p>
          </button>
          <button
            onClick={() => navigate('/manager/routes')}
            className="bg-green-600 text-white p-6 rounded-lg shadow-md hover:bg-green-700 transition text-left"
          >
            <h3 className="text-lg font-semibold mb-2">Manage Routes</h3>
            <p className="text-sm opacity-90">View and edit bus routes</p>
          </button>
          <button
            onClick={() => navigate('/manager/reports')}
            className="bg-purple-600 text-white p-6 rounded-lg shadow-md hover:bg-purple-700 transition text-left"
          >
            <h3 className="text-lg font-semibold mb-2">Reports</h3>
            <p className="text-sm opacity-90">View system reports</p>
          </button>
        </div>

        {/* Pending Passes */}
        {pendingPasses.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">Pending Pass Requests</h2>
            <div className="space-y-3">
              {pendingPasses.slice(0, 5).map((pass) => (
                <div key={pass.id} className="border-l-4 border-yellow-500 bg-yellow-50 p-4 rounded">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-gray-800">{pass.userName}</p>
                      <p className="text-sm text-gray-600">
                        {pass.type} Pass - Requested{' '}
                        {new Date(pass.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() => navigate(`/manager/approve-passes`)}
                      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition text-sm"
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
