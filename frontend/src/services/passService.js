const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';

export const passService = {
  async createPass(type) {
    const res = await fetch(`${SERVER_URL}/api/passes/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ type }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    return data;
  },

  async getUserPass() {
    const res = await fetch(`${SERVER_URL}/api/passes/user`, {
      method: 'GET',
      credentials: 'include',
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    return data;
  },

  async approvePass(id, action, status = 'ACTIVE') {
    const res = await fetch(`${SERVER_URL}/api/passes/${id}/approve`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ action, status }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    return data;
  },

  async getPendingPasses() {
    const res = await fetch(`${SERVER_URL}/api/passes/pending`, {
      method: 'GET',
      credentials: 'include',
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    return data;
  },
};
