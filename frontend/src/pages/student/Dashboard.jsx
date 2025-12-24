import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { qrService } from '../../services/qrService';
import { passService } from '../../services/passService';
import Sidebar from '../../components/Sidebar';
import QRDisplay from '../../components/QRDisplay';

export default function StudentDashboard() {
  const [qrData, setQrData] = useState(null);
  const [pass, setPass] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [qrRes, passRes] = await Promise.all([
        qrService.generateQR().catch(() => null),
        passService.getUserPass().catch(() => null),
      ]);

      if (qrRes) setQrData(qrRes);
      if (passRes?.pass) setPass(passRes.pass);
    } catch (err) {
      console.error('Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50 flex">
      <Sidebar role="student" />
      <div className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-700 to-cyan-600 bg-clip-text text-transparent mb-2">
            Student Dashboard
          </h1>
          <p className="text-gray-600">Welcome back! Here's your travel overview.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* QR Code Section */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-6 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-800">My QR Code</h2>
            </div>
            {qrData ? (
              <QRDisplay
                qrCode={qrData.qrCode}
                qrId={qrData.qrId}
                status={pass?.status || 'NO_PASS'}
                profile={qrData.profile}
              />
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">Failed to load QR code</p>
              </div>
            )}
          </div>

          {/* Pass Status Section */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-6 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-800">Pass Status</h2>
            </div>
            {pass ? (
              <div className="space-y-4">
                <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl">
                  <p className="text-sm text-gray-600 mb-1">Type</p>
                  <p className="text-xl font-bold text-gray-800">{pass.type}</p>
                </div>
                <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl">
                  <p className="text-sm text-gray-600 mb-2">Status</p>
                  <span
                    className={`inline-block px-4 py-2 rounded-full text-sm font-bold ${
                      pass.status === 'ACTIVE'
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg'
                        : pass.status === 'PENDING'
                        ? 'bg-gradient-to-r from-yellow-400 to-orange-400 text-white shadow-lg'
                        : 'bg-gray-300 text-gray-700'
                    }`}
                  >
                    {pass.status}
                  </span>
                </div>
                <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
                  <p className="text-sm text-gray-600 mb-1">Valid Until</p>
                  <p className="text-lg font-semibold text-gray-800">{new Date(pass.endDate).toLocaleDateString()}</p>
                </div>
                {pass.status === 'PENDING' && (
                  <div className="p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded-lg">
                    <p className="text-sm text-yellow-800 font-medium">⏳ Awaiting approval from manager</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="mb-4">
                  <svg className="w-16 h-16 text-gray-300 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                  </svg>
                </div>
                <p className="text-gray-500 mb-4">No active pass</p>
                <button
                  onClick={() => navigate('/student/my-pass')}
                  className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all duration-200 shadow-lg font-semibold"
                >
                  Get a Pass
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <button
            onClick={() => navigate('/student/book-ticket')}
            className="group bg-gradient-to-br from-blue-600 to-blue-700 text-white p-6 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 text-left transform hover:scale-[1.02] border border-blue-500/50"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-white/20 rounded-lg group-hover:bg-white/30 transition">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold">Buy Ticket</h3>
            </div>
            <p className="text-sm opacity-90">Purchase a daily ticket</p>
          </button>
          <button
            onClick={() => navigate('/student/my-tickets')}
            className="group bg-gradient-to-br from-green-600 to-emerald-600 text-white p-6 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 text-left transform hover:scale-[1.02] border border-green-500/50"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-white/20 rounded-lg group-hover:bg-white/30 transition">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold">My Tickets</h3>
            </div>
            <p className="text-sm opacity-90">View ticket history</p>
          </button>
          <button
            onClick={() => navigate('/student/travel-history')}
            className="group bg-gradient-to-br from-purple-600 to-pink-600 text-white p-6 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 text-left transform hover:scale-[1.02] border border-purple-500/50"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-white/20 rounded-lg group-hover:bg-white/30 transition">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold">Travel History</h3>
            </div>
            <p className="text-sm opacity-90">View past travels</p>
          </button>
        </div>
      </div>
    </div>
  );
}
