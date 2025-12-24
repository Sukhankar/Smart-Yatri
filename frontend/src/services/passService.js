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

  async uploadPaymentProof(passId, fileOrUrl, reference = null) {
    let body;
    let headers = {};
    
    // Check if it's a File object (for file upload)
    if (fileOrUrl instanceof File) {
      const formData = new FormData();
      formData.append('paymentProof', fileOrUrl);
      if (reference) {
        formData.append('reference', reference);
      }
      body = formData;
      // Don't set Content-Type header - browser will set it with boundary
    } else {
      // Fallback to JSON for base64 or URL (backward compatibility)
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify({ proofUrl: fileOrUrl, reference });
    }

    const res = await fetch(`${SERVER_URL}/api/passes/${passId}/payment-proof`, {
      method: 'PATCH',
      headers,
      credentials: 'include',
      body,
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    return data;
  },
};
