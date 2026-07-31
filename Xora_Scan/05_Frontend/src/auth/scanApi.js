/**
 * scanApi.js
 * All scan and assessment-related API calls.
 * Reuses the same base URL and Bearer-token pattern as authApi.js.
 */
import axios from 'axios';
import { AUTH_API_BASE_URL } from './authConfig';
import { getStoredToken } from './useAuth';

const scanClient = axios.create({
  baseURL: AUTH_API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

/** Attach the Bearer token automatically to every request */
scanClient.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Fetch the latest dental scan for the authenticated user.
 * POST /api/health-advisor/latest-dental-scan
 */
export async function fetchLatestDentalScan() {
  const res = await scanClient.post('/api/health-advisor/latest-dental-scan');
  return res.data;
}

/**
 * Fetch the complete scan history for the authenticated user.
 * GET /api/assessments/scans
 */
export async function fetchScanHistory() {
  const res = await scanClient.get('/api/assessments/scans');
  return res.data;
}

/**
 * Generate or retrieve an assessment for a specific scan.
 * POST /api/assessments/scans/:id/assess
 * - If the scan is already assessed, the API returns the existing assessment.
 * - If not, it generates a new one (~30-60 seconds).
 * @param {number|string} scanId
 */
export async function assessScan(scanId) {
  const res = await scanClient.post(`/api/assessments/scans/${scanId}/assess`);
  return res.data;
}
