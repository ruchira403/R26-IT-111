import axios from 'axios';
import { MODEL_API_BASE_URL } from './authConfig';
import { getStoredToken } from './useAuth';

const client = axios.create({
  baseURL: MODEL_API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 120000,
});

client.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export async function compareLongitudinalScans(previousScan, currentScan) {
  const response = await client.post('/ruchira/compare', {
    previous_scan_id: previousScan.id,
    current_scan_id: currentScan.id,
    previous_image: previousScan.image_path,
    current_image: currentScan.image_path,
    previous_date: previousScan.created_at,
    current_date: currentScan.created_at,
    previous_diseases: previousScan.detected_diseases || [],
    current_diseases: currentScan.detected_diseases || [],
  });
  return response.data;
}

export async function fetchLongitudinalTimeline(scans) {
  const response = await client.post('/ruchira/timeline', {
    scans: scans.map((scan) => ({
      id: scan.id,
      image_path: scan.image_path,
      created_at: scan.created_at,
      detected_diseases: scan.detected_diseases || [],
    })),
  });
  return response.data;
}
