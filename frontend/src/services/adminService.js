import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const adminService = {
  // Dashboard
  async getDashboardStats() {
    try {
      const response = await api.get('/admin/dashboard');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to get dashboard stats');
    }
  },

  // Word Management
  async getWords(params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await api.get(`/admin/words?${queryString}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to get words');
    }
  },

  async createWord(wordData) {
    try {
      const response = await api.post('/admin/words', wordData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to create word');
    }
  },

  async updateWord(id, wordData) {
    try {
      const response = await api.put(`/admin/words/${id}`, wordData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update word');
    }
  },

  async deleteWord(id) {
    try {
      const response = await api.delete(`/admin/words/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to delete word');
    }
  },

  // Level Management
  async getLevels(params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await api.get(`/admin/levels?${queryString}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to get levels');
    }
  },

  async createLevel(levelData) {
    try {
      const response = await api.post('/admin/levels', levelData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to create level');
    }
  },

  async updateLevel(id, levelData) {
    try {
      const response = await api.put(`/admin/levels/${id}`, levelData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update level');
    }
  },

  async deleteLevel(id) {
    try {
      const response = await api.delete(`/admin/levels/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to delete level');
    }
  },

  // Coin Pack Management
  async getCoinPacks() {
    try {
      const response = await api.get('/admin/packs');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to get coin packs');
    }
  },

  async createCoinPack(packData) {
    try {
      const response = await api.post('/admin/packs', packData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to create coin pack');
    }
  },

  async updateCoinPack(id, packData) {
    try {
      const response = await api.put(`/admin/packs/${id}`, packData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update coin pack');
    }
  },

  async deleteCoinPack(id) {
    try {
      const response = await api.delete(`/admin/packs/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to delete coin pack');
    }
  },

  // Users
  async getUsers(params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const suffix = queryString ? `?${queryString}` : '';
      const response = await api.get(`/admin/users${suffix}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to get users');
    }
  },
};