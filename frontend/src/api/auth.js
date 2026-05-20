const API = '/api';

export async function loginRequest(username, password) {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: username.trim().toLowerCase(), password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Login failed');
  return data;
}

export async function verifyToken(token) {
  const res = await fetch(`${API}/auth/verify`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.ok;
}
