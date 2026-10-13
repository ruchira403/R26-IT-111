/**
 * useAuth.js
 * Custom hook for auth token + user management using localStorage.
 *
 * (no dedicated auth store exists yet).
 */
import { useState, useCallback } from 'react';

const TOKEN_KEY = 'xorascan_access_token';
const USER_KEY  = 'xorascan_user';

function readStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function useAuth() {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || null);
  const [user,  setUser]  = useState(() => readStoredUser());

  /** Store token + user after login / register success */
  const saveAuth = useCallback((newToken, newUser) => {
    localStorage.setItem(TOKEN_KEY, newToken);
    localStorage.setItem(USER_KEY, JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  }, []);

  /** Clear everything on logout */
  const clearAuth = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }, []);

  return {
    token,
    user,
    saveAuth,
    clearAuth,
    isLoggedIn: !!token,
  };
}

/** Standalone helpers for components that don't use the hook */
export const getStoredToken = () => localStorage.getItem(TOKEN_KEY);
export const getStoredUser  = () => readStoredUser();
export const clearStoredAuth = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};
