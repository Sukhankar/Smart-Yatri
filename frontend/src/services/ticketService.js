const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';

export const ticketService = {
  async createTicket(routeId, ticketType = 'DAILY') {
    const res = await fetch(`${SERVER_URL}/api/tickets/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ routeId, ticketType }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    return data;
  },

  async listTickets() {
    const res = await fetch(`${SERVER_URL}/api/tickets/list`, {
      method: 'GET',
      credentials: 'include',
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    return data;
  },
};
