import { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import { paymentService } from '../../services/paymentService';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';

function getProofUrl(url) {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  return SERVER_URL.replace(/\/$/, '') + (url.startsWith('/') ? url : '/' + url);
}

export default function VerifyPayment() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);

  useEffect(() => {
    loadPendingPayments();
    // eslint-disable-next-line
  }, []);

  const loadPendingPayments = async () => {
    try {
      const res = await paymentService.getPendingPayments();
      setPayments(res.payments || []);
    } catch (err) {
      console.error('Error loading payments:', err);
      alert(err.message || 'Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (paymentId, action) => {
    try {
      setProcessing(paymentId);
      await paymentService.verifyPayment(paymentId, action);
      await loadPendingPayments();
    } catch (err) {
      console.error('Error verifying payment:', err);
      alert(err.message || 'Failed to verify payment');
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50 flex">
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50 flex">
      <Sidebar role="manager" />
      <div className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-700 to-cyan-600 bg-clip-text text-transparent mb-2">
            Verify Payments
          </h1>
          <p className="text-gray-600">Review and approve/reject pending payment requests for passes.</p>
        </div>

        {/* Main content */}
        {payments.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-12 text-center">
            <svg className="w-16 h-16 text-gray-200 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-gray-500 text-lg mb-2">No pending payments</p>
            <p className="text-gray-400">All payment verifications are up to date.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {payments.map((payment) => (
              <div
                key={payment.id}
                className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-yellow-400/70 p-6 hover:shadow-2xl transition-all duration-300 flex flex-col"
              >
                {/* Top: User & Payment Info */}
                <div className="flex items-start gap-4 flex-col sm:flex-row sm:items-center mb-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-lg">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-base mb-0.5 truncate">{payment.userName}</p>
                        <p className="text-xs text-gray-500 truncate">{payment.userEmail}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                      <div>
                        <span className="block text-gray-500 font-medium mb-0.5">Amount</span>
                        <span className="font-bold text-xl text-green-700">₹{payment.amount}</span>
                      </div>
                      <div>
                        <span className="block text-gray-500 font-medium mb-0.5">Method</span>
                        <span className="font-semibold">{payment.method || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="block text-gray-500 font-medium mb-0.5">Reference</span>
                        <span className="font-mono text-blue-700">{payment.reference || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 sm:mt-0 flex-none flex flex-row gap-2">
                    <button
                      onClick={() => handleVerify(payment.id, 'APPROVE')}
                      disabled={processing === payment.id}
                      className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-5 py-2 rounded-xl font-semibold shadow hover:from-green-600 hover:to-emerald-600 transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {processing === payment.id ? 'Processing...' : 'Approve'}
                    </button>
                    <button
                      onClick={() => handleVerify(payment.id, 'REJECT')}
                      disabled={processing === payment.id}
                      className="bg-gradient-to-r from-red-500 to-rose-500 text-white px-5 py-2 rounded-xl font-semibold shadow hover:from-red-600 hover:to-red-600 transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {processing === payment.id ? 'Processing...' : 'Reject'}
                    </button>
                  </div>
                </div>
                {/* Additional Info */}
                <div className="border-t border-gray-100/70 pt-3 mt-3 space-y-2">
                  {payment.passCode && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Pass Code</p>
                      <span className="inline-block font-mono bg-gradient-to-r from-blue-100 to-cyan-50 text-blue-700 px-3 py-1 rounded-lg text-sm">{payment.passCode}</span>
                    </div>
                  )}
                  {payment.proofUrl && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Payment Proof</p>
                      <a
                        href={getProofUrl(payment.proofUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-700 font-medium hover:underline break-all"
                      >
                        View Proof
                      </a>
                    </div>
                  )}
                  <p className="text-xs text-gray-400">
                    Requested: {new Date(payment.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
