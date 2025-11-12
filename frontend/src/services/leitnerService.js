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

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const leitnerService = {
  async getCards() {
    try {
      const response = await api.get('/leitner/cards');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'خطا در دریافت کارت‌های لایتنر');
    }
  },

  async addCard(payload) {
    try {
      const response = await api.post('/leitner/cards', payload);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'خطا در افزودن کلمه به لایتنر');
    }
  },

  async reviewCard(cardId, result) {
    try {
      const response = await api.post(`/leitner/cards/${cardId}/review`, { result });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'خطا در ثبت نتیجه مرور');
    }
  },
};
