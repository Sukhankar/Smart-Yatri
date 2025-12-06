import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { passService } from '../../services/passService';
import Sidebar from '../../components/Sidebar';

export default function FacultyMyPass() {
  const [pass, setPass] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadPass();
  }, []);

  const loadPass = async () => {
    try {
      const res = await passService.getUserPass();
      setPass(res.pass);
    } catch (err) {
      console.error('Error loading pass:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePass = async (type) => {
    try {
      setCreating(true);
      setError('');
      setSuccess('');
      const res = await passService.createPass(type);
      setPass(res.pass);
      setSuccess(`${type} pass request created successfully!`);
    } catch (err) {
      setError(err.message || 'Failed to create pass');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar role="faculty" />
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
      <Sidebar role="faculty" />
      <div className="flex-1 p-4 md:p-6 lg:p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">My Pass</h1>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
            {success}
          </div>
        )}

        {pass ? (
          <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl">
            <h2 className="text-2xl font-semibold mb-6 text-gray-800">Pass Details</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Pass Code</p>
                <p className="text-lg font-semibold font-mono">{pass.passCode}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Type</p>
                <p className="text-lg font-semibold">{pass.type}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <span
                  className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${
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
                <p className="text-sm text-gray-500">Start Date</p>
                <p className="text-lg">{new Date(pass.startDate).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">End Date</p>
                <p className="text-lg">{new Date(pass.endDate).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl">
            <h2 className="text-2xl font-semibold mb-6 text-gray-800">Get a Pass</h2>
            <p className="text-gray-600 mb-6">
              Choose a monthly or yearly pass for unlimited travel on all routes.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border-2 border-gray-200 rounded-lg p-6 hover:border-blue-500 transition">
                <h3 className="text-xl font-semibold mb-2">Monthly Pass</h3>
                <p className="text-3xl font-bold text-blue-600 mb-2">₹500</p>
                <p className="text-sm text-gray-600 mb-4">Valid for 30 days</p>
                <button
                  onClick={() => handleCreatePass('MONTHLY')}
                  disabled={creating}
                  className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Request Monthly Pass'}
                </button>
              </div>

              <div className="border-2 border-gray-200 rounded-lg p-6 hover:border-blue-500 transition">
                <h3 className="text-xl font-semibold mb-2">Yearly Pass</h3>
                <p className="text-3xl font-bold text-blue-600 mb-2">₹5,000</p>
                <p className="text-sm text-gray-600 mb-4">Valid for 365 days</p>
                <button
                  onClick={() => handleCreatePass('YEARLY')}
                  disabled={creating}
                  className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Request Yearly Pass'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
