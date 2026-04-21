import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Auto-attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ─── Auth ─────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  verifyOTP: (data) => api.post('/auth/verify-otp', data),
  getMe: () => api.get('/auth/me'),
};

// ─── Events ───────────────────────────────────────────────────────
export const eventsAPI = {
  getAll: (params) => api.get('/events', { params }),
  getById: (id) => api.get(`/events/${id}`),
  create: (data) => api.post('/events', data),
  update: (id, data) => api.put(`/events/${id}`, data),
  remove: (id) => api.delete(`/events/${id}`),
  // Entity portal
  createEntityEvent: (data) => api.post('/events/entity/create', data),
  getEntityEvents: () => api.get('/events/entity/my'),
  // Admin approval
  getPendingEvents: () => api.get('/events/admin/pending'),
  approveEvent: (id, action) => api.patch(`/events/${id}/approve`, { action }),
};

// ─── Registrations ────────────────────────────────────────────────
export const registrationsAPI = {
  register: (eventId) => api.post(`/registrations/event/${eventId}`),
  getMyRegistrations: () => api.get('/registrations/my'),
  getByEvent: (eventId) => api.get(`/registrations/event/${eventId}/participants`),
  confirm: (id) => api.patch(`/registrations/${id}/confirm`),
  delete: (id) => api.delete(`/registrations/${id}`),
};

// ─── Users ────────────────────────────────────────────────────────
export const usersAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (updates) => api.patch('/users/profile', updates),
  getCVData: () => api.get('/users/cv-data'),
  getLeaderboard: () => api.get('/users/leaderboard'),
  getAdminStats: () => api.get('/users/admin/stats'),
};

// ─── Neighborhoods ────────────────────────────────────────────────
export const neighborhoodsAPI = {
  getAll: () => api.get('/neighborhoods'),
};

// ─── Chat ─────────────────────────────────────────────────────────
export const chatAPI = {
  send: (message, userId) => api.post('/chat', { message, userId }),
};

// ─── Analytics ────────────────────────────────────────────────────
export const analyticsAPI = {
  getHeatmap: () => api.get('/analytics/heatmap'),
};

// ─── University ───────────────────────────────────────────────────
export const universityAPI = {
  getReport: (params) => api.get('/university/report', { params }),
  getTranscript: (userId) => api.get(`/university/student/${userId}`),
  getUniversities: () => api.get('/university/list'),
  getDashboardStats: () => api.get('/university/dashboard-stats'),
  getMyStudents: (params) => api.get('/university/my-students', { params }),
  addStudent: (data) => api.post('/university/add-student', data),
  verifyAttendance: (data) => api.post('/university/verify-attendance', data),
  getCertificate: (userId) => api.get(`/university/certificate/${userId}`),
  generateCode: (data) => api.post('/university/generate-code', data),
};

// ─── Admin Management ─────────────────────────────────────────────
export const adminAPI = {
  listUsers: (params) => api.get('/admin/users', { params }),
  toggleUser: (id) => api.patch(`/admin/users/${id}/toggle`),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  impersonate: (id) => api.post(`/admin/users/${id}/impersonate`),
  getEventRegs: (eventId, params) => api.get(`/admin/events/${eventId}/registrations`, { params }),
  cancelReg: (id) => api.delete(`/admin/registrations/${id}`),
  changeRegStatus: (id, status) => api.patch(`/admin/registrations/${id}/status`, { status }),
  getAuditLog: (params) => api.get('/admin/audit-log', { params }),
  getMonitoring: () => api.get('/admin/monitoring'),
  getSettings: () => api.get('/admin/settings'),
  updateSetting: (key, value) => api.patch('/admin/settings', { key, value }),
};

// ─── Notifications ────────────────────────────────────────────────
export const notificationsAPI = {
  getAll: (params) => api.get('/notifications', { params }),
  getCount: () => api.get('/notifications/count'),
  markAsRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => api.patch('/notifications/read-all'),
  delete: (id) => api.delete(`/notifications/${id}`),
  clearRead: () => api.delete('/notifications/clear-read'),
  broadcast: (data) => api.post('/notifications/broadcast', data),
  getAdminRecent: () => api.get('/notifications/admin/recent'),
};

