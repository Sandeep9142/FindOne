import api from './api';

export const paymentService = {
  /**
   * Creates a Razorpay order on the server and returns:
   *   { razorpayOrderId, razorpayKeyId, amount, currency, ... }
   * Pass bookingId OR jobId (not both).
   */
  create: async (data) => {
    const response = await api.post('/payments', data);
    return response.data;
  },

  /**
   * Confirms a payment after the Razorpay checkout popup succeeds.
   * Send the three values Razorpay provides in the onSuccess callback.
   */
  verify: async (paymentId, { razorpayOrderId, razorpayPaymentId, razorpaySignature }) => {
    const response = await api.post(`/payments/${paymentId}/verify`, {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    });
    return response.data;
  },

  getAll: async (params) => {
    const response = await api.get('/payments', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/payments/${id}`);
    return response.data;
  },

  updateStatus: async (id, status) => {
    const response = await api.patch(`/payments/${id}/status`, { status });
    return response.data;
  },
};
