import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { authApi } from '../api/client';

interface AuthState {
  token: string | null;
  user: { id: string; name: string; email: string; role: string } | null;
  initialized: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  init: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  initialized: false,

  init: async () => {
    const token = await SecureStore.getItemAsync('dw_token');
    if (token) {
      try {
        const res = await authApi.me();
        set({ token, user: res.data, initialized: true });
      } catch {
        await SecureStore.deleteItemAsync('dw_token');
        set({ token: null, user: null, initialized: true });
      }
    } else {
      set({ initialized: true });
    }
  },

  login: async (email, password) => {
    const res = await authApi.login(email, password);
    const token = res.data.accessToken;
    await SecureStore.setItemAsync('dw_token', token);
    const me = await authApi.me();
    set({ token, user: me.data });
  },

  register: async (name, email, password) => {
    const res = await authApi.register(name, email, password);
    const token = (res.data as any).accessToken;
    await SecureStore.setItemAsync('dw_token', token);
    const me = await authApi.me();
    set({ token, user: me.data });
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('dw_token');
    set({ token: null, user: null });
  },
}));
