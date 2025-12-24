const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';

export const reportService = {
  async getDashboardStats() {
    const res = await fetch(`${SERVER_URL}/api/reports/dashboard-stats`, {
      method: 'GET',
      credentials: 'include',
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    return data;
  },
};

