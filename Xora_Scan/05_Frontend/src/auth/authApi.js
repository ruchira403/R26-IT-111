import axios from 'axios';
import { AUTH_API_BASE_URL } from './authConfig';

const authClient = axios.create({
  baseURL: AUTH_API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

export async function register(payload) {
  const response = await authClient.post('/api/auth/register', payload);
  return response.data;
}

export async function login(email, password) {
  const response = await authClient.post('/api/auth/login', { email, password });
  return response.data;
}

export async function getMe(token) {
  const t = token || (typeof localStorage !== 'undefined' ? localStorage.getItem('xorascan_access_token') : null);
  const headers = t ? { Authorization: `Bearer ${t}` } : {};
  const response = await authClient.get('/api/auth/me', { headers });
  return response.data;
}

export async function logout(token) {
  const response = await authClient.post(
    '/api/auth/logout',
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
}
