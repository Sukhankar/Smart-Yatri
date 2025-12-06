import { useState, useEffect } from 'react';
import { routeService } from '../../services/routeService';
import Sidebar from '../../components/Sidebar';

export default function ManageRoutes() {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRoute, setEditingRoute] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    stops: '',
    scheduleTime: '',
  });

  useEffect(() => {
    loadRoutes();
  }, []);

  const loadRoutes = async () => {
    try {
      const res = await routeService.listRoutes();
      setRoutes(res.routes || []);
    } catch (err) {
      console.error('Error loading routes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingRoute(null);
    setFormData({ name: '', stops: '', scheduleTime: '' });
    setShowModal(true);
  };

  const handleEdit = (route) => {
    setEditingRoute(route);
    setFormData({
      name: route.name,
      stops: Array.isArray(route.stops) ? route.stops.join(', ') : '',
      scheduleTime: Array.isArray(route.scheduleTime) ? route.scheduleTime.join(', ') : '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const stops = formData.stops.split(',').map((s) => s.trim()).filter(Boolean);
      const scheduleTime = formData.scheduleTime.split(',').map((s) => s.trim()).filter(Boolean);

      if (editingRoute) {
        await routeService.updateRoute(editingRoute.id, {
          name: formData.name,
          stops,
          scheduleTime,
        });
      } else {
        await routeService.createRoute(formData.name, stops, scheduleTime);
      }

      setShowModal(false);
      await loadRoutes();
    } catch (err) {
      alert(err.message || 'Failed to save route');
    }
  };

  const handleToggleActive = async (route) => {
    try {
      await routeService.updateRoute(route.id, { active: !route.active });
      await loadRoutes();
    } catch (err) {
      alert(err.message || 'Failed to update route');
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
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Manage Routes</h1>
          <button
            onClick={handleCreate}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            + Add Route
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {routes.map((route) => (
            <div
              key={route.id}
              className={`bg-white rounded-lg shadow-md p-6 border-l-4 ${
                route.active ? 'border-green-500' : 'border-gray-300'
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-gray-800">{route.name}</h3>
                <span
                  className={`px-2 py-1 rounded text-xs font-semibold ${
                    route.active
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {route.active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="space-y-2 text-sm mb-4">
                <div>
                  <p className="text-gray-500">Stops:</p>
                  <p className="font-semibold">
                    {Array.isArray(route.stops) ? route.stops.join(' → ') : 'N/A'}
                  </p>
                </div>
                {Array.isArray(route.scheduleTime) && route.scheduleTime.length > 0 && (
                  <div>
                    <p className="text-gray-500">Schedule:</p>
                    <p className="font-semibold">{route.scheduleTime.join(', ')}</p>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(route)}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition text-sm"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleToggleActive(route)}
                  className={`flex-1 px-4 py-2 rounded text-sm transition ${
                    route.active
                      ? 'bg-gray-600 text-white hover:bg-gray-700'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {route.active ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h2 className="text-2xl font-bold mb-4">
                {editingRoute ? 'Edit Route' : 'Create Route'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Route Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Stops (comma separated)
                  </label>
                  <input
                    type="text"
                    value={formData.stops}
                    onChange={(e) => setFormData({ ...formData, stops: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-2"
                    placeholder="Stop 1, Stop 2, Stop 3"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Schedule Times (comma separated)
                  </label>
                  <input
                    type="text"
                    value={formData.scheduleTime}
                    onChange={(e) => setFormData({ ...formData, scheduleTime: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-2"
                    placeholder="08:00, 12:00, 18:00"
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                  >
                    {editingRoute ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
