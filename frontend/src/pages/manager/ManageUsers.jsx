import { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import { userService } from '../../services/userService';
import QRDisplay from '../../components/QRDisplay';

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    role: '',
    loginType: '',
    search: '',
  });
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line
  }, [filters]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await userService.listUsers(filters);
      setUsers(res.users || []);
    } catch (err) {
      console.error('Error loading users:', err);
      alert(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50 flex">
        <Sidebar role="manager" />
        <div className="flex-1 flex items-center justify-center">
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
            Manage Users
          </h1>
          <p className="text-gray-600">View, search, and administer users.</p>
        </div>

        {/* Filters */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <input
                type="text"
                placeholder="Search by name, email, ID..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-gray-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">User Type</label>
              <select
                value={filters.loginType}
                onChange={(e) => setFilters({ ...filters, loginType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-gray-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">All Types</option>
                <option value="STUDENT">Student</option>
                <option value="STAFF">Staff</option>
                <option value="CONDUCTOR">Conductor</option>
                <option value="MANAGER">Manager</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select
                value={filters.role}
                onChange={(e) => setFilters({ ...filters, role: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-gray-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">All Roles</option>
                <option value="STUDENT">Student</option>
                <option value="STAFF">Staff</option>
                <option value="CONDUCTOR">Conductor</option>
                <option value="MANAGER">Manager</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users Table for md+ / Cards for mobile */}
        <div>
          {/* Table for md and up */}
          <div className="hidden md:block">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-white">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      ID Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      QR Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center text-gray-400 text-lg">
                        No users found.
                      </td>
                    </tr>
                  )}
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-blue-50/30 transition">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-gray-700">
                          {user.profile?.fullName || user.username}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold 
                          ${user.loginType === 'STUDENT' ? 'bg-blue-100 text-blue-800'
                            : user.loginType === 'STAFF' ? 'bg-green-100 text-green-800'
                            : user.loginType === 'CONDUCTOR' ? 'bg-yellow-100 text-yellow-800'
                            : user.loginType === 'MANAGER' ? 'bg-indigo-100 text-indigo-800'
                            : 'bg-gray-100 text-gray-700'}
                        `}>
                          {user.loginType}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.profile?.idNumber || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {user.profile?.qrId ? (
                          <button
                            onClick={() => setSelectedUser(user)}
                            className="text-blue-600 hover:underline hover:text-blue-800 font-medium"
                          >
                            View QR
                          </button>
                        ) : (
                          <span className="text-gray-400">No QR</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => setSelectedUser(user)}
                          className="bg-gradient-to-r from-indigo-500 to-blue-500 text-white rounded-xl px-4 py-2 shadow hover:from-indigo-600 hover:to-blue-600 transition-all duration-200 font-semibold"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {/* Card layout for mobile */}
          <div className="block md:hidden">
            <div className="space-y-4">
              {users.length === 0 && (
                <div className="bg-white/70 rounded-2xl shadow-md border border-gray-100 px-4 py-10 text-center text-gray-400 text-lg">
                  No users found.
                </div>
              )}
              {users.map((user) => (
                <div
                  key={user.id}
                  className="bg-white/80 rounded-2xl shadow-lg border border-gray-200 mb-2 p-4 flex flex-col gap-1"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div>
                      <div className="text-base font-bold text-gray-700">{user.profile?.fullName || user.username}</div>
                      <div className="text-xs text-gray-500">{user.email || 'N/A'}</div>
                    </div>
                    <span className={`ml-auto inline-block px-3 py-1 rounded-full text-xs font-semibold
                      ${user.loginType === 'STUDENT' ? 'bg-blue-100 text-blue-800'
                        : user.loginType === 'STAFF' ? 'bg-green-100 text-green-800'
                        : user.loginType === 'CONDUCTOR' ? 'bg-yellow-100 text-yellow-800'
                        : user.loginType === 'MANAGER' ? 'bg-indigo-100 text-indigo-800'
                        : 'bg-gray-100 text-gray-700'}`
                    }>
                      {user.loginType}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-4 items-center mb-1">
                    <div>
                      <span className="text-xs text-gray-400 mr-1">ID:</span>
                      <span className="text-sm font-semibold text-gray-600">{user.profile?.idNumber || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-xs text-gray-400 mr-1">QR:</span>
                      {user.profile?.qrId ? (
                        <button
                          onClick={() => setSelectedUser(user)}
                          className="text-blue-600 hover:underline font-medium"
                        >
                          View QR
                        </button>
                      ) : (
                        <span className="text-gray-400 text-xs">No QR</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedUser(user)}
                      className="bg-gradient-to-r from-indigo-500 to-blue-500 text-white rounded-xl px-4 py-2 shadow hover:from-indigo-600 hover:to-blue-600 transition-all duration-200 text-xs font-semibold"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* User Details Modal */}
        {selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="relative bg-white rounded-2xl p-4 sm:p-6 w-full max-w-lg sm:max-w-2xl mx-2 sm:mx-4 max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200">
              <button
                onClick={() => setSelectedUser(null)}
                className="absolute top-3 right-4 text-gray-500 hover:text-gray-700 text-2xl font-bold z-10 focus:outline-none"
                aria-label="Close"
              >
                &times;
              </button>
              <div className="mb-2">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-700 to-cyan-600 bg-clip-text text-transparent">
                  User Details
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-gray-500">Full Name</p>
                    <p className="font-semibold text-lg break-words">{selectedUser.profile?.fullName || selectedUser.username}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-semibold break-words">{selectedUser.email || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">User Type</p>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold 
                      ${selectedUser.loginType === 'STUDENT' ? 'bg-blue-100 text-blue-800'
                        : selectedUser.loginType === 'STAFF' ? 'bg-green-100 text-green-800'
                        : selectedUser.loginType === 'CONDUCTOR' ? 'bg-yellow-100 text-yellow-800'
                        : selectedUser.loginType === 'MANAGER' ? 'bg-indigo-100 text-indigo-800'
                        : 'bg-gray-100 text-gray-700'}`
                    }>
                      {selectedUser.loginType}
                    </span>
                  </div>
                  {selectedUser.profile && (
                    <>
                      <div>
                        <p className="text-sm text-gray-500">ID Number</p>
                        <p className="font-semibold">{selectedUser.profile.idNumber || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Class/Position</p>
                        <p className="font-semibold">{selectedUser.profile.classOrPosition || 'N/A'}</p>
                      </div>
                    </>
                  )}
                </div>
                {selectedUser.profile?.qrId && (
                  <div className="flex flex-col items-center justify-center">
                    <p className="text-sm text-gray-500 mb-2">QR Code</p>
                    <QRDisplay
                      qrId={selectedUser.profile.qrId}
                      qrCode={null}
                      status="ACTIVE"
                      profile={selectedUser.profile}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
