const rawApiBase = import.meta.env.VITE_API_BASE_URL || '/api';

export const API_BASE_URL = rawApiBase.replace(/\/$/, '');

export function toApiUrl(path) {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

export function getWebSocketUrl() {
  const envWsUrl = import.meta.env.VITE_WS_URL;
  if (envWsUrl) return envWsUrl;

  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    return `${protocol}://${window.location.host}/ws`;
  }

  return 'ws://localhost:8081/ws';
}
