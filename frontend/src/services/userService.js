const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';

export const userService = {
  async listUsers(filters = {}) {
    const params = new URLSearchParams();
    if (filters.role) params.append('role', filters.role);
    if (filters.loginType) params.append('loginType', filters.loginType);
    if (filters.search) params.append('search', filters.search);

    const url = `${SERVER_URL}/api/users/list${params.toString() ? '?' + params.toString() : ''}`;
    const res = await fetch(url, {
      method: 'GET',
      credentials: 'include',
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    return data;
  },

  async getUser(id) {
    const res = await fetch(`${SERVER_URL}/api/users/${id}`, {
      method: 'GET',
      credentials: 'include',
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    return data;
  },
};

