/**
 * 
 * All auth-related API calls
 * Uses axios (already in project dependencies).
 */
import axios from 'axios';
import { AUTH_API_BASE_URL } from './authConfig';

const authClient = axios.create({
  baseURL: AUTH_API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

/**
 * Register a new user with full health profile.
 * @param {Object} payload - { email, password, role, healthProfile }
 */
export async function register(payload) {
  const res = await authClient.post('/api/auth/register', payload);
  return res.data;
}

/**
 * Login with email and password.
 * @param {string} email
 * @param {string} password
 * @returns {{ data: { accessToken: string, user: Object } }}
 */
export async function login(email, password) {
  const res = await authClient.post('/api/auth/login', { email, password });
  return res.data;
}

/**
 * Get the currently authenticated user's profile.
 * @param {string} token - Bearer access token
 */
export async function getMe(token) {
  const res = await authClient.get('/api/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

/**
 * Logout the current user.
 * @param {string} token - Bearer access token
 */
export async function logout(token) {
  const res = await authClient.post(
    '/api/auth/logout',
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
}
