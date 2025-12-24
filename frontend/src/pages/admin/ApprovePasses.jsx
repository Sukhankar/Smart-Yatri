import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { passService } from '../../services/passService';
import Sidebar from '../../components/Sidebar';

export default function ApprovePasses() {
  const [passes, setPasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadPendingPasses();
    // eslint-disable-next-line
  }, []);

  const loadPendingPasses = async () => {
    try {
      setLoading(true);
      const res = await passService.getPendingPasses();
      setPasses(res.passes || []);
    } catch (err) {
      console.error('Error loading passes:', err);
    } finally {
      setLoading(false);
    }
  };

  // Navigate to payment verification (do not actually approve yet)
  const handleApprove = (passId, action) => {
    navigate('/admin/verify-payment');
  };

  // Optional: actual reject handler
  const handleReject = async (passId) => {
    try {
      setProcessing(passId);
      await passService.approvePass(passId, 'REJECT');
      await loadPendingPasses();
    } catch (err) {
      console.error('Error approving pass:', err);
      alert(err.message || 'Failed to update pass');
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-red-50/30 to-gray-50 flex">
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
            Approve Pass Requests
          </h1>
          <p className="text-gray-600">
            Review and process pending pass requests from students.
          </p>
        </div>

        {passes.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-12 text-center">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
            </svg>
            <p className="text-gray-500 text-lg mb-2">No pending pass requests</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
            {passes.map((pass) => (
              <div
                key={pass.id}
                className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-6 hover:shadow-2xl transition-all duration-300 flex flex-col"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="p-2 bg-gradient-to-br from-red-500 to-pink-500 rounded-lg self-start">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-800">{pass.userName}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Applied {new Date(pass.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl">
                    <p className="text-sm text-gray-600 mb-1">Type</p>
                    <p className="text-xl font-bold text-gray-800">{pass.type}</p>
                  </div>
                  <div className="p-4 bg-gradient-to-r from-red-50 to-pink-50 rounded-xl">
                    <p className="text-sm text-gray-600 mb-1">Start Date</p>
                    <p className="text-lg font-semibold text-gray-800">{new Date(pass.startDate).toLocaleDateString()}</p>
                  </div>
                  <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl">
                    <p className="text-sm text-gray-600 mb-1">End Date</p>
                    <p className="text-lg font-semibold text-gray-800">{new Date(pass.endDate).toLocaleDateString()}</p>
                  </div>
                  <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl">
                    <p className="text-sm text-gray-600 mb-1">Status</p>
                    <span
                      className={`inline-block px-4 py-2 rounded-full text-sm font-bold
                        ${
                          pass.status === 'PENDING'
                            ? 'bg-gradient-to-r from-yellow-400 to-orange-400 text-white shadow-lg'
                            : pass.status === 'ACTIVE'
                            ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg'
                            : 'bg-gray-300 text-gray-700'
                        }`}
                    >
                      {pass.status}
                    </span>
                  </div>
                </div>
                {pass.status === 'PENDING' && (
                  <div className="mb-4 p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded-lg">
                    <p className="text-sm text-yellow-800 font-medium">⏳ Awaiting your approval</p>
                  </div>
                )}
                <div className="flex flex-col sm:flex-row justify-end gap-3 mt-auto">
                  <button
                    onClick={() => handleApprove(pass.id, 'APPROVE')}
                    disabled={processing === pass.id}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-2 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {'Approve'}
                  </button>
                  <button
                    onClick={() => handleReject(pass.id)}
                    disabled={processing === pass.id}
                    className="bg-gradient-to-r from-red-600 to-pink-600 text-white px-6 py-2 rounded-xl hover:from-red-700 hover:to-pink-700 transition-all duration-200 shadow-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {processing === pass.id ? 'Processing...' : 'Reject'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

