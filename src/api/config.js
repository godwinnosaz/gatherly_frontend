import { Capacitor } from '@capacitor/core';

/**
 * Universal API Configuration System
 * Designed to be reusable across any Capacitor/React project.
 * 
 * Logic Flow:
 * 1. Check for explicit VITE_API_BASE_URL (Production/Staging).
 * 2. Detect platform (Web vs Android vs iOS).
 * 3. Apply loopback/IP logic for mobile testing against local backend.
 */

const getBaseUrl = () => {
  // Priority 1: Explicitly defined full URL (from .env or .env.development)
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }

  // Fallback logic for local development if VITE_API_BASE_URL is not set
  const port = import.meta.env.VITE_API_PORT || 5000;
  const path = import.meta.env.VITE_API_PATH || '/api';
  const localIp = import.meta.env.VITE_LOCAL_IP;
  const platform = Capacitor.getPlatform();

  // Android Specific Logic
  if (platform === 'android') {
    if (localIp && localIp !== '192.168.1.100') {
      return `http://${localIp}:${port}${path}`;
    }
    return `http://10.0.2.2:${port}${path}`;
  }

  // iOS Specific Logic
  if (platform === 'ios') {
    return `http://${localIp || 'localhost'}:${port}${path}`;
  }

  // Web / Desktop Logic
  return `http://localhost:${port}${path}`;
};

export const API_CONFIG = {
  BASE_URL: getBaseUrl(),
  TIMEOUT: 15000,
  HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  MODE: import.meta.env.VITE_API_MODE || 'development'
};

// Log configuration on startup for easier debugging
console.log(`[Gatherly API] Mode: ${API_CONFIG.MODE}`);
console.log(`[Gatherly API] Base URL: ${API_CONFIG.BASE_URL}`);

export default API_CONFIG;
