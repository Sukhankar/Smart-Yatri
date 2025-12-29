const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';

export const systemSettingsService = {
  async getSystemSettings(category = null) {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    const qs = params.toString() ? `?${params.toString()}` : '';

    const res = await fetch(`${SERVER_URL}/api/admin/system-settings${qs}`, {
      method: 'GET',
      credentials: 'include',
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    return data;
  },

  async updateSystemSetting(key, value) {
    const res = await fetch(`${SERVER_URL}/api/admin/system-settings/${key}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ value }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    return data;
  },

  async deleteSystemSetting(key) {
    const res = await fetch(`${SERVER_URL}/api/admin/system-settings/${key}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    return data;
  },
};