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

export const gameService = {
  // Get the first level (public)
  async getFirstLevel() {
    try {
      const response = await api.get('/game/level/1');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to load the first level');
    }
  },

  // Get next level for user
  async getNextLevel(levelId) {
    try {
      const config = levelId ? { params: { levelId } } : {};
      const response = await api.get('/game/next-level', config);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to get next level');
    }
  },

  // Get all levels with progress
  async getLevels() {
    try {
      const response = await api.get('/game/levels');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to load levels');
    }
  },

  // Unlock a specific level
  async unlockLevel(levelId) {
    try {
      const response = await api.post('/game/unlock-level', { levelId });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to unlock level');
    }
  },

  // Submit completed word
  async completeWord(word, levelId) {
    try {
      const response = await api.post('/game/complete-word', { word, levelId });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to complete word');
    }
  },

  // Auto solve word
  async autoSolve(levelId) {
    try {
      const response = await api.post('/game/auto-solve', { levelId });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to auto solve');
    }
  },

  // Purchase shuffle
  async purchaseShuffle(levelId) {
    try {
      const response = await api.post('/game/shuffle', { levelId });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to purchase shuffle');
    }
  },

  // Get game statistics
  async getGameStats() {
    try {
      const response = await api.get('/game/stats');
      return response.data.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to get game stats');
    }
  },
};