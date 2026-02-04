import { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import { adminTicketService } from '../../services/adminTicketService';
import { routeService } from '../../services/routeService';
import { userService } from '../../services/userService';

// Centralized user type pricing rules, must match backend logic!
const USER_PRICING_RULES = {
  STUDENT: 0.7,
  STAFF: 0.85,
  REGULAR: 1,
};

// Derives prices for user types based on a base price
function deriveUserPricesFromBase(basePrice) {
  const base = Number(basePrice) || 0;
  const prices = {
    studentPrice: Math.round(base * USER_PRICING_RULES.STUDENT),
    staffPrice: Math.round(base * USER_PRICING_RULES.STAFF),
    regularPrice: base,
  };
  return prices;
}

// Corresponds to fields as per TicketSession model/schema
const emptySession = {
  title: '',
  routeId: '',
  departureTime: '',
  busNumber: '',
  basePrice: 50,
  studentPrice: '',
  staffPrice: '',
  regularPrice: '',
  monthlyPassPrice: '',
  yearlyPassPrice: '',
  passStartDate: '',
  passExpiryDate: '',
  kind: 'session'
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
  const [selectedSessions, setSelectedSessions] = useState([]);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [issueSession, setIssueSession] = useState(null);
  const [issueKind, setIssueKind] = useState('ticket');
  const [issueUserId, setIssueUserId] = useState('');
  const [issueUserType, setIssueUserType] = useState('STUDENT');
  const [routes, setRoutes] = useState([]);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userSearchResults, setUserSearchResults] = useState([]);
  const [userSearchLoading, setUserSearchLoading] = useState(false);
  const [userSearchTimeout, setUserSearchTimeout] = useState(null);
  const [issueTicketType, setIssueTicketType] = useState('DAILY');
  const [issuePassType, setIssuePassType] = useState('MONTHLY');
  const [issueLoading, setIssueLoading] = useState(false);

  useEffect(() => {
    loadSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.status, filters.routeSearch, filters.fromDate, filters.toDate]);

  // Load routes on component mount (separate effect for independent concern)
  useEffect(() => {
    (async () => {
      try {
        const r = await routeService.listRoutes(true);
        setRoutes(r.routes || []);
      } catch (err) {
        console.error('Failed to load routes:', err);
        setRoutes([]);
      }
    })();
  }, []);

  async function loadSessions() {
    setLoading(true);
    setError('');
    try {
      const res = await adminTicketService.listSessions(filters);
      if (!res.sessions) {
        setSessions([]);
        setSelectedSessions([]);
        return;
      }
      // Compute prices for each session and attach to object (in-memory, for quick admin display)
      const withUserTypePrices = res.sessions.map(session => {
        // compute and attach prices for display as per our pricing rules
        const { studentPrice, staffPrice, regularPrice } = deriveUserPricesFromBase(session.basePrice);
        return { ...session, studentPrice, staffPrice, regularPrice };
      });
      setSessions(withUserTypePrices);
      setSelectedSessions([]);
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
      routeId: session.routeId || '',
      departureTime: session.departureTime
        ? new Date(session.departureTime).toISOString().slice(0, 16)
        : '',
      busNumber: session.busNumber || '',
      basePrice: session.basePrice,
      studentPrice: session.studentPrice || '',
      staffPrice: session.staffPrice || '',
      regularPrice: session.regularPrice || '',
      monthlyPassPrice: session.monthlyPassPrice || '',
      yearlyPassPrice: session.yearlyPassPrice || '',
      passStartDate: session.passStartDate || '',
      passExpiryDate: session.passExpiryDate || '',
      kind: 'session'
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

  const openIssueModal = (session) => {
    setIssueSession(session);
    setIssueKind('ticket');
    setIssueUserId('');
    setIssueTicketType('DAILY');
    setIssuePassType('MONTHLY');
    setShowIssueModal(true);
  };

  const handleIssueSubmit = async (e) => {
    e.preventDefault();
    if (!issueUserId) {
      setError('User ID is required to issue');
      return;
    }
    try {
      setIssueLoading(true);
      const payload = {
        kind: issueKind,
        userId: Number(issueUserId),
      };
      if (issueKind === 'ticket') payload.ticketType = issueTicketType;
      else payload.passType = issuePassType;

      await adminTicketService.issueForSession(issueSession._id, payload);
      setShowIssueModal(false);
      await loadSessions();
    } catch (err) {
      setError(err.message || 'Failed to issue');
    } finally {
      setIssueLoading(false);
    }
  };

  const handleUserSearchChange = (val) => {
    setUserSearchQuery(val);
    setIssueUserId('');
    if (userSearchTimeout) clearTimeout(userSearchTimeout);
    if (!val || val.length < 2) {
      setUserSearchResults([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        setUserSearchLoading(true);
        // Filter search by selected user type (loginType) when provided
        const res = await userService.listUsers({ search: val, loginType: issueUserType });
        setUserSearchResults(res.users || []);
      } catch {
        setUserSearchResults([]);
      } finally {
        setUserSearchLoading(false);
      }
    }, 300);
    setUserSearchTimeout(t);
  };

  const selectUserFromSearch = (u) => {
    setIssueUserId(u.id);
    setUserSearchQuery(u.profile?.fullName || u.username || u.email || (`#${u.id}`));
    setUserSearchResults([]);
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

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedSessions(sessions.map(s => s._id));
    } else {
      setSelectedSessions([]);
    }
  };

  const handleSelectSession = (id, checked) => {
    if (checked) {
      setSelectedSessions(prev => [...prev, id]);
    } else {
      setSelectedSessions(prev => prev.filter(sid => sid !== id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedSessions.length === 0) return;
    if (!window.confirm(`Delete ${selectedSessions.length} selected sessions?`)) return;
    try {
      setLoading(true);
      for (const id of selectedSessions) {
        await adminTicketService.deleteSession(id);
      }
      setSelectedSessions([]);
      await loadSessions();
    } catch (err) {
      setError(err.message || 'Failed to delete sessions');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkStatusUpdate = async (newStatus) => {
    if (selectedSessions.length === 0) return;
    try {
      setLoading(true);
      for (const id of selectedSessions) {
        await adminTicketService.updateStatus(id, newStatus);
      }
      setSelectedSessions([]);
      await loadSessions();
    } catch (err) {
      setError(err.message || 'Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  // (old quick create removed)

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
    setLoading(true);
    try {
      // Create session
      const payload = {
        title: form.title,
        routeId: Number(form.routeId),
        departureTime: form.departureTime,
        busNumber: form.busNumber,
        basePrice: Number(form.basePrice),
        studentPrice: form.studentPrice ? Number(form.studentPrice) : null,
        staffPrice: form.staffPrice ? Number(form.staffPrice) : null,
        regularPrice: form.regularPrice ? Number(form.regularPrice) : null,
        monthlyPassPrice: form.monthlyPassPrice ? Number(form.monthlyPassPrice) : null,
        yearlyPassPrice: form.yearlyPassPrice ? Number(form.yearlyPassPrice) : null,
        passStartDate: form.passStartDate || null,
        passExpiryDate: form.passExpiryDate || null,
        // Ensure backend-required routeInfo is included (derive from selected route if not provided)
        routeInfo: form.routeInfo || (routes.find(r => String(r.id) === String(form.routeId))?.name || ''),
      };

      if (modalMode === 'add') {
        await adminTicketService.createSession(payload);
      } else if (modalMode === 'edit' && editingSession?._id) {
        await adminTicketService.updateSession(editingSession._id, payload);
      }
      setShowModal(false);
      await loadSessions();
    } catch (err) {
      setError(err.message || 'Failed to save session');
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
              Manage Sessions
            </h1>
            <p className="text-gray-600">
              Configure routes, timings, seats and dynamic pricing for different user types.
            </p>
          </div>
          <div className="flex gap-2 mt-4 sm:mt-0">
            {selectedSessions.length > 0 && (
              <>
                <button
                  onClick={handleBulkDelete}
                  disabled={loading}
                  className="bg-red-500 text-white font-semibold rounded-xl px-4 py-3 shadow hover:bg-red-600 transition-all duration-200 disabled:opacity-50"
                >
                  Delete Selected ({selectedSessions.length})
                </button>
                <button
                  onClick={() => handleBulkStatusUpdate('ACTIVE')}
                  disabled={loading}
                  className="bg-green-500 text-white font-semibold rounded-xl px-4 py-3 shadow hover:bg-green-600 transition-all duration-200 disabled:opacity-50"
                >
                  Activate Selected
                </button>
                <button
                  onClick={() => handleBulkStatusUpdate('INACTIVE')}
                  disabled={loading}
                  className="bg-gray-500 text-white font-semibold rounded-xl px-4 py-3 shadow hover:bg-gray-600 transition-all duration-200 disabled:opacity-50"
                >
                  Deactivate Selected
                </button>
              </>
            )}

            {/* Modal: Issue Ticket/Pass */}
            {showIssueModal && issueSession && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                <div className="relative bg-white rounded-2xl p-4 sm:p-6 w-full max-w-md mx-2 sm:mx-4 max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200">
                  <button
                    onClick={() => setShowIssueModal(false)}
                    className="absolute top-3 right-4 text-gray-500 hover:text-gray-700 text-2xl font-bold z-10 focus:outline-none"
                    aria-label="Close"
                  >
                    &times;
                  </button>
                  <div className="mb-2">
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">Issue {issueKind === 'ticket' ? 'Ticket' : 'Pass'} for Session</h2>
                    <p className="text-sm text-gray-500 mt-1">Session: {issueSession.title}</p>
                  </div>
                  {error && <div className="mb-2 text-red-500">{error}</div>}
                  <form onSubmit={handleIssueSubmit} className="space-y-4 mt-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Kind</label>
                      <select value={issueKind} onChange={(e) => setIssueKind(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-gray-50">
                        <option value="ticket">Ticket</option>
                        <option value="pass">Pass</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Target User</label>
                      <div className="flex gap-2">
                        <select value={issueUserType} onChange={(e)=>setIssueUserType(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-xl bg-gray-50">
                          <option value="STUDENT">Student</option>
                          <option value="STAFF">Staff</option>
                          <option value="REGULAR">Regular</option>
                        </select>
                        <input
                          name="userSearch"
                          value={userSearchQuery || issueUserId}
                          onChange={(e) => handleUserSearchChange(e.target.value)}
                          placeholder="Search name, username or email (min 2 chars)"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-xl bg-gray-50"
                        />
                      </div>
                      {userSearchLoading && <div className="text-xs text-gray-500 mt-1">Searching...</div>}
                      {userSearchResults.length > 0 && (
                        <ul className="mt-2 bg-white border border-gray-200 rounded-md max-h-40 overflow-y-auto">
                          {userSearchResults.map((u) => (
                            <li
                              key={u.id}
                              onClick={() => selectUserFromSearch(u)}
                              className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                            >
                              {u.profile?.fullName || u.username} {u.email ? `— ${u.email}` : ''} <span className="text-xs text-gray-400">(#{u.id})</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    {issueKind === 'ticket' ? (
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Ticket Type</label>
                        <select value={issueTicketType} onChange={(e) => setIssueTicketType(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-gray-50">
                          <option value="DAILY">Daily</option>
                          <option value="MONTHLY">Monthly</option>
                          <option value="YEARLY">Yearly</option>
                        </select>
                      </div>
                    ) : (
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Pass Type</label>
                        <select value={issuePassType} onChange={(e) => setIssuePassType(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-gray-50">
                          <option value="MONTHLY">Monthly</option>
                          <option value="YEARLY">Yearly</option>
                        </select>
                      </div>
                    )}

                    <div className="flex gap-3 justify-end mt-4">
                      <button type="button" onClick={() => setShowIssueModal(false)} className="bg-gray-100 text-gray-700 rounded-xl px-4 py-2 border border-gray-200 hover:bg-gray-200 text-sm font-semibold">Cancel</button>
                      <button type="submit" disabled={issueLoading} className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl px-6 py-2 shadow font-semibold text-sm">{issueLoading ? 'Issuing...' : 'Issue'}</button>
                    </div>
                  </form>
                </div>
              </div>
            )}
            <button
              type="button"
              onClick={handleAddClick}
              className="bg-gradient-to-r from-red-500 to-pink-500 text-white font-semibold rounded-xl px-6 py-3 shadow hover:from-red-600 hover:to-pink-600 transition-all duration-200"
            >
              + Add Session
            </button>
          </div>
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
                    <input
                      type="checkbox"
                      checked={selectedSessions.length === sessions.length && sessions.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                    />
                  </th>
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
                    <td colSpan={8} className="px-6 py-10 text-center text-gray-400 text-lg">
                      Loading...
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-10 text-center text-red-500">
                      {error}
                    </td>
                  </tr>
                ) : sessions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-10 text-center text-gray-400 text-lg">
                      No ticket sessions found.
                    </td>
                  </tr>
                ) : (
                  sessions.map((session) => {
                    const { studentPrice, staffPrice, regularPrice } = session;
                    return (
                      <tr key={session._id} className="hover:bg-red-50/30 transition">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedSessions.includes(session._id)}
                            onChange={(e) => handleSelectSession(session._id, e.target.checked)}
                            className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                          />
                        </td>
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
                            onClick={() => openIssueModal(session)}
                            className="bg-gradient-to-r from-indigo-500 to-violet-500 text-white rounded-xl px-3 py-1 shadow hover:from-indigo-600 hover:to-violet-600 transition-all duration-200 font-semibold text-xs"
                          >
                            Issue
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
                  {modalMode === 'add' ? 'Add Session' : 'Edit Session'}
                </h2>
              </div>
              {error && <div className="mb-2 text-red-500">{error}</div>}
              <form onSubmit={handleModalSubmit} className="space-y-4 mt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Session Title */}
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

                  {/* Route / Travel Info - fetch from database */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      Route / Travel Info
                    </label>
                    <select
                      name="routeId"
                      value={form.routeId}
                      onChange={handleModalChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-gray-50 focus:border-red-500 focus:ring-2 focus:ring-red-100"
                    >
                      <option value="">Select route</option>
                      {routes.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                    {routes.length === 0 && (
                      <div className="text-xs text-gray-500 mt-1">
                        No active routes available. Add routes under Manage Routes.
                      </div>
                    )}
                  </div>

                  {/* Bus Number */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      Bus Number
                    </label>
                    <input
                      name="busNumber"
                      value={form.busNumber}
                      onChange={handleModalChange}
                      placeholder="e.g. BUS-001"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-gray-50 focus:border-red-500 focus:ring-2 focus:ring-red-100"
                    />
                  </div>

                  {/* Departure Time */}
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

                  {/* Base Price */}
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

                  {/* Ticket Pricing */}
                  <div className="sm:col-span-2 mt-2 p-3 bg-blue-50 rounded-xl border border-blue-100">
                    <p className="text-xs font-semibold text-blue-700 mb-3">Ticket Pricing</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Student Ticket Price (₹)</label>
                        <input
                          type="number"
                          name="studentPrice"
                          value={form.studentPrice}
                          min={0}
                          onChange={handleModalChange}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Staff Ticket Price (₹)</label>
                        <input
                          type="number"
                          name="staffPrice"
                          value={form.staffPrice}
                          min={0}
                          onChange={handleModalChange}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Regular Ticket Price (₹)</label>
                        <input
                          type="number"
                          name="regularPrice"
                          value={form.regularPrice}
                          min={0}
                          onChange={handleModalChange}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Pass Pricing */}
                  <div className="sm:col-span-2 mt-2 p-3 bg-green-50 rounded-xl border border-green-100">
                    <p className="text-xs font-semibold text-green-700 mb-3">Pass Pricing & Dates</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Monthly Pass Price (₹)</label>
                        <input
                          type="number"
                          name="monthlyPassPrice"
                          value={form.monthlyPassPrice}
                          min={0}
                          onChange={handleModalChange}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-white focus:border-green-500 focus:ring-2 focus:ring-green-100 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Yearly Pass Price (₹)</label>
                        <input
                          type="number"
                          name="yearlyPassPrice"
                          value={form.yearlyPassPrice}
                          min={0}
                          onChange={handleModalChange}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-white focus:border-green-500 focus:ring-2 focus:ring-green-100 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Pass Start Date</label>
                        <input
                          type="date"
                          name="passStartDate"
                          value={form.passStartDate}
                          onChange={handleModalChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-white focus:border-green-500 focus:ring-2 focus:ring-green-100 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Pass Expiry Date</label>
                        <input
                          type="date"
                          name="passExpiryDate"
                          value={form.passExpiryDate}
                          onChange={handleModalChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-white focus:border-green-500 focus:ring-2 focus:ring-green-100 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Info section */}
                <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-100">
                  <p className="text-xs font-semibold text-amber-700 mb-2">Session Configuration</p>
                  <p className="text-xs text-gray-600">
                    Configure the bus session with route, departure time, bus number, and pricing for both tickets and passes. These details will be used when managing and issuing tickets/passes for this session.
                  </p>
                </div>

                {/* Session-specific fields (only show when kind is session) */}
                {form.kind === 'session' && (
                  <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                    <p className="text-xs font-semibold text-blue-700 mb-2">Session Details</p>
                    <p className="text-xs text-gray-600 mb-3">
                      Configure the session properties below. Session titles, route info, and timing are only used when creating a Session.
                    </p>
                  </div>
                )}

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
