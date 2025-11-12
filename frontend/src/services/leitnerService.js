import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
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

// Handle response errors
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

/**
 * Add a word to Leitner box
 */
export const addWordToLeitner = async (wordId, levelId = null, notes = '') => {
  const response = await api.post('/api/leitner/add', {
    wordId,
    levelId,
    notes,
  });
  return response.data;
};

/**
 * Batch add words to Leitner box
 */
export const batchAddWordsToLeitner = async (wordIds, levelId = null) => {
  const response = await api.post('/api/leitner/batch-add', {
    wordIds,
    levelId,
  });
  return response.data;
};

/**
 * Get all words in Leitner box
 */
export const getLeitnerWords = async (params = {}) => {
  const response = await api.get('/api/leitner/words', { params });
  return response.data;
};

/**
 * Get words due for review
 */
export const getDueWords = async (limit = 20) => {
  const response = await api.get('/api/leitner/review', {
    params: { limit },
  });
  return response.data;
};

/**
 * Review a word (correct/incorrect/skipped)
 */
export const reviewWord = async (cardId, result) => {
  const response = await api.post(`/api/leitner/review/${cardId}`, {
    result, // 'correct', 'incorrect', 'skipped'
  });
  return response.data;
};

/**
 * Get Leitner box statistics
 */
export const getLeitnerStats = async () => {
  const response = await api.get('/api/leitner/stats');
  return response.data;
};

/**
 * Get words by box number
 */
export const getWordsByBox = async (boxNumber) => {
  const response = await api.get(`/api/leitner/box/${boxNumber}`);
  return response.data;
};

/**
 * Update card notes
 */
export const updateCardNotes = async (cardId, notes) => {
  const response = await api.put(`/api/leitner/${cardId}/notes`, { notes });
  return response.data;
};

/**
 * Archive a card
 */
export const archiveCard = async (cardId) => {
  const response = await api.post(`/api/leitner/${cardId}/archive`);
  return response.data;
};

/**
 * Unarchive a card
 */
export const unarchiveCard = async (cardId) => {
  const response = await api.post(`/api/leitner/${cardId}/unarchive`);
  return response.data;
};

/**
 * Reset a card to box 1
 */
export const resetCard = async (cardId) => {
  const response = await api.post(`/api/leitner/${cardId}/reset`);
  return response.data;
};

/**
 * Delete a card from Leitner box
 */
export const deleteCard = async (cardId) => {
  const response = await api.delete(`/api/leitner/${cardId}`);
  return response.data;
};

export default {
  addWordToLeitner,
  batchAddWordsToLeitner,
  getLeitnerWords,
  getDueWords,
  reviewWord,
  getLeitnerStats,
  getWordsByBox,
  updateCardNotes,
  archiveCard,
  unarchiveCard,
  resetCard,
  deleteCard,
};
