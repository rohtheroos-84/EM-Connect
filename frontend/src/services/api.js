const API_BASE = '/api';

/**
 * Core fetch wrapper with JWT injection and error handling.
 */
async function request(endpoint, options = {}) {
  const token = localStorage.getItem('em_token');
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  // Handle 401 — token expired or invalid
  if (response.status === 401) {
    localStorage.removeItem('em_token');
    localStorage.removeItem('em_user');
    window.location.href = '/login';
    throw new Error('Session expired');
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const message = body.message || body.error || `Request failed (${response.status})`;
    const error = new Error(message);
    error.status = response.status;
    error.body = body;
    throw error;
  }

  // Some endpoints return no body (204)
  if (response.status === 204) return null;

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }
  return response.text();
}

/* ── Auth ── */

export async function login(email, password) {
  const data = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  // Response shape: { message, user: { id, email, name, role, createdAt }, token }
  if (data.token) {
    localStorage.setItem('em_token', data.token);
    localStorage.setItem('em_user', JSON.stringify(data.user));
  }
  return data;
}

export async function register(email, password, name) {
  const data = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, name }),
  });
  if (data.token) {
    localStorage.setItem('em_token', data.token);
    localStorage.setItem('em_user', JSON.stringify(data.user));
  }
  return data;
}

export function logout() {
  localStorage.removeItem('em_token');
  localStorage.removeItem('em_user');
}

export function getStoredUser() {
  const raw = localStorage.getItem('em_user');
  return raw ? JSON.parse(raw) : null;
}

export function getToken() {
  return localStorage.getItem('em_token');
}

export function isAuthenticated() {
  return !!getToken();
}

/* ── Events (for future phases) ── */

export async function getEvents(page = 0, size = 10) {
  return request(`/events?page=${page}&size=${size}`);
}

export async function getEvent(id) {
  return request(`/events/${id}`);
}

export async function searchEvents(keyword, page = 0, size = 10) {
  return request(`/events/search?keyword=${encodeURIComponent(keyword)}&page=${page}&size=${size}`);
}

/* ── Generic GET / POST / PUT / DELETE ── */

export const api = {
  get: (endpoint) => request(endpoint),
  post: (endpoint, body) => request(endpoint, { method: 'POST', body: JSON.stringify(body) }),
  put: (endpoint, body) => request(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (endpoint) => request(endpoint, { method: 'DELETE' }),
};
