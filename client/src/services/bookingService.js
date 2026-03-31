import api from './api';

export const bookingService = {
  getAll: async (params) => {
    const response = await api.get('/bookings', { params });
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/bookings/${id}`);
    return response.data;
  },
  create: async (data) => {
    const response = await api.post('/bookings', data);
    return response.data;
  },
  updateStatus: async (id, status) => {
    const response = await api.patch(`/bookings/${id}/status`, { status });
    return response.data;
  },
  cancel: async (id) => {
    const response = await api.patch(`/bookings/${id}/cancel`);
    return response.data;
  },
  createReview: async (id, data) => {
    const response = await api.post(`/bookings/${id}/reviews`, data);
    return response.data;
  },
};
