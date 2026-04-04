import api from './api';

export const reviewService = {
  getTestimonials: async (params) => {
    const response = await api.get('/reviews/testimonials', { params });
    return response.data;
  },
};
