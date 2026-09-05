const BASE = import.meta.env.VITE_API_URL || '/admin/api';
let token = localStorage.getItem('access_token') || null;

export function setToken(t) {
  token = t;
  if (t) localStorage.setItem('access_token', t);
  else localStorage.removeItem('access_token');
}
export function getToken() { return token; }

async function request(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  if (res.status === 401 && !path.startsWith('/auth/')) {
    setToken(null);
    window.location.href = '/admin/login';
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error || 'Error');
  return data;
}

export const api = {
  login: (email, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  me: () => request('/auth/me'),
  routers: {
    list: () => request('/routers'),
    get: (id) => request(`/routers/${id}`),
    create: (d) => request('/routers', { method: 'POST', body: JSON.stringify(d) }),
    update: (id, d) => request(`/routers/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
    delete: (id) => request(`/routers/${id}`, { method: 'DELETE' }),
    sync: (id) => request(`/sync/${id}`, { method: 'POST' }),
  },
  clients: {
    list: () => request('/clients'),
    get: (id) => request(`/clients/${id}`),
    create: (d) => request('/clients', { method: 'POST', body: JSON.stringify(d) }),
    update: (id, d) => request(`/clients/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
    delete: (id) => request(`/clients/${id}`, { method: 'DELETE' }),
    status: (id, action, reason) => request(`/clients/${id}/status`, { method: 'POST', body: JSON.stringify({ action, reason }) }),
  },
  billing: {
    byClient: (cid) => request(`/billing/client/${cid}`),
    create: (d) => request('/billing', { method: 'POST', body: JSON.stringify(d) }),
    update: (id, d) => request(`/billing/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
  },
  cutoff: { run: () => request('/cutoff', { method: 'POST' }) },
};