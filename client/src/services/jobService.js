import api from './api';

export const jobService = {
  getAll: async (params) => {
    const response = await api.get('/jobs', { params });
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/jobs/${id}`);
    return response.data;
  },
  create: async (data) => {
    const response = await api.post('/jobs', data);
    return response.data;
  },
  update: async (id, data) => {
    const response = await api.put(`/jobs/${id}`, data);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/jobs/${id}`);
    return response;
  },
  apply: async (id, data = {}) => {
    const response = await api.post(`/jobs/${id}/apply`, data);
    return response.data;
  },
  getApplications: async (id) => {
    const response = await api.get(`/jobs/${id}/applications`);
    return response.data;
  },
  getMyPosted: async () => {
    const response = await api.get('/jobs/my/posted');
    return response.data;
  },
  getMyApplied: async () => {
    const response = await api.get('/jobs/my/applied');
    return response.data;
  },
};
