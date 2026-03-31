import api from './api';

export const workerService = {
  getAll: async (params) => {
    const response = await api.get('/workers', { params });
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/workers/${id}`);
    return response.data;
  },
  search: async (query) => {
    const response = await api.get('/workers/search', { params: { q: query } });
    return response.data;
  },
  getReviews: async (id, params) => {
    const response = await api.get(`/workers/${id}/reviews`, { params });
    return response.data;
  },
  getMyProfile: async () => {
    const response = await api.get('/workers/profile/me');
    return response.data;
  },
  updateProfile: async (data) => {
    const response = await api.put('/workers/profile', data);
    return response.data;
  },
  uploadAvatar: async (formData) => {
    const response = await api.post('/workers/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};
