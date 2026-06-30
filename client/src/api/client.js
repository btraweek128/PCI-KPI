const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

export async function apiFetch(path, { token, method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    credentials: 'include',
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const detail = err.message ? `${err.error}: ${err.message}` : err.error;
    throw new Error(detail || err.message || `Request failed: ${response.status}`);
  }

  if (response.status === 204) return null;
  return response.json();
}
