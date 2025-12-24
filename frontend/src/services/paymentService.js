const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';

export const paymentService = {
  async getUPIQR() {
    const res = await fetch(`${SERVER_URL}/api/payments/upi-qr`, {
      method: 'GET',
      credentials: 'include',
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    return data;
  },

  async getPendingPayments() {
    const res = await fetch(`${SERVER_URL}/api/payments/pending`, {
      method: 'GET',
      credentials: 'include',
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    return data;
  },

  async verifyPayment(id, action) {
    const res = await fetch(`${SERVER_URL}/api/payments/${id}/verify`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ action }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    return data;
  },

  async uploadProof(id, proofUrl) {
    const res = await fetch(`${SERVER_URL}/api/payments/${id}/proof`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ proofUrl }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    return data;
  },
};
