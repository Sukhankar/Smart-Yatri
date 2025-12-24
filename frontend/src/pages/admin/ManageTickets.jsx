import { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import { ticketService } from '../../services/ticketService';

function getTicketPriceForRole(ticketType, userRole) {
  let basePrice = 50;
  if (userRole === 'STUDENT') {
    basePrice = 40;
  } else if (userRole === 'STAFF') {
    basePrice = 45;
  } else if (userRole === 'ADMIN' || userRole === 'MANAGER') {
    basePrice = 0;
  }
  return basePrice;
}

// Separate fields for city and stop; routeFromCityAndStop is no longer on the form
const emptyTicket = {
  userRole: '',
  routeCity: '',
  routeStop: '',
  ticketType: 'DAILY',
  price: 50,
  // issuedDate: '',  // not needed, will be backend-generated on creation
};

export default function ManageTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    userRole: '',
    routeCity: '',
    routeStop: '',
    search: '',
  });
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingTicket, setEditingTicket] = useState(null);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [form, setForm] = useState(emptyTicket);

  // Helper to compose and extract "city - stop" string
  function routeString(city, stop) {
    if (city && stop) return `${city} - ${stop}`;
    if (city) return city;
    if (stop) return stop;
    return '';
  }
  function splitRoute(cityAndStopStr) {
    if (!cityAndStopStr) return { city: '', stop: '' };
    const parts = cityAndStopStr.split(' - ').map(x => x.trim());
    return { city: parts[0] || '', stop: parts[1] || '' };
  }

  // Load adjusts for new route-based filters
  useEffect(() => {
    loadTickets();
    // eslint-disable-next-line
  }, [filters]);

  async function loadTickets() {
    setLoading(true);
    setError('');
    try {
      // Compose route string for filtering
      const apiFilters = { ...filters };
      if ((filters.routeCity || filters.routeStop)) {
        apiFilters.routeName = routeString(filters.routeCity, filters.routeStop);
        delete apiFilters.routeCity;
        delete apiFilters.routeStop;
      } else if ('routeFromCityAndStop' in apiFilters) {
        apiFilters.routeName = apiFilters.routeFromCityAndStop;
        delete apiFilters.routeFromCityAndStop;
      }
      const res = await ticketService.listTickets(apiFilters);
      setTickets(res.tickets || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch tickets');
    } finally {
      setLoading(false);
    }
  }

  const handleAddClick = () => {
    setForm(emptyTicket);
    setModalMode('add');
    setEditingTicket(null);
    setShowModal(true);
  };

  const handleEditClick = (ticket) => {
    // Attempt to get the route from city and stop
    const routeName = ticket.routeFromCityAndStop || ticket.routeName || '';
    const { city, stop } = splitRoute(routeName);
    setForm({
      ...ticket,
      userRole: ticket.userRole || '',
      routeCity: city,
      routeStop: stop,
      ticketType: ticket.ticketType || 'DAILY',
      price: ticket.price || getTicketPriceForRole(ticket.ticketType, ticket.userRole)
      // issuedDate: // not needed, can't edit
    });
    setModalMode('edit');
    setEditingTicket(ticket);
    setShowModal(true);
  };

  const handleDeleteClick = async (ticketId) => {
    if (!window.confirm('Are you sure you want to delete this ticket?')) return;
    try {
      setLoading(true);
      await ticketService.deleteTicket(ticketId);
      await loadTickets();
    } catch (err) {
      setError(err.message || 'Failed to delete ticket');
    } finally {
      setLoading(false);
    }
  };

  const handleModalChange = (e) => {
    const { name, value } = e.target;
    if (name === 'userRole' || name === 'ticketType') {
      const updatedRole = name === 'userRole' ? value : form.userRole;
      const updatedType = name === 'ticketType' ? value : form.ticketType;
      setForm((prev) => ({
        ...prev,
        [name]: value,
        price: getTicketPriceForRole(updatedType, updatedRole),
      }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      setLoading(true);

      // Backend expects routeName as "city - stop" string.
      let toSend = {
        ...form,
        routeName: routeString(form.routeCity, form.routeStop)
      };
      delete toSend.routeCity;
      delete toSend.routeStop;

      // Remove issuedDate; creation time is set by backend
      delete toSend.issuedDate;

      if (modalMode === 'add') {
        await ticketService.createTicket(toSend);
      } else if (modalMode === 'edit' && editingTicket?.id) {
        await ticketService.updateTicket(editingTicket.id, toSend);
      }
      setShowModal(false);
      await loadTickets();
    } catch (err) {
      setError(err.message || 'Failed to save ticket');
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
              Manage Tickets (Admin)
            </h1>
            <p className="text-gray-600">View, add, edit, and delete tickets.</p>
          </div>
          <button
            type="button"
            onClick={handleAddClick}
            className="bg-gradient-to-r from-red-500 to-pink-500 text-white font-semibold rounded-xl px-6 py-3 shadow hover:from-red-600 hover:to-pink-600 transition-all duration-200 mt-4 sm:mt-0"
          >
            + Add Ticket
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <input
                type="text"
                placeholder="User role, route, ticket ID..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-gray-50 focus:border-red-500 focus:ring-2 focus:ring-red-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">User Role</label>
              <select
                value={filters.userRole}
                onChange={(e) => setFilters({ ...filters, userRole: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-gray-50 focus:border-red-500 focus:ring-2 focus:ring-red-100"
              >
                <option value="">All</option>
                <option value="STUDENT">Student</option>
                <option value="STAFF">Staff</option>
                <option value="CONDUCTOR">Conductor</option>
                <option value="MANAGER">Manager</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input
                type="text"
                placeholder="City"
                value={filters.routeCity}
                onChange={(e) => setFilters({ ...filters, routeCity: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-gray-50 focus:border-red-500 focus:ring-2 focus:ring-red-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stop</label>
              <input
                type="text"
                placeholder="Stop"
                value={filters.routeStop}
                onChange={(e) => setFilters({ ...filters, routeStop: e.target.value })}
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
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Ticket ID</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">User Role</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Route (City - Stop)</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Issued Date</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
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
                    <td colSpan={7} className="px-6 py-10 text-center text-red-500">{error}</td>
                  </tr>
                ) : tickets.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-gray-400 text-lg">
                      No tickets found.
                    </td>
                  </tr>
                ) : (
                  tickets.map((ticket) => {
                    const cityAndStop = splitRoute(ticket.routeFromCityAndStop || ticket.routeName || '');
                    return (
                      <tr key={ticket.id} className="hover:bg-red-50/30 transition">
                        <td className="px-6 py-4 whitespace-nowrap">{ticket.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{ticket.userRole || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {routeString(cityAndStop.city, cityAndStop.stop) || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">{ticket.ticketType || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {(ticket.issuedDate
                            ? new Date(ticket.issuedDate).toLocaleString()
                            : (ticket.purchaseDate
                              ? new Date(ticket.purchaseDate).toLocaleString()
                              : '-'))}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap font-bold">
                          ₹{getTicketPriceForRole(ticket.ticketType, ticket.userRole)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap flex gap-2">
                          <button
                            onClick={() => handleEditClick(ticket)}
                            className="bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl px-3 py-1 shadow hover:from-red-600 hover:to-pink-600 transition-all duration-200 font-semibold text-xs"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteClick(ticket.id)}
                            className="bg-red-100 text-red-700 rounded-xl px-3 py-1 border border-red-200 hover:bg-red-200 hover:text-red-900 transition-all duration-200 font-semibold text-xs"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    )
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
            ) : tickets.length === 0 ? (
              <div className="bg-white/70 rounded-2xl shadow-md border border-gray-100 px-4 py-10 text-center text-gray-400 text-lg">
                No tickets found.
              </div>
            ) : (
              tickets.map((ticket) => {
                const cityAndStop = splitRoute(ticket.routeFromCityAndStop || ticket.routeName || '');
                return (
                  <div
                    key={ticket.id}
                    className="bg-white/80 rounded-2xl shadow-lg border border-gray-200 mb-2 p-4 flex flex-col gap-1"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div>
                        <div className="text-base font-bold text-gray-700">Ticket #{ticket.id}</div>
                        <div className="text-xs text-gray-500">
                          {routeString(cityAndStop.city, cityAndStop.stop) || 'No Route'} · {ticket.userRole || 'N/A'}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-4 items-center mb-1">
                      <div>
                        <span className="text-xs text-gray-400 mr-1">Type:</span>
                        <span className="text-sm font-semibold text-gray-600">{ticket.ticketType}</span>
                      </div>
                      <div>
                        <span className="text-xs text-gray-400 mr-1">Price:</span>
                        <span className="text-sm font-semibold text-gray-700">₹{getTicketPriceForRole(ticket.ticketType, ticket.userRole)}</span>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 mb-2">
                      Issued: {(ticket.issuedDate
                        ? new Date(ticket.issuedDate).toLocaleString()
                        : (ticket.purchaseDate
                          ? new Date(ticket.purchaseDate).toLocaleString()
                          : '-'))}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditClick(ticket)}
                        className="bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl px-4 py-2 shadow hover:from-red-600 hover:to-pink-600 transition-all duration-200 text-xs font-semibold"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteClick(ticket.id)}
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

        {/* Modal: Add/Edit Ticket */}
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
                  {modalMode === 'add' ? 'Add Ticket' : 'Edit Ticket'}
                </h2>
              </div>
              {error && <div className="mb-2 text-red-500">{error}</div>}
              <form onSubmit={handleModalSubmit} className="space-y-4 mt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">User Role</label>
                    <select
                      name="userRole"
                      value={form.userRole}
                      onChange={handleModalChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-gray-50 focus:border-red-500 focus:ring-2 focus:ring-red-100"
                    >
                      <option value="">Select</option>
                      <option value="STUDENT">Student</option>
                      <option value="STAFF">Staff</option>
                      <option value="CONDUCTOR">Conductor</option>
                      <option value="MANAGER">Manager</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">City</label>
                    <input
                      name="routeCity"
                      value={form.routeCity}
                      onChange={handleModalChange}
                      placeholder="e.g. Mumbai"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-gray-50 focus:border-red-500 focus:ring-2 focus:ring-red-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Stop</label>
                    <input
                      name="routeStop"
                      value={form.routeStop}
                      onChange={handleModalChange}
                      placeholder="e.g. Fort"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-gray-50 focus:border-red-500 focus:ring-2 focus:ring-red-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Ticket Type</label>
                    <select
                      name="ticketType"
                      value={form.ticketType}
                      onChange={handleModalChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-gray-50 focus:border-red-500 focus:ring-2 focus:ring-red-100"
                    >
                      <option value="DAILY">Daily</option>
                      <option value="WEEKLY">Weekly</option>
                      <option value="MONTHLY">Monthly</option>
                    </select>
                  </div>
                  {/* Issued date is removed from form, assigned by backend */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Price</label>
                    <input
                      type="number"
                      name="price"
                      value={form.price}
                      min={0}
                      step={1}
                      onChange={handleModalChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-gray-50 focus:border-red-500 focus:ring-2 focus:ring-red-100"
                      readOnly
                    />
                  </div>
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
                    {modalMode === 'add' ? 'Add Ticket' : 'Save Changes'}
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
