import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('dw_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    const requestUrl = err.config?.url ?? '';
    const isLoginRequest = requestUrl.endsWith('/auth/login');
    if (err.response?.status === 401 && !isLoginRequest) {
      localStorage.removeItem('dw_token');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  },
);

export const authApi = {
  login: (email: string, password: string) =>
    api.post<{ accessToken: string }>('/auth/login', { email, password }),
  register: (name: string, email: string, password: string) =>
    api.post<{ accessToken: string }>('/auth/register', { name, email, password }),
  me: () => api.get('/auth/me'),
};

export const adminApi = {
  stats: () => api.get('/admin/stats'),
  users: () => api.get('/admin/users'),
  trips: () => api.get('/admin/trips'),
  events: () => api.get('/admin/events'),
  heatmap: () => api.get('/admin/heatmap'),
  roadIntelligence: () => api.get('/admin/road-intelligence'),
  dataSources: () => api.get('/admin/data-sources'),
};

export const simulationApi = {
  scenarios: () => api.get('/simulation/scenarios'),
  generate: (scenarioId: string) => api.post('/simulation/trips/generate', { scenarioId }),
};

export const ingestionApi = {
  importOsm: () => api.post('/ingestion/osm/import'),
  importTraffic: () => api.post('/ingestion/traffic/import'),
  logs: () => api.get('/ingestion/logs'),
  providerStatus: () => api.get('/ingestion/provider-status'),
  trafficEvents: () => api.get('/traffic-events'),
};

export const tripsApi = {
  list: () => api.get('/trips'),
  get: (id: string) => api.get(`/trips/${id}`),
  points: (id: string) => api.get(`/trips/${id}/points`),
  events: (id: string) => api.get(`/trips/${id}/events`),
  scoreBreakdown: (id: string) => api.get(`/trips/${id}/score-breakdown`),
};

export const scoresApi = {
  summary: () => api.get('/scores/me/summary'),
  monthly: () => api.get('/scores/me/monthly'),
  achievements: () => api.get('/scores/me/achievements'),
  weeklyReport: () => api.get('/scores/me/weekly-report'),
};
