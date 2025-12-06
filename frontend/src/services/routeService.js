const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';

export const routeService = {
  async listRoutes(activeOnly = false) {
    const url = activeOnly 
      ? `${SERVER_URL}/api/routes/list?active=true`
      : `${SERVER_URL}/api/routes/list`;
    const res = await fetch(url, {
      method: 'GET',
      credentials: 'include',
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    return data;
  },

  async createRoute(name, stops, scheduleTime) {
    const res = await fetch(`${SERVER_URL}/api/routes/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ name, stops, scheduleTime }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    return data;
  },

  async updateRoute(id, updates) {
    const res = await fetch(`${SERVER_URL}/api/routes/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    return data;
  },
};
