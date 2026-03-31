import api from './api';

export const messageService = {
  getConversations: async () => {
    const response = await api.get('/conversations');
    return response.data;
  },
  createConversation: async (data) => {
    const response = await api.post('/conversations', data);
    return response.data;
  },
  getMessages: async (conversationId) => {
    const response = await api.get(`/conversations/${conversationId}/messages`);
    return response.data;
  },
  sendMessage: async (conversationId, data) => {
    const response = await api.post(`/conversations/${conversationId}/messages`, data);
    return response.data;
  },
  markRead: async (conversationId) => {
    const response = await api.patch(`/conversations/${conversationId}/read`);
    return response.data;
  },
};
