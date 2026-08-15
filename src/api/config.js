/**
 * Gatherly API Configuration
 *
 * Priority:
 *   1. VITE_API_BASE_URL environment variable  (set in .env / CI)
 *   2. Postman-documented production base URL  (hard fallback)
 *
 * The Capacitor platform-detection block was intentionally removed.
 * Mobile builds must set VITE_API_BASE_URL explicitly in their env file.
 */

const POSTMAN_BASE_URL = 'https://apiv.gatherly.com.ng/api';

const getBaseUrl = () => {
  // During local development prefer the dev-server proxy at /api
  if (import.meta.env.DEV) {
    return '/api';
  }
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  return POSTMAN_BASE_URL;
};

export const API_CONFIG = {
  BASE_URL: getBaseUrl(),
  TIMEOUT: 15000,
  HEADERS: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  MODE: import.meta.env.VITE_API_MODE || (import.meta.env.PROD ? 'production' : 'development'),
};

// Log configuration on startup only during development
if (import.meta.env.DEV) {
}

export default API_CONFIG;
