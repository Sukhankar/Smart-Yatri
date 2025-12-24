const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';

function buildQuery(params = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      qs.append(key, value);
    }
  });
  const s = qs.toString();
  return s ? `?${s}` : '';
}

export const adminTicketService = {
  async listSessions(filters = {}) {
    const res = await fetch(
      `${SERVER_URL}/api/admin/ticket-sessions${buildQuery(filters)}`,
      {
        method: 'GET',
        credentials: 'include',
      }
    );
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to load sessions');
    return data;
  },

  async createSession(payload) {
    const res = await fetch(`${SERVER_URL}/api/admin/ticket-sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to create session');
    return data;
  },

  async updateSession(id, payload) {
    const res = await fetch(`${SERVER_URL}/api/admin/ticket-sessions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to update session');
    return data;
  },

  async deleteSession(id) {
    const res = await fetch(`${SERVER_URL}/api/admin/ticket-sessions/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to delete session');
    return data;
  },

  async updateStatus(id, status) {
    const res = await fetch(
      `${SERVER_URL}/api/admin/ticket-sessions/${id}/status`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status }),
      }
    );
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to update status');
    return data;
  },
};


