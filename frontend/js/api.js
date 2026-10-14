/* ==========================================================================
   LeftoverLoop API Client Module
   ========================================================================== */

// Detect environment: use local backend in development, Render backend in production.
const API_BASE_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? 'http://localhost:8080/api'
  : 'https://leftoverloop-backend.onrender.com/api';

class ApiClient {

  static getToken() {
    return localStorage.getItem('leftoverloop_token');
  }

  static setToken(token) {
    localStorage.setItem('leftoverloop_token', token);
  }

  static clearToken() {
    localStorage.removeItem('leftoverloop_token');
    localStorage.removeItem('leftoverloop_user');
  }

  static getHeaders() {
    const headers = {
      'Content-Type': 'application/json'
    };
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  static async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: this.getHeaders(),
      ...options
    };

    try {
      const response = await fetch(url, config);

      if (response.status === 401) {
        // Expired or missing token — clear session and redirect to login
        if (!endpoint.includes('/auth/login') && !endpoint.includes('/auth/register')) {
          ApiClient.clearToken();
          setTimeout(() => { window.location.href = 'login.html'; }, 1500);
          throw new Error('Session expired. Please log in again.');
        }
      }

      if (response.status === 403) {
        // Authenticated but not authorized for this resource — do NOT clear the token
        if (!endpoint.includes('/auth/login') && !endpoint.includes('/auth/register')) {
          throw new Error('You are not authorized to view this resource.');
        }
      }

      if (response.status === 204) {
        return null;
      }

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message = data.message || (data.errors ? Object.values(data.errors).join(', ') : 'API Request Failed');
        throw new Error(message);
      }

      return data;
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      throw error;
    }
  }

  // Auth endpoints
  static register(data) {
    return this.request('/auth/register', { method: 'POST', body: JSON.stringify(data) });
  }

  static login(data) {
    return this.request('/auth/login', { method: 'POST', body: JSON.stringify(data) });
  }

  static getCurrentUser() {
    return this.request('/auth/me');
  }

  // Donations endpoints
  static getActiveDonations(category = '', location = '') {
    const query = new URLSearchParams();
    if (category) query.append('category', category);
    if (location) query.append('location', location);
    return this.request(`/donations/public/active?${query.toString()}`);
  }

  static getDonationById(id) {
    return this.request(`/donations/public/${id}`);
  }

  static createDonation(data) {
    return this.request('/donations', { method: 'POST', body: JSON.stringify(data) });
  }

  static getMyDonations() {
    return this.request('/donations/my-donations');
  }

  static getOrganizationDonations() {
    return this.request('/donations/organization');
  }

  static updateDonation(id, data) {
    return this.request(`/donations/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }

  static deleteDonation(id) {
    return this.request(`/donations/${id}`, { method: 'DELETE' });
  }

  // Requests endpoints
  static createRequest(donationId, requestedQuantity, notes) {
    return this.request('/requests', { method: 'POST', body: JSON.stringify({ donationId, requestedQuantity, notes }) });
  }

  static getMyRequests() {
    return this.request('/requests/my-requests');
  }

  static getIncomingRequests() {
    return this.request('/requests/incoming');
  }

  static updateRequestStatus(requestId, status, notes = '') {
    return this.request(`/requests/${requestId}/status`, { method: 'PATCH', body: JSON.stringify({ status, notes }) });
  }

  static verifyCollection(collectionCode) {
    return this.request('/requests/verify', { method: 'POST', body: JSON.stringify({ collectionCode }) });
  }

  static getRequestById(id) {
    return this.request(`/requests/${id}`);
  }

  static getRequestByCode(code) {
    return this.request(`/requests/code/${encodeURIComponent(code)}`);
  }

  // AI Recommendations endpoint
  static getAiRecommendations(preferredCategory, location, requestedQuantity, receiverType) {
    return this.request('/ai/recommendations', {
      method: 'POST',
      body: JSON.stringify({ preferredCategory, location, requestedQuantity, receiverType })
    });
  }

  // Admin endpoints
  static getAdminUsers() {
    return this.request('/admin/users');
  }

  static toggleUserStatus(userId) {
    return this.request(`/admin/users/${userId}/toggle-status`, { method: 'PATCH' });
  }

  static updateUserRole(userId, role) {
    return this.request(`/admin/users/${userId}/role`, { method: 'PATCH', body: JSON.stringify({ role }) });
  }

  static getAdminDonations() {
    return this.request('/admin/donations');
  }

  static getAdminRequests() {
    return this.request('/admin/requests');
  }

  // Impact endpoints
  static getImpactStats() {
    return this.request('/impact/public/stats');
  }
}
