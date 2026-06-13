import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3000/api';

export const api = axios.create({ baseURL: BASE_URL });

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('dw_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const authApi = {
  register: (name: string, email: string, password: string) =>
    api.post('/auth/register', { name, email, password }),
  login: (email: string, password: string) =>
    api.post<{ accessToken: string }>('/auth/login', { email, password }),
  me: () => api.get('/auth/me'),
};

export const vehiclesApi = {
  list: () => api.get('/vehicles'),
  create: (plateNumber: string, vehicleType: string) =>
    api.post('/vehicles', { plateNumber, vehicleType }),
};

export const tripsApi = {
  start: (vehicleId?: string, mode = 'REAL_DEVICE') =>
    api.post('/trips/start', { vehicleId, mode }),
  addPointsBatch: (tripId: string, points: object[]) =>
    api.post(`/trips/${tripId}/points/batch`, { points }),
  addSamplesBatch: (tripId: string, samples: object[]) =>
    api.post(`/trips/${tripId}/sensor-samples/batch`, { samples }),
  finish: (tripId: string) =>
    api.post(`/trips/${tripId}/finish`),
  list: () => api.get('/trips'),
  get: (id: string) => api.get(`/trips/${id}`),
  points: (id: string) => api.get(`/trips/${id}/points`),
  events: (id: string) => api.get(`/trips/${id}/events`),
};

export const scoresApi = {
  monthly: () => api.get('/scores/me/monthly'),
  summary: () => api.get('/scores/me/summary'),
  achievements: () => api.get('/scores/me/achievements'),
  weeklyReport: () => api.get('/scores/me/weekly-report'),
};

export const tripsScoreApi = {
  breakdown: (id: string) => api.get(`/trips/${id}/score-breakdown`),
};

export const rewardsApi = {
  me: () => api.get('/rewards/me'),
  simulator: () => api.get('/rewards/simulator'),
};

export const simulationApi = {
  scenarios: () => api.get('/simulation/scenarios'),
  generate: (scenarioId: string) =>
    api.post('/simulation/trips/generate', { scenarioId }),
};
