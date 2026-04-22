import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem('token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

export const botApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }).then((r) => r.data),

  listOrders: (params?: { status?: string; limit?: number }) =>
    api.get('/orders', { params }).then((r) => r.data),
  getOrder: (id: number) => api.get(`/orders/${id}`).then((r) => r.data),
  updateOrderStatus: (id: number, status: string) =>
    api.patch(`/orders/${id}/status`, { status }).then((r) => r.data),

  listClients: () => api.get('/clients').then((r) => r.data),
  getClient: (phone: string) => api.get(`/clients/${phone}`).then((r) => r.data),

  listCategories: () => api.get('/products/categories').then((r) => r.data),
  listProducts: (category?: string) =>
    api.get('/products', { params: { category } }).then((r) => r.data),

  searchMessages: (q?: string, phone?: string) =>
    api.get('/messages', { params: { q, phone } }).then((r) => r.data),

  waStatus: () => api.get('/whatsapp/status').then((r) => r.data),
  waSend: (phone: string, text: string) =>
    api.post('/whatsapp/send', { phone, text }).then((r) => r.data),

  chatSend: (text: string, sessionId: string) =>
    api.post('/chat/message', { text, sessionId }).then((r) => r.data),
  chatReset: (sessionId: string) =>
    api.post('/chat/reset', { sessionId }).then((r) => r.data),
  chatState: (sessionId: string) =>
    api.get('/chat/state', { params: { sessionId } }).then((r) => r.data),
};

export default api;
