import axios from 'axios';

// Dynamically resolve API URL:
// - On localhost/127.0.0.1: use '/api' if served on port 8000 (same-origin, 0 CORS), or 'http://localhost:8000/api' if on Vite (port 5173 etc.)
// - In production: use VITE_API_URL or relative '/api'
const getApiBase = () => {
  if (typeof window !== 'undefined') {
    const { hostname, port } = window.location;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return port === '8000' ? '/api' : 'http://localhost:8000/api';
    }
  }
  return import.meta.env.VITE_API_URL || '/api';
};

const API_BASE = getApiBase();

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// Attach JWT on protected requests only
api.interceptors.request.use(config => {
  const publicUrls = ['/auth/login/', '/auth/register/', '/auth/google/', '/auth/reset-password/', '/platform-stats/'];
  const isPublic = publicUrls.some(url => config.url?.includes(url));
  if (!isPublic) {
    const token = localStorage.getItem('ventureiq_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: automatically remove invalid/expired token on 401
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      const publicUrls = ['/auth/login/', '/auth/register/', '/auth/google/', '/auth/reset-password/'];
      const isPublic = publicUrls.some(url => error.config?.url?.includes(url));
      if (!isPublic) {
        localStorage.removeItem('ventureiq_token');
        localStorage.removeItem('ventureiq_refresh');
        localStorage.removeItem('ventureiq_user');
      }
    }
    return Promise.reject(error);
  }
);

// API Methods
export const authAPI = {
  login: (email, password, role) => api.post('/auth/login/', { email, password, role }),
  register: (data) => api.post('/auth/register/', data),
  googleAuth: (credential, role, mode = 'signup') => api.post('/auth/google/', { credential, role, mode }),
  me: () => api.get('/auth/me/'),
  verifyEmail: (email) => api.post('/auth/reset-password/', { email }),
  resetPassword: (email, new_password) => api.post('/auth/reset-password/', { email, new_password }),
};

export const profileAPI = {
  get: () => api.get('/profile/'),
  update: (data) => api.put('/profile/', data),
  delete: () => api.delete('/profile/'),
};

export const startupsAPI = {
  // All startups (for investor browsing)
  list: (params) => api.get('/startups/', { params }),
  get: (id) => api.get(`/startups/${id}/`),

  // Founder's own startup
  mine: () => api.get('/startups/mine/'),
  saveMyStartup: (data) => api.put('/startups/mine/', data),
  createMyStartup: (data) => api.post('/startups/mine/', data),

  // Bookmarks / Watchlist
  toggleBookmark: (id) => api.post(`/startups/${id}/bookmark/`),
  getWatchlist: () => api.get('/watchlist/'),
  updateWatchlistNote: (startup_id, notes) => api.put('/watchlist/', { startup_id, notes }),

  // Meeting requests (Investor → Startup)
  requestMeeting: (id, message) => api.post(`/startups/${id}/meeting/`, { message }),

  // Meetings for founder (incoming)
  getMeetings: () => api.get('/startups/meetings/'),
  updateMeeting: (id, meetingStatus) => api.put(`/meetings/${id}/`, { status: meetingStatus }),
  replyToMeeting: (id, reply) => api.put(`/meetings/${id}/reply/`, { reply }),

  // Meetings for investor (sent)
  getMeetingsSent: () => api.get('/meetings/sent/'),
  replyToMeetingAsInvestor: (id, reply) => api.put(`/meetings/${id}/investor-reply/`, { reply }),

  // Chat messages (both sides)
  getMessages: (meetingId) => api.get(`/meetings/${meetingId}/messages/`),
  sendMessage: (meetingId, content) => api.post(`/meetings/${meetingId}/messages/`, { content }),

  // In-app email sending via Django SMTP
  sendEmail: (meetingId, subject, body) => api.post(`/meetings/${meetingId}/send-email/`, { subject, body }),
};

export const analysisAPI = {
  predict: (data) => api.post('/analysis/predict/', data),
  getDocuments: () => api.get('/analysis/documents/'),
};

export const toolsAPI = {
  calculateROI: (data) => api.post('/tools/roi/', data),
  calculateBreakeven: (data) => api.post('/tools/breakeven/', data),
  generateAI: (data) => api.post('/tools/generate/', data),
};

export const investorsAPI = {
  list: (params) => api.get('/investors/', { params }),
  connectWithInvestor: (investorId, message) => api.post(`/investors/${investorId}/connect/`, { message }),
};

export const adminAPI = {
  getStats: () => api.get('/admin/stats/'),
  getUsers: () => api.get('/admin/users/'),
  banUser: (id, action = 'ban') => api.post(`/admin/users/${id}/ban/`, { action }),
  deleteUser: (id) => api.delete(`/admin/users/${id}/delete/`),
  getApprovals: () => api.get('/admin/approvals/'),
  actionApproval: (id, action, notes) => api.post(`/admin/approvals/${id}/action/`, { action, notes }),
};

export const publicAPI = {
  platformStats: () => api.get('/platform-stats/'),
};

export default api;
