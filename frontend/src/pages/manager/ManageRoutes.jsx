import { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import { routeService } from '../../services/routeService';

export default function ManageRoutes() {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRoute, setEditingRoute] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    stops: '',
    scheduleTime: '',
    busType: '',
    totalSeats: '',
  });

  useEffect(() => {
    loadRoutes();
  }, []);

  const loadRoutes = async () => {
    setLoading(true);
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
    setFormData({ name: '', stops: '', scheduleTime: '', busType: '', totalSeats: '' });
    setShowModal(true);
  };

  const handleEdit = (route) => {
    setEditingRoute(route);
    setFormData({
      name: route.name,
      stops: Array.isArray(route.stops) ? route.stops.join(', ') : '',
      scheduleTime: Array.isArray(route.scheduleTime) ? route.scheduleTime.join(', ') : '',
      busType: route.busType || '',
      totalSeats: route.totalSeats ? String(route.totalSeats) : '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const stops = formData.stops.split(',').map(s => s.trim()).filter(Boolean);
      const scheduleTime = formData.scheduleTime.split(',').map(s => s.trim()).filter(Boolean);
      const totalSeats = parseInt(formData.totalSeats, 10);

      if (isNaN(totalSeats) || totalSeats <= 0) {
        alert('Total seats must be a positive number');
        return;
      }

      if (!formData.busType) {
        alert('Bus Type is required');
        return;
      }

      if (editingRoute) {
        await routeService.updateRoute(editingRoute.id, {
          name: formData.name,
          stops,
          scheduleTime,
          busType: formData.busType,
          totalSeats,
        });
      } else {
        await routeService.createRoute({
          name: formData.name,
          stops,
          scheduleTime,
          busType: formData.busType,
          totalSeats,
        });
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
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-700 to-cyan-600 bg-clip-text text-transparent mb-2">
              Manage Bus Routes
            </h1>
            <p className="text-gray-600">
              Create, edit, or manage operational bus routes of your fleet.
            </p>
          </div>
          <button
            onClick={handleCreate}
            className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all duration-200 shadow-lg font-semibold"
          >
            + Add Route
          </button>
        </div>

        {/* Cards Responsive Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 mb-10">
          {routes.length === 0 && (
            <div className="col-span-full text-center py-12">
              <svg className="mx-auto w-20 h-20 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h10M7 11h10m-5 4h5m-9 1a9 9 0 1118 0 9 9 0 01-18 0z" />
              </svg>
              <p className="text-gray-500 mb-4">No routes available yet.</p>
              <button
                onClick={handleCreate}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-8 py-3 rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all duration-200 font-semibold shadow-lg"
              >
                Create First Route
              </button>
            </div>
          )}

          {routes.map((route) => (
            <div
              key={route.id}
              className={`bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-6 flex flex-col justify-between hover:shadow-2xl transition-all duration-300 ${
                route.active ? 'border-l-8 border-green-400' : 'border-l-8 border-gray-200'
              }`}
            >
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h10M7 11h10m-5 4h5m-9 1a9 9 0 1118 0 9 9 0 01-18 0z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-gray-800 flex-1">{route.name}</h2>
                  <span
                    className={`px-4 py-1 rounded-full text-xs font-bold shadow ${
                      route.active
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                        : 'bg-gray-300 text-gray-700'
                    }`}
                  >
                    {route.active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="space-y-2 text-base mb-3">
                  <div className="flex items-start gap-2">
                    <span className="text-gray-500 flex-none">Stops:</span>
                    <span className="font-semibold break-all">
                      {Array.isArray(route.stops) ? route.stops.join(' → ') : 'N/A'}
                    </span>
                  </div>
                  {Array.isArray(route.scheduleTime) && route.scheduleTime.length > 0 && (
                    <div className="flex items-start gap-2">
                      <span className="text-gray-500 flex-none">Schedule:</span>
                      <span className="font-semibold">{route.scheduleTime.join(', ')}</span>
                    </div>
                  )}
                  <div className="flex items-start gap-2">
                    <span className="text-gray-500 flex-none">Bus Type:</span>
                    <span className="font-semibold">{route.busType || 'N/A'}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-gray-500 flex-none">Total Seats:</span>
                    <span className="font-semibold">{route.totalSeats || 'N/A'}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 pt-3">
                <button
                  onClick={() => handleEdit(route)}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-4 py-2 rounded-lg font-semibold hover:from-blue-700 hover:to-cyan-700 transition-all shadow"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleToggleActive(route)}
                  className={`flex-1 px-4 py-2 rounded-lg font-semibold shadow transition-all ${
                    route.active
                      ? 'bg-gradient-to-r from-gray-500 to-gray-700 text-white hover:from-gray-700 hover:to-gray-900'
                      : 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700'
                  }`}
                >
                  {route.active ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 relative">
              <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-blue-700 to-cyan-600 bg-clip-text text-transparent">
                {editingRoute ? 'Edit Route' : 'Create Route'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-5">

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Route Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-300"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Stops <span className="text-gray-400 font-normal">(comma separated)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.stops}
                    onChange={e => setFormData({ ...formData, stops: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-300"
                    placeholder="Stop 1, Stop 2, Stop 3"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Schedule <span className="text-gray-400 font-normal">(comma separated)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.scheduleTime}
                    onChange={e => setFormData({ ...formData, scheduleTime: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-300"
                    placeholder="08:00, 12:00, 18:00"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Bus Type
                  </label>
                  <input
                    type="text"
                    value={formData.busType}
                    onChange={e => setFormData({ ...formData, busType: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-300"
                    placeholder="AC, Non-AC, Deluxe, Volvo, etc."
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Total Seats
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.totalSeats}
                    onChange={e => setFormData({ ...formData, totalSeats: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-300"
                    placeholder="e.g., 40"
                    required
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 bg-gradient-to-r from-gray-500 to-gray-700 text-white px-4 py-2 rounded-xl hover:from-gray-700 hover:to-gray-900 transition-all font-semibold shadow"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-4 py-2 rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all font-semibold shadow"
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
