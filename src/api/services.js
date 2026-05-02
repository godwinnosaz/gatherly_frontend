import api from './axios';

export const AuthService = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getMe: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
};

export const OnboardingService = {
  getStatus: () => api.get('/onboarding/status'),
  setupChurch: (data) => api.post('/onboarding/setup-org', data),
  setupAdmin: (data) => api.post('/onboarding/admin-profile', data),
  setupDepartments: (data) => api.post('/onboarding/departments', data),
  setupEvents: (data) => api.post('/onboarding/events', data),
  setupMembers: (data) => api.post('/onboarding/import-members', data),
  complete: () => api.post('/onboarding/complete'),
};

export const MemberService = {
  getAll: (params) => api.get('/members', { params }),
  getById: (id) => api.get(`/members/${id}`),
  create: (data) => api.post('/members', data),
  update: (id, data) => api.put(`/members/${id}`, data),
  delete: (id) => api.delete(`/members/${id}`),
  importCsv: (formData) => api.post('/import/upload-csv', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
};

export const DepartmentService = {
  getAll: () => api.get('/members/departments'),
  create: (data) => api.post('/members/departments', data),
  update: (id, data) => api.put(`/members/departments/${id}`, data),
  delete: (id) => api.delete(`/members/departments/${id}`),
};

export const EventService = {
  getAll: () => api.get('/events'),
  getById: (id) => api.get(`/events/${id}`),
  create: (data) => api.post('/events', data),
  update: (id, data) => api.put(`/events/${id}`, data),
  delete: (id) => api.delete(`/events/${id}`),
  rsvp: (data) => api.post('/events/rsvp', data),
  checkIn: (data) => api.post('/events/check-in', data),
};

export const AttendanceService = {
  getSummary: () => api.get('/attendance/summary'),
  mark: (data) => api.post('/attendance/mark', data),
};

export const DashboardService = {
  getStats: () => api.get('/intelligence/command-center'),
};

export const FinanceService = {
  getSummary: () => api.get('/finance/summary'),
  getTransactions: (params) => api.get('/finance/transactions', { params }),
  recordTransaction: (data) => api.post('/finance/transactions', data),
  getCategories: () => api.get('/finance/categories'),
};

export const InvitationService = {
  send: (data) => api.post('/onboarding/invite-leaders', data),
  getHistory: () => api.get('/onboarding/invitations'), // Adjust if needed
};
