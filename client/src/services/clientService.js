import api from './api';

export const clientService = {
  getMyProfile: async () => {
    const response = await api.get('/clients/profile');
    return response.data;
  },
  updateProfile: async (data) => {
    const response = await api.put('/clients/profile', data);
    return response.data;
  },
};
