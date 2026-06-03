/** Resolve API base URL (always ends with /api) for local and Render builds */
export function getApiBaseUrl(): string {
  const raw = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const base = raw.replace(/\/$/, '');
  return base.endsWith('/api') ? base : `${base}/api`;
}

/** Socket.IO server URL (API origin without /api) */
export function getSocketUrl(): string {
  if (import.meta.env.VITE_SOCKET_URL) {
    return import.meta.env.VITE_SOCKET_URL.replace(/\/$/, '');
  }
  const raw = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  return raw.replace(/\/api\/?$/, '').replace(/\/$/, '');
}
