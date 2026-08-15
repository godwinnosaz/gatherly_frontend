/**
 * Gatherly API Service Layer
 *
 * All endpoints follow the official Postman contract:
 * BASE URL: https://apiv.gatherly.com.ng/api
 *
 * Every method returns the unwrapped payload directly (the Axios response
 * interceptor strips the outer `data` envelope before it reaches callers).
 */
import api from './axios';

// ─────────────────────────────────────────────────────────────────────────────
// AUTH MODULE
// ─────────────────────────────────────────────────────────────────────────────
export const AuthService = {
  /**
   * POST /auth/login
   * @param {{ email: string, password: string }} data
   */
  login: (data) => api.post('/auth/login', data),

  /**
   * POST /auth/register
   * @param {{ email: string, password: string, organization_name: string }} data
   */
  register: (data) => api.post('/auth/register', data),

  /**
   * GET /auth/me
   * Retained as it is used by AuthContext session check
   */
  getMe: () => api.get('/auth/me'),

  /**
   * POST /auth/logout
   * Retained for session termination
   */
  logout: () => api.post('/auth/logout'),

  /**
   * GET /auth/verifyInvite/{inviteToken}
   * @param {string} token
   */
  verifyInvite: (token) => api.get(`/auth/verifyInvite/${token}`),

  /**
   * POST /auth/acceptInvite
   * @param {{ token: string, password: string }} data
   */
  acceptInvite: (data) => api.post('/auth/acceptInvite', data),
};

// ─────────────────────────────────────────────────────────────────────────────
// MEMBERS MODULE
// ─────────────────────────────────────────────────────────────────────────────
export const MemberService = {
  /** GET /members */
  getAll: (params) => api.get('/members', { params }),

  /** GET /members/{id} */
  getById: (id) => api.get(`/members/${id}`),

  /**
   * POST /members/create
   * @param {{ first_name: string, last_name: string, email: string, phone?: string, role?: string, department_id?: number, status: string }} data
   */
  create: (data) => api.post('/members/create', data),

  /** POST /members/update/{id} */
  update: (id, data) => api.post(`/members/update/${id}`, data),

  /** POST /members/delete/{id} */
  delete: (id) => api.post(`/members/delete/${id}`),

  /** POST /members/resendInvite */
  resendInvite: (data) => api.post('/members/resendInvite', data),

  /** POST /members/setLoginAccess */
  setLoginAccess: (data) => api.post('/members/setLoginAccess', data),

  /**
   * GET /members/public-profile/{id}
   * @param {number|string} id
   */
  getPublicProfile: (id) => api.get(`/members/public-profile/${id}`),
};

// ─────────────────────────────────────────────────────────────────────────────
// TENANTS MODULE
// ─────────────────────────────────────────────────────────────────────────────
export const TenantService = {
  /**
   * GET /tenants/public-profile
   * @param {{ slug?: string, id?: number }} params
   */
  getPublicProfile: (params) => api.get('/tenants/public-profile', { params }),

  /**
   * POST /settings/public-profile
   * @param {Object} data
   */
  updateProfile: (data) => api.post('/settings/public-profile', data),

  /**
   * Fallback method using /auth/me
   */
  getCurrentTenantProfile: () => api.get('/auth/me'),
};

// ─────────────────────────────────────────────────────────────────────────────
// EVENTS MODULE
// ─────────────────────────────────────────────────────────────────────────────
export const EventService = {
  /** GET /events */
  getAll: () => api.get('/events'),

  /** GET /events/{id} */
  getById: (id) => api.get(`/events/${id}`),

  /**
   * POST /events/create
   * @param {{ title: string, description: string, event_date: string, type: string }} data
   */
  create: (data) => api.post('/events/create', data),

  /** PUT /events/{id} */
  update: (id, data) => api.put(`/events/${id}`, data),

  /** DELETE /events/{id} */
  delete: (id) => api.delete(`/events/${id}`),

  /** POST /events/rsvp */
  rsvp: (data) => api.post('/events/rsvp', data),

  /** POST /events/check-in */
  checkIn: (data) => api.post('/events/check-in', data),
};

// ─────────────────────────────────────────────────────────────────────────────
// FINANCE MODULE & CATEGORIES
// ─────────────────────────────────────────────────────────────────────────────
export const FinanceService = {
  /** GET /finance/summary */
  getSummary: () => api.get('/finance/summary'),

  /**
   * POST /finance/createTransaction
   * @param {{ amount: number, type: string, category_id: string|number, description: string, date: string, account_id?: string|number, reference_number?: string, strict_mode?: boolean }} data
   */
  recordTransaction: (data) => api.post('/finance/createTransaction', data),

  /** GET /finance/categories */
  getCategories: () => api.get('/finance/categories'),

  /** POST /finance/categories/create */
  createCategory: (data) => api.post('/finance/categories/create', data),

  /** POST /finance/categories/update/{id} */
  updateCategory: (id, data) => api.post(`/finance/categories/update/${id}`, data),

  /** POST /finance/categories/delete/{id} */
  deleteCategory: (id) => api.post(`/finance/categories/delete/${id}`),

  // Retained legacy endpoints
  getTransactions: (params) => api.get('/finance/transactions', { params }),
};

