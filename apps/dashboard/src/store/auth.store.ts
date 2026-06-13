import { create } from 'zustand';
import { authApi } from '../api/client';

interface AuthState {
  token: string | null;
  user: { id: string; name: string; email: string; role: string } | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  fetchMe: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('dw_token'),
  user: null,
  isLoading: false,

  login: async (email, password) => {
    set({ isLoading: true });
    const res = await authApi.login(email, password);
    const token = res.data.accessToken;
    localStorage.setItem('dw_token', token);
    set({ token, isLoading: false });
  },

  logout: () => {
    localStorage.removeItem('dw_token');
    set({ token: null, user: null });
  },

  fetchMe: async () => {
    const res = await authApi.me();
    set({ user: res.data });
  },
}));
