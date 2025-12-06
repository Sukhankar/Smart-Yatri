import { useState, useEffect } from 'react';
import { ticketService } from '../../services/ticketService';
import Sidebar from '../../components/Sidebar';

export default function MyTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    try {
      const res = await ticketService.listTickets();
      setTickets(res.tickets || []);
    } catch (err) {
      console.error('Error loading tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  const isTicketValid = (ticket) => {
    if (ticket.paymentStatus !== 'PAID') return false;
    if (!ticket.validUntil) return false;
    return new Date(ticket.validUntil) > new Date();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar role="student" />
        <div className="flex-1 p-6 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading tickets...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar role="student" />
      <div className="flex-1 p-4 md:p-6 lg:p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">My Tickets</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tickets.map((ticket) => {
            const valid = isTicketValid(ticket);
            return (
              <div
                key={ticket.id}
                className={`bg-white rounded-lg shadow-md p-6 border-l-4 ${
                  valid ? 'border-green-500' : 'border-gray-300'
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      {ticket.routeName || 'Route'}
                    </h3>
                    <p className="text-sm text-gray-500">{ticket.ticketType}</p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      valid
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {valid ? 'Valid' : 'Expired'}
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <div>
                    <p className="text-gray-500">Purchase Date</p>
                    <p className="font-semibold">
                      {new Date(ticket.purchaseDate).toLocaleDateString()}
                    </p>
                  </div>
                  {ticket.validUntil && (
                    <div>
                      <p className="text-gray-500">Valid Until</p>
                      <p className="font-semibold">
                        {new Date(ticket.validUntil).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-gray-500">Status</p>
                    <p className="font-semibold">{ticket.paymentStatus}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {tickets.length === 0 && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-500 text-lg">No tickets found</p>
            <p className="text-gray-400 mt-2">Purchase a ticket to get started</p>
          </div>
        )}
      </div>
    </div>
  );
}
