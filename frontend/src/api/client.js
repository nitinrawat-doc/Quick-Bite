import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor — attach auth token when available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('qb_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (err) => Promise.reject(err)
);

// Response interceptor — unwrap data or surface error message
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const message =
      err.response?.data?.message || err.message || 'Something went wrong';
    return Promise.reject(new Error(message));
  }
);

export default api;

// ─── Menu API ─────────────────────────────────────────────────────────────────
export const fetchMenu = (params = {}) =>
  api.get('/menu', { params }).then((r) => r.data.data);

export const fetchFoodItem = (id) =>
  api.get(`/menu/${id}`).then((r) => r.data.data);

// ─── Auth API ─────────────────────────────────────────────────────────────────
export const apiLogin = (credentials) =>
  api.post('/auth/login', credentials).then((r) => r.data);

export const apiRegister = (userData) =>
  api.post('/auth/register', userData).then((r) => r.data);

export const apiSetupAdmin = (adminData) =>
  api.post('/auth/setup-admin', adminData).then((r) => r.data);

export const fetchCurrentUser = () =>
  api.get('/auth/me').then((r) => r.data.data.user);

export const updateProfile = (data) =>
  api.put('/auth/profile', data).then((r) => r.data.data.user);

// ─── Orders API (Student) ─────────────────────────────────────────────────────
export const apiCreateOrder = (orderData) =>
  api.post('/orders', orderData).then((r) => r.data);

export const fetchMyOrders = (params = {}) =>
  api.get('/orders', { params }).then((r) => r.data.data);

export const fetchOrderDetails = (id) =>
  api.get(`/orders/${id}`).then((r) => r.data.data);

export const apiCancelOrder = (id, reason) =>
  api.patch(`/orders/${id}/cancel`, { reason }).then((r) => r.data);

// ─── Payments API (Student & Online Checkout) ─────────────────────────────────
export const apiCreatePaymentOrder = (orderId) =>
  api.post('/payments/create-order', { orderId }).then((r) => r.data.data);

export const apiVerifyPayment = (payload) =>
  api.post('/payments/verify', payload).then((r) => r.data);

export const apiCancelPayment = (payload) =>
  api.post('/payments/cancel', payload).then((r) => r.data);

// ─── Admin API ────────────────────────────────────────────────────────────────
// Food CRUD
export const fetchAdminFoodItems = (params = {}) =>
  api.get('/admin/food', { params }).then((r) => r.data.data);

export const createAdminFoodItem = (data) =>
  api.post('/admin/food', data).then((r) => r.data.data);

export const updateAdminFoodItem = (id, data) =>
  api.put(`/admin/food/${id}`, data).then((r) => r.data.data);

export const toggleAdminFoodAvailability = (id) =>
  api.patch(`/admin/food/${id}/toggle-availability`).then((r) => r.data.data);

export const updateAdminFoodStock = (id, data) =>
  api.patch(`/admin/food/${id}/stock`, data).then((r) => r.data.data);

export const deleteAdminFoodItem = (id) =>
  api.delete(`/admin/food/${id}`).then((r) => r.data);

// Category CRUD
export const fetchAdminCategories = () =>
  api.get('/admin/categories').then((r) => r.data.data);

export const createAdminCategory = (data) =>
  api.post('/admin/categories', data).then((r) => r.data.data);

export const updateAdminCategory = (id, data) =>
  api.put(`/admin/categories/${id}`, data).then((r) => r.data.data);

export const deleteAdminCategory = (id) =>
  api.delete(`/admin/categories/${id}`).then((r) => r.data);

// Order Management
export const fetchAdminOrders = (params = {}) =>
  api.get('/admin/orders', { params }).then((r) => r.data.data);

export const fetchAdminOrderDetails = (id) =>
  api.get(`/admin/orders/${id}`).then((r) => r.data.data);

export const updateAdminOrderStatus = (id, status, note, cancellationReason) =>
  api
    .patch(`/admin/orders/${id}/status`, { status, note, cancellationReason })
    .then((r) => r.data);

// Sales Analytics
export const fetchAdminAnalytics = (params = {}) =>
  api.get('/admin/analytics', { params }).then((r) => r.data.data);

// Payment Records & Refunds
export const fetchAdminPayments = (params = {}) =>
  api.get('/admin/payments', { params }).then((r) => r.data.data);

export const processAdminRefund = (id, data) =>
  api.post(`/admin/payments/${id}/refund`, data).then((r) => r.data);

// Admin Invites
export const fetchAdminInvites = () =>
  api.get('/admin/invites').then((r) => r.data.data);

export const createAdminInvite = (data) =>
  api.post('/admin/invites', data).then((r) => r.data.data);

export const revokeAdminInvite = (id) =>
  api.delete(`/admin/invites/${id}`).then((r) => r.data);

// Image Upload
export const uploadFoodImage = (file) => {
  const formData = new FormData();
  formData.append('image', file);
  return api
    .post('/admin/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((r) => r.data);
};
