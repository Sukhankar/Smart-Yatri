import { useState, useEffect } from 'react';
import { travelHistoryService } from '../../services/travelHistoryService';
import Sidebar from '../../components/Sidebar';

export default function TravelHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
    // eslint-disable-next-line
  }, []);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const res = await travelHistoryService.listHistory();
      setHistory(res.history || []);
    } catch (err) {
      console.error('Error loading travel history:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50 flex">
        <Sidebar role="student" />
        <div className="flex-1 p-6 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading travel history...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50 flex">
      <Sidebar role="student" />
      <div className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-700 to-pink-600 bg-clip-text text-transparent mb-2">
            Travel History
          </h1>
          <p className="text-gray-600">View your previous bus travels below.</p>
        </div>

        <div className="max-w-5xl mx-auto">
          {history.length > 0 ? (
            <div className="space-y-3">
              {/* Responsive Table for md+ */}
              <div className="hidden md:block bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-purple-200/50 transition-all duration-300">
                <div className="overflow-x-auto rounded-2xl">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Route</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Time</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {history.map((entry) => (
                        <tr key={entry.id || `${entry.travelDate}_${entry.createdAt}`}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(entry.travelDate).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-800">
                            {entry.routeName || 'Route'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                                entry.ticketType === 'PASS'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-blue-100 text-blue-700'
                              }`}
                            >
                              {entry.ticketType}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {entry.createdAt
                              ? new Date(entry.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                              : new Date(entry.travelDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Card style list for mobile */}
              <div className="space-y-4 md:hidden">
                {history.map((entry) => (
                  <div
                    key={entry.id || `${entry.travelDate}_${entry.createdAt}`}
                    className="bg-white/90 rounded-xl shadow flex flex-col sm:flex-row items-center justify-between border border-purple-100/60 px-4 py-4"
                  >
                    <div className="flex-1 w-full flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="inline-block w-2 h-2 rounded-full mr-1"
                          style={{
                            backgroundColor:
                              entry.ticketType === 'PASS'
                                ? '#38b48b' // emerald
                                : '#2563eb' // blue-600
                          }}
                        />
                        <span className="text-base font-semibold text-gray-700">{entry.routeName || "Route"}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M6 2a1 1 0 00-1 1v1H5a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V6a2 2 0 00-2-2h-0V3a1 1 0 00-1-1H6zm8 4v10H6V6h8zm-2-2H8V3h4v1z" />
                          </svg>
                          {new Date(entry.travelDate).toLocaleDateString()}
                        </span>
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3A9 9 0 11 3 12a9 9 0 0115 7.07" />
                          </svg>
                          {entry.createdAt
                            ? new Date(entry.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : new Date(entry.travelDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                    <div className="flex-none mt-3 sm:mt-0 sm:ml-6">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                          entry.ticketType === 'PASS'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {entry.ticketType}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-16">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p className="text-gray-500 text-lg font-medium">No travel history found</p>
              <p className="text-gray-400 mt-2">Your travel records will appear here after your first trip.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
