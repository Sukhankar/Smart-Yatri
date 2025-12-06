const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';

export const qrService = {
  async generateQR() {
    const res = await fetch(`${SERVER_URL}/api/qr/generate`, {
      method: 'GET',
      credentials: 'include',
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    return data;
  },

  async verifyQR(qrId, routeId = null) {
    const res = await fetch(`${SERVER_URL}/api/qr/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ qrId, routeId }),
    });
    const data = await res.json();
    return data;
  },
};
