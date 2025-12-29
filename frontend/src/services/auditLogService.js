const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';

export const auditLogService = {
  async getAuditLogs(filters = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value);
      }
    });
    const qs = params.toString() ? `?${params.toString()}` : '';

    const res = await fetch(`${SERVER_URL}/api/admin/audit-logs${qs}`, {
      method: 'GET',
      credentials: 'include',
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    return data;
  },

  async createAuditLog(logData) {
    const res = await fetch(`${SERVER_URL}/api/admin/audit-logs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(logData),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    return data;
  },
};