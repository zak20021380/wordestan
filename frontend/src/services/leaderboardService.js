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

export const leaderboardService = {
  // Get leaderboard
  async getLeaderboard(limit = 20, offset = 0) {
    try {
      const response = await api.get(`/leaderboard?limit=${limit}&offset=${offset}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to get leaderboard');
    }
  },

  // Get user's rank
  async getMyRank() {
    try {
      const response = await api.get('/leaderboard/me');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to get user rank');
    }
  },

  // Get leaderboard statistics
  async getLeaderboardStats() {
    try {
      const response = await api.get('/leaderboard/stats');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to get leaderboard stats');
    }
  },
};