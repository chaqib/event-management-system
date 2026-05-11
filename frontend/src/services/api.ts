import axios from 'axios';

interface ImportMeta {
  env: Record<string, string>;
}

const API_URL = (import.meta as unknown as ImportMeta).env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor - attach token and tenant ID
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const tenantId = localStorage.getItem('activeTenantId');
  if (tenantId) {
    config.headers['x-tenant-id'] = tenantId;
  }
  return config;
});

// Response interceptor - handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export default api;

// Auth API
export const authApi = {
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
  register: (data: any) => api.post('/auth/register', data),
  getProfile: () => api.get('/auth/me'),
};

// Events API
export const eventsApi = {
  getAll: (params?: any) => api.get('/events', { params }),
  getMyEvents: (params?: any) => api.get('/events/my-events', { params }),
  getById: (id: string) => api.get(`/events/${id}`),
  create: (data: any) => api.post('/events', data),
  update: (id: string, data: any) => api.put(`/events/${id}`, data),
  publish: (id: string) => api.put(`/events/${id}/publish`),
  cancel: (id: string) => api.put(`/events/${id}/cancel`),
  delete: (id: string) => api.delete(`/events/${id}`),
  getStats: () => api.get('/events/stats'),
  getFeatured: () => api.get('/events/featured'),
};

// Bookings API
export const bookingsApi = {
  getAll: (params?: any) => api.get('/bookings', { params }),
  getMyBookings: (params?: any) => api.get('/bookings/my-bookings', { params }),
  getById: (id: string) => api.get(`/bookings/${id}`),
  create: (data: any) => api.post('/bookings', data),
  confirm: (id: string) => api.put(`/bookings/${id}/confirm`),
  cancel: (id: string, reason?: string) => api.put(`/bookings/${id}/cancel`, { reason }),
  checkIn: (id: string) => api.put(`/bookings/${id}/check-in`),
  getStats: () => api.get('/bookings/stats'),
};

// Users API
export const usersApi = {
  getAll: (params?: any) => api.get('/users', { params }),
  getById: (id: string) => api.get(`/users/${id}`),
  updateStatus: (id: string, status: string) => api.put(`/users/${id}/status`, { status }),
  getStats: () => api.get('/users/stats'),
};

// Tickets API
export const ticketsApi = {
  getByEvent: (eventId: string) => api.get(`/tickets/event/${eventId}`),
  create: (data: any) => api.post('/tickets', data),
  update: (id: string, data: any) => api.put(`/tickets/${id}`, data),
  delete: (id: string) => api.delete(`/tickets/${id}`),
};

// Venues API
export const venuesApi = {
  getAll: (params?: any) => api.get('/venues', { params }),
  getById: (id: string) => api.get(`/venues/${id}`),
  create: (data: any) => api.post('/venues', data),
  update: (id: string, data: any) => api.put(`/venues/${id}`, data),
  delete: (id: string) => api.delete(`/venues/${id}`),
};

// Payments API
export const paymentsApi = {
  getAll: (params?: any) => api.get('/payments', { params }),
  getById: (id: string) => api.get(`/payments/${id}`),
  getRevenue: () => api.get('/payments/revenue'),
};

// Promotions API
export const promotionsApi = {
  getAll: (params?: any) => api.get('/promotions', { params }),
  create: (data: any) => api.post('/promotions', data),
  validate: (code: string, orderAmount: number) => api.post('/promotions/validate', { code, orderAmount }),
  delete: (id: string) => api.delete(`/promotions/${id}`),
};

// Analytics API
export const analyticsApi = {
  getDashboard: () => api.get('/analytics/dashboard'),
};

// Notifications API
export const notificationsApi = {
  getAll: (params?: any) => api.get('/notifications', { params }),
  markAsRead: (id: string) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
};

// Tenants API
export const tenantsApi = {
  create: (data: any) => api.post('/tenants', data),
  getMyTenants: () => api.get('/tenants/my-tenants'),
  getAll: (params?: any) => api.get('/tenants', { params }),
  getById: (id: string) => api.get(`/tenants/${id}`),
  update: (id: string, data: any) => api.put(`/tenants/${id}`, data),
  getStats: () => api.get('/tenants/stats'),
  // Members
  getMembers: (tenantId: string) => api.get(`/tenants/${tenantId}/members`),
  inviteMember: (tenantId: string, data: any) => api.post(`/tenants/${tenantId}/members`, data),
  updateMemberRole: (tenantId: string, memberId: string, data: any) => api.put(`/tenants/${tenantId}/members/${memberId}/role`, data),
  removeMember: (tenantId: string, memberId: string) => api.delete(`/tenants/${tenantId}/members/${memberId}`),
  // Subscription
  updateSubscription: (tenantId: string, plan: string) => api.put(`/tenants/${tenantId}/subscription`, { plan }),
};

// Admin API (Super Admin only)
export const adminApi = {
  getDashboard: () => api.get('/admin/dashboard'),
  // Tenants
  getTenants: (params?: any) => api.get('/admin/tenants', { params }),
  getTenantDetails: (id: string) => api.get(`/admin/tenants/${id}`),
  updateTenantStatus: (id: string, status: string, reason?: string) => 
    api.put(`/admin/tenants/${id}/status`, { status, reason }),
  updateTenantPlan: (id: string, plan: string) => 
    api.put(`/admin/tenants/${id}/plan`, { plan }),
  // Users
  getUsers: (params?: any) => api.get('/admin/users', { params }),
  banUser: (id: string, reason?: string) => 
    api.put(`/admin/users/${id}/ban`, { reason }),
  unbanUser: (id: string) => 
    api.put(`/admin/users/${id}/unban`, {}),
  // Revenue
  getRevenue: (days?: number) => api.get('/admin/revenue', { params: { days } }),
  // Audit Logs
  getAuditLogs: (params?: any) => api.get('/admin/audit-logs', { params }),
};

// Invoices API
export const invoicesApi = {
  create: (data: any) => api.post('/invoices', data),
  getTenantInvoices: (tenantId: string, page?: number, limit?: number, status?: string) =>
    api.get(`/invoices/tenant/${tenantId}`, { params: { page, limit, status } }),
  getPendingInvoices: (page?: number, limit?: number) =>
    api.get('/invoices/admin/pending', { params: { page, limit } }),
  getById: (id: string) => api.get(`/invoices/${id}`),
  getPayments: (id: string) => api.get(`/invoices/${id}/payments`),
  send: (id: string, email: string) => api.post(`/invoices/${id}/send`, { email }),
  approve: (id: string) => api.put(`/invoices/${id}/approve`, {}),
  recordPayment: (id: string, data: any) => api.post(`/invoices/${id}/payment`, data),
  refund: (id: string, data: any) => api.post(`/invoices/${id}/refund`, data),
  cancel: (id: string, data: any) => api.put(`/invoices/${id}/cancel`, data),
};
