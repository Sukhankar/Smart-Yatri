import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { qrService } from '../../services/qrService';
import { passService } from '../../services/passService';
import Sidebar from '../../components/Sidebar';
import QRDisplay from '../../components/QRDisplay';

export default function FacultyDashboard() {
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
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar role="faculty" />
      <div className="flex-1 p-4 md:p-6 lg:p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Faculty Dashboard</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* QR Code Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">My QR Code</h2>
            {qrData ? (
              <QRDisplay
                qrCode={qrData.qrCode}
                qrId={qrData.qrId}
                status={pass?.status || 'NO_PASS'}
                profile={qrData.profile}
              />
            ) : (
              <p className="text-gray-500">Failed to load QR code</p>
            )}
          </div>

          {/* Pass Status Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">Pass Status</h2>
            {pass ? (
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Type</p>
                  <p className="text-lg font-semibold">{pass.type}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                      pass.status === 'ACTIVE'
                        ? 'bg-green-100 text-green-800'
                        : pass.status === 'PENDING'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {pass.status}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Valid Until</p>
                  <p className="text-lg">{new Date(pass.endDate).toLocaleDateString()}</p>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-gray-500 mb-4">No active pass</p>
                <button
                  onClick={() => navigate('/faculty/my-pass')}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                  Get a Pass
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <button
            onClick={() => navigate('/faculty/book-ticket')}
            className="bg-blue-600 text-white p-6 rounded-lg shadow-md hover:bg-blue-700 transition text-left"
          >
            <h3 className="text-lg font-semibold mb-2">Book Ticket</h3>
            <p className="text-sm opacity-90">Purchase a daily ticket</p>
          </button>
          <button
            onClick={() => navigate('/faculty/my-pass')}
            className="bg-green-600 text-white p-6 rounded-lg shadow-md hover:bg-green-700 transition text-left"
          >
            <h3 className="text-lg font-semibold mb-2">My Pass</h3>
            <p className="text-sm opacity-90">View pass details</p>
          </button>
        </div>
      </div>
    </div>
  );
}
