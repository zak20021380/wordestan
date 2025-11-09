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
  // Get next level for user
  async getNextLevel() {
    try {
      const response = await api.get('/game/next-level');
      return response.data.data;
    } catch (error) {
      // Handle "No more levels available" as a valid end state, not an error
      if (error.response?.data?.message === 'No more levels available') {
        return null;
      }
      throw new Error(error.response?.data?.message || 'Failed to get next level');
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