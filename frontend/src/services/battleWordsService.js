import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const withData = (response) => response.data?.data || response.data;

export const battleWordsService = {
  async list(params = {}) {
      const response = await api.get('/admin/battle-words', { params });
      return {
        items: withData(response) || [],
        meta: response.data?.meta || { page: 1, limit: 12, total: 0, pages: 1 },
        stats: response.data?.stats || {},
      };
  },

  async get(id) {
    const response = await api.get(`/admin/battle-words/${id}`);
    return withData(response);
  },

  async create(payload) {
    const response = await api.post('/admin/battle-words', payload);
    return withData(response);
  },

  async update(id, payload) {
    const response = await api.put(`/admin/battle-words/${id}`, payload);
    return withData(response);
  },

  async remove(id) {
    const response = await api.delete(`/admin/battle-words/${id}`);
    return response.data;
  },

  async addWord(id, payload) {
    const response = await api.post(`/admin/battle-words/${id}/words`, payload);
    return withData(response);
  },

  async removeWord(id, wordId) {
    const response = await api.delete(`/admin/battle-words/${id}/words/${wordId}`);
    return withData(response);
  },
};