// ─────────────────────────────────────────────────────────────────────────────
// FINANCE ACCOUNTS MODULE
// ─────────────────────────────────────────────────────────────────────────────
export const FinanceAccountsService = {
  /** GET /finance/accounts */
  getAll: () => api.get('/finance/accounts'),

  /** POST /finance/accounts/create */
  create: (data) => api.post('/finance/accounts/create', data),

  /** GET /finance/accounts/show/{id} */
  getById: (id) => api.get(`/finance/accounts/show/${id}`),

  /** POST /finance/accounts/update/{id} */
  update: (id, data) => api.post(`/finance/accounts/update/${id}`, data),

  /** POST /finance/accounts/delete/{id} */
  delete: (id) => api.post(`/finance/accounts/delete/${id}`),

  /** GET /finance/accounts/tree */
  getTree: () => api.get('/finance/accounts/tree'),
};

// ─────────────────────────────────────────────────────────────────────────────
// BUDGET REQUESTS MODULE
// ─────────────────────────────────────────────────────────────────────────────
export const BudgetRequestsService = {
  /** GET /finance/budgetRequests */
  getAll: () => api.get('/finance/budgetRequests'),

  /** POST /finance/budgetRequests/create */
  create: (data) => api.post('/finance/budgetRequests/create', data),

  /** GET /finance/budgetRequests/show/{id} */
  getById: (id) => api.get(`/finance/budgetRequests/show/${id}`),

  /** POST /finance/budgetRequests/submit/{id} */
  submit: (id) => api.post(`/finance/budgetRequests/submit/${id}`),

  /** POST /finance/budgetRequests/review/{id} */
  review: (id, data) => api.post(`/finance/budgetRequests/review/${id}`, data),

  /** POST /finance/budgetRequests/approve/{id} */
  approve: (id, data) => api.post(`/finance/budgetRequests/approve/${id}`, data),

  /** POST /finance/budgetRequests/decline/{id} */
  decline: (id, data) => api.post(`/finance/budgetRequests/decline/${id}`, data),
};

// ─────────────────────────────────────────────────────────────────────────────
// APPROVALS MODULE
// ─────────────────────────────────────────────────────────────────────────────
export const ApprovalsService = {
  /** GET /approvals */
  getAll: () => api.get('/approvals'),

  /** GET /approvals/history/{entityType}/{entityId} */
  getHistory: (entityType, entityId) => api.get(`/approvals/history/${entityType}/${entityId}`),

  /** POST /approvals/return/{entityType}/{entityId} */
  returnItem: (entityType, entityId, data) => api.post(`/approvals/return/${entityType}/${entityId}`, data),
};

// ─────────────────────────────────────────────────────────────────────────────
// DEPARTMENTS / UNITS MODULE
// ─────────────────────────────────────────────────────────────────────────────
export const DepartmentService = {
  /** GET /departments */
  getAll: () => api.get('/departments'),

  /** POST /departments/create */
  create: (data) => api.post('/departments/create', data),

  /** GET /departments/show/{id} */
  getById: (id) => api.get(`/departments/show/${id}`),

  /** POST /departments/update/{id} */
  update: (id, data) => api.post(`/departments/update/${id}`, data),

  /** POST /departments/delete/{id} */
  delete: (id) => api.post(`/departments/delete/${id}`),
};

// ─────────────────────────────────────────────────────────────────────────────
// ATTENDANCE MODULE
// ─────────────────────────────────────────────────────────────────────────────
export const AttendanceService = {
  /** GET /attendance */
  getAll: () => api.get('/attendance'),

  /** POST /attendance/createSession */
  createSession: (data) => api.post('/attendance/createSession', data),

  /** GET /attendance/session/{id} */
  getSession: (id) => api.get(`/attendance/session/${id}`),

  /** POST /attendance/mark */
  mark: (data) => api.post('/attendance/mark', data),

  /** GET /attendance/member/{memberId} */
  getMemberHistory: (memberId) => api.get(`/attendance/member/${memberId}`),

  /** GET /attendance/summary */
  getSummary: () => api.get('/attendance/summary'),
};

