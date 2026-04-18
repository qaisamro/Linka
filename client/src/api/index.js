import axios from 'axios';
import mockAPI from './mockBackend';

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

let backendModePromise;

function shouldUseMock(err) {
  return !err.response || err.response.status >= 500 || err.code === 'ECONNABORTED';
}

async function detectBackendMode() {
  if (!backendModePromise) {
    backendModePromise = api.get('/health', { timeout: 5000 })
      .then((res) => (res.data?.database?.connected ? 'real' : 'mock'))
      .catch(() => 'mock');
  }
  return backendModePromise;
}

async function requestWithFallback(realRequest, mockRequest) {
  const mode = await detectBackendMode();
  if (mode === 'mock') return mockRequest();
  try {
    return await realRequest();
  } catch (err) {
    if (shouldUseMock(err)) {
      backendModePromise = Promise.resolve('mock');
      return mockRequest();
    }
    throw err;
  }
}

// ─── Auth ─────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => requestWithFallback(() => api.post('/auth/register', data), () => mockAPI.auth.register(data)),
  login: (data) => requestWithFallback(() => api.post('/auth/login', data), () => mockAPI.auth.login(data)),
  getMe: () => requestWithFallback(() => api.get('/auth/me'), () => mockAPI.auth.getMe()),
};

// ─── Events ───────────────────────────────────────────────────────
export const eventsAPI = {
  getAll: (params) => requestWithFallback(() => api.get('/events', { params }), () => mockAPI.events.getAll(params)),
  getById: (id) => requestWithFallback(() => api.get(`/events/${id}`), () => mockAPI.events.getById(id)),
  create: (data) => requestWithFallback(() => api.post('/events', data), () => mockAPI.events.create(data)),
  update: (id, data) => requestWithFallback(() => api.put(`/events/${id}`, data), () => mockAPI.events.update(id, data)),
  remove: (id) => requestWithFallback(() => api.delete(`/events/${id}`), () => mockAPI.events.remove(id)),
};

// ─── Registrations ────────────────────────────────────────────────
export const registrationsAPI = {
  register: (eventId) => requestWithFallback(() => api.post(`/registrations/event/${eventId}`), () => mockAPI.registrations.register(eventId)),
  getMy: () => requestWithFallback(() => api.get('/registrations/my'), () => mockAPI.registrations.getMy()),
  getByEvent: (eventId) => requestWithFallback(() => api.get(`/registrations/event/${eventId}/participants`), () => mockAPI.registrations.getByEvent(eventId)),
  confirm: (id) => requestWithFallback(() => api.patch(`/registrations/${id}/confirm`), () => mockAPI.registrations.confirm(id)),
};

// ─── Users ────────────────────────────────────────────────────────
export const usersAPI = {
  getProfile: () => requestWithFallback(() => api.get('/users/profile'), () => mockAPI.users.getProfile()),
  updateProfile: (updates) => requestWithFallback(() => api.patch('/users/profile', updates), () => mockAPI.users.updateProfile(updates)),
  getCVData: () => requestWithFallback(() => api.get('/users/cv-data'), () => mockAPI.users.getCVData()),
  getLeaderboard: () => requestWithFallback(() => api.get('/users/leaderboard'), () => mockAPI.users.getLeaderboard()),
  getAdminStats: () => requestWithFallback(() => api.get('/users/admin/stats'), () => mockAPI.users.getAdminStats()),
};

// ─── Neighborhoods ────────────────────────────────────────────────
export const neighborhoodsAPI = {
  getAll: () => requestWithFallback(() => api.get('/neighborhoods'), () => mockAPI.neighborhoods.getAll()),
};

// ─── Chat ─────────────────────────────────────────────────────────
export const chatAPI = {
  send: (message, userId) => requestWithFallback(() => api.post('/chat', { message, userId }), () => mockAPI.chat.send(message, userId)),
};

// ─── Analytics ────────────────────────────────────────────────────
export const analyticsAPI = {
  getHeatmap: () => requestWithFallback(() => api.get('/analytics/heatmap'), () => mockAPI.analytics.getHeatmap()),
};

