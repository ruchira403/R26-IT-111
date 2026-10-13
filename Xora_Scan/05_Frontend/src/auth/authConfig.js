// Single source of truth for every backend base URL this app talks to.
// Override any of these via Xora_Scan/05_Frontend/.env — never hardcode a host/port in a component.
export const AUTH_API_BASE_URL = import.meta.env.VITE_HEALTH_BACKEND_URL || 'http://localhost:8081';
export const CARIES_API_BASE_URL = import.meta.env.VITE_CARIES_BACKEND_URL || 'http://localhost:8000/api';
export const MODEL_API_BASE_URL = import.meta.env.VITE_MODEL_BACKEND_URL || 'http://127.0.0.1:5000';
