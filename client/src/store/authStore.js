import { create } from "zustand";
import { storage } from "@utils/storage";
import { authService } from "@services/authService";

export const useAuthStore = create((set) => ({
  user: storage.getUser(),
  token: storage.getToken(),
  isAuthenticated: !!storage.getToken(),
  loading: false,
  initialized: false,

  setAuth: (user, token) => {
    storage.setToken(token);
    storage.setUser(user);
    set({ user, token, isAuthenticated: true });
  },

  initializeAuth: async () => {
    const token = storage.getToken();

    if (!token) {
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        initialized: true,
      });
      return;
    }

    set({ loading: true });

    try {
      const user = await authService.getMe();
      storage.setUser(user);
      set({
        user,
        token,
        isAuthenticated: true,
        loading: false,
        initialized: true,
      });
    } catch {
      storage.clearAuth();
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        initialized: true,
      });
    }
  },

  login: async (credentials) => {
    set({ loading: true });

    try {
      const { user, token } = await authService.login(credentials);
      storage.setToken(token);
      storage.setUser(user);
      set({
        user,
        token,
        isAuthenticated: true,
        loading: false,
        initialized: true,
      });
      return user;
    } catch (error) {
      set({ loading: false, initialized: true });
      throw error;
    }
  },

  register: async (data) => {
    set({ loading: true });

    try {
      const { user, token } = await authService.register(data);
      storage.setToken(token);
      storage.setUser(user);
      set({
        user,
        token,
        isAuthenticated: true,
        loading: false,
        initialized: true,
      });
      return user;
    } catch (error) {
      set({ loading: false, initialized: true });
      throw error;
    }
  },

  logout: async () => {
    try {
      await authService.logout();
    } catch {
      // Best-effort logout.
    }

    storage.clearAuth();
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      loading: false,
      initialized: true,
    });
  },

  fetchUser: async () => {
    set({ loading: true });

    try {
      const user = await authService.getMe();
      storage.setUser(user);
      set({
        user,
        token: storage.getToken(),
        isAuthenticated: true,
        loading: false,
        initialized: true,
      });
      return user;
    } catch {
      storage.clearAuth();
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        initialized: true,
      });
      return null;
    }
  },
}));