// ─────────────────────────────────────────────────────────────────────────────
// REPORTS MODULE
// ─────────────────────────────────────────────────────────────────────────────
export const ReportsService = {
  /** GET /reports/summary */
  getSummary: () => api.get('/reports/summary'),

  /** GET /reports/finance */
  getFinance: (params) => api.get('/reports/finance', { params }),

  /** GET /reports/attendance */
  getAttendance: (params) => api.get('/reports/attendance', { params }),

  /** GET /reports/events */
  getEvents: () => api.get('/reports/events'),

  /** GET /reports/departments */
  getDepartments: () => api.get('/reports/departments'),
};

// ─────────────────────────────────────────────────────────────────────────────
// ROLES & PERMISSIONS MODULE
// ─────────────────────────────────────────────────────────────────────────────
export const RolesService = {
  /** GET /roles */
  getAll: () => api.get('/roles'),

  /** GET /roles/myRole */
  getMyRole: () => api.get('/roles/myRole'),

  /** POST /roles/assign */
  assign: (data) => api.post('/roles/assign', data),

  /** POST /roles/remove */
  remove: (data) => api.post('/roles/remove', data),
};

// ─────────────────────────────────────────────────────────────────────────────
// AI & INTELLIGENCE MODULE
// ─────────────────────────────────────────────────────────────────────────────
export const AIService = {
  /** GET /ai/attendanceSummary */
  getAttendanceSummary: () => api.get('/ai/attendanceSummary'),

  /** POST /ai/csvAnalyze */
  analyzeCsv: (data) => api.post('/ai/csvAnalyze', data),

  /** POST /ai/financeSummary */
  getFinanceSummary: (data) => api.post('/ai/financeSummary', data),

  /** POST /ai/generateReport */
  generateReport: (data) => api.post('/ai/generateReport', data),

  /** POST /ai/writeAnnouncement */
  writeAnnouncement: (data) => api.post('/ai/writeAnnouncement', data),
};

// ─────────────────────────────────────────────────────────────────────────────
// NOTIFICATIONS MODULE
// ─────────────────────────────────────────────────────────────────────────────
export const NotificationService = {
  /** GET /notifications */
  getAll: () => api.get('/notifications'),

  /** POST /notifications/readAll */
  markAllRead: () => api.post('/notifications/readAll'),
};

// ─────────────────────────────────────────────────────────────────────────────
// ONBOARDING MODULE (Retained for setup flow integration)
// ─────────────────────────────────────────────────────────────────────────────
export const OnboardingService = {
  getStatus: () => api.get('/onboarding/status'),
  setupChurch: (data) => api.post('/onboarding/setup-org', data),
  setupAdmin: (data) => api.post('/onboarding/admin-profile', data),
  setupDepartments: (data) => api.post('/onboarding/departments', data),
  setupEvents: (data) => api.post('/onboarding/events', data),
  setupMembers: (data) => api.post('/onboarding/import-members', data),
  complete: () => api.post('/onboarding/complete'),
};

// ─────────────────────────────────────────────────────────────────────────────
// INVITATIONS MODULE (Retained for setup invitation compatibility)
// ─────────────────────────────────────────────────────────────────────────────
export const InvitationService = {
  send: (data) => api.post('/onboarding/invite-leaders', data),
  getHistory: () => api.get('/onboarding/invitations'),
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPATIBILITY ALIASES
// ─────────────────────────────────────────────────────────────────────────────
export const FinanceCategoriesService = {
  getAll: () => FinanceService.getCategories(),
  create: (data) => FinanceService.createCategory(data),
  update: (id, data) => FinanceService.updateCategory(id, data),
  delete: (id) => FinanceService.deleteCategory(id),
};

// ─────────────────────────────────────────────────────────────────────────────
// FLOWS MODULE
// ─────────────────────────────────────────────────────────────────────────────
export const FlowService = {
  /** GET /flows */
  getAll: (params) => api.get('/flows', { params }),

  /** POST /flows/save */
  save: (data) => api.post('/flows/save', data),

  /** GET /flows/show/{id} */
  getById: (id) => api.get(`/flows/show/${id}`),

  /** GET /flows/byKey/{flowKey} */
  getByKey: (flowKey) => api.get(`/flows/byKey/${flowKey}`),

  /** POST /flows/publish/{id} */
  publish: (id) => api.post(`/flows/publish/${id}`),

  /** POST /flows/archive/{id} */
  archive: (id) => api.post(`/flows/archive/${id}`),

  /** POST /flows/delete/{id} */
  delete: (id) => api.post(`/flows/delete/${id}`),
};

// ─────────────────────────────────────────────────────────────────────────────
// PROFILE MODULE
// ─────────────────────────────────────────────────────────────────────────────
export const ProfileService = {
  /** GET /profile/me */
  getMe: () => api.get('/profile/me'),

  /** POST /profile/update */
  updateMe: (data) => api.post('/profile/update', data),
};
