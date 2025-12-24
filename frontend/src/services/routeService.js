const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';

export const routeService = {
  // List routes. `activeOnly` will query for only active routes if true.
  async listRoutes(activeOnly = false) {
    const url = activeOnly
      ? `${SERVER_URL}/api/routes-management/list?active=true`
      : `${SERVER_URL}/api/routes-management/list`;
    const res = await fetch(url, {
      method: 'GET',
      credentials: 'include',
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    return data;
  },

  // Create a new route with all required details
  async createRoute({ name, stops, scheduleTime, busType, totalSeats }) {
    const res = await fetch(`${SERVER_URL}/api/routes-management/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ name, stops, scheduleTime, busType, totalSeats }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    return data;
  },

  // Update an existing route, use PATCH for partial update
  async updateRoute(id, updates) {
    const res = await fetch(`${SERVER_URL}/api/routes-management/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    return data;
  },

  // Optionally: Fetch bus seating info for a given route (if needed)
  async getBusSeating(routeId) {
    const res = await fetch(`${SERVER_URL}/api/routes-management/bus-seating/${routeId}`, {
      method: 'GET',
      credentials: 'include',
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    return data;
  },
};
