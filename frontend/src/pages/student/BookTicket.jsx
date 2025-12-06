import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { routeService } from '../../services/routeService';
import { ticketService } from '../../services/ticketService';
import Sidebar from '../../components/Sidebar';

export default function BookTicket() {
  const [routes, setRoutes] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadRoutes();
  }, []);

  const loadRoutes = async () => {
    try {
      const res = await routeService.listRoutes(true);
      setRoutes(res.routes || []);
    } catch (err) {
      console.error('Error loading routes:', err);
      setError('Failed to load routes');
    }
  };

  const handlePurchase = async () => {
    if (!selectedRoute) {
      setError('Please select a route');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');
      const res = await ticketService.createTicket(selectedRoute.id, 'DAILY');
      setSuccess('Ticket purchased successfully!');
      setTimeout(() => {
        navigate('/student/my-tickets');
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to purchase ticket');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar role="student" />
      <div className="flex-1 p-4 md:p-6 lg:p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Buy Ticket</h1>

        <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Select Route</h2>

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

          <div className="space-y-4">
            {routes.map((route) => (
              <div
                key={route.id}
                className={`p-4 border-2 rounded-lg cursor-pointer transition ${
                  selectedRoute?.id === route.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedRoute(route)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg text-gray-800">{route.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Stops: {Array.isArray(route.stops) ? route.stops.join(' → ') : 'N/A'}
                    </p>
                    {Array.isArray(route.scheduleTime) && route.scheduleTime.length > 0 && (
                      <p className="text-sm text-gray-600 mt-1">
                        Schedule: {route.scheduleTime.join(', ')}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-blue-600">₹50</p>
                    <p className="text-xs text-gray-500">Daily Ticket</p>
                  </div>
                </div>
              </div>
            ))}

            {routes.length === 0 && (
              <p className="text-gray-500 text-center py-8">No routes available</p>
            )}
          </div>

          {selectedRoute && (
            <div className="mt-6 pt-6 border-t">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <p className="text-gray-600">Selected Route</p>
                  <p className="text-lg font-semibold">{selectedRoute.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-blue-600">₹50</p>
                  <p className="text-sm text-gray-500">Total</p>
                </div>
              </div>
              <button
                onClick={handlePurchase}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing...' : 'Purchase Ticket'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
