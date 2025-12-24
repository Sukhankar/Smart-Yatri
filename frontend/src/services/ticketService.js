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

  async uploadPaymentProof(ticketId, fileOrUrl, reference = null) {
    const formData = new FormData();
    
    // Check if it's a File object or a URL string
    if (fileOrUrl instanceof File) {
      formData.append('paymentProof', fileOrUrl);
    } else if (typeof fileOrUrl === 'string') {
      // If it's a base64 string or URL, send as JSON
      const res = await fetch(`${SERVER_URL}/api/tickets/${ticketId}/payment-proof`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ proofUrl: fileOrUrl, reference }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      return data;
    }

    if (reference) {
      formData.append('reference', reference);
    }

    const res = await fetch(`${SERVER_URL}/api/tickets/${ticketId}/payment-proof`, {
      method: 'PATCH',
      credentials: 'include',
      body: formData,
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    return data;
  },
};
