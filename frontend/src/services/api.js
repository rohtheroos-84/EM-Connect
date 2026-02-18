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

  // Only attach token if we have one
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  // Handle 401 — but only redirect if user had a token (was logged in)
  if (response.status === 401 && token) {
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

/* ── Events ── */

export async function getEvents(page = 0, size = 10) {
  return request(`/events?page=${page}&size=${size}`);
}

export async function getEvent(id) {
  return request(`/events/${id}`);
}

export async function searchEvents(keyword, page = 0, size = 10) {
  return request(`/events/search?keyword=${encodeURIComponent(keyword)}&page=${page}&size=${size}`);
}

export async function getMyEvents(page = 0, size = 10) {
  return request(`/events/my-events?page=${page}&size=${size}`);
}

export async function createEvent(data) {
  return request('/events', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateEvent(id, data) {
  return request(`/events/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export async function deleteEvent(id) {
  return request(`/events/${id}`, { method: 'DELETE' });
}

export async function publishEvent(id) {
  return request(`/events/${id}/publish`, { method: 'POST' });
}

export async function cancelEvent(id) {
  return request(`/events/${id}/cancel`, { method: 'POST' });
}

export async function completeEvent(id) {
  return request(`/events/${id}/complete`, { method: 'POST' });
}

/* ── Registrations ── */

export async function registerForEvent(eventId) {
  return request(`/events/${eventId}/register`, { method: 'POST' });
}

export async function cancelRegistration(registrationId) {
  return request(`/registrations/${registrationId}/cancel`, { method: 'POST' });
}

export async function getMyRegistrations(page = 0, size = 10, activeOnly = false) {
  return request(`/registrations/my-registrations?page=${page}&size=${size}&activeOnly=${activeOnly}`);
}

export async function getRegistration(id) {
  return request(`/registrations/${id}`);
}

export async function getRegistrationByTicket(ticketCode) {
  return request(`/registrations/ticket/${ticketCode}`);
}

export async function getEventRegistrationStatus(eventId) {
  return request(`/events/${eventId}/registration-status`);
}

export async function getEventRegistrations(eventId, page = 0, size = 10) {
  return request(`/events/${eventId}/registrations?page=${page}&size=${size}`);
}

/* ── Tickets ── */

export async function getMyTickets() {
  return request('/tickets/my');
}

/* ── Generic GET / POST / PUT / DELETE ── */

export const api = {
  get: (endpoint) => request(endpoint),
  post: (endpoint, body) => request(endpoint, { method: 'POST', body: JSON.stringify(body) }),
  put: (endpoint, body) => request(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (endpoint) => request(endpoint, { method: 'DELETE' }),
};
