import api from '../axios';

/**
 * Universal User Service
 * Demonstrates clean, reusable API calls using the routing system.
 */
export const userService = {
  /**
   * Get current user profile
   */
  getProfile: async () => {
    try {
      const response = await api.get('/users/profile');
      return response.data;
    } catch (error) {
      console.error('[UserService] Failed to fetch profile:', error.message);
      throw error;
    }
  },

  /**
   * Update user settings
   * @param {Object} data 
   */
  updateSettings: async (data) => {
    try {
      const response = await api.patch('/users/settings', data);
      return response.data;
    } catch (error) {
      console.error('[UserService] Failed to update settings:', error.message);
      throw error;
    }
  }
};

export default userService;
