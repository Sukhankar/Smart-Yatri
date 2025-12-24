import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ticketService } from "../../services/ticketService";
import Sidebar from "../../components/Sidebar";

export default function MyTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadTickets();
    // eslint-disable-next-line
  }, []);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const res = await ticketService.listTickets();
      setTickets(res.tickets || []);
    } catch (err) {
      console.error("Error loading tickets:", err);
    } finally {
      setLoading(false);
    }
  };

  const isTicketValid = (ticket) => {
    if (ticket.paymentStatus !== "PAID") return false;
    if (!ticket.validUntil) return false;
    return new Date(ticket.validUntil) > new Date();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50 flex">
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50 flex">
      <Sidebar role="student" />
      <div className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-700 to-emerald-600 bg-clip-text text-transparent mb-2">
            My Tickets
          </h1>
          <p className="text-gray-600">View your purchased daily tickets below.</p>
        </div>

        <div className="max-w-5xl mx-auto">
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
            {tickets.map((ticket) => {
              const valid = isTicketValid(ticket);
              return (
                <div
                  key={ticket.id}
                  className={`bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 hover:shadow-2xl transition-all duration-300 p-6 flex flex-col h-full min-h-[220px] ${
                    valid
                      ? "border-l-8 border-green-500"
                      : "border-l-8 border-gray-300"
                  }`}
                  style={{ position: "relative" }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className={`p-2 rounded-lg ${
                        valid
                          ? "bg-gradient-to-br from-green-500 to-emerald-500"
                          : "bg-gradient-to-br from-gray-400 to-gray-300"
                      }`}
                    >
                      <svg
                        className="w-6 h-6 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        {/* Ticket icon */}
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                        {ticket.routeName || "Route"}
                      </h3>
                      <p className="text-xs font-medium text-gray-500">
                        {ticket.ticketType}
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center mb-4">
                    <span
                      className={`inline-block px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wide shadow ${
                        valid
                          ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-green-200"
                          : "bg-gray-200 text-gray-700"
                      }`}
                    >
                      {valid ? "Valid" : "Expired"}
                    </span>
                    <span className="text-lg font-bold text-blue-600">
                      ₹50
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm mb-2">
                    <div>
                      <p className="text-gray-500">Purchased</p>
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
                  </div>
                  <div className="flex flex-col gap-1 mt-1 text-sm">
                    <div>
                      <span className="text-gray-500">Status: </span>
                      <span
                        className={`font-semibold ${
                          ticket.paymentStatus === "PAID"
                            ? "text-green-700"
                            : "text-gray-800"
                        }`}
                      >
                        {ticket.paymentStatus}
                      </span>
                    </div>
                  </div>
                  {/* Ribbon for valid ticket */}
                  {valid && (
                    <div className="absolute top-3 right-4">
                      <span className="inline-flex items-center text-xs font-bold text-green-700 bg-green-100 border border-green-200 px-2 py-0.5 rounded-full shadow">
                        ACTIVE
                      </span>
                    </div>
                  )}
                  {/* Ribbon for expired */}
                  {!valid && (
                    <div className="absolute top-3 right-4">
                      <span className="inline-flex items-center text-xs font-bold text-gray-700 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-full shadow">
                        {ticket.paymentStatus === "PAID"
                          ? "EXPIRED"
                          : "PENDING"}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Empty state */}
          {tickets.length === 0 && (
            <div className="bg-white/80 rounded-2xl shadow-xl border border-gray-200/50 p-12 text-center mt-10">
              <div className="mb-5">
                <svg
                  className="w-16 h-16 text-gray-200 mx-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
                  />
                </svg>
              </div>
              <p className="text-gray-500 text-lg">No tickets found</p>
              <p className="text-gray-400 mt-2">
                Purchase a ticket to get started.
              </p>
              <button
                onClick={() => navigate("/student/book-ticket")}
                className="mt-6 bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-8 py-3 rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all duration-200 shadow-lg font-semibold"
              >
                Buy a Ticket
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
