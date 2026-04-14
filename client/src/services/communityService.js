import api from './api';

export const communityService = {
  getPosts: async (params) => {
    const response = await api.get('/community/posts', { params });
    return response.data;
  },
  createPost: async (formData) => {
    const response = await api.post('/community/posts', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
  toggleLike: async (postId) => {
    const response = await api.post(`/community/posts/${postId}/like`);
    return response.data;
  },
  getComments: async (postId, params) => {
    const response = await api.get(`/community/posts/${postId}/comments`, { params });
    return response.data;
  },
  createComment: async (postId, data) => {
    const response = await api.post(`/community/posts/${postId}/comments`, data);
    return response.data;
  },
  deletePost: async (postId) => {
    const response = await api.delete(`/community/posts/${postId}`);
    return response;
  },
  deleteComment: async (commentId) => {
    const response = await api.delete(`/community/comments/${commentId}`);
    return response;
  },
  reportPost: async (postId) => {
    const response = await api.post(`/community/posts/${postId}/report`);
    return response.data;
  },
  reportComment: async (commentId) => {
    const response = await api.post(`/community/comments/${commentId}/report`);
    return response.data;
  },
};
