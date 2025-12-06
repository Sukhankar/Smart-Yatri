const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';

export const notificationService = {
  async listNotifications(role = null) {
    const url = role
      ? `${SERVER_URL}/api/notifications/list?role=${role}`
      : `${SERVER_URL}/api/notifications/list`;
    const res = await fetch(url, {
      method: 'GET',
      credentials: 'include',
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    return data;
  },

  async markAsRead(id) {
    const res = await fetch(`${SERVER_URL}/api/notifications/${id}/read`, {
      method: 'PATCH',
      credentials: 'include',
    });
    const data = await res.json();
    return data;
  },

  async createNotification(userId, broadcastRole, title, message, type = 'INFO') {
    const res = await fetch(`${SERVER_URL}/api/notifications/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ userId, broadcastRole, title, message, type }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    return data;
  },
};
