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

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const storeService = {
  // Get all active coin packs
  async getCoinPacks() {
    try {
      const response = await api.get('/store/packs');
      // Normalize the response so components always receive an array of packs
      const packs = response?.data?.data;
      return Array.isArray(packs) ? packs : [];
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to get coin packs');
    }
  },

  // Mock purchase coin pack
  async mockPurchase(packId) {
    try {
      const response = await api.post('/store/purchase', { packId });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Purchase failed');
    }
  },

  // Get purchase history
  async getPurchaseHistory(page = 1, limit = 10) {
    try {
      const response = await api.get(`/store/purchases?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to get purchase history');
    }
  },
};