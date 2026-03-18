import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosError } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,   
});

const getAccessToken = (): string | null =>
  typeof window !== 'undefined' ? localStorage.getItem('neo_access_token') : null;

const setAccessToken = (token: string) =>
  localStorage.setItem('neo_access_token', token);

const clearSession = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('neo_access_token');
  localStorage.removeItem('neo_user');
};

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let refreshQueue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = [];

const processQueue = (err: unknown, token: string | null) => {
  refreshQueue.forEach((p) => (err ? p.reject(err) : p.resolve(token!)));
  refreshQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    const code = (error.response?.data as { code?: string })?.code;
    const status = error.response?.status;

    const shouldRefresh =
      status === 401 &&
      code === 'TOKEN_EXPIRED' &&
      !original._retry &&
      !original.url?.includes('/auth/refresh-token') &&
      !original.url?.includes('/auth/login');

    if (!shouldRefresh) {
      if (status === 401 && typeof window !== 'undefined') {
        clearSession();
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        refreshQueue.push({
          resolve: (token) => {
            original.headers!.Authorization = `Bearer ${token}`;
            resolve(api(original));
          },
          reject,
        });
      });
    }

    original._retry = true;
    isRefreshing = true;

    try {
      const { data } = await axios.post(
        `${API_URL}/auth/refresh-token`,
        {},
        { withCredentials: true }
      );

      const newAccessToken: string = data.accessToken;
      setAccessToken(newAccessToken);

      if (data.user) {
        localStorage.setItem('neo_user', JSON.stringify(data.user));
      }

      processQueue(null, newAccessToken);

      original.headers!.Authorization = `Bearer ${newAccessToken}`;
      return api(original);
    } catch (refreshErr) {
      processQueue(refreshErr, null);
      clearSession();
      if (typeof window !== 'undefined') window.location.href = '/login';
      return Promise.reject(refreshErr);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;

export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (data: Record<string, unknown>) =>
    api.post('/auth/register', data),
  refresh: () =>
    api.post('/auth/refresh-token'),
  logout: () =>
    api.post('/auth/logout'),
  me: () =>
    api.get('/auth/me'),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.put('/auth/change-password', { currentPassword, newPassword }),
};

export const complaintsApi = {
  getAll: (params?: Record<string, unknown>) =>
    api.get('/complaints', { params }),
  getOne: (id: string) =>
    api.get(`/complaints/${id}`),
  track: (trackingId: string) =>
    api.get(`/complaints/track/${trackingId}`),
  create: (data: FormData) =>
    api.post('/complaints', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  assign: (id: string, caseManagerId: string) =>
    api.put(`/complaints/${id}/assign`, { caseManagerId }),
  updateStatus: (id: string, data: Record<string, unknown>) =>
    api.put(`/complaints/${id}/status`, data),
  addNote: (id: string, content: string) =>
    api.post(`/complaints/${id}/notes`, { content }),
  publish: (id: string, data: Record<string, unknown>) =>
    api.put(`/complaints/${id}/publish`, data),
};

export const usersApi = {
  getAll: (params?: Record<string, unknown>) =>
    api.get('/users', { params }),
  getCaseManagers: () =>
    api.get('/users/case-managers'),
  update: (id: string, data: Record<string, unknown>) =>
    api.put(`/users/${id}`, data),
  deactivate: (id: string) =>
    api.delete(`/users/${id}`),
};

export const pollsApi = {
  getAll: () => api.get('/polls'),
  create: (data: Record<string, unknown>) => api.post('/polls', data),
  vote: (id: string, optionIndex: number) =>
    api.post(`/polls/${id}/vote`, { optionIndex }),
  close: (id: string) => api.put(`/polls/${id}/close`),
};

export const publicHubApi = {
  getDigest: (params?: Record<string, unknown>) =>
    api.get('/public-hub/digest', { params }),
  getImpact: () => api.get('/public-hub/impact'),
  uploadMinutes: (data: FormData) =>
    api.post('/public-hub/minutes', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  getMinutes: (params?: Record<string, unknown>) =>
    api.get('/public-hub/minutes', { params }),
};

export const analyticsApi = {
  getOverview: () => api.get('/analytics/overview'),
  getHeatmap: () => api.get('/analytics/heatmap'),
  getHotspots: () => api.get('/analytics/hotspots'),
  getCaseManagerStats: () => api.get('/analytics/case-manager-stats'),
};