import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: `${API_URL}/battle`,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const battleService = {
  async getStats() {
    try {
      const response = await api.get('/stats');
      return response.data.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'خطا در دریافت آمار نبرد');
    }
  },
  async getHistory() {
    try {
      const response = await api.get('/history');
      return response.data.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'خطا در دریافت تاریخچه نبرد');
    }
  },
  async createChallenge() {
    try {
      const response = await api.post('/challenge');
      return response.data.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'خطا در ساخت کد نبرد');
    }
  },
};
