const AUTH_ROUTES = new Set(['/login', '/register', '/forgot-password']);

export const DEFAULT_POST_AUTH_REDIRECT = '/dashboard';

export function buildLocationPath(location) {
  if (!location || typeof location.pathname !== 'string') {
    return '/';
  }

  return `${location.pathname}${location.search || ''}${location.hash || ''}`;
}

function normalizeRedirectTarget(rawTarget) {
  const target = typeof rawTarget === 'string'
    ? rawTarget
    : buildLocationPath(rawTarget);

  const trimmed = (target || '').trim();
  if (!trimmed || !trimmed.startsWith('/')) return null;
  if (trimmed.startsWith('//')) return null;
  if (trimmed.includes('://')) return null;

  const basePath = trimmed.split(/[?#]/)[0];
  if (basePath === '/') return null;
  if (AUTH_ROUTES.has(basePath)) return null;

  return trimmed;
}

export function resolvePostAuthRedirect(fromState, fallback = DEFAULT_POST_AUTH_REDIRECT) {
  return normalizeRedirectTarget(fromState) || fallback;
}