// ─── University ───────────────────────────────────────────────────
export const universityAPI = {
  getReport: (params) => requestWithFallback(() => api.get('/university/report', { params }), () => mockAPI.university.getReport(params)),
  getTranscript: (userId) => requestWithFallback(() => api.get(`/university/student/${userId}`), () => mockAPI.university.getTranscript(userId)),
  getUniversities: () => requestWithFallback(() => api.get('/university/list'), () => mockAPI.university.getUniversities()),
  getDashboardStats: () => requestWithFallback(() => api.get('/university/dashboard-stats'), () => mockAPI.university.getDashboardStats()),
  getMyStudents: (params) => requestWithFallback(() => api.get('/university/my-students', { params }), () => mockAPI.university.getMyStudents(params)),
  addStudent: (data) => requestWithFallback(() => api.post('/university/add-student', data), () => mockAPI.university.addStudent(data)),
  verifyAttendance: (data) => requestWithFallback(() => api.post('/university/verify-attendance', data), () => mockAPI.university.verifyAttendance(data)),
  getCertificate: (userId) => requestWithFallback(() => api.get(`/university/certificate/${userId}`), () => mockAPI.university.getCertificate(userId)),
  generateCode: (data) => requestWithFallback(() => api.post('/university/generate-code', data), () => mockAPI.university.generateCode(data)),
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
  getAll: (params) => requestWithFallback(() => api.get('/notifications', { params }), () => mockAPI.notifications.getAll(params)),
  getCount: () => requestWithFallback(() => api.get('/notifications/count'), () => mockAPI.notifications.getCount()),
  markAsRead: (id) => requestWithFallback(() => api.patch(`/notifications/${id}/read`), () => mockAPI.notifications.markAsRead(id)),
  markAllAsRead: () => requestWithFallback(() => api.patch('/notifications/read-all'), () => mockAPI.notifications.markAllAsRead()),
  delete: (id) => requestWithFallback(() => api.delete(`/notifications/${id}`), () => mockAPI.notifications.delete(id)),
  clearRead: () => requestWithFallback(() => api.delete('/notifications/clear-read'), () => mockAPI.notifications.clearRead()),
  broadcast: (data) => requestWithFallback(() => api.post('/notifications/broadcast', data), () => mockAPI.notifications.broadcast(data)),
  getAdminRecent: () => requestWithFallback(() => api.get('/notifications/admin/recent'), () => mockAPI.notifications.getAdminRecent()),
};

// ─── Jobs ─────────────────────────────────────────────────────────
export const jobsAPI = {
  list: (params) => requestWithFallback(() => api.get('/jobs', { params }), () => mockAPI.jobs.getAll(params)),
  create: (data) => requestWithFallback(() => api.post('/jobs', data), () => mockAPI.jobs.create(data)),
  getRecommend: () => requestWithFallback(() => api.get('/jobs/recommend'), () => mockAPI.jobs.getRecommend()),
  getSkills: () => requestWithFallback(() => api.get('/jobs/skills'), () => mockAPI.jobs.getSkills()),
  getCareerPath: () => requestWithFallback(() => api.get('/jobs/career-path'), () => mockAPI.jobs.getCareerPath()),
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

// ─── Training Field MVP ──────────────────────────────────────────
export const trainingAPI = {
  // Offers
  listOffers: (params) => requestWithFallback(() => api.get('/training/offers', { params }), () => mockAPI.training.listOffers(params)),
  createOffer: (data) => requestWithFallback(() => api.post('/training/offers', data), () => mockAPI.training.createOffer(data)),
  listCompanyOffers: () => requestWithFallback(() => api.get('/training/company/offers'), () => mockAPI.training.listCompanyOffers()),

  // Applications / Programs
  applyToOffer: (offerId) => requestWithFallback(() => api.post(`/training/offers/${offerId}/apply`), () => mockAPI.training.applyToOffer(offerId)),
  listMyApplications: () => requestWithFallback(() => api.get('/training/my-applications'), () => mockAPI.training.listMyApplications()),
  getMyPrograms: () => requestWithFallback(() => api.get('/training/my-programs'), () => mockAPI.training.getMyPrograms()),
  listProgramSessions: (programId) => requestWithFallback(() => api.get(`/training/programs/${programId}/sessions`), () => mockAPI.training.listProgramSessions(programId)),

  // Check-in/out
  checkIn: (programId, payload) => requestWithFallback(() => api.post(`/training/programs/${programId}/sessions/check-in`, payload), () => mockAPI.training.checkIn(programId, payload)),
  checkOut: (programId, payload) => requestWithFallback(() => api.post(`/training/programs/${programId}/sessions/check-out`, payload), () => mockAPI.training.checkOut(programId, payload)),

  // University approval
  approveSession: (sessionId, payload) => requestWithFallback(() => api.patch(`/training/sessions/${sessionId}/approve`, payload), () => mockAPI.training.approveSession(sessionId, payload)),
  listUniversitySessions: (params) => requestWithFallback(() => api.get('/training/university/sessions', { params }), () => mockAPI.training.listUniversitySessions(params)),

  // Completion & Reviews
  completeProgram: (programId) => requestWithFallback(() => api.post(`/training/programs/${programId}/complete`), () => mockAPI.training.completeProgram(programId)),
  submitReview: (programId, payload) => requestWithFallback(() => api.post(`/training/programs/${programId}/reviews`, payload), () => mockAPI.training.submitReview(programId, payload)),
  listOfferReviews: (offerId) => requestWithFallback(() => api.get(`/training/offers/${offerId}/reviews`), () => mockAPI.training.listOfferReviews(offerId)),

  // Company endpoints
  listOfferApplications: (offerId) => requestWithFallback(() => api.get(`/training/offers/${offerId}/applications`), () => mockAPI.training.listOfferApplications(offerId)),
  acceptApplication: (applicationId) => requestWithFallback(() => api.patch(`/training/applications/${applicationId}/accept`), () => mockAPI.training.acceptApplication(applicationId)),
  rejectApplication: (applicationId, payload) => requestWithFallback(() => api.patch(`/training/applications/${applicationId}/reject`, payload), () => mockAPI.training.rejectApplication(applicationId, payload)),
  exportReport: (params) => requestWithFallback(() => api.get('/training/export-report', { params }), () => mockAPI.training.exportReport(params)),
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

// ─── Super Admin (central command) ────────────────────────────────
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
};

export default api;
