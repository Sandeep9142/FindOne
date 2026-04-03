import api from "./api";

function unwrap(response) {
  return response?.data ?? response;
}

export const authService = {
  login: async (credentials) => {
    const response = await api.post("/auth/login", credentials);
    return unwrap(response);
  },
  register: async (data) => {
    const response = await api.post("/auth/register", data);
    return unwrap(response);
  },
  logout: async () => {
    const response = await api.post("/auth/logout");
    return unwrap(response);
  },
  getMe: async () => {
    const response = await api.get("/auth/me");
    return unwrap(response);
  },
  refreshToken: async (token) => {
    const response = await api.post("/auth/refresh", { refreshToken: token });
    return unwrap(response);
  },
  forgotPassword: async (email) => {
    const response = await api.post("/auth/forgot-password", { email });
    return unwrap(response);
  },
  resetPassword: async (data) => {
    const response = await api.post("/auth/reset-password", data);
    return unwrap(response);
  },
};
