import { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import { busService } from '../../services/busService';
import { routeService } from '../../services/routeService';
import { userService } from '../../services/userService';

export default function ManageBuses() {
  const [buses, setBuses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [conductors, setConductors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBus, setEditingBus] = useState(null);
  const [formData, setFormData] = useState({
    numberPlate: '',
    from: '',
    to: '',
    departureTime: '',
    arrivalTime: '',
    totalSeats: '',
    routeId: '',
    conductorId: '',
  });

  useEffect(() => {
    loadData();
    // eslint-disable-next-line
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [busesRes, routesRes, conductorsRes] = await Promise.all([
        busService.listBuses(),
        routeService.listRoutes(),
        userService.listUsers({ loginType: 'CONDUCTOR' }),
      ]);
      setBuses(busesRes.buses || []);
      setRoutes(routesRes.routes || []);
      setConductors(conductorsRes.users || []);
    } catch (err) {
      // eslint-disable-next-line
      console.error('Error loading data:', err);
      alert(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingBus(null);
    setFormData({
      numberPlate: '',
      from: '',
      to: '',
      departureTime: '',
      arrivalTime: '',
      totalSeats: '',
      routeId: '',
      conductorId: '',
    });
    setShowModal(true);
  };

  const handleEdit = (bus) => {
    setEditingBus(bus);
    setFormData({
      numberPlate: bus.numberPlate,
      from: bus.from,
      to: bus.to,
      departureTime: bus.departureTime ? new Date(bus.departureTime).toISOString().slice(0, 16) : '',
      arrivalTime: bus.arrivalTime ? new Date(bus.arrivalTime).toISOString().slice(0, 16) : '',
      totalSeats: String(bus.totalSeats),
      routeId: bus.routeId ? String(bus.routeId) : '',
      conductorId: bus.conductorId ? String(bus.conductorId) : '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const busData = {
        ...formData,
        totalSeats: parseInt(formData.totalSeats),
        routeId: formData.routeId || null,
        conductorId: formData.conductorId || null,
      };

      if (editingBus) {
        await busService.updateBus(editingBus.id, busData);
      } else {
        await busService.createBus(busData);
      }
      setShowModal(false);
      await loadData();
    } catch (err) {
      alert(err.message || 'Failed to save bus');
    }
  };

  const handleToggleActive = async (bus) => {
    try {
      await busService.updateBus(bus.id, { active: !bus.active });
      await loadData();
    } catch (err) {
      alert(err.message || 'Failed to update bus');
    }
  };

  const handleDelete = async (bus) => {
    if (!window.confirm(`Are you sure you want to delete bus ${bus.numberPlate}?`)) return;
    try {
      await busService.deleteBus(bus.id);
      await loadData();
    } catch (err) {
      alert(err.message || 'Failed to delete bus');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col md:flex-row">
        <Sidebar role="manager" />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-base font-medium text-blue-800">Loading bus data...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col md:flex-row">
      <Sidebar role="manager" />
      <main className="flex-1 flex flex-col px-2 sm:px-4 md:px-8 py-4">

        {/* Header and Add Bus button */}
        <div className="w-full flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center mb-5">
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-gray-900 drop-shadow-sm">
            Manage Buses
          </h1>
          <button
            onClick={handleCreate}
            className="inline-flex items-center justify-center bg-gradient-to-br from-blue-600 to-sky-600 text-white font-semibold px-6 py-2 rounded-xl shadow-md hover:shadow-lg hover:from-blue-700 hover:to-sky-700 transition-all duration-200 focus:outline-none focus:ring focus:ring-blue-300"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"></path></svg>
            Add Bus
          </button>
        </div>

        {/* Table on md+ screens */}
        <div className="hidden md:block">
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-blue-100">
            <table className="w-full text-sm">
              <thead className="bg-blue-50 border-b border-blue-100">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold text-blue-900 uppercase tracking-wider">Number Plate</th>
                  <th className="px-6 py-3 text-left font-semibold text-blue-900 uppercase tracking-wider">Route</th>
                  <th className="px-6 py-3 text-left font-semibold text-blue-900 uppercase tracking-wider">Conductor</th>
                  <th className="px-6 py-3 text-left font-semibold text-blue-900 uppercase tracking-wider">Seats</th>
                  <th className="px-6 py-3 text-left font-semibold text-blue-900 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left font-semibold text-blue-900 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {buses.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-blue-500">No buses found.</td>
                  </tr>
                )}
                {buses.map((bus) => (
                  <tr
                    key={bus.id}
                    className="hover:bg-blue-50 transition"
                  >
                    <td className="px-6 py-4 font-semibold text-gray-800">{bus.numberPlate}</td>
                    <td className="px-6 py-4 text-gray-600">{bus.route?.name || <span className="italic text-gray-400">Not assigned</span>}</td>
                    <td className="px-6 py-4 text-gray-600">{bus.conductor?.fullName || <span className="italic text-gray-400">Not assigned</span>}</td>
                    <td className="px-6 py-4 text-gray-700">{bus.totalSeats}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 text-xs font-bold rounded-full ${
                          bus.active
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {bus.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(bus)}
                          className="px-2 py-1 text-blue-600 hover:text-white hover:bg-blue-600 rounded transition text-xs font-semibold"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleToggleActive(bus)}
                          className={`px-2 py-1 ${bus.active
                            ? "text-yellow-600 hover:bg-yellow-100"
                            : "text-green-600 hover:bg-green-100"
                          } hover:text-white rounded transition text-xs font-semibold`}
                        >
                          {bus.active ? 'Disable' : 'Enable'}
                        </button>
                        <button
                          onClick={() => handleDelete(bus)}
                          className="px-2 py-1 text-red-600 hover:text-white hover:bg-red-600 rounded transition text-xs font-semibold"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bus cards for mobile */}
        <div className="md:hidden w-full flex flex-col gap-4">
          {buses.length === 0 ? (
            <div className="w-full text-center py-10 bg-white rounded-2xl shadow-md border border-blue-100 text-blue-500">
              No buses found.
            </div>
          ) : (
            buses.map((bus) => (
              <div
                key={bus.id}
                className="bg-white rounded-xl shadow-md border border-blue-100 px-4 py-5 flex flex-col gap-1"
              >
                <div className="flex justify-between items-center mb-2">
                  <div className="flex-1">
                    <span className="block text-lg font-black text-gray-800">{bus.numberPlate}</span>
                    <span className="block text-xs text-blue-500">{bus.route?.name || <span className="italic text-gray-400">Not assigned</span>}</span>
                  </div>
                  <span
                    className={`ml-2 px-3 py-1 text-xs font-bold rounded-full ${
                      bus.active
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {bus.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs text-blue-600">
                  <span>Seats: <strong className="text-gray-600">{bus.totalSeats}</strong></span>
                  <span>Conductor: <strong className="text-gray-600">{bus.conductor?.fullName || <span className="italic text-gray-400">Not assigned</span>}</strong></span>
                </div>
                <div className="flex mt-3 gap-2">
                  <button
                    onClick={() => handleEdit(bus)}
                    className="flex-1 py-2 rounded bg-blue-100 text-blue-600 font-bold shadow hover:bg-blue-600 hover:text-white text-xs transition"
                  >Edit</button>
                  <button
                    onClick={() => handleToggleActive(bus)}
                    className={`flex-1 py-2 rounded font-bold shadow text-xs transition ${
                      bus.active
                        ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-400 hover:text-white'
                        : 'bg-green-100 text-green-600 hover:bg-green-500 hover:text-white'
                    }`}
                  >{bus.active ? 'Disable' : 'Enable'}
                  </button>
                  <button
                    onClick={() => handleDelete(bus)}
                    className="flex-1 py-2 rounded bg-red-100 text-red-600 font-bold shadow hover:bg-red-600 hover:text-white text-xs transition"
                  >Delete</button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
            <div className="relative w-full max-w-lg mx-2 sm:mx-auto bg-white rounded-2xl shadow-lg border border-blue-100 p-6 overflow-y-auto max-h-[90vh]">
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 text-blue-400 hover:text-red-500 hover:bg-red-50 rounded-full p-2 transition"
                aria-label="Close"
                tabIndex={0}
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" stroke="currentColor" fill="none"><path d="M6 18L18 6M6 6l12 12" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
              <h2 className="text-xl font-black mb-6 text-blue-800">
                {editingBus ? 'Edit Bus' : 'Add New Bus'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Number Plate <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.numberPlate}
                      maxLength="30"
                      onChange={e => setFormData({ ...formData, numberPlate: e.target.value })}
                      className="w-full px-3 py-2 border border-blue-200 rounded focus:ring-2 focus:ring-blue-200"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Total Seats <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={formData.totalSeats}
                      onChange={e => setFormData({ ...formData, totalSeats: e.target.value })}
                      className="w-full px-3 py-2 border border-blue-200 rounded focus:ring-2 focus:ring-blue-200"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      From <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.from}
                      maxLength="100"
                      onChange={e => setFormData({ ...formData, from: e.target.value })}
                      className="w-full px-3 py-2 border border-blue-200 rounded focus:ring-2 focus:ring-blue-200"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      To <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      maxLength="100"
                      value={formData.to}
                      onChange={e => setFormData({ ...formData, to: e.target.value })}
                      className="w-full px-3 py-2 border border-blue-200 rounded focus:ring-2 focus:ring-blue-200"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Departure Time <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={formData.departureTime}
                      onChange={e => setFormData({ ...formData, departureTime: e.target.value })}
                      className="w-full px-3 py-2 border border-blue-200 rounded focus:ring-2 focus:ring-blue-200"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Arrival Time <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={formData.arrivalTime}
                      onChange={e => setFormData({ ...formData, arrivalTime: e.target.value })}
                      className="w-full px-3 py-2 border border-blue-200 rounded focus:ring-2 focus:ring-blue-200"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Route
                  </label>
                  <select
                    value={formData.routeId}
                    onChange={e => setFormData({ ...formData, routeId: e.target.value })}
                    className="w-full px-3 py-2 border border-blue-200 rounded focus:ring-2 focus:ring-blue-200"
                  >
                    <option value="">Select Route</option>
                    {routes.map(route => (
                      <option key={route.id} value={route.id}>{route.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Conductor
                  </label>
                  <select
                    value={formData.conductorId}
                    onChange={e => setFormData({ ...formData, conductorId: e.target.value })}
                    className="w-full px-3 py-2 border border-blue-200 rounded focus:ring-2 focus:ring-blue-200"
                  >
                    <option value="">Select Conductor</option>
                    {conductors.map(conductor => (
                      <option key={conductor.id} value={conductor.id}>
                        {conductor.profile?.fullName || conductor.username}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end gap-3 pt-5">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-5 py-2 border border-gray-200 bg-gray-50 text-gray-700 rounded-lg shadow-sm hover:bg-gray-100 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-gradient-to-br from-blue-600 to-blue-500 rounded-lg text-white font-semiblod shadow hover:from-blue-700 hover:to-blue-600 transition"
                  >
                    {editingBus ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