// ─── Jobs ─────────────────────────────────────────────────────────
export const jobsAPI = {
  list: (params) => api.get('/jobs', { params }),
  create: (data) => api.post('/jobs', data),
  getRecommend: () => api.get('/jobs/recommend'),
  getSkills: () => api.get('/jobs/skills'),
  getCareerPath: () => api.get('/jobs/career-path'),
  apply: (id, payload) => api.post(`/jobs/${id}/apply`, payload),
  listApplications: (jobId) => api.get(`/jobs/${jobId}/applications`),
  getMyApplications: () => api.get('/jobs/my-applications'),
  update: (id, data) => api.put(`/jobs/${id}`, data),
  delete: (id) => api.delete(`/jobs/${id}`),
  deleteApplication: (jobId, appId) => api.delete(`/jobs/${jobId}/applications/${appId}`),
  updateApplicationStatus: (jobId, appId, status) => api.patch(`/jobs/${jobId}/applications/${appId}/status`, { status }),
  contactApplicant: (jobId, appId, data) => api.post(`/jobs/${jobId}/applications/${appId}/contact`, data),
};

// ─── Entities (Super Admin) ───────────────────────────────────────
export const entitiesAPI = {
  list: (params) => api.get('/entities', { params }),
  create: (data) => api.post('/entities', data),
  toggle: (id) => api.patch(`/entities/${id}/toggle`),
  update: (id, data) => api.put(`/entities/${id}`, data),
  delete: (id) => api.delete(`/entities/${id}`),
  getStats: () => api.get('/entities/stats'),
};

// ─── Training ────────────────────────────────────────────────────
export const trainingAPI = {
  listOffers: (params) => api.get('/training/offers', { params }),
  createOffer: (data) => api.post('/training/offers', data),
  listCompanyOffers: () => api.get('/training/company/offers'),
  applyToOffer: (offerId) => api.post(`/training/offers/${offerId}/apply`),
  listMyApplications: () => api.get('/training/my-applications'),
  getMyPrograms: () => api.get('/training/my-programs'),
  listProgramSessions: (programId) => api.get(`/training/programs/${programId}/sessions`),
  checkIn: (programId, payload) => api.post(`/training/programs/${programId}/sessions/check-in`, payload),
  checkOut: (programId, payload) => api.post(`/training/programs/${programId}/sessions/check-out`, payload),
  approveSession: (sessionId, payload) => api.patch(`/training/sessions/${sessionId}/approve`, payload),
  listUniversitySessions: (params) => api.get('/training/university/sessions', { params }),
  completeProgram: (programId) => api.post(`/training/programs/${programId}/complete`),
  submitReview: (programId, payload) => api.post(`/training/programs/${programId}/reviews`, payload),
  listOfferReviews: (offerId) => api.get(`/training/offers/${offerId}/reviews`),
  listOfferApplications: (offerId) => api.get(`/training/offers/${offerId}/applications`),
  acceptApplication: (applicationId) => api.patch(`/training/applications/${applicationId}/accept`),
  rejectApplication: (applicationId, payload) => api.patch(`/training/applications/${applicationId}/reject`, payload),
  exportReport: (params) => api.get('/training/export-report', { params }),
};

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// ─── Super Admin ──────────────────────────────────────────────────
export const superAdminAPI = {
  getOverview: () => api.get('/super-admin/overview'),
  listAlerts: (params) => api.get('/super-admin/alerts', { params }),
  markAlertRead: (id) => api.patch(`/super-admin/alerts/${id}/read`),
  listBlockedIps: () => api.get('/super-admin/blocked-ips'),
  addBlockedIp: (data) => api.post('/super-admin/blocked-ips', data),
  disableBlockedIp: (id) => api.patch(`/super-admin/blocked-ips/${id}/disable`),
  listAllEvents: () => api.get('/super-admin/events'),
  patchUser: (id, data) => api.patch(`/super-admin/users/${id}`, data),
  exportAuditCsv: () =>
    api.get('/super-admin/export/audit-log.csv', { responseType: 'blob' }).then((res) => {
      downloadBlob(res.data, 'audit-log.csv');
    }),
  exportUsersCsv: () =>
    api.get('/super-admin/export/users.csv', { responseType: 'blob' }).then((res) => {
      downloadBlob(res.data, 'users-report.csv');
    }),
  listAllJobs: () => api.get('/super-admin/jobs'),
  deleteJob: (id) => api.delete(`/super-admin/jobs/${id}`),
};

export default api;
