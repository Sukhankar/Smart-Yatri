const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';

export const profileService = {
  async getProfile() {
    const res = await fetch(`${SERVER_URL}/api/profile`, {
      method: 'GET',
      credentials: 'include',
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    return data;
  },

  async updateProfile(profileData) {
    const res = await fetch(`${SERVER_URL}/api/profile/update`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(profileData),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    return data;
  },
};

