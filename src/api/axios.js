import axios from 'axios';
import API_CONFIG from './config';

const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    ...API_CONFIG.HEADERS,
    'ngrok-skip-browser-warning': 'true',
  },
});

// Request Interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('gatherly_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor
api.interceptors.response.use(
  (response) => response.data, // Return only the data part
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      
      // Handle 401 (Unauthorized) -> Clear storage and redirect to login
      if (status === 401) {
        console.error('[API] Unauthorized (401). Logging out...');
        localStorage.removeItem('gatherly_token');
        localStorage.removeItem('gatherly_user');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
      
      // Handle 403 (Forbidden) -> Just show error (handled by caller)
      if (status === 403) {
        console.error('[API] Forbidden (403). Access denied.');
      }

      return Promise.reject(data || { message: 'An error occurred' });
    }
    
    return Promise.reject({
      status: false,
      message: 'Network Error. Please check if the ngrok URL is active.',
      errors: error
    });
  }
);

export default api;
