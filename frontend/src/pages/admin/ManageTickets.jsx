import { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import { adminTicketService } from '../../services/adminTicketService';

// Default discounts – must stay in sync with backend defaults in PricingRule
function deriveUserPricesFromBase(basePrice) {
  const base = Number(basePrice) || 0;
  const studentPrice = Math.round(base * 0.7);
  const staffPrice = Math.round(base * 0.85);
  const regularPrice = base;
  return { studentPrice, staffPrice, regularPrice };
}

const emptySession = {
  title: '',
  routeInfo: '',
  departureTime: '',
  totalSeats: 40,
  availableSeats: 40,
  basePrice: 50,
};

export default function ManageTickets() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: 'ACTIVE',
    routeSearch: '',
    fromDate: '',
    toDate: '',
  });
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [form, setForm] = useState(emptySession);

  useEffect(() => {
    loadSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.status, filters.routeSearch, filters.fromDate, filters.toDate]);

  async function loadSessions() {
    setLoading(true);
    setError('');
    try {
      const res = await adminTicketService.listSessions(filters);
      setSessions(res.sessions || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch ticket sessions');
    } finally {
      setLoading(false);
    }
  }

  const handleAddClick = () => {
    setForm(emptySession);
    setModalMode('add');
    setEditingSession(null);
    setShowModal(true);
  };

  const handleEditClick = (session) => {
    setForm({
      title: session.title,
      routeInfo: session.routeInfo,
      departureTime: session.departureTime
        ? new Date(session.departureTime).toISOString().slice(0, 16)
        : '',
      totalSeats: session.totalSeats,
      availableSeats: session.availableSeats,
      basePrice: session.basePrice,
    });
    setModalMode('edit');
    setEditingSession(session);
    setShowModal(true);
  };

  const handleDeleteClick = async (id) => {
    if (!window.confirm('Are you sure you want to delete this ticket session?')) return;
    try {
      setLoading(true);
      await adminTicketService.deleteSession(id);
      await loadSessions();
    } catch (err) {
      setError(err.message || 'Failed to delete ticket session');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (session) => {
    try {
      setLoading(true);
      const nextStatus = session.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      await adminTicketService.updateStatus(session._id, nextStatus);
      await loadSessions();
    } catch (err) {
      setError(err.message || 'Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  const handleModalChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      setLoading(true);

      const payload = {
        ...form,
        totalSeats: Number(form.totalSeats),
        availableSeats: Number(form.availableSeats),
        basePrice: Number(form.basePrice),
      };

      if (modalMode === 'add') {
        await adminTicketService.createSession(payload);
      } else if (modalMode === 'edit' && editingSession?._id) {
        await adminTicketService.updateSession(editingSession._id, payload);
      }
      setShowModal(false);
      await loadSessions();
    } catch (err) {
      setError(err.message || 'Failed to save ticket session');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-red-50/30 to-gray-50 flex">
      <Sidebar role="admin" />

      <div className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row items-start justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-red-700 to-pink-600 bg-clip-text text-transparent mb-2">
              Manage Ticket Sessions
            </h1>
            <p className="text-gray-600">
              Configure routes, timings, seats and dynamic pricing for different user types.
            </p>
          </div>
          <button
            type="button"
            onClick={handleAddClick}
            className="bg-gradient-to-r from-red-500 to-pink-500 text-white font-semibold rounded-xl px-6 py-3 shadow hover:from-red-600 hover:to-pink-600 transition-all duration-200 mt-4 sm:mt-0"
          >
            + Add Session
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-gray-50 focus:border-red-500 focus:ring-2 focus:ring-red-100"
              >
                <option value="">All</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Route</label>
              <input
                type="text"
                placeholder="Search by route or title"
                value={filters.routeSearch}
                onChange={(e) => setFilters({ ...filters, routeSearch: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-gray-50 focus:border-red-500 focus:ring-2 focus:ring-red-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
              <input
                type="date"
                value={filters.fromDate}
                onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-gray-50 focus:border-red-500 focus:ring-2 focus:ring-red-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
              <input
                type="date"
                value={filters.toDate}
                onChange={(e) => setFilters({ ...filters, toDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-gray-50 focus:border-red-500 focus:ring-2 focus:ring-red-100"
              />
            </div>
          </div>
        </div>

        {/* Table: Desktop */}
        <div className="hidden md:block">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-white">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Route / Info
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Departure
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Seats (Avail / Total)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Prices (Stu / Staff / Reg)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-gray-400 text-lg">
                      Loading...
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-red-500">
                      {error}
                    </td>
                  </tr>
                ) : sessions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-gray-400 text-lg">
                      No ticket sessions found.
                    </td>
                  </tr>
                ) : (
                  sessions.map((session) => {
                    const { studentPrice, staffPrice, regularPrice } = session;
                    return (
                      <tr key={session._id} className="hover:bg-red-50/30 transition">
                        <td className="px-6 py-4 whitespace-nowrap font-semibold text-gray-800">
                          {session.title}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap max-w-xs">
                          <span className="text-gray-600 line-clamp-2">{session.routeInfo}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {session.departureTime
                            ? new Date(session.departureTime).toLocaleString()
                            : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {session.availableSeats} / {session.totalSeats}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">
                          <span className="block text-green-700">₹{studentPrice}</span>
                          <span className="block text-amber-700">₹{staffPrice}</span>
                          <span className="block text-gray-800">₹{regularPrice}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                              session.status === 'ACTIVE'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-200 text-gray-700'
                            }`}
                          >
                            {session.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap flex gap-2">
                          <button
                            onClick={() => handleEditClick(session)}
                            className="bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl px-3 py-1 shadow hover:from-red-600 hover:to-pink-600 transition-all duration-200 font-semibold text-xs"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleToggleStatus(session)}
                            className="bg-blue-100 text-blue-700 rounded-xl px-3 py-1 border border-blue-200 hover:bg-blue-200 hover:text-blue-900 transition-all duration-200 font-semibold text-xs"
                          >
                            {session.status === 'ACTIVE' ? 'Disable' : 'Enable'}
                          </button>
                          <button
                            onClick={() => handleDeleteClick(session._id)}
                            className="bg-red-100 text-red-700 rounded-xl px-3 py-1 border border-red-200 hover:bg-red-200 hover:text-red-900 transition-all duration-200 font-semibold text-xs"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Card: Mobile */}
        <div className="block md:hidden">
          <div className="space-y-4">
            {loading ? (
              <div className="bg-white/70 rounded-2xl shadow-md border border-gray-100 px-4 py-10 text-center text-gray-400 text-lg">
                Loading...
              </div>
            ) : error ? (
              <div className="bg-white/70 rounded-2xl shadow-md border border-gray-100 px-4 py-10 text-center text-red-500">
                {error}
              </div>
            ) : sessions.length === 0 ? (
              <div className="bg-white/70 rounded-2xl shadow-md border border-gray-100 px-4 py-10 text-center text-gray-400 text-lg">
                No ticket sessions found.
              </div>
            ) : (
              sessions.map((session) => {
                const { studentPrice, staffPrice, regularPrice } = session;
                return (
                  <div
                    key={session._id}
                    className="bg-white/80 rounded-2xl shadow-lg border border-gray-200 mb-2 p-4 flex flex-col gap-1"
                  >
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div>
                        <div className="text-base font-bold text-gray-700">
                          {session.title}
                        </div>
                        <div className="text-xs text-gray-500 line-clamp-2">
                          {session.routeInfo}
                        </div>
                      </div>
                      <span
                        className={`inline-flex px-2 py-1 rounded-full text-[10px] font-semibold ${
                          session.status === 'ACTIVE'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-200 text-gray-700'
                        }`}
                      >
                        {session.status}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mb-2">
                      Departure:{' '}
                      {session.departureTime
                        ? new Date(session.departureTime).toLocaleString()
                        : '-'}
                    </div>
                    <div className="flex flex-wrap gap-4 items-center mb-1 text-xs">
                      <span className="text-gray-600">
                        Seats:{' '}
                        <span className="font-semibold">
                          {session.availableSeats} / {session.totalSeats}
                        </span>
                      </span>
                      <span className="text-gray-600">
                        Prices:{' '}
                        <span className="font-semibold text-green-700">
                          Stu ₹{studentPrice}
                        </span>
                        {', '}
                        <span className="font-semibold text-amber-700">
                          Staff ₹{staffPrice}
                        </span>
                        {', '}
                        <span className="font-semibold text-gray-800">
                          Reg ₹{regularPrice}
                        </span>
                      </span>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => handleEditClick(session)}
                        className="bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl px-4 py-2 shadow hover:from-red-600 hover:to-pink-600 transition-all duration-200 text-xs font-semibold"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleToggleStatus(session)}
                        className="bg-blue-100 text-blue-700 rounded-xl px-4 py-2 border border-blue-200 hover:bg-blue-200 hover:text-blue-900 transition-all duration-200 text-xs font-semibold"
                      >
                        {session.status === 'ACTIVE' ? 'Disable' : 'Enable'}
                      </button>
                      <button
                        onClick={() => handleDeleteClick(session._id)}
                        className="bg-red-100 text-red-700 rounded-xl px-4 py-2 border border-red-200 hover:bg-red-200 hover:text-red-900 transition-all duration-200 text-xs font-semibold"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Modal: Add/Edit Session */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="relative bg-white rounded-2xl p-4 sm:p-6 w-full max-w-lg sm:max-w-2xl mx-2 sm:mx-4 max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200">
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-3 right-4 text-gray-500 hover:text-gray-700 text-2xl font-bold z-10 focus:outline-none"
                aria-label="Close"
              >
                &times;
              </button>
              <div className="mb-2">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-red-700 to-pink-600 bg-clip-text text-transparent">
                  {modalMode === 'add' ? 'Add Ticket Session' : 'Edit Ticket Session'}
                </h2>
              </div>
              {error && <div className="mb-2 text-red-500">{error}</div>}
              <form onSubmit={handleModalSubmit} className="space-y-4 mt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      Session Title
                    </label>
                    <input
                      name="title"
                      value={form.title}
                      onChange={handleModalChange}
                      placeholder="e.g. Morning College Route"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-gray-50 focus:border-red-500 focus:ring-2 focus:ring-red-100"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      Route / Travel Info
                    </label>
                    <textarea
                      name="routeInfo"
                      value={form.routeInfo}
                      onChange={handleModalChange}
                      placeholder="e.g. City Center to Campus via Main Road"
                      rows={2}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-gray-50 focus:border-red-500 focus:ring-2 focus:ring-red-100 resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      Departure Time
                    </label>
                    <input
                      type="datetime-local"
                      name="departureTime"
                      value={form.departureTime}
                      onChange={handleModalChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-gray-50 focus:border-red-500 focus:ring-2 focus:ring-red-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      Total Seats
                    </label>
                    <input
                      type="number"
                      name="totalSeats"
                      value={form.totalSeats}
                      min={1}
                      max={500}
                      onChange={handleModalChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-gray-50 focus:border-red-500 focus:ring-2 focus:ring-red-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      Available Seats
                    </label>
                    <input
                      type="number"
                      name="availableSeats"
                      value={form.availableSeats}
                      min={0}
                      max={form.totalSeats || 500}
                      onChange={handleModalChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-gray-50 focus:border-red-500 focus:ring-2 focus:ring-red-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      Base Price (₹)
                    </label>
                    <input
                      type="number"
                      name="basePrice"
                      value={form.basePrice}
                      min={0}
                      onChange={handleModalChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-gray-50 focus:border-red-500 focus:ring-2 focus:ring-red-100"
                    />
                  </div>
                </div>

                {/* Preview of user-type prices (calculated client-side for admin visibility only) */}
                <div className="mt-2 p-3 bg-red-50 rounded-xl border border-red-100 text-xs text-gray-700">
                  <p className="font-semibold mb-1 text-red-700">User Type Prices (preview)</p>
                  {(() => {
                    const { studentPrice, staffPrice, regularPrice } =
                      deriveUserPricesFromBase(form.basePrice);
                    return (
                      <div className="flex flex-wrap gap-4">
                        <span>
                          <span className="font-semibold text-green-700">Student:</span> ₹
                          {studentPrice}
                        </span>
                        <span>
                          <span className="font-semibold text-amber-700">Staff:</span> ₹
                          {staffPrice}
                        </span>
                        <span>
                          <span className="font-semibold text-gray-800">Regular:</span> ₹
                          {regularPrice}
                        </span>
                      </div>
                    );
                  })()}
                  <p className="mt-1 text-[11px] text-gray-500">
                    Final prices are calculated and stored securely on the server based on this base
                    price.
                  </p>
                </div>

                <div className="flex gap-3 justify-end mt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="bg-gray-100 text-gray-700 rounded-xl px-4 py-2 border border-gray-200 hover:bg-gray-200 hover:text-gray-900 transition-all duration-200 text-sm font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl px-6 py-2 shadow hover:from-red-600 hover:to-pink-600 transition-all duration-200 font-semibold text-sm"
                  >
                    {modalMode === 'add' ? 'Add Session' : 'Save Changes'}
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
