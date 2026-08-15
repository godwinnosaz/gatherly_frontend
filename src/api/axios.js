import axios from 'axios';
import API_CONFIG from './config';

// ---------------------------------------------------------------------------
// Axios instance
// ---------------------------------------------------------------------------
const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: { ...API_CONFIG.HEADERS },
});

// ---------------------------------------------------------------------------
// Logout handler
// Registered by AuthContext so navigation stays inside React.
// ---------------------------------------------------------------------------
let logoutHandler = null;
export const registerAuthLogoutHandler = (fn) => {
  logoutHandler = fn;
};

// ---------------------------------------------------------------------------
// Request interceptor â€“ attach Bearer token
// ---------------------------------------------------------------------------
api.interceptors.request.use(
  (config) => {
    // Token key must stay in sync with AuthContext ('gatherly_token')
    const token = localStorage.getItem('gatherly_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ---------------------------------------------------------------------------
// Response interceptor â€“ unwrap data + normalised error objects
// ---------------------------------------------------------------------------
api.interceptors.response.use(
  // âœ… Success: unwrap axios envelope so callers receive the payload directly
  (response) => {
    const payload = response.data;
    if (payload && typeof payload === 'object' && payload.status === false) {
      return Promise.reject({
        status: response.status,
        type: 'api_error',
        message: payload.message || 'The request could not be completed.',
        errors: payload.errors || null,
      });
    }
    return payload;
  },

  // âŒ Error: produce a consistent, typed error object
  (error) => {
    // â”€â”€ A) Server responded (we got an HTTP status code) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    if (error.response) {
      const { status, data } = error.response;

      // 401 â€“ Unauthenticated: clear session and delegate navigation to React
      if (status === 401) {
        try {
          if (logoutHandler) {
            logoutHandler();
          } else {
            localStorage.removeItem('gatherly_token');
            localStorage.removeItem('gatherly_user');
          }
        } catch (e) {
          console.error('[API] Error calling logout handler', e);
        }

        return Promise.reject({
          status: 401,
          type: 'unauthenticated',
          message: data?.message || 'Your session has expired. Please log in again.',
          errors: data?.errors || null,
        });
      }

      // 400 â€“ Bad Request (malformed payload / business-rule rejection)
      if (status === 400) {
        return Promise.reject({
          status: 400,
          type: 'bad_request',
          message: data?.message || 'The request was invalid.',
          errors: data?.errors || null,
        });
      }

      // 422 â€“ Unprocessable Entity (validation errors from backend)
      if (status === 422) {
        return Promise.reject({
          status: 422,
          type: 'validation',
          // Surface the top-level message or stringify the first field error
          message:
            data?.message ||
            (data?.errors
              ? Object.values(data.errors).flat()[0]
              : 'Validation failed. Please check your input.'),
          errors: data?.errors || null,
        });
      }

      // 403 â€“ Forbidden
      if (status === 403) {
      console.error('[API] Forbidden (403). Access denied.');
        return Promise.reject({
          status: 403,
          type: 'forbidden',
          message: data?.message || 'You do not have permission to perform this action.',
          errors: null,
        });
      }

      if (status >= 500) {
        console.error(`[API] Server error (${status}):`, data);
        return Promise.reject({
          status,
          type: 'server_error',
          message: data?.message || 'A server error occurred. Please try again later.',
          errors: data?.errors || null,
        });
      }

      // Any other status â€“ pass through with normalised shape
      return Promise.reject({
        status,
        type: 'api_error',
        message: data?.message || 'An unexpected error occurred.',
        errors: data?.errors || null,
      });
    }

    // â”€â”€ B) Request was made but no response received â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    //    This covers both genuine network failures AND CORS preflight blocks,
    //    both of which surface in the browser as a null error.response.
    if (error.request) {
      const isCors =
        error.message?.toLowerCase().includes('network') ||
        error.message?.toLowerCase().includes('cors') ||
        !error.response;

      console.error('[API] No response received:', error.message);

      return Promise.reject({
        status: null,
        type: isCors ? 'cors_or_network' : 'no_response',
        message:
          'Unable to reach the server. This may be a network issue or a CORS configuration problem.',
        errors: null,
      });
    }

    // â”€â”€ C) Request was never sent (Axios config error) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    console.error('[API] Request setup error:', error.message);
    return Promise.reject({
      status: null,
      type: 'request_error',
      message: 'Failed to send request. Please check your connection.',
      errors: null,
    });
  }
);

export default api;


