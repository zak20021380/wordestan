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

export const authService = {
  // Register new user
  async register(userData) {
    try {
      const payload = {
        username: userData.username,
        password: userData.password,
      };

      if (typeof userData.email === 'string') {
        const trimmedEmail = userData.email.trim();
        if (trimmedEmail.length > 0) {
          payload.email = trimmedEmail;
        }
      } else if (userData.email) {
        payload.email = userData.email;
      }

      const response = await api.post('/auth/register', payload);
      return response.data.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Registration failed');
    }
  },

  // Login user
  async login(username, password) {
    try {
      const response = await api.post('/auth/login', { username, password });
      return response.data.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  },

  // Get current user
  async getMe() {
    try {
      const response = await api.get('/auth/me');
      return response.data.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to get user data');
    }
  },

  // Update user profile
  async updateProfile(userData) {
    try {
      const response = await api.put('/auth/update', userData);
      return response.data.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Profile update failed');
    }
  },

  // Check if username is available
  async checkUsername(username) {
    try {
      const response = await api.get(`/auth/check-username?username=${username}`);
      return response.data.available;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Username check failed');
    }
  },

  // Check if email is available
  async checkEmail(email) {
    try {
      const response = await api.get(`/auth/check-email?email=${email}`);
      return response.data.available;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Email check failed');
    }
  },
};