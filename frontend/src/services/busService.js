const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';

export const busService = {
  async listBuses(activeOnly = false) {
    const url = activeOnly
      ? `${SERVER_URL}/api/buses/list?active=true`
      : `${SERVER_URL}/api/buses/list`;
    const res = await fetch(url, {
      method: 'GET',
      credentials: 'include',
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    return data;
  },

  async createBus(busData) {
    const res = await fetch(`${SERVER_URL}/api/buses/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(busData),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    return data;
  },

  async updateBus(id, updates) {
    const res = await fetch(`${SERVER_URL}/api/buses/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    return data;
  },

  async deleteBus(id) {
    const res = await fetch(`${SERVER_URL}/api/buses/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    return data;
  },
};

